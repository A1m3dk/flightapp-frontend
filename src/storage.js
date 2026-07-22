const KEY = "flightapp_tracked_flights";
const RECENT_KEY = "flightapp_recent_searches";

export function getTrackedFlights() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

export function saveTrackedFlights(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function addTrackedFlight(flight) {
  const list = getTrackedFlights();
  if (list.find((f) => f.id === flight.id)) return list;
  const newList = list.concat([flight]);
  saveTrackedFlights(newList);
  return newList;
}

export function removeTrackedFlight(id) {
  const list = getTrackedFlights().filter((f) => f.id !== id);
  saveTrackedFlights(list);
  return list;
}

export function updateTrackedFlight(id, updates) {
  const list = getTrackedFlights().map((f) =>
    f.id === id ? Object.assign({}, f, updates) : f
  );
  saveTrackedFlights(list);
  return list;
}

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