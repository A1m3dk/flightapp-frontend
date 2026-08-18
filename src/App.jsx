import { useState, useEffect } from "react";
import "./App.css";
import AirportDisruptions from "./AirportDisruptions";
import AircraftEvents from "./AircraftEvents";
import AirlineInfo from "./AirlineInfo";
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
import { setupPushNotifications, disablePushNotifications, checkPushStatus, getDeviceIdSync } from "./push";
import FlightStatusCard from "./FlightStatusCard";
import FlightMap from "./FlightMap";
import AtcLinks from "./AtcLinks";
import TrackedFlights from "./TrackedFlights";
import FlightTimeline from "./FlightTimeline";
import Settings from "./Settings";
import Hero from "./Hero";

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(true);
  const [autoLoaded, setAutoLoaded] = useState(false);

  useEffect(() => {
    setRecent(getRecentSearches());
    const id = getDeviceIdSync();
    setDeviceId(id);
    refreshTracked(id);
    checkPushStatus().then(setPushEnabled);
  }, []);

  useEffect(() => {
    if (autoLoaded || tracked.length === 0 || flight) return;
    const sorted = [...tracked].sort((a, b) => a.date.localeCompare(b.date));
    const primary = sorted[0];
    setAutoLoaded(true);
    setSearchOpen(false);
    handleSearch(primary.flightNumber, primary.date);
  }, [tracked, autoLoaded]);

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

  async function handleTogglePush() {
    if (pushEnabled) {
      await disablePushNotifications();
      setPushEnabled(false);
    } else {
      await enablePush();
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
    setSearchOpen(false);
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
        <button className="settings-gear" onClick={() => setSettingsOpen(true)} title="Settings">⚙</button>
      </div>
      <div className="subtitle-row">
        <p className="app-subtitle">Personal Flight Ops Tracker</p>
        {!pushEnabled && (
          <button className="enable-push-pill" onClick={enablePush}>
            Enable background alerts
          </button>
        )}
      </div>

      {flight && <Hero flight={flight} />}

      {!searchOpen && (
        <button className="search-toggle" onClick={() => setSearchOpen(true)}>
          + Search another flight
        </button>
      )}

      {searchOpen && (
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
      )}

      {recent.length > 0 && searchOpen && (
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

          <AircraftEvents
            reg={flight.aircraft?.reg}
            modeS={flight.aircraft?.modeS}
            date={date}
            currentFlightNumber={flight.number}
          />

          <AirlineInfo airline={flight.airline} />

          <AirportDisruptions icao={flight.departure?.airport?.icao} label={flight.departure?.airport?.iata} />
          <AirportDisruptions icao={flight.arrival?.airport?.icao} label={flight.arrival?.airport?.iata} />
          
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

      <p className="app-footer">Beta 6.12 — Made by A1m3dk</p>

      <Settings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        pushEnabled={pushEnabled}
        onTogglePush={handleTogglePush}
      />
    </div>
  );
}

export default App;