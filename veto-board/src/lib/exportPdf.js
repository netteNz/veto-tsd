import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function sanitizeColorValue(value) {
  if (!value || typeof value !== 'string') return value;
  
  // Convert oklch() and oklab() functions to fallback colors
  if (value.includes('oklch(') || value.includes('oklab(')) {
    // Replace common oklch/oklab patterns with rgb equivalents
    const colorReplacements = {
      'oklch(0.15 0 0)': 'rgb(38, 38, 38)',
      'oklch(0.2 0 0)': 'rgb(51, 51, 51)',
      'oklch(0.25 0 0)': 'rgb(64, 64, 64)',
      'oklch(0.3 0 0)': 'rgb(77, 77, 77)',
      'oklch(0.4 0 0)': 'rgb(102, 102, 102)',
      'oklch(0.5 0 0)': 'rgb(128, 128, 128)',
      'oklch(0.6 0 0)': 'rgb(153, 153, 153)',
      'oklch(0.7 0 0)': 'rgb(179, 179, 179)',
      'oklch(0.8 0 0)': 'rgb(204, 204, 204)',
      'oklch(0.9 0 0)': 'rgb(230, 230, 230)',
      'oklch(1 0 0)': 'rgb(255, 255, 255)',
      // Add common oklab patterns
      'oklab(0.15 0 0)': 'rgb(38, 38, 38)',
      'oklab(0.2 0 0)': 'rgb(51, 51, 51)',
      'oklab(0.25 0 0)': 'rgb(64, 64, 64)',
      'oklab(0.3 0 0)': 'rgb(77, 77, 77)',
      'oklab(0.4 0 0)': 'rgb(102, 102, 102)',
      'oklab(0.5 0 0)': 'rgb(128, 128, 128)',
    };
    
    // Try exact replacements first
    for (const [modernColor, rgb] of Object.entries(colorReplacements)) {
      if (value.includes(modernColor)) {
        value = value.replace(new RegExp(modernColor.replace(/[()]/g, '\\$&'), 'g'), rgb);
      }
    }
    
    // Generic fallback for any remaining oklch/oklab
    value = value.replace(/oklch\([^)]+\)/g, 'rgb(64, 64, 64)');
    value = value.replace(/oklab\([^)]+\)/g, 'rgb(64, 64, 64)');
  }
  
  return value;
}

function copyComputedStylesToClone(orig, clone) {
  const style = window.getComputedStyle(orig);
  
  // Expanded list of properties to copy
  const props = [
    "backgroundColor", "color", "borderColor",
    "borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor",
    "boxShadow", "textShadow",
    "backgroundImage", "backgroundSize", "backgroundRepeat", "backgroundPosition",
    "font", "fontSize", "fontWeight", "fontFamily", "lineHeight", "letterSpacing",
    "textTransform", "textDecoration", "textAlign",
    "padding", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
    "margin", "marginTop", "marginRight", "marginBottom", "marginLeft",
    "border", "borderWidth", "borderStyle", "borderRadius",
    "display", "position", "zIndex", "opacity", "visibility",
    "width", "height", "minWidth", "minHeight", "maxWidth", "maxHeight",
    "left", "top", "right", "bottom",
    "flexDirection", "justifyContent", "alignItems", "gap",
    "gridTemplateColumns", "gridGap", "gridColumnGap", "gridRowGap"
  ];

  for (const prop of props) {
    try {
      let value = style.getPropertyValue(prop) || style[prop];
      if (value) {
        // Sanitize oklch values
        value = sanitizeColorValue(value);
        clone.style[prop] = value;
      }
    } catch (e) {
      // ignore unsupported properties
    }
  }

  // Set explicit dimensions
  const rect = orig.getBoundingClientRect();
  if (rect.width) clone.style.width = rect.width + "px";
  if (rect.height) clone.style.height = rect.height + "px";
}

function convertIconsToText(clone) {
  // Map of icon classes to text replacements
  const iconReplacements = {
    'lucide-flag': '🏁 CTF',
    'lucide-castle': '👑 KOTH', 
    'lucide-skull': '💀 Slayer',
    'lucide-crown': '👑 KOTH',
    'lucide-bomb': '💣 Bomb',
    'lucide-target': '🎯 Oddball',
    'lucide-x-circle': '❌',
    'lucide-check-circle': '✅'
  };

  // Find all elements with lucide classes and replace with text
  const iconElements = clone.querySelectorAll('[class*="lucide"]');
  
  iconElements.forEach(el => {
    // Get the icon class name
    const iconClass = Array.from(el.classList).find(cls => cls.startsWith('lucide-'));
    
    if (iconClass && iconReplacements[iconClass]) {
      // Create text replacement
      const textSpan = document.createElement('span');
      textSpan.textContent = iconReplacements[iconClass];
      textSpan.style.cssText = `
        font-size: 14px !important;
        color: inherit !important;
        font-weight: 600 !important;
        display: inline-block !important;
      `;
      
      // Replace the icon element
      el.parentNode?.replaceChild(textSpan, el);
    }
  });

  // Also handle specific game mode patterns
  const gameRows = clone.querySelectorAll('[class*="flex"][class*="justify-between"]');
  gameRows.forEach(row => {
    // Look for mode indicators and replace with text
    const modeElements = row.querySelectorAll('svg, [class*="lucide"]');
    modeElements.forEach(el => {
      const parent = el.parentElement;
      if (parent) {
        // Determine mode type from context
        let modeText = '';
        if (parent.textContent?.includes('Slayer') || el.classList?.contains('lucide-skull')) {
          modeText = '💀 Slayer';
        } else if (parent.textContent?.includes('Flag') || el.classList?.contains('lucide-flag')) {
          modeText = '🏁 CTF';
        } else if (parent.textContent?.includes('Hill') || el.classList?.contains('lucide-crown')) {
          modeText = '👑 KOTH';
        } else if (parent.textContent?.includes('Bomb') || el.classList?.contains('lucide-bomb')) {
          modeText = '💣 Bomb';
        } else if (parent.textContent?.includes('Oddball') || el.classList?.contains('lucide-target')) {
          modeText = '🎯 Oddball';
        }

        if (modeText) {
          const textSpan = document.createElement('span');
          textSpan.textContent = modeText;
          textSpan.style.cssText = `
            font-size: 14px !important;
            color: inherit !important;
            font-weight: 600 !important;
            display: inline-block !important;
          `;
          el.parentNode?.replaceChild(textSpan, el);
        }
      }
    });
  });
}

function deepCloneAndSanitize(el) {
  const origNodes = [];
  const cloneNodes = [];

  const cloneRoot = el.cloneNode(true);

  // Convert icons to text before processing styles
  convertIconsToText(cloneRoot);

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

  // Try with sanitized clone first, fallback to simplified approach
  let container;
  let targetForCapture = el;

  try {
    const clone = deepCloneAndSanitize(el);

    // create off-screen container with safe default styles
    container = document.createElement("div");
    container.style.cssText = `
      position: fixed !important;
      left: -10000px !important;
      top: 0 !important;
      pointer-events: none !important;
      opacity: 1 !important;
      z-index: 99999 !important;
      background-color: rgb(31, 41, 55) !important;
      color: rgb(255, 255, 255) !important;
      font-family: system-ui, -apple-system, sans-serif !important;
    `;
    container.setAttribute("aria-hidden", "true");

    // ensure layout by copying computed width of original container
    const rect = el.getBoundingClientRect();
    if (rect.width) container.style.width = rect.width + "px";

    container.appendChild(clone);
    document.body.appendChild(container);

    targetForCapture = clone;
  } catch (err) {
    console.warn("[exportPdf] clone/sanitize failed, trying simplified approach:", err);
    
    // Cleanup failed clone attempt
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
      container = null;
    }
    
    targetForCapture = el;
  }

  try {
    const scale = opts.scale || 1;
    const canvas = await html2canvas(targetForCapture, {
      scale,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#1f2937",
      imageTimeout: opts.imageTimeout ?? 15000,
      logging: false,
      // Remove ignoreElements since we're converting icons to text
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
    throw new Error(`Export failed: ${err?.message || String(err)}`);
  } finally {
    // cleanup
    try {
      if (container && container.parentNode) container.parentNode.removeChild(container);
    } catch (_) {}
  }
}

export default exportElementToPdf;