const RECENT_KEY = "flightapp_recent_searches";
const BACKEND_URL = "https://flightapp-w6ob.onrender.com";

export function getRecentSearches() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

export function addRecentSearch(flightNumber, date) {
  const list = getRecentSearches().filter(
    (r) => !(r.flightNumber === flightNumber && r.date === date)
  );
  list.unshift({ flightNumber, date });
  const trimmed = list.slice(0, 5);
  localStorage.setItem(RECENT_KEY, JSON.stringify(trimmed));
  return trimmed;
}

export async function getTrackedFlights(deviceId) {
  try {
    const res = await fetch(BACKEND_URL + "/api/tracked/" + deviceId);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    return [];
  }
}

export async function addTrackedFlight(deviceId, flightNumber, date, route) {
  const res = await fetch(BACKEND_URL + "/api/tracked", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscriptionId: deviceId, flightNumber, date, route }),
  });
  return await res.json();
}

export async function removeTrackedFlight(id) {
  await fetch(BACKEND_URL + "/api/tracked/" + id, { method: "DELETE" });
}