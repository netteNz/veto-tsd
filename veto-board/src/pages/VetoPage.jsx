// src/pages/VetoPage.jsx
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { HelpCircle } from "lucide-react";
import SeriesManager from "../components/SeriesManager";
import { createSeries } from "../lib/api";
import "../index.css";

export default function VetoPage() {
  const [seriesId, setSeriesId] = useState(null);
  const [loading, setLoading] = useState(false);

  // read seriesId from query param if present (navigate from LandingPage)
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sid = params.get("seriesId");
    if (sid) {
      setSeriesId(Number(sid));
    }
  }, [location.search]);

  // create a blank series (series manager will show the assignment UI)
  const handleNewSeries = async () => {
    setLoading(true);
    try {
      const s = await createSeries("", "");
      setSeriesId(s.id);
    } catch (err) {
      console.error("Failed to create series:", err);
      alert("Failed to create series");
    } finally {
      setLoading(false);
    }
  };

  const handleResetToCreate = () => {
    // unmount SeriesManager and return to "create" state (if you want)
    setSeriesId(null);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h1 className="text-3xl font-bold text-white">Setup New Series</h1>
          <Link to="/help" className="ml-4 text-sm text-blue-400 hover:underline flex items-center">
            <HelpCircle size={14} className="mr-1" />
            <span>How to Use</span>
          </Link>
        </div>

        <div>
          <button
            onClick={handleNewSeries}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white mr-2"
            disabled={loading}
          >
            {loading ? "Creating..." : "New Series"}
          </button>
          <button
            onClick={handleResetToCreate}
            className="bg-gray-700 hover:bg-gray-800 px-3 py-1 rounded text-white"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Always mount SeriesManager when we have a seriesId.
          The TeamAssignmentForm (assignment UI) lives inside SeriesManager (IDLE state). */}
      {seriesId ? (
        <SeriesManager seriesId={seriesId} onSuccess={() => {/* refresh if needed */}} />
      ) : (
        <div className="bg-gray-800 rounded-lg p-6">
          <p className="text-gray-300 mb-4">
            Click "New Series" to create a series. The team-assignment form is shown inside the Series Manager.
          </p>
        </div>
      )}
    </div>
  );
}