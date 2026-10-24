import { useState, useEffect, useRef, lazy, Suspense } from "react";
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
import AtcLinks from "./AtcLinks";
import TrackedFlights from "./TrackedFlights";
import FlightTimeline from "./FlightTimeline";
import Hero from "./Hero";
import AirportDisruptions from "./AirportDisruptions";
import AircraftEvents from "./AircraftEvents";
import AirlineInfo from "./AirlineInfo";
import InboundWarning from "./InboundWarning";
import MetarPanel from "./MetarPanel";
import CarbonEstimate from "./CarbonEstimate";
import EasterEggs from "./EasterEggs";

const FlightMap = lazy(() => import("./FlightMap"));
const RouteSearch = lazy(() => import("./RouteSearch"));
const BoardingPassScan = lazy(() => import("./BoardingPassScan"));
const Settings = lazy(() => import("./Settings"));

const TABS = ["Flight", "Timeline", "Live", "More"];

function todayDate() {
  const d = new Date();
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

function cacheKeyFor(number, date) {
  return number.replace(/\s/g, "").toUpperCase() + "_" + date;
}

function App() {
  const [flightNumber, setFlightNumber] = useState("");
  const [date, setDate] = useState(todayDate());
  const [flight, setFlight] = useState(null);
  const [aircraftPhoto, setAircraftPhoto] = useState(null);
  const [aircraftInfo, setAircraftInfo] = useState(null);
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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
  const [scanOpen, setScanOpen] = useState(false);
  const [viewingCached, setViewingCached] = useState(false);
  const [titleTaps, setTitleTaps] = useState([]);
  const [devNoteOpen, setDevNoteOpen] = useState(false);

  const searchId = useRef(0);

  useEffect(() => {
    setRecent(getRecentSearches());
    setTracked(getCachedTrackedFlights());
    const id = getDeviceIdSync();
    setDeviceId(id);
    refreshTracked(id);
    checkPushStatus().then(setPushEnabled);

    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
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
    handleSearch(primary.flightNumber, primary.date);
  }, [tracked, autoLoaded]);

  async function refreshTracked(id) {
    if (!navigator.onLine) {
      setTracked(getCachedTrackedFlights());
      return;
    }
    try {
      const list = await getTrackedFlights(id);
      if (!Array.isArray(list)) {
        setTracked(getCachedTrackedFlights());
        return;
      }
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
    const numberToUse = (overrideNumber || flightNumber || "").trim();
    const dateToUse = overrideDate || date;
    if (!numberToUse || !dateToUse) return;

    if (numberToUse.toUpperCase() === "TOGA") {
      setError("");
      setLoading(false);
      setFlight({ __toga: true });
      return;
    }

    const myId = ++searchId.current;
    const key = cacheKeyFor(numberToUse, dateToUse);
    const cached = getCachedFlightData(key);

    setError("");
    setAircraftPhoto(null);
    setAircraftInfo(null);
    setPosition(null);
    setActiveTab("Flight");
    setViewingCached(false);

    if (!navigator.onLine) {
      setLoading(false);
      setRefreshing(false);
      if (cached) {
        setFlight(cached);
        setViewingCached(true);
        setSearchOpen(false);
      } else {
        setFlight(null);
        setError("You're offline and this flight isn't saved on this device yet.");
      }
      return;
    }

    if (cached) {
      setFlight(cached);
      setLastFetchedAt(null);
      setLoading(false);
      setRefreshing(true);
      setSearchOpen(false);
    } else {
      setFlight(null);
      setLoading(true);
    }

    try {
      const data = await fetchFlightStatus(numberToUse, dateToUse);
      if (myId !== searchId.current) return;
      if (!data) throw new Error("Flight not found");

      setFlight(data);
      setLastFetchedAt(new Date());
      setLoading(false);
      setRefreshing(false);
      setSearchOpen(false);
      cacheFlightData(key, data);
      setRecent(addRecentSearch(numberToUse, dateToUse));

      if (data.aircraft?.reg) {
        fetchAircraftPhoto(data.aircraft.reg).then((p) => {
          if (myId === searchId.current) setAircraftPhoto(p);
        });
        fetchAircraftInfo(data.aircraft.reg).then((info) => {
          if (myId === searchId.current) setAircraftInfo(info);
        });
      }
      fetchLivePosition(data.callSign || numberToUse).then((pos) => {
        if (myId === searchId.current) setPosition(pos);
      });
    } catch (err) {
      if (myId !== searchId.current) return;
      setLoading(false);
      setRefreshing(false);
      if (cached) setViewingCached(true);
      else setError(err.message);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSearch();
  }

  function isCurrentFlightTracked() {
    if (!flight || flight.__toga) return false;
    return tracked.find((f) => f.flightNumber === flight.number && f.date === date) != null;
  }

  async function handleTrackToggle() {
    if (!flight || flight.__toga) return;

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

  function handleRoutePick(number, pickedDate) {
    setFlightNumber(number);
    setDate(pickedDate);
    setRouteSearchOpen(false);
    handleSearch(number, pickedDate);
  }

  function handleScanPick(number, pickedDate) {
    setFlightNumber(number);
    setDate(pickedDate);
    setScanOpen(false);
    handleSearch(number, pickedDate);
  }

  function handleTitleTap() {
    const now = Date.now();
    const recentTaps = [...titleTaps, now].filter((t) => now - t < 2000);
    setTitleTaps(recentTaps);
    if (recentTaps.length >= 5) {
      setDevNoteOpen(true);
      setTitleTaps([]);
    }
  }

  const showFlight = flight && !flight.__toga;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand" onClick={handleTitleTap}>
          <span className="brand-mark" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
          </span>
          <h1 className="app-title">Flightapp</h1>
        </div>
        <div className="header-actions">
          {!pushEnabled && (
            <button className="enable-push-pill" onClick={enablePush}>
              Turn on alerts
            </button>
          )}
          <button className="settings-gear" aria-label="Settings" onClick={() => setSettingsOpen(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <line x1="4" y1="8" x2="20" y2="8" />
              <circle cx="9" cy="8" r="2.4" className="gear-knob" />
              <line x1="4" y1="16" x2="20" y2="16" />
              <circle cx="15" cy="16" r="2.4" className="gear-knob" />
            </svg>
          </button>
        </div>
      </header>

      {!isOnline && (
        <p className="offline-banner">You're offline. Showing saved data where available.</p>
      )}

      {showFlight && <Hero flight={flight} />}
      {refreshing && <p className="status-note">Updating…</p>}
      {viewingCached && <p className="status-note">Showing last saved data.</p>}

      <section className="search-card">
        {searchOpen ? (
          <>
            <div className="search-fields">
              <input
                type="text"
                placeholder="Flight number, e.g. EK1"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value)}
                onKeyDown={handleKeyDown}
                className="search-input"
                autoCapitalize="characters"
                autoCorrect="off"
              />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onKeyDown={handleKeyDown}
                className="search-input"
              />
              <button onClick={() => handleSearch()} className="search-button" disabled={loading}>
                {loading ? "Searching…" : "Search"}
              </button>
            </div>
            <div className="search-links">
              <button className="link-button" onClick={() => setRouteSearchOpen(true)}>Find by route</button>
              <span className="link-sep" aria-hidden="true">·</span>
              <button className="link-button" onClick={() => setScanOpen(true)}>Scan boarding pass</button>
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
          </>
        ) : (
          <div className="search-collapsed">
            <button className="link-button strong" onClick={() => setSearchOpen(true)}>Search a flight</button>
            <span className="link-sep" aria-hidden="true">·</span>
            <button className="link-button" onClick={() => setRouteSearchOpen(true)}>Find by route</button>
            <span className="link-sep" aria-hidden="true">·</span>
            <button className="link-button" onClick={() => setScanOpen(true)}>Scan boarding pass</button>
          </div>
        )}
      </section>

      {error && <p className="error-msg">{error}</p>}

      <TrackedFlights flights={tracked} onSelect={handleSelectTracked} onRemove={handleRemoveTracked} />

      {loading && (
        <div className="panel">
          <div className="skeleton-line skeleton-title"></div>
          <div className="skeleton-line skeleton-sub"></div>
          <div className="skeleton-grid">
            <div className="skeleton-block"></div>
            <div className="skeleton-block"></div>
          </div>
        </div>
      )}

      {flight && flight.__toga && (
        <div className="panel">
          <p className="toga-card">
            TOGA: Take Off, Go Around.<br />
            No flight found, but the pilots say hi.
          </p>
        </div>
      )}

      {showFlight && !loading && (
        <>
          <nav className="tab-bar">
            {TABS.map((tab) => (
              <button
                key={tab}
                className={"tab-button" + (activeTab === tab ? " tab-active" : "")}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </nav>

          {activeTab === "Flight" && (
            <>
              <FlightStatusCard
                flight={flight}
                aircraftPhoto={aircraftPhoto}
                aircraftInfo={aircraftInfo}
                lastFetchedAt={lastFetchedAt}
              />
              <InboundWarning flight={flight} date={date} />
              <button
                className={"track-button" + (isCurrentFlightTracked() ? " tracked" : "")}
                onClick={handleTrackToggle}
                disabled={!isOnline}
              >
                {isCurrentFlightTracked() ? "✓ Tracking · tap to remove" : "Track this flight"}
              </button>
            </>
          )}

          {activeTab === "Timeline" && <FlightTimeline flight={flight} />}

          {activeTab === "Live" &&
            (!isOnline ? (
              <div className="panel">
                <p className="no-data-msg">Offline. Go online to see live tracking.</p>
              </div>
            ) : (
              <>
                <div className="panel">
                  <p className="section-heading">Live position</p>
                  <Suspense fallback={<p className="no-data-msg">Loading map…</p>}>
                    <FlightMap position={position} />
                  </Suspense>
                </div>
                <div className="panel">
                  <AtcLinks
                    departureIcao={flight.departure?.airport?.icao}
                    arrivalIcao={flight.arrival?.airport?.icao}
                  />
                </div>
              </>
            ))}

          {activeTab === "More" &&
            (!isOnline ? (
              <div className="panel">
                <p className="no-data-msg">Offline. Go online to see more details.</p>
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
                <CarbonEstimate flight={flight} aircraftInfo={aircraftInfo} />
                <MetarPanel icao={flight.departure?.airport?.icao} label={flight.departure?.airport?.iata} />
                <MetarPanel icao={flight.arrival?.airport?.icao} label={flight.arrival?.airport?.iata} />
              </>
            ))}
        </>
      )}

      <p className="app-footer">Beta 6.00 · Made by A1m3dk</p>

      <EasterEggs />

      {settingsOpen && (
        <Suspense fallback={null}>
          <Settings
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            pushEnabled={pushEnabled}
            onTogglePush={handleTogglePush}
          />
        </Suspense>
      )}

      {routeSearchOpen && (
        <Suspense fallback={null}>
          <RouteSearch onPick={handleRoutePick} onClose={() => setRouteSearchOpen(false)} />
        </Suspense>
      )}

      {scanOpen && (
        <Suspense fallback={null}>
          <BoardingPassScan onPick={handleScanPick} onClose={() => setScanOpen(false)} />
        </Suspense>
      )}

      {devNoteOpen && (
        <div className="dev-note-overlay" onClick={() => setDevNoteOpen(false)}>
          <div className="dev-note-card" onClick={(e) => e.stopPropagation()}>
            <p className="dev-note-title">From the flight deck</p>
            <p className="dev-note-body">
              Built from scratch by A1m3dk. It survived npm path errors, CORS walls, OAuth detours and more case-sensitivity bugs than any app deserves. Thanks for flying Flightapp.
            </p>
            <button className="dev-note-close" onClick={() => setDevNoteOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;