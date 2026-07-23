function FlightTimeline({ flight }) {
  const dep = flight?.departure;
  const arr = flight?.arrival;
  if (!dep || !arr) return null;

  const gateDepScheduled = dep.scheduledTime?.local;
  const gateDepActual = dep.actualTime?.local || dep.revisedTime?.local;
  const takeoffActual = dep.runwayTime?.local;

  const landingActual = arr.runwayTime?.local;
  const gateArrScheduled = arr.scheduledTime?.local;
  const gateArrActual = arr.actualTime?.local || arr.predictedTime?.local || arr.revisedTime?.local;

  const taxiOutMin = diffMinutes(gateDepActual, takeoffActual);
  const taxiInMin = diffMinutes(landingActual, gateArrActual);
  const airTimeMin = diffMinutes(takeoffActual, landingActual);

  const rows = [
    { label: "Gate Departure", scheduled: gateDepScheduled, actual: gateDepActual },
    { label: "Taxi Out", computed: taxiOutMin != null ? taxiOutMin + " min" : "Pending" },
    { label: "Takeoff", scheduled: null, actual: takeoffActual },
    { label: "Air Time", computed: airTimeMin != null ? formatDuration(airTimeMin) : "Pending" },
    { label: "Landing", scheduled: null, actual: landingActual },
    { label: "Taxi In", computed: taxiInMin != null ? taxiInMin + " min" : "Pending" },
    { label: "Gate Arrival", scheduled: gateArrScheduled, actual: gateArrActual },
  ];

  return (
    <div className="panel">
      <p className="section-heading">Detailed Timetable</p>
      <div className="timeline">
        {rows.map((row, i) => (
          <div key={i} className="timeline-row">
            <span className="timeline-label">{row.label}</span>
            {row.computed !== undefined ? (
              <span className="timeline-computed">{row.computed}</span>
            ) : (
              <span className="timeline-times">
                <TimeCell label="Sched" value={row.scheduled} />
                <TimeCell label="Actual/Est" value={row.actual} highlight />
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TimeCell({ label, value, highlight }) {
  if (!value) return <span className="timeline-time-cell empty">{label}: N/A</span>;
  return (
    <span className={"timeline-time-cell" + (highlight ? " highlight" : "")}>
      <span className="timeline-time-tag">{label}</span>
      <span className="timeline-time-airport">{formatAirportLocal(value)}</span>
      <span className="timeline-time-user">{formatUserLocal(value)}</span>
    </span>
  );
}

function diffMinutes(from, to) {
  if (!from || !to) return null;
  const diff = Math.round((new Date(to) - new Date(from)) / 60000);
  return diff >= 0 ? diff : null;
}

function formatDuration(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? h + "h " + m + "m" : m + "m";
}

function formatAirportLocal(localStr) {
  const match = localStr.match(/(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})/);
  if (!match) return localStr;
  return match[1] + " " + match[2];
}

function formatUserLocal(localStr) {
  return new Date(localStr).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default FlightTimeline;