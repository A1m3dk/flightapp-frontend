const KEY = "flightapp_tracked_flights";

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