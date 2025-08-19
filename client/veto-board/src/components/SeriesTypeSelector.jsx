import { useState } from "react";
import { confirmSeriesType } from "../lib/api";

export default function SeriesTypeSelector({ series, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSelect = async (type) => {
    setLoading(true);
    setError("");

    try {
      await confirmSeriesType(series.id, type);
      onSuccess(); // reload series state
    } catch (err) {
      setError("Failed to confirm series type.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 text-white p-4 rounded space-y-3 mt-4">
      <h3 className="font-bold text-lg">Choose Series Type</h3>
      <div className="flex gap-4">
        {["Bo3", "Bo5", "Bo7"].map((type) => (
          <button
            key={type}
            onClick={() => handleSelect(type)}
            disabled={loading}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded"
          >
            {type}
          </button>
        ))}
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  );
}
