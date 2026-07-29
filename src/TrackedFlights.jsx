import { useState } from "react";

function TrackedFlights({ flights, onSelect, onRemove }) {
  const [openMenuId, setOpenMenuId] = useState(null);

  if (!flights.length) return null;

  return (
    <div className="panel">
      <p className="section-heading">Tracked Flights</p>
      <div className="tracked-list">
        {flights.map((f) => (
          <div key={f._id} className="tracked-item">
            <div className="tracked-info" onClick={() => onSelect(f)}>
              <p className="tracked-number">{f.flightNumber}</p>
              <p className="tracked-meta">{f.date} {f.route ? "· " + f.route : ""}</p>
              {f.lastStatus && <span className="tracked-status">{f.lastStatus}</span>}
            </div>
            <div className="tracked-menu-wrap">
              <button
                className="dots-button"
                onClick={() => setOpenMenuId(openMenuId === f._id ? null : f._id)}
              >
                ⋮
              </button>
              {openMenuId === f._id && (
                <div className="dots-dropdown">
                  <button
                    className="dropdown-item remove"
                    onClick={() => {
                      onRemove(f._id);
                      setOpenMenuId(null);
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TrackedFlights;