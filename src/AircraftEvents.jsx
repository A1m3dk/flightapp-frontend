import { useState, useEffect } from "react";
import { fetchAircraftHistory, fetchLivePositionByHex } from "./api";

function AircraftEvents({ reg, modeS, date, currentFlightNumber }) {
  const [history, setHistory] = useState([]);
  const [position, setPosition] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!reg || !date) return;
    fetchAircraftHistory(reg, date).then((h) => {
      setHistory(h || []);
      setLoaded(true);
    });
    if (modeS) {
      fetchLivePositionByHex(modeS).then(setPosition);
    }
  }, [reg, date, modeS]);

  if (!reg || !loaded) return null;

  const others = history.filter((f) => f.number !== currentFlightNumber);
  const now = new Date();

  const completed = others
    .filter((f) => {
      const t = f.arrival?.actualTime?.local || f.arrival?.scheduledTime?.local;
      return t && new Date(t) < now;
    })
    .sort((a, b) => new Date(b.arrival?.scheduledTime?.local) - new Date(a.arrival?.scheduledTime?.local))[0];

  const upcoming = others
    .filter((f) => {
      const t = f.departure?.scheduledTime?.local;
      return t && new Date(t) > now;
    })
    .sort((a, b) => new Date(a.departure?.scheduledTime?.local) - new Date(b.departure?.scheduledTime?.local))[0];

  if (!completed && !upcoming && !position) return null;

  return (
    <div className="panel">
      <p className="section-heading">This Aircraft Today</p>
      <div className="aircraft-events">
        {position && (
          <p className="aircraft-event-line">
            <span className="aircraft-event-tag">Right now</span>
            {position.onGround
              ? "On the ground"
              : "Airborne at " + Math.round(position.altitude) + "m, " + Math.round(position.speed) + " kt"}
          </p>
        )}
        {completed && (
          <p className="aircraft-event-line">
            <span className="aircraft-event-tag">Just completed</span>
            {completed.number}: {completed.departure?.airport?.iata} &rarr; {completed.arrival?.airport?.iata}
          </p>
        )}
        {upcoming && (
          <p className="aircraft-event-line">
            <span className="aircraft-event-tag">Next up</span>
            {upcoming.number}: {upcoming.departure?.airport?.iata} &rarr; {upcoming.arrival?.airport?.iata} at{" "}
            {new Date(upcoming.departure?.scheduledTime?.local).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>
    </div>
  );
}

export default AircraftEvents;