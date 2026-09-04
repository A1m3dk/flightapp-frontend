const BACKEND_URL = "https://flightapp-w6ob.onrender.com";
const REQUEST_TIMEOUT_MS = 15000;

async function fetchJson(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) {
      throw new Error("Request failed");
    }
    return await res.json();
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new Error("The flight service is taking too long to respond. Please try again.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchFlightStatus(flightNumber, date) {
  const url = BACKEND_URL + "/api/flight/" + flightNumber + "/" + date;
  const data = await fetchJson(url);
  const flight = Array.isArray(data) ? data[0] : data;

  if (!flight) {
    throw new Error("Flight not found or API error");
  }

  return flight;
}

export async function fetchAircraftPhoto(registration) {
  try {
    return await fetchJson(BACKEND_URL + "/api/aircraft-photo/" + registration);
  } catch (err) {
    return null;
  }
}

export async function fetchAircraftInfo(registration) {
  try {
    return await fetchJson(BACKEND_URL + "/api/aircraft/" + registration);
  } catch (err) {
    return null;
  }
}

export async function fetchLivePosition(callsign) {
  try {
    return await fetchJson(BACKEND_URL + "/api/live-position/" + callsign);
  } catch (err) {
    return null;
  }
}

export async function fetchAirportStats(iata) {
  try {
    return await fetchJson(BACKEND_URL + "/api/airport-stats/" + iata, { cache: "no-store" });
  } catch (err) {
    return null;
  }
}

export async function fetchAircraftHistory(reg, date) {
  try {
    const data = await fetchJson(BACKEND_URL + "/api/aircraft-history/" + reg + "/" + date, { cache: "no-store" });
    return Array.isArray(data) ? data : [];
  } catch (err) {
    return [];
  }
}

export async function fetchLivePositionByHex(hex) {
  try {
    return await fetchJson(BACKEND_URL + "/api/live-position-hex/" + hex, { cache: "no-store" });
  } catch (err) {
    return null;
  }
}

export function getLiveAtcUrl(icao) {
  return "https://www.liveatc.net/search/?icao=" + icao;
}

export async function fetchRouteSearch(depIata, arrIata, date) {
  try {
    const data = await fetchJson(BACKEND_URL + "/api/route-search/" + depIata + "/" + arrIata + "/" + date, { cache: "no-store" });
    return Array.isArray(data) ? data : [];
  } catch (err) {
    return [];
  }
}