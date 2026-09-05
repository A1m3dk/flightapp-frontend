import { useState, useRef } from "react";
import { fetchRouteSearch, fetchAirportSearch } from "./api";

function AirportField({ label, value, onSelect }) {
  const [text, setText] = useState(value || "");
  const [options, setOptions] = useState([]);
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);

  function handleChange(e) {
    const val = e.target.value;
    setText(val);
    onSelect("");
    if (timerRef.current) clearTimeout(timerRef.current);
    if (val.trim().length < 2) {
      setOptions([]);
      setOpen(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      const results = await fetchAirportSearch(val.trim());
      setOptions(results);
      setOpen(results.length > 0);
    }, 300);
  }

  function pick(opt) {
    setText(opt.iata + " — " + opt.city);
    onSelect(opt.iata);
    setOpen(false);
    setOptions([]);
  }

  return (
    <div className="airport-field">
      <input
        className="search-input"
        placeholder={label}
        value={text}
        onChange={handleChange}
        onFocus={() => options.length > 0 && setOpen(true)}
      />
      {open && (
        <div className="airport-dropdown">
          {options.map((opt, i) => (
            <button key={i} className="airport-option" onClick={() => pick(opt)}>
              <span className="airport-option-code">{opt.iata}</span>
              <span className="airport-option-name">{opt.city ? opt.city + " — " : ""}{opt.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
    const data = await fetchRouteSearch(dep, arr, date);
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
          <AirportField label="From (city or code)" onSelect={setDep} />
          <AirportField label="To (city or code)" onSelect={setArr} />
          <input
            className="search-input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button className="search-button" onClick={handleFind} disabled={loading || !dep || !arr}>
            {loading ? "Searching" : "Find"}
          </button>
        </div>

        <div className="route-results">
          {searched && results.length === 0 && !loading && (
            <p className="no-data-msg">No matching flights found for that route and date.</p>
          )}
          {results.map((f, i) => (
            <button key={i} className="route-result-item" onClick={() => onPick(f.number, date)}>
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