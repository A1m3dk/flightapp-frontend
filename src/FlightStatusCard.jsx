function FlightStatusCard({ flight, aircraftPhoto, aircraftInfo }) {
  if (!flight) return null;

  const dep = flight.departure;
  const arr = flight.arrival;
  const aircraft = flight.aircraft;

  const depDelayMin = getDelayMinutes(dep);
  const arrDelayMin = getDelayMinutes(arr);

  return (
    <div className="panel">
    <span className={"flight-phase " + getPhaseClass(flight.status)}>
        {getPhaseLabel(flight.status)}
      </span>
      <h2 className="flight-title">
        {flight.airline?.name} {flight.number}
      </h2>
      <p className="flight-route">
        {dep?.airport?.name} ({dep?.airport?.icao}) &rarr; {arr?.airport?.name} ({arr?.airport?.icao})
      </p>

      <div className="leg-grid">
        <div className="leg-col">
          <p className="leg-label">Departure</p>
          <p className="leg-row"><span>Scheduled</span><span>{formatTime(dep?.scheduledTime?.local)}</span></p>
          <p className="leg-row"><span>Actual/Est</span><span>{formatTime(dep?.actualTime?.local || dep?.predictedTime?.local)}</span></p>
          <span className={"status-pill " + (depDelayMin > 15 ? "delayed" : "ontime")}>
            {depDelayMin > 0 ? "DELAYED " + depDelayMin + "M" : "ON TIME"}
          </span>
          <p className="leg-row"><span>Terminal</span><span>{dep?.terminal || "N/A"}</span></p>
          <p className="leg-row"><span>Gate</span><span>{dep?.gate || "N/A"}</span></p>
        </div>

        <div className="leg-col">
          <p className="leg-label">Arrival</p>
          <p className="leg-row"><span>Scheduled</span><span>{formatTime(arr?.scheduledTime?.local)}</span></p>
          <p className="leg-row"><span>Actual/Est</span><span>{formatTime(arr?.actualTime?.local || arr?.predictedTime?.local)}</span></p>
          <span className={"status-pill " + (arrDelayMin > 15 ? "delayed" : "ontime")}>
            {arrDelayMin > 0 ? "DELAYED " + arrDelayMin + "M" : "ON TIME"}
          </span>
          <p className="leg-row"><span>Terminal</span><span>{arr?.terminal || "N/A"}</span></p>
          <p className="leg-row"><span>Gate</span><span>{arr?.gate || "N/A"}</span></p>
        </div>
      </div>

      <hr className="section-divider" />

      <p className="section-heading">Aircraft</p>
      <div className="aircraft-row">
        {aircraftPhoto && (
          <img
            className="aircraft-photo"
            src={aircraftPhoto.thumbnail_large?.src || aircraftPhoto.thumbnail?.src}
            alt="Aircraft"
          />
        )}
        <div className="aircraft-details">
          <p><strong>Type:</strong> {aircraft?.model || "Unknown type"}</p>
          <p><strong>Registration:</strong> {aircraft?.reg || "N/A"}</p>
          <p><strong>Age:</strong> {formatAge(aircraftInfo)}</p>
        </div>
      </div>
    </div>
  );
}

function getDelayMinutes(leg) {
  if (!leg) return 0;
  const scheduled = leg.scheduledTime?.local;
  const actual = leg.actualTime?.local || leg.predictedTime?.local;
  if (!scheduled || !actual) return 0;
  const diffMs = new Date(actual) - new Date(scheduled);
  const diffMin = Math.round(diffMs / 60000);
  return diffMin > 0 ? diffMin : 0;
}

function formatAge(aircraftInfo) {
  if (!aircraftInfo) return "N/A";
  const rollout = aircraftInfo.rolloutDate || aircraftInfo.firstFlightDate;
  if (!rollout) return "N/A";
  const years = Math.floor((Date.now() - new Date(rollout)) / (365.25 * 24 * 60 * 60 * 1000));
  return years + " yrs (built " + rollout.slice(0, 4) + ")";
}

function getPhaseLabel(status) {
  const s = (status || "").toLowerCase();
  if (s.includes("enroute") || s.includes("approach") || s.includes("diverted")) return "AIRBORNE";
  if (s.includes("landed") || s.includes("arrived")) return "ARRIVED";
  if (s.includes("cancel")) return "CANCELLED";
  if (s.includes("expected") || s.includes("scheduled") || s.includes("unknown")) return "NOT DEPARTED";
  return status ? status.toUpperCase() : "UNKNOWN";
}

function getPhaseClass(status) {
  const s = (status || "").toLowerCase();
  if (s.includes("enroute") || s.includes("approach") || s.includes("diverted")) return "phase-airborne";
  if (s.includes("landed") || s.includes("arrived")) return "phase-arrived";
  if (s.includes("cancel")) return "phase-cancelled";
  return "phase-notdeparted";
}

function formatTime(t) {
  if (!t) return "N/A";
  return new Date(t).toLocaleString();
}

export default FlightStatusCard;