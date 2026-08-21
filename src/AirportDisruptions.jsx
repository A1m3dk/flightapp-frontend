import { useState, useEffect } from "react";
import { fetchAirportStats } from "./api";

function AirportDisruptions({ icao, label }) {
  const [stats, setStats] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!icao) return;
    setLoaded(false);
    fetchAirportStats(icao).then(function (s) {
      setStats(s);
      setLoaded(true);
    });
  }, [icao]);

  if (!icao) return null;

  let otpClass = "otp-poor";
  if (stats && stats.otpPercent >= 80) otpClass = "otp-good";
  else if (stats && stats.otpPercent >= 60) otpClass = "otp-fair";

  return (
    <div className="panel">
      <p className="section-heading">{label || icao} &middot; Airport Performance (&plusmn;3hrs)</p>

      {!loaded && <p className="no-data-msg">Loading airport performance...</p>}

      {loaded && (!stats || stats.totalFlights === 0) && (
        <p className="no-data-msg">No recent departure data available for this airport right now.</p>
      )}

      {loaded && stats && stats.totalFlights > 0 && (
        <div className="otp-row">
          <div className={"otp-circle " + otpClass}>
            <span className="otp-percent">{stats.otpPercent != null ? stats.otpPercent + "%" : "N/A"}</span>
            <span className="otp-label">On time</span>
          </div>
          <div className="otp-stats">
            <p className="otp-stat-line">
              <span>Departures tracked</span>
              <span>{stats.totalFlights}</span>
            </p>
            <p className="otp-stat-line">
              <span>On time</span>
              <span>{stats.onTime}</span>
            </p>
            <p className="otp-stat-line">
              <span>Delayed</span>
              <span>{stats.delayed}</span>
            </p>
            <p className="otp-stat-line">
              <span>Cancelled</span>
              <span>{stats.cancelled}</span>
            </p>
            {stats.avgDelayMin > 0 && (
              <p className="otp-stat-line">
                <span>Avg delay</span>
                <span>{stats.avgDelayMin} min</span>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AirportDisruptions;