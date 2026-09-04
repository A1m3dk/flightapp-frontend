import { useState } from "react";
import { fetchRouteSearch } from "./api";

function RouteSearch({ onPick, onClose }) {
  const [dep, setDep] = useState("");
  const [arr, setArr] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleFind() {
    if (!dep || !arr || !date) return;
    setLoading(true);
    setSearched(false);
    const data = await fetchRouteSearch(dep.trim().toUpperCase(), arr.trim().toUpperCase(), date);
    setResults(data);
    setLoading(false);
    setSearched(true);
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel route-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <p className="section-heading">Find Flights by Route</p>
          <button className="settings-close" onClick={onClose}>✕</button>
        </div>

        <div className="route-inputs">
          <input
            className="search-input"
            placeholder="From (e.g. DXB)"
            value={dep}
            onChange={(e) => setDep(e.target.value)}
          />
          <input
            className="search-input"
            placeholder="To (e.g. LHR)"
            value={arr}
            onChange={(e) => setArr(e.target.value)}
          />
          <input
            className="search-input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button className="search-button" onClick={handleFind} disabled={loading}>
            {loading ? "Searching" : "Find"}
          </button>
        </div>

        <div className="route-results">
          {searched && results.length === 0 && !loading && (
            <p className="no-data-msg">No matching flights found for that route and date.</p>
          )}
          {results.map((f, i) => (
            <button
              key={i}
              className="route-result-item"
              onClick={() => onPick(f.number, date)}
            >
              <span className="route-result-number">{f.number}</span>
              <span className="route-result-airline">{f.airline}</span>
              <span className="route-result-time">
                {f.departureScheduled ? new Date(f.departureScheduled).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "N/A"}
              </span>
              <span className="route-result-aircraft">{f.aircraftModel || ""}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RouteSearch;