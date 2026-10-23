const PROFILES = [
  { match: /A380/i, kgPerKm: 13.0, seats: 500 },
  { match: /747/i, kgPerKm: 12.5, seats: 380 },
  { match: /777/i, kgPerKm: 8.3, seats: 350 },
  { match: /A350/i, kgPerKm: 6.2, seats: 310 },
  { match: /787/i, kgPerKm: 5.3, seats: 270 },
  { match: /A330/i, kgPerKm: 6.5, seats: 280 },
  { match: /767/i, kgPerKm: 6.3, seats: 230 },
  { match: /A321/i, kgPerKm: 3.0, seats: 200 },
  { match: /A320/i, kgPerKm: 2.7, seats: 170 },
  { match: /A319/i, kgPerKm: 2.5, seats: 140 },
  { match: /A220/i, kgPerKm: 2.2, seats: 130 },
  { match: /737/i, kgPerKm: 2.8, seats: 170 },
];

const CO2_PER_KG_FUEL = 3.16;
const LOAD_FACTOR = 0.82;
const ROUTING_UPLIFT = 1.09;
const TAKEOFF_LANDING_KM_EQUIV = 250;

function CarbonEstimate({ flight, aircraftInfo }) {
  const km = flight?.greatCircleDistance?.km;
  const model = flight?.aircraft?.model || "";
  const profile = PROFILES.find((p) => p.match.test(model));
  const seats = aircraftInfo?.numSeats > 0 ? aircraftInfo.numSeats : profile?.seats;

  if (!km || !profile || !seats) {
    return (
      <div className="panel">
        <p className="section-heading">Carbon Estimate</p>
        <p className="no-data-msg">Not enough data to estimate emissions for this aircraft type.</p>
      </div>
    );
  }

  const effectiveKm = km * ROUTING_UPLIFT + TAKEOFF_LANDING_KM_EQUIV;
  const fuelKg = profile.kgPerKm * effectiveKm;
  const co2Kg = fuelKg * CO2_PER_KG_FUEL;
  const perPassenger = co2Kg / (seats * LOAD_FACTOR);

  return (
    <div className="panel">
      <p className="section-heading">Carbon Estimate</p>
      <p className="co2-big">&asymp; {Math.round(perPassenger)} kg CO2</p>
      <p className="co2-sub">per passenger, averaged across all cabins</p>
      <p className="co2-detail">
        Whole flight &asymp; {Math.round(co2Kg / 1000)} t CO2 &middot; {Math.round(km)} km &middot; {seats} seats at {Math.round(LOAD_FACTOR * 100)}% full
      </p>
      <p className="co2-detail">
        Rough estimate (expect roughly ±25%). Uses typical fuel burn for the aircraft family, a 9% routing allowance and a fixed takeoff/landing allowance.
      </p>
    </div>
  );
}

export default CarbonEstimate;