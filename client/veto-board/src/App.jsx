import { useEffect, useState } from "react";
import SeriesManager from "./components/SeriesManager";
import MapList from "./components/MapList";
import "./index.css";

function App() {
  const [seriesId, setSeriesId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/series/");
        const data = await res.json();

        if (data.results && data.results.length > 0) {
          // ✅ Use the first series found
          setSeriesId(data.results[0].id);
        } else {
          // ✅ Or create a new one
          const createRes = await fetch("http://localhost:8000/api/series/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              team_a: "Dev Team A",
              team_b: "Dev Team B",
            }),
          });
          const created = await createRes.json();
          setSeriesId(created.id);
        }
      } catch (error) {
        console.error("Failed to initialize series:", error);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <h1 className="text-3xl font-bold text-white mb-4">TSD Veto Tool</h1>

      {loading ? (
        <p className="text-white">Initializing series...</p>
      ) : (
        <>
          <SeriesManager seriesId={seriesId} />
          <MapList />
        </>
      )}
    </div>
  );
}

export default App;
