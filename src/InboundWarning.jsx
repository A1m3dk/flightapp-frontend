import { useState, useEffect } from "react";
import { fetchAircraftHistory } from "./api";

const WIDEBODY = /A330|A340|A350|A380|747|767|777|787/i;

function toMs(t) {
  const s = t && (t.utc || t.local);
  if (!s) return null;
  const d = new Date(s.replace(" ", "T"));
  return isNaN(d.getTime()) ? null : d.getTime();
}

function arrivalEstimate(arr) {
  const revised = toMs(arr?.revisedTime);
  if (revised) return revised;
  const predicted = toMs(arr?.predictedTime);
  if (predicted) return predicted;
  const runway = toMs(arr?.runwayTime);
  if (runway) return runway + 8 * 60000;
  return toMs(arr?.scheduledTime);
}

function fmt(ms, tz) {
  try {
    return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: tz || undefined });
  } catch (err) {
    return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
}

function clean(n) {
  return (n || "").replace(/\s/g, "").toUpperCase();
}

function InboundWarning({ flight, date }) {
  const [history, setHistory] = useState(null);

  const reg = flight?.aircraft?.reg;
  const depSched = toMs(flight?.departure?.scheduledTime);
  const status = (flight?.status || "").toLowerCase();
  const alreadyGone = /depart|enroute|approach|divert|land|arriv|cancel/.test(status);
  const minsToDep = depSched ? (depSched - Date.now()) / 60000 : null;
  const eligible = !!reg && !alreadyGone && minsToDep != null && minsToDep <= 720 && minsToDep > -90;

  useEffect(() => {
    setHistory(null);
    if (!eligible) return;
    let cancelled = false;
    fetchAircraftHistory(reg, date).then((h) => {
      if (!cancelled) setHistory(h);
    });
    return () => {
      cancelled = true;
    };
  }, [reg, date, eligible, flight?.number]);

  if (!eligible || !history) return null;

  const depIcao = flight.departure?.airport?.icao;
  const depTarget = toMs(flight.departure?.revisedTime) || depSched;
  const tz = flight.departure?.airport?.timeZone;

  const inbound = history
    .filter(
      (f) =>
        clean(f.number) !== clean(flight.number) &&
        f.arrival?.airport?.icao === depIcao &&
        toMs(f.arrival?.scheduledTime) &&
        toMs(f.arrival.scheduledTime) <= depSched
    )
    .sort((a, b) => toMs(b.arrival.scheduledTime) - toMs(a.arrival.scheduledTime))[0];

  if (!inbound) return null;

  const arrivalMs = arrivalEstimate(inbound.arrival);
  if (!arrivalMs) return null;

  const turnaround = WIDEBODY.test(flight.aircraft?.model || "") ? 60 : 40;
  const readyMs = arrivalMs + turnaround * 60000;
  const shortfall = Math.round((readyMs - depTarget) / 60000);
  const late = shortfall > 10;
  const landed = /arriv|land/i.test(inbound.status || "");
  const from = inbound.departure?.airport?.iata || inbound.departure?.airport?.icao || "?";

  return (
    <div className={"inbound-banner " + (late ? "inbound-late" : "inbound-ok")}>
      <p className="inbound-title">{late ? "Inbound aircraft running late" : "Inbound aircraft on track"}</p>
      <p className="inbound-text">
        {inbound.number} from {from} {landed ? "landed" : "is due"} at {fmt(arrivalMs, tz)}.{" "}
        {late
          ? "After a ~" + turnaround + " min turnaround your aircraft may not be ready until " + fmt(readyMs, tz) + ", about " + shortfall + " min after your planned departure."
          : "That leaves enough time to turn the aircraft around."}
      </p>
      <p className="inbound-note">Estimate from typical turnaround times, not an airline announcement.</p>
    </div>
  );
}

export default InboundWarning;