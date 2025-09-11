import { Link, useNavigate } from "react-router-dom";
import { Play, HelpCircle, Shuffle } from "lucide-react";
import { useState } from "react";
import { createSeries } from "../lib/api";

export default function LandingPage() {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  const handleStartNewSeries = async () => {
    try {
      setCreating(true);
      const s = await createSeries("", "");
      // navigate to /veto and pass the new series id as query param
      navigate(`/veto?seriesId=${s.id}`);
    } catch (err) {
      console.error("Failed to create series:", err);
      alert("Failed to create series");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">TSD Veto Tool</h1>
          <p className="text-xl text-gray-300 mb-8">
            Drafting and veto system for competitive Halo matches
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={handleStartNewSeries}
            className="w-full text-left border-2 border-blue-600 text-blue-500 hover:bg-blue-600 hover:text-white transition-colors p-8 rounded-lg group bg-transparent"
            disabled={creating}
          >
            <Play size={48} className="mx-auto mb-4 text-blue-500 group-hover:text-white group-hover:scale-110 transition-transform" />
            <h2 className="text-2xl font-bold text-blue-500 group-hover:text-white mb-2">Start New Series</h2>
            <p className="text-blue-100 group-hover:text-blue-50">
              {creating ? "Creating..." : "Begin a new competitive veto session with team assignments and live drafting"}
            </p>
          </button>

          <Link
            to="/random"
            className="border-2 border-green-600 text-green-500 hover:bg-green-600 hover:text-white transition-colors p-8 rounded-lg text-center group bg-transparent"
          >
            <Shuffle size={48} className="mx-auto mb-4 text-green-500 group-hover:text-white group-hover:scale-110 transition-transform" />
            <h2 className="text-2xl font-bold text-green-500 group-hover:text-white mb-2">Random Series</h2>
            <p className="text-green-100 group-hover:text-green-50">
              Generate a randomized series for practice or demonstration purposes
            </p>
          </Link>
        </div>

        <div className="text-center mb-8">
          <Link
            to="/help"
            className="inline-flex items-center text-gray-300 hover:text-white transition-colors"
          >
            <HelpCircle size={20} className="mr-2" />
            <span className="text-lg">How to Use This Tool</span>
          </Link>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-3">Features</h3>
          <ul className="space-y-2 text-gray-300">
            <li>• Team-based veto and pick system</li>
            <li>• Support for Bo3, Bo5, and Bo7 series formats</li>
            <li>• Real-time series progression tracking</li>
          </ul>
        </div>
      </div>
    </div>
  );
}