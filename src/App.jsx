import { useState, useEffect } from "react";
import "./App.css";
import {
  fetchFlightStatus,
  fetchAircraftPhoto,
  fetchAircraftInfo,
  fetchLivePosition,
} from "./api";
import {
  getRecentSearches,
  addRecentSearch,
  getTrackedFlights,
  addTrackedFlight,
  removeTrackedFlight,
} from "./storage";
import { setupPushNotifications, getDeviceIdSync } from "./push";
import FlightStatusCard from "./FlightStatusCard";
import FlightMap from "./FlightMap";
import AtcLinks from "./AtcLinks";
import TrackedFlights from "./TrackedFlights";
import FlightTimeline from "./FlightTimeline";

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function App() {
  const [flightNumber, setFlightNumber] = useState("");
  const [date, setDate] = useState(todayDate());
  const [flight, setFlight] = useState(null);
  const [aircraftPhoto, setAircraftPhoto] = useState(null);
  const [aircraftInfo, setAircraftInfo] = useState(null);
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tracked, setTracked] = useState([]);
  const [recent, setRecent] = useState([]);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    setRecent(getRecentSearches());
    const id = getDeviceIdSync();
    setDeviceId(id);
    refreshTracked(id);
  }, []);

  async function refreshTracked(id) {
    const list = await getTrackedFlights(id);
    setTracked(list);
  }

  async function enablePush() {
    const id = await setupPushNotifications();
    if (id) {
      setPushEnabled(true);
      refreshTracked(id);
    } else {
      alert("Notifications permission is needed for background flight alerts. Please allow notifications and try again.");
    }
  }

  async function handleSearch(overrideNumber, overrideDate) {
    const numberToUse = overrideNumber || flightNumber;
    const dateToUse = overrideDate || date;
    if (!numberToUse || !dateToUse) return;

    setLoading(true);
    setError("");
    setFlight(null);
    setAircraftPhoto(null);
    setAircraftInfo(null);
    setPosition(null);

    try {
      const data = await fetchFlightStatus(numberToUse, dateToUse);
      setFlight(data);
      setLastFetchedAt(new Date());
      setLoading(false);

      const updatedRecent = addRecentSearch(numberToUse, dateToUse);
      setRecent(updatedRecent);

      if (data.aircraft?.reg) {
        fetchAircraftPhoto(data.aircraft.reg).then(setAircraftPhoto);
        fetchAircraftInfo(data.aircraft.reg).then(setAircraftInfo);
      }

      const callsign = data.callSign || numberToUse;
      fetchLivePosition(callsign).then(setPosition);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSearch();
  }

  function isCurrentFlightTracked() {
    if (!flight) return false;
    return tracked.find((f) => f.flightNumber === flight.number && f.date === date) != null;
  }

  async function handleTrackToggle() {
    if (!flight) return;

    const existing = tracked.find((f) => f.flightNumber === flight.number && f.date === date);
    if (existing) {
      await removeTrackedFlight(existing._id);
      refreshTracked(deviceId);
      return;
    }

    if (!pushEnabled) {
      await enablePush();
    }

    const route = flight.departure?.airport?.icao + " to " + flight.arrival?.airport?.icao;
    await addTrackedFlight(deviceId, flight.number, date, route);
    refreshTracked(deviceId);
  }

  async function handleRemoveTracked(id) {
    await removeTrackedFlight(id);
    refreshTracked(deviceId);
  }

  function handleSelectTracked(f) {
    setFlightNumber(f.flightNumber);
    setDate(f.date);
    handleSearch(f.flightNumber, f.date);
  }

  function handleSelectRecent(r) {
    setFlightNumber(r.flightNumber);
    setDate(r.date);
    handleSearch(r.flightNumber, r.date);
  }

  return (
    <div className="app-shell">
      <div className="app-header">
        <h1 className="app-title">FLIGHTAPP</h1>
      </div>
      <p className="app-subtitle">Personal Flight Ops Tracker</p>

      {!pushEnabled && (
        <button className="enable-push-button" onClick={enablePush}>
          Enable background flight alerts
        </button>
      )}

      <div className="search-bar">
        <input
          type="text"
          placeholder="Flight number e.g. EK123"
          value={flightNumber}
          onChange={(e) => setFlightNumber(e.target.value)}
          onKeyDown={handleKeyDown}
          className="search-input"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          onKeyDown={handleKeyDown}
          className="search-input"
        />
        <button onClick={() => handleSearch()} className="search-button" disabled={loading}>
          {loading ? "Searching" : "Search"}
        </button>
      </div>

      {recent.length > 0 && (
        <div className="recent-chips">
          {recent.map((r, i) => (
            <button key={i} className="recent-chip" onClick={() => handleSelectRecent(r)}>
              {r.flightNumber} · {r.date}
            </button>
          ))}
        </div>
      )}

      {error && <p className="error-msg">{error}</p>}

      <TrackedFlights flights={tracked} onSelect={handleSelectTracked} onRemove={handleRemoveTracked} />

      {loading && (
        <div className="panel skeleton-panel">
          <div className="skeleton-line skeleton-title"></div>
          <div className="skeleton-line skeleton-sub"></div>
          <div className="skeleton-grid">
            <div className="skeleton-block"></div>
            <div className="skeleton-block"></div>
          </div>
        </div>
      )}

      {flight && !loading && (
        <>
          <FlightStatusCard
            flight={flight}
            aircraftPhoto={aircraftPhoto}
            aircraftInfo={aircraftInfo}
            lastFetchedAt={lastFetchedAt}
          />

          <FlightTimeline flight={flight} />

          <button
            className={"track-button " + (isCurrentFlightTracked() ? "tracked" : "")}
            onClick={handleTrackToggle}
          >
            {isCurrentFlightTracked() ? "✓ Tracking — tap to remove" : "+ Track this flight"}
          </button>

          <div className="panel">
            <p className="section-heading">Live Position</p>
            <FlightMap position={position} />
          </div>
          <div className="panel">
            <AtcLinks
              departureIcao={flight.departure?.airport?.icao}
              arrivalIcao={flight.arrival?.airport?.icao}
            />
          </div>
        </>
      )}

      <p className="app-footer">Beta 3.00 — Made by A1m3dk</p>
    </div>
  );
}

export default App;