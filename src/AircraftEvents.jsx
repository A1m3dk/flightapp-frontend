import { useState, useEffect } from "react";
import { fetchAircraftHistory, fetchLivePositionByHex } from "./api";

function AircraftEvents({ reg, modeS, date, currentFlightNumber }) {
  const [history, setHistory] = useState([]);
  const [position, setPosition] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!reg || !date) return;
    setLoaded(false);
    fetchAircraftHistory(reg, date).then((h) => {
      setHistory(Array.isArray(h) ? h : []);
      setLoaded(true);
    });
    if (modeS) {
      fetchLivePositionByHex(modeS).then(setPosition);
    }
  }, [reg, date, modeS]);

  if (!reg) return null;

  const others = history.filter((f) => f.number !== currentFlightNumber);
  const now = new Date();

  const completedCandidates = others.filter((f) => {
    const t = f.arrival?.actualTime?.local || f.arrival?.revisedTime?.local || f.arrival?.scheduledTime?.local;
    return t && new Date(t) < now;
  });
  const completed = completedCandidates.sort(
    (a, b) => new Date(b.arrival?.scheduledTime?.local || 0) - new Date(a.arrival?.scheduledTime?.local || 0)
  )[0];

  const upcomingCandidates = others.filter((f) => {
    const t = f.departure?.scheduledTime?.local;
    return t && new Date(t) > now;
  });
  const upcoming = upcomingCandidates.sort(
    (a, b) => new Date(a.departure?.scheduledTime?.local || 0) - new Date(b.departure?.scheduledTime?.local || 0)
  )[0];

  return (
    <div className="panel">
      <p className="section-heading">This Aircraft Today</p>
      {!loaded && <p className="no-data-msg">Loading aircraft activity...</p>}
      {loaded && (
        <div className="aircraft-events">
          {position && (
            <p className="aircraft-event-line">
              <span className="aircraft-event-tag">Right now</span>
              {position.onGround
                ? "On the ground"
                : "Airborne at " + Math.round(position.altitude || 0) + "m, " + Math.round(position.speed || 0) + " kt"}
            </p>
          )}
          {completed && (
            <p className="aircraft-event-line">
              <span className="aircraft-event-tag">Just completed</span>
              {completed.number}: {completed.departure?.airport?.iata || "?"} &rarr; {completed.arrival?.airport?.iata || "?"}
            </p>
          )}
          {upcoming && (
            <p className="aircraft-event-line">
              <span className="aircraft-event-tag">Next up</span>
              {upcoming.number}: {upcoming.departure?.airport?.iata || "?"} &rarr; {upcoming.arrival?.airport?.iata || "?"} at{" "}
              {upcoming.departure?.scheduledTime?.local
                ? new Date(upcoming.departure.scheduledTime.local).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "N/A"}
            </p>
          )}
          {!position && !completed && !upcoming && (
            <p className="no-data-msg">No other recorded activity for this aircraft today.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default AircraftEvents;