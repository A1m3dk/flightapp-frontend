import { useState } from "react";
import { fetchMetar } from "./api";

function MetarPanel({ icao, label }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!icao) return null;

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !data && !loading) {
      setLoading(true);
      setFailed(false);
      const result = await fetchMetar(icao);
      if (result) setData(result);
      else setFailed(true);
      setLoading(false);
    }
  }

  return (
    <div className="panel">
      <p className="section-heading">{label || icao} &middot; METAR / TAF</p>
      <button className="icon-button" onClick={toggle}>{open ? "Hide raw reports" : "Show raw reports"}</button>

      {open && loading && <p className="no-data-msg">Loading...</p>}
      {open && failed && <p className="no-data-msg">Couldn't load weather reports right now.</p>}
      {open && data && (
        <div>
          <p className="metar-tag">METAR &middot; current observation</p>
          <pre className="metar-raw">{data.metar || "No METAR available for this airport right now."}</pre>
          <p className="metar-tag">TAF &middot; forecast</p>
          <pre className="metar-raw">{data.taf || "No TAF available for this airport right now."}</pre>
        </div>
      )}
    </div>
  );
}

export default MetarPanel;