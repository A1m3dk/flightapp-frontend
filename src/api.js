const BACKEND_URL = "https://flightapp-w6ob.onrender.com";

export async function fetchFlightStatus(flightNumber, date) {
  const url = BACKEND_URL + "/api/flight/" + flightNumber + "/" + date;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Flight not found or API error");
  const data = await res.json();
  return data[0];
}

export async function fetchAircraftPhoto(registration) {
  try {
    const res = await fetch(BACKEND_URL + "/api/aircraft-photo/" + registration);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function fetchAircraftInfo(registration) {
  try {
    const res = await fetch(BACKEND_URL + "/api/aircraft/" + registration);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function fetchLivePosition(callsign) {
  try {
    const res = await fetch(BACKEND_URL + "/api/live-position/" + callsign);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export function getLiveAtcUrl(icao) {
  return "https://www.liveatc.net/search/?icao=" + icao;
}