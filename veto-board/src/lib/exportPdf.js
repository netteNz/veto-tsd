import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function copyComputedStylesToClone(orig, clone) {
  const style = window.getComputedStyle(orig);
  // list of properties to copy as inline styles (add more if needed)
  const props = [
    "backgroundColor",
    "color",
    "borderTopColor",
    "borderRightColor",
    "borderBottomColor",
    "borderLeftColor",
    "boxShadow",
    "backgroundImage",
    "backgroundSize",
    "backgroundRepeat",
    "backgroundPosition",
    "font",
    "fontSize",
    "fontWeight",
    "lineHeight",
    "letterSpacing",
    "textTransform",
    "textDecoration",
    "padding",
    "margin",
  ];

  for (const p of props) {
    try {
      const v = style.getPropertyValue(p) || style[p];
      if (v) clone.style[p] = v;
    } catch (e) {
      // ignore unsupported properties
    }
  }

  // set width/height to preserve layout
  const rect = orig.getBoundingClientRect();
  if (rect.width) clone.style.width = rect.width + "px";
  if (rect.height) clone.style.height = rect.height + "px";
}

function deepCloneAndSanitize(el) {
  const origNodes = [];
  const cloneNodes = [];

  const cloneRoot = el.cloneNode(true);

  // traverse both trees in parallel and copy computed styles
  const origWalker = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT);
  const cloneWalker = document.createTreeWalker(cloneRoot, NodeFilter.SHOW_ELEMENT);

  // start with root nodes
  origNodes.push(el);
  cloneNodes.push(cloneRoot);

  while (origNodes.length) {
    const o = origNodes.shift();
    const c = cloneNodes.shift();
    if (!o || !c) continue;

    try {
      copyComputedStylesToClone(o, c);
    } catch (e) {
      // ignore per-element errors
    }

    // enqueue children
    const oChildren = Array.from(o.children || []);
    const cChildren = Array.from(c.children || []);
    for (let i = 0; i < oChildren.length; i++) {
      origNodes.push(oChildren[i]);
      cloneNodes.push(cChildren[i]);
    }
  }

  return cloneRoot;
}

export async function exportElementToPdf(element, filename = "export.pdf", opts = {}) {
  const el = typeof element === "string" ? document.querySelector(element) : element;
  if (!el) throw new Error("Element not found: " + element);

  // attempt using a sanitized clone to avoid html2canvas parsing oklch color functions
  let container;
  let targetForCapture = el;

  try {
    const clone = deepCloneAndSanitize(el);

    // create off-screen container
    container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-10000px";
    container.style.top = "0";
    container.style.pointerEvents = "none";
    container.style.opacity = "1";
    container.style.zIndex = "99999";
    container.setAttribute("aria-hidden", "true");

    // ensure layout by copying computed width of original container
    const rect = el.getBoundingClientRect();
    if (rect.width) container.style.width = rect.width + "px";

    container.appendChild(clone);
    document.body.appendChild(container);

    targetForCapture = clone;
  } catch (err) {
    console.warn("[exportPdf] clone/sanitize failed, falling back to original element:", err);
    targetForCapture = el;
  }

  try {
    const scale = opts.scale || 2;
    const canvas = await html2canvas(targetForCapture, {
      scale,
      useCORS: true,
      allowTaint: false,
      backgroundColor: opts.backgroundColor ?? null,
      imageTimeout: opts.imageTimeout ?? 15000,
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? "landscape" : "portrait",
      unit: "pt",
      format: "a4",
    });

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    const imgW = canvas.width;
    const imgH = canvas.height;
    const ratio = Math.min(pageW / imgW, pageH / imgH);
    const drawW = imgW * ratio;
    const drawH = imgH * ratio;
    const x = (pageW - drawW) / 2;
    const y = (pageH - drawH) / 2;

    pdf.addImage(imgData, "PNG", x, y, drawW, drawH);
    pdf.save(filename);
  } catch (err) {
    console.error("[exportPdf] export failed:", err);
    throw new Error(err?.message || String(err));
  } finally {
    // cleanup
    try {
      if (container && container.parentNode) container.parentNode.removeChild(container);
    } catch (_) {}
  }
}

export default exportElementToPdf;