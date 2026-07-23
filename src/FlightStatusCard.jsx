import { useState, useEffect } from "react";

function FlightStatusCard({ flight, aircraftPhoto, aircraftInfo, lastFetchedAt }) {
  const [copiedField, setCopiedField] = useState(null);
  const [countdown, setCountdown] = useState("");
  const [depWeather, setDepWeather] = useState(null);
  const [arrForecast, setArrForecast] = useState(null);

  const dep = flight?.departure;
  const arr = flight?.arrival;
  const aircraft = flight?.aircraft;

  useEffect(() => {
    if (!dep?.scheduledTime?.local) return;
    const target = new Date(dep.scheduledTime.local);

    function tick() {
      const diffMs = target - new Date();
      if (diffMs <= 0) {
        setCountdown("");
        return;
      }
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setCountdown(hours + "h " + mins + "m");
    }

    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, [dep?.scheduledTime?.local]);

  useEffect(() => {
    async function loadWeather() {
      if (dep?.airport?.location) {
        const w = await fetchCurrentWeather(dep.airport.location.lat, dep.airport.location.lon);
        setDepWeather(w);
      }
      const arrTime = arr?.scheduledTime?.local || arr?.predictedTime?.local;
      if (arr?.airport?.location && arrTime) {
        const f = await fetchForecastAt(arr.airport.location.lat, arr.airport.location.lon, arrTime);
        setArrForecast(f);
      }
    }
    loadWeather();
  }, [dep?.airport?.icao, arr?.airport?.icao]);

  if (!flight) return null;

  const depDelayMin = getDelayMinutes(dep);
  const arrDelayMin = getDelayMinutes(arr);

  function copyToClipboard(text, field) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    });
  }

  function shareFlight() {
    const summary =
      (flight.airline?.name || "") + " " + flight.number + "\n" +
      (dep?.airport?.name || "") + " -> " + (arr?.airport?.name || "") + "\n" +
      "Departure: " + formatTime(dep?.scheduledTime?.local) + "\n" +
      "Gate: " + (dep?.gate || "N/A") + " | Terminal: " + (dep?.terminal || "N/A") + "\n" +
      "Status: " + getPhaseLabel(flight.status);

    if (navigator.share) {
      navigator.share({ title: flight.number + " flight status", text: summary }).catch(() => {});
    } else {
      copyToClipboard(summary, "share");
    }
  }

  return (
    <div className="panel">
      <div className="phase-row">
        <span className={"flight-phase " + getPhaseClass(flight.status)}>
          {getPhaseLabel(flight.status)}
        </span>
        {countdown && <span className="countdown-badge">Departs in {countdown}</span>}
      </div>

      <div className="flight-title-row">
        <h2 className="flight-title">
          {flight.airline?.name} {flight.number}
        </h2>
        <button className="icon-button" onClick={() => copyToClipboard(flight.number, "number")} title="Copy flight number">
          {copiedField === "number" ? "Copied" : "Copy"}
        </button>
        <button className="icon-button" onClick={shareFlight} title="Share flight">
          {copiedField === "share" ? "Copied" : "Share"}
        </button>
      </div>

      <p className="flight-route">
        {dep?.airport?.name} ({dep?.airport?.icao}) &rarr; {arr?.airport?.name} ({arr?.airport?.icao})
      </p>
      <p className="flight-meta-row">
        {getFlightDuration(dep, arr) && (
          <span className="flight-meta-item">Flight time: {getFlightDuration(dep, arr)}</span>
        )}
        {getTimezoneDiff(dep, arr) && (
          <span className="flight-meta-item">Timezone: {getTimezoneDiff(dep, arr)}</span>
        )}
      </p>

      <div className="leg-grid">
        <div className="leg-col">
          <p className="leg-label">Departure &middot; {dep?.airport?.timeZone || ""}</p>
          <p className="leg-row"><span>Scheduled</span><span>{formatTime(dep?.scheduledTime?.local)}</span></p>
          <p className="leg-row"><span>Actual/Est</span><span>{formatTime(dep?.actualTime?.local || dep?.predictedTime?.local)}</span></p>
          <span className={"status-pill " + (depDelayMin > 15 ? "delayed" : "ontime")}>
            {depDelayMin > 0 ? "DELAYED " + depDelayMin + "M" : "ON TIME"}
          </span>
          <p className="leg-row">
            <span>Terminal</span>
            <span>{dep?.terminal || "N/A"}</span>
          </p>
          <p className="leg-row">
            <span>Gate</span>
            <span>
              {dep?.gate || "N/A"}
              {dep?.gate && (
                <button className="mini-copy" onClick={() => copyToClipboard(dep.gate, "gate")}>
                  {copiedField === "gate" ? "✓" : "copy"}
                </button>
              )}
            </span>
          </p>
          {depWeather && (
            <p className="leg-row"><span>Weather now</span><span>{depWeather}</span></p>
          )}
        </div>

        <div className="leg-col">
          <p className="leg-label">Arrival &middot; {arr?.airport?.timeZone || ""}</p>
          <p className="leg-row"><span>Scheduled</span><span>{formatTime(arr?.scheduledTime?.local)}</span></p>
          <p className="leg-row"><span>Actual/Est</span><span>{formatTime(arr?.actualTime?.local || arr?.predictedTime?.local)}</span></p>
          <span className={"status-pill " + (arrDelayMin > 15 ? "delayed" : "ontime")}>
            {arrDelayMin > 0 ? "DELAYED " + arrDelayMin + "M" : "ON TIME"}
          </span>
          <p className="leg-row"><span>Terminal</span><span>{arr?.terminal || "N/A"}</span></p>
          <p className="leg-row"><span>Gate</span><span>{arr?.gate || "N/A"}</span></p>
          {arrForecast && (
            <p className="leg-row"><span>Forecast on arrival</span><span>{arrForecast}</span></p>
          )}
        </div>
      </div>

      <hr className="section-divider" />

      <p className="section-heading">Aircraft</p>
      <div className="aircraft-row">
        {aircraftPhoto ? (
          <img
            className="aircraft-photo"
            src={"https://flightapp-w6ob.onrender.com/api/image-proxy?url=" + encodeURIComponent(aircraftPhoto.imageUrl)}
            alt="Aircraft"
          />
        ) : (
          <div className="aircraft-photo-placeholder">No photo available</div>
        )}
        <div className="aircraft-details">
          <p><strong>Type:</strong> {aircraft?.model || "Unknown type"}</p>
          <p><strong>Registration:</strong> {aircraft?.reg || "N/A"}</p>
          <p><strong>Age:</strong> {formatAge(aircraftInfo)}</p>
        </div>
      </div>

      {lastFetchedAt && (
        <p className="last-updated">Last updated {lastFetchedAt.toLocaleTimeString()}</p>
      )}
    </div>
  );
}

async function fetchCurrentWeather(lat, lon) {
  try {
    const res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lon + "&current_weather=true"
    );
    if (!res.ok) return null;
    const data = await res.json();
    const temp = data.current_weather?.temperature;
    const code = data.current_weather?.weathercode;
    if (temp == null) return null;
    return Math.round(temp) + "°C, " + weatherCodeLabel(code);
  } catch (err) {
    return null;
  }
}

async function fetchForecastAt(lat, lon, targetLocalStr) {
  try {
    const res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lon +
      "&hourly=temperature_2m,weathercode&timezone=auto&forecast_days=3"
    );
    if (!res.ok) return null;
    const data = await res.json();
    const times = data.hourly?.time || [];
    if (!times.length) return null;

    const targetDatePart = targetLocalStr.slice(0, 13);
    let idx = times.findIndex((t) => t.slice(0, 13) === targetDatePart);
    if (idx === -1) idx = 0;

    const temp = data.hourly.temperature_2m[idx];
    const code = data.hourly.weathercode[idx];
    if (temp == null) return null;
    return Math.round(temp) + "°C, " + weatherCodeLabel(code);
  } catch (err) {
    return null;
  }
}

function weatherCodeLabel(code) {
  if (code === 0) return "Clear";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Fog";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Showers";
  if (code <= 99) return "Storms";
  return "";
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

function getFlightDuration(dep, arr) {
  const depTime = dep?.scheduledTime?.utc;
  const arrTime = arr?.scheduledTime?.utc;
  if (!depTime || !arrTime) return null;
  const diffMs = new Date(arrTime + "Z".replace("ZZ", "Z")) - new Date(depTime + "Z".replace("ZZ", "Z"));
  const totalMin = Math.round(diffMs / 60000);
  if (totalMin <= 0) return null;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h + "h " + m + "m";
}

function getTimezoneDiff(dep, arr) {
  const depLocal = dep?.scheduledTime?.local;
  const depUtc = dep?.scheduledTime?.utc;
  const arrLocal = arr?.scheduledTime?.local;
  const arrUtc = arr?.scheduledTime?.utc;
  if (!depLocal || !depUtc || !arrLocal || !arrUtc) return null;

  const depOffset = getUtcOffsetHours(depLocal, depUtc);
  const arrOffset = getUtcOffsetHours(arrLocal, arrUtc);
  if (depOffset == null || arrOffset == null) return null;

  const diff = arrOffset - depOffset;
  if (diff === 0) return "Same time zone";
  const sign = diff > 0 ? "+" : "";
  return sign + diff + "h vs departure";
}

function getUtcOffsetHours(localStr, utcStr) {
  const match = localStr.match(/([+-]\d{2}):(\d{2})$/);
  if (!match) return null;
  const sign = match[1][0] === "-" ? -1 : 1;
  const hours = parseInt(match[1].slice(1), 10);
  const mins = parseInt(match[2], 10);
  return sign * (hours + mins / 60);
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

function formatTime(t) {
  if (!t) return "N/A";
  return new Date(t).toLocaleString();
}

export default FlightStatusCard;