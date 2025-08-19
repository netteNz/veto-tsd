import { useEffect, useState } from "react";
import { getAllMaps } from "../lib/api";

export default function MapList() {
  const [maps, setMaps] = useState([]);

  useEffect(() => {
    getAllMaps().then(setMaps);
  }, []);

  return (
    <div className="bg-gray-800 text-white p-4 mt-6 rounded">
      <h3 className="font-bold mb-2">Maps & Modes</h3>
      <ul className="space-y-2">
        {maps.map((map) => (
          <li key={map.id}>
            <span className="font-semibold">{map.name}</span>:{" "}
            {map.modes.map((mode) => mode.name).join(", ")}
          </li>
        ))}
      </ul>
    </div>
  );
}
