import { useState, useRef } from "react";
import { fetchRouteSearch, fetchAirportSearch } from "./api";

function localToday() {
  const d = new Date();
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

function clockOf(str) {
  const m = /(\d{2}):(\d{2})/.exec(str || "");
  return m ? m[1] + ":" + m[2] : "N/A";
}

function dateOf(str, fallback) {
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(str || "");
  return m ? m[1] : fallback;
}

function AirportField({ label, onSelect }) {
  const [text, setText] = useState("");
  const [options, setOptions] = useState([]);
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);
  const reqRef = useRef(0);

  function handleChange(e) {
    const val = e.target.value;
    setText(val);
    onSelect("");
    if (timerRef.current) clearTimeout(timerRef.current);
    if (val.trim().length < 2) {
      reqRef.current++;
      setOptions([]);
      setOpen(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      const myReq = ++reqRef.current;
      const results = await fetchAirportSearch(val.trim());
      if (myReq !== reqRef.current) return;
      setOptions(results);
      setOpen(results.length > 0);
    }, 300);
  }

  function pick(opt) {
    setText(opt.iata + (opt.city ? " · " + opt.city : ""));
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
              <span className="airport-option-name">
                {opt.city ? opt.city + " · " : ""}
                {opt.name}
              </span>
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
  const [date, setDate] = useState(localToday());
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleFind() {
    if (!dep || !arr || !date) return;
    setLoading(true);
    setSearched(false);
    const data = await fetchRouteSearch(dep, arr, date);
    const list = Array.isArray(data) ? data : [];
    list.sort((a, b) => (a.departureScheduled || "").localeCompare(b.departureScheduled || ""));
    setResults(list);
    setLoading(false);
    setSearched(true);
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel route-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <p className="section-heading">Find flights by route</p>
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
            {loading ? "Searching…" : "Find"}
          </button>
        </div>

        <p className="bp-note">
          Results come from the current airline schedule, so they're most reliable for today and the next day or two.
        </p>

        <div className="route-results">
          {searched && results.length === 0 && !loading && (
            <p className="no-data-msg">No matching flights found for that route.</p>
          )}
          {results.map((f, i) => (
            <button
              key={i}
              className="route-result-item"
              onClick={() => onPick(f.number, dateOf(f.departureScheduled, date))}
            >
              <span className="route-result-number">{f.number}</span>
              <span className="route-result-airline">{f.airline}</span>
              <span className="route-result-time">{clockOf(f.departureScheduled)}</span>
              <span className="route-result-aircraft">{f.aircraftModel || ""}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RouteSearch;