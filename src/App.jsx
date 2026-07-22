import { useState, useEffect, useRef } from "react";
import "./App.css";
import {
  fetchFlightStatus,
  fetchAircraftPhoto,
  fetchAircraftInfo,
  fetchLivePosition,
} from "./api";
import {
  getTrackedFlights,
  addTrackedFlight,
  removeTrackedFlight,
  updateTrackedFlight,
  getRecentSearches,
  addRecentSearch,
} from "./storage";
import { requestNotificationPermission, notify } from "./notifications";
import FlightStatusCard from "./FlightStatusCard";
import FlightMap from "./FlightMap";
import AtcLinks from "./AtcLinks";
import TrackedFlights from "./TrackedFlights";

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

  const pollRef = useRef(null);

  useEffect(() => {
    setTracked(getTrackedFlights());
    setRecent(getRecentSearches());
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    pollRef.current = setInterval(checkTrackedFlights, 5 * 60 * 1000);
    return () => clearInterval(pollRef.current);
  }, [tracked]);

  function getDelayMinutes(leg) {
    if (!leg) return 0;
    const scheduled = leg.scheduledTime?.local;
    const actual = leg.actualTime?.local || leg.predictedTime?.local;
    if (!scheduled || !actual) return 0;
    const diffMs = new Date(actual) - new Date(scheduled);
    const diffMin = Math.round(diffMs / 60000);
    return diffMin > 0 ? diffMin : 0;
  }

  async function checkTrackedFlights() {
    const list = getTrackedFlights();
    for (const f of list) {
      try {
        const data = await fetchFlightStatus(f.flightNumber, f.date);
        const dep = data.departure;
        const arr = data.arrival;

        const depDelay = getDelayMinutes(dep);
        const arrDelay = getDelayMinutes(arr);
        const newStatus = depDelay > 15 || arrDelay > 15 ? "Delayed" : "On time";

        if (f.lastStatus && f.lastStatus !== newStatus) {
          notify(f.flightNumber + " status changed", newStatus);
        }
        if (f.lastGate !== dep?.gate && dep?.gate) {
          notify(f.flightNumber + " gate assigned", "Gate " + dep.gate);
        }
        if (f.lastTerminal !== dep?.terminal && dep?.terminal) {
          notify(f.flightNumber + " terminal", "Terminal " + dep.terminal);
        }

        const updated = updateTrackedFlight(f.id, {
          lastStatus: newStatus,
          lastGate: dep?.gate,
          lastTerminal: dep?.terminal,
        });
        setTracked(updated);
      } catch (err) {
        // silent fail for individual flight, keep checking the rest
      }
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

      const updatedRecent = addRecentSearch(numberToUse, dateToUse);
      setRecent(updatedRecent);

      if (data.aircraft?.reg) {
        const photo = await fetchAircraftPhoto(data.aircraft.reg);
        setAircraftPhoto(photo);
        const info = await fetchAircraftInfo(data.aircraft.reg);
        setAircraftInfo(info);
      }

      const callsign = data.callSign || numberToUse;
      const pos = await fetchLivePosition(callsign);
      setPosition(pos);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSearch();
  }

  function isCurrentFlightTracked() {
    if (!flight) return false;
    const id = flight.number + "_" + date;
    return tracked.find((f) => f.id === id) != null;
  }

  async function handleTrackToggle() {
    if (!flight) return;
    const id = flight.number + "_" + date;

    if (isCurrentFlightTracked()) {
      const updated = removeTrackedFlight(id);
      setTracked(updated);
      return;
    }

    const granted = await requestNotificationPermission();
    if (!granted) {
      alert("Enable notifications in your browser settings to get flight alerts.");
    }

    const updated = addTrackedFlight({
      id: id,
      flightNumber: flight.number,
      date: date,
      route: flight.departure?.airport?.icao + " to " + flight.arrival?.airport?.icao,
      lastStatus: null,
      lastGate: flight.departure?.gate,
      lastTerminal: flight.departure?.terminal,
    });
    setTracked(updated);
  }

  function handleRemoveTracked(id) {
    const updated = removeTrackedFlight(id);
    setTracked(updated);
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
            <button
              key={i}
              className="recent-chip"
              onClick={() => handleSelectRecent(r)}
            >
              {r.flightNumber} · {r.date}
            </button>
          ))}
        </div>
      )}

      {error && <p className="error-msg">{error}</p>}

      <TrackedFlights
        flights={tracked}
        onSelect={handleSelectTracked}
        onRemove={handleRemoveTracked}
      />

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

      <p className="app-footer">Beta 1.20 — Made by A1m3dk</p>
    </div>
  );
}

export default App;