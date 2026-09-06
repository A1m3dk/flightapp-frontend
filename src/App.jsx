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
  cacheTrackedFlights,
  getCachedTrackedFlights,
  cacheFlightData,
  getCachedFlightData,
} from "./storage";
import { setupPushNotifications, disablePushNotifications, checkPushStatus, getDeviceIdSync } from "./push";
import FlightStatusCard from "./FlightStatusCard";
import FlightMap from "./FlightMap";
import EasterEggs from "./EasterEggs";
import AtcLinks from "./AtcLinks";
import TrackedFlights from "./TrackedFlights";
import FlightTimeline from "./FlightTimeline";
import Settings from "./Settings";
import Hero from "./Hero";
import AirportDisruptions from "./AirportDisruptions";
import AircraftEvents from "./AircraftEvents";
import AirlineInfo from "./AirlineInfo";
import RouteSearch from "./RouteSearch";

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

const TABS = ["Flight", "Timeline", "Live", "More"];

function App() {
  const [flightNumber, setFlightNumber] = useState("");
  const [titleTaps, setTitleTaps] = useState([]);
  const [devNoteOpen, setDevNoteOpen] = useState(false);
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
  const [activeTab, setActiveTab] = useState("Flight");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [routeSearchOpen, setRouteSearchOpen] = useState(false);
  const [viewingCached, setViewingCached] = useState(false);

  useEffect(() => {
    setRecent(getRecentSearches());
    const id = getDeviceIdSync();
    setDeviceId(id);
    refreshTracked(id);
    checkPushStatus().then(setPushEnabled);

    function goOnline() { setIsOnline(true); }
    function goOffline() { setIsOnline(false); }
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
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
    if (!navigator.onLine) {
      setTracked(getCachedTrackedFlights());
      return;
    }
    try {
      const list = await getTrackedFlights(id);
      setTracked(list);
      cacheTrackedFlights(list);
    } catch (err) {
      setTracked(getCachedTrackedFlights());
    }
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

    if (numberToUse.trim().toUpperCase() === "TOGA") {
      setFlight(null);
      setError("");
      setLoading(false);
      setFlight({ __toga: true });
      return;
    }

    const cacheKey = numberToUse.replace(/\s/g, "").toUpperCase() + "_" + dateToUse;

    setLoading(true);
    setError("");
    setFlight(null);
    setAircraftPhoto(null);
    setAircraftInfo(null);
    setPosition(null);
    setActiveTab("Flight");
    setViewingCached(false);

    if (!navigator.onLine) {
      const cached = getCachedFlightData(cacheKey);
      setLoading(false);
      if (cached) {
        setFlight(cached);
        setViewingCached(true);
      } else {
        setError("You're offline and this flight isn't cached yet.");
      }
      return;
    }

    try {
      const data = await fetchFlightStatus(numberToUse, dateToUse);
      setFlight(data);
      setLastFetchedAt(new Date());
      cacheFlightData(cacheKey, data);

      const updatedRecent = addRecentSearch(numberToUse, dateToUse);
      setRecent(updatedRecent);

      if (data.aircraft?.reg) {
        fetchAircraftPhoto(data.aircraft.reg).then(setAircraftPhoto).catch(() => setAircraftPhoto(null));
        fetchAircraftInfo(data.aircraft.reg).then(setAircraftInfo).catch(() => setAircraftInfo(null));
      }

      const callsign = data.callSign || numberToUse;
      fetchLivePosition(callsign).then(setPosition).catch(() => setPosition(null));
    } catch (err) {
      setError(err?.message || "Flight look-up failed. Please try again.");
      setFlight(null);
    } finally {
      setLoading(false);
    }
  }
  function handleTitleTap() {
    const now = Date.now();
    const recent = [...titleTaps, now].filter((t) => now - t < 2000);
    setTitleTaps(recent);
    if (recent.length >= 5) {
      setDevNoteOpen(true);
      setTitleTaps([]);
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

  function handleRoutePick(number, pickedDate) {
    setFlightNumber(number);
    setDate(pickedDate);
    setRouteSearchOpen(false);
    setSearchOpen(false);
    handleSearch(number, pickedDate);
  }

  return (
    <div className="app-shell">
      <div className="app-header">
        <h1 className="app-title" onClick={handleTitleTap} style={{ cursor: "default" }}>FLIGHTAPP</h1>
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

      {!isOnline && (
        <p className="offline-banner">You're offline — showing cached data where available.</p>
      )}

      {flight && <Hero flight={flight} />}

      {viewingCached && (
        <p className="cached-note">Showing last known data (offline).</p>
      )}

      {!searchOpen && (
        <div className="search-toggle-row">
          <button className="search-toggle" onClick={() => setSearchOpen(true)}>
            + Search another flight
          </button>
          <button className="search-toggle" onClick={() => setRouteSearchOpen(true)}>
            Find by route
          </button>
        </div>
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

      {searchOpen && (
        <button className="search-toggle route-toggle" onClick={() => setRouteSearchOpen(true)}>
          Find flights by route instead
        </button>
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

      {flight && !loading && flight.__toga && (
        <div className="panel">
          <p className="toga-card">
            TOGA — Take Off, Go Around.<br />
            No flight found, but the pilots say hi. 🛫
          </p>
        </div>
      )}

      {flight && !loading && !flight.__toga && (
        <>
          <div className="tab-bar">
            {TABS.map((tab) => (
              <button
                key={tab}
                className={"tab-button " + (activeTab === tab ? "tab-active" : "")}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "Flight" && (
            <>
              <FlightStatusCard
                flight={flight}
                aircraftPhoto={aircraftPhoto}
                aircraftInfo={aircraftInfo}
                lastFetchedAt={lastFetchedAt}
                
              />
              <button
                className={"track-button " + (isCurrentFlightTracked() ? "tracked" : "")}
                onClick={handleTrackToggle}
                disabled={!isOnline}
              >
                {isCurrentFlightTracked() ? "✓ Tracking — tap to remove" : "+ Track this flight"}
              </button>
            </>
          )}

          {activeTab === "Timeline" && <FlightTimeline flight={flight} />}

          {activeTab === "Live" && (
            <>
              {!isOnline ? (
                <div className="panel">
                  <p className="no-data-msg">Offline — go online to see live flight tracking.</p>
                </div>
              ) : (
                <>
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
            </>
          )}

          {activeTab === "More" && (
            <>
              {!isOnline ? (
                <div className="panel">
                  <p className="no-data-msg">Offline — go online to see live flight tracking.</p>
                </div>
              ) : (
                <>
                  <AircraftEvents
                    reg={flight.aircraft?.reg}
                    modeS={flight.aircraft?.modeS}
                    date={date}
                    currentFlightNumber={flight.number}
                  />
                  <AirlineInfo airline={flight.airline} />
                  <AirportDisruptions icao={flight.departure?.airport?.iata} label={flight.departure?.airport?.iata} />
                  <AirportDisruptions icao={flight.arrival?.airport?.iata} label={flight.arrival?.airport?.iata} />
                </>
              )}
            </>
          )}
        </>
      )}

      <p className="app-footer">Beta 5.00 — Made by A1m3dk</p>

      <Settings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        pushEnabled={pushEnabled}
        onTogglePush={handleTogglePush}
      />

      {routeSearchOpen && (
        <RouteSearch onPick={handleRoutePick} onClose={() => setRouteSearchOpen(false)} />
      )}
    </div>
  );
}

export default App;