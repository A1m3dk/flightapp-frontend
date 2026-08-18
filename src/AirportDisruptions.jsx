import { useState, useEffect } from "react";
import { fetchAirportStats } from "./api";

function AirportDisruptions({ icao, label }) {
  const [stats, setStats] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!icao) return;
    fetchAirportStats(icao).then((s) => {
      setStats(s);
      setLoaded(true);
    });
  }, [icao]);

  if (!icao) return null;
  if (!loaded) return null;
  if (!stats || stats.totalFlights === 0) return null;

  const otpClass = stats.otpPercent >= 80 ? "otp-good" : stats.otpPercent >= 60 ? "otp-fair" : "otp-poor";

  return (
    <div className="panel">
      <p className="section-heading">{label} · Airport Performance (±3hrs)</p>
      <div className="otp-row">
        <div className={"otp-circle " + otpClass}>
          <span className="otp-percent">{stats.otpPercent != null ? stats.otpPercent + "%" : "N/A"}</span>
          <span className="otp-label">On time</span>
        </div>
        <div className="otp-stats">
          <p className="otp-stat-line"><span>Departures tracked</span><span>{stats.totalFlights}</span></p>
          <p className="otp-stat-line"><span>On time</span><span>{stats.onTime}</span></p>
          <p className="otp-stat-line"><span>Delayed</span><span>{stats.delayed}</span></p>
          <p className="otp-stat-line"><span>Cancelled</span><span>{stats.cancelled}</span></p>
          {stats.avgDelayMin > 0 && (
            <p className="otp-stat-line"><span>Avg delay</span><span>{stats.avgDelayMin} min</span></p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AirportDisruptions;