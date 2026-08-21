const AIRLINES = {
  EK: { name: "Emirates", website: "https://www.emirates.com", twitter: "https://twitter.com/emirates", instagram: "https://instagram.com/emirates", hub: "Dubai (DXB)" },
  WY: { name: "Oman Air", website: "https://www.omanair.com", twitter: "https://twitter.com/OmanAir", instagram: "https://instagram.com/omanair", hub: "Muscat (MCT)" },
  QR: { name: "Qatar Airways", website: "https://www.qatarairways.com", twitter: "https://twitter.com/qatarairways", instagram: "https://instagram.com/qatarairways", hub: "Doha (DOH)" },
  EY: { name: "Etihad Airways", website: "https://www.etihad.com", twitter: "https://twitter.com/etihadairways", instagram: "https://instagram.com/etihad", hub: "Abu Dhabi (AUH)" },
  BA: { name: "British Airways", website: "https://www.britishairways.com", twitter: "https://twitter.com/British_Airways", instagram: "https://instagram.com/britishairways", hub: "London Heathrow (LHR)" },
  AF: { name: "Air France", website: "https://www.airfrance.com", twitter: "https://twitter.com/AirFrance", instagram: "https://instagram.com/airfrance", hub: "Paris CDG (CDG)" },
  LH: { name: "Lufthansa", website: "https://www.lufthansa.com", twitter: "https://twitter.com/Lufthansa", instagram: "https://instagram.com/lufthansa", hub: "Frankfurt (FRA)" },
  TK: { name: "Turkish Airlines", website: "https://www.turkishairlines.com", twitter: "https://twitter.com/TurkishAirlines", instagram: "https://instagram.com/turkishairlines", hub: "Istanbul (IST)" },
  SQ: { name: "Singapore Airlines", website: "https://www.singaporeair.com", twitter: "https://twitter.com/SingaporeAir", instagram: "https://instagram.com/singaporeair", hub: "Singapore Changi (SIN)" },
  DL: { name: "Delta Air Lines", website: "https://www.delta.com", twitter: "https://twitter.com/Delta", instagram: "https://instagram.com/delta", hub: "Atlanta (ATL)" },
  UA: { name: "United Airlines", website: "https://www.united.com", twitter: "https://twitter.com/united", instagram: "https://instagram.com/united", hub: "Chicago (ORD)" },
  AA: { name: "American Airlines", website: "https://www.aa.com", twitter: "https://twitter.com/AmericanAir", instagram: "https://instagram.com/americanair", hub: "Dallas Fort Worth (DFW)" },
};

export function getAirlineInfo(iata) {
  return AIRLINES[iata] || null;
}