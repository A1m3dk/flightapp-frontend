import { getAirlineInfo } from "./airlineData";

function AirlineInfo({ airline }) {
  if (!airline) return null;
  const info = getAirlineInfo(airline.iata);

  return (
    <div className="panel">
      <p className="section-heading">Airline</p>
      <p className="airline-name">{airline.name}</p>
      <div className="airline-codes">
        <span className="airline-code-item">IATA: {airline.iata || "N/A"}</span>
        <span className="airline-code-item">ICAO: {airline.icao || "N/A"}</span>
        {info?.hub && <span className="airline-code-item">Main hub: {info.hub}</span>}
      </div>
      {info ? (
        <div className="airline-buttons">
          <a href={info.website} target="_blank" rel="noopener noreferrer" className="airline-btn">Website</a>
          <a href={info.twitter} target="_blank" rel="noopener noreferrer" className="airline-btn">Twitter/X</a>
          <a href={info.instagram} target="_blank" rel="noopener noreferrer" className="airline-btn">Instagram</a>
        </div>
      ) : (
        <p className="no-data-msg">Social links not available for this airline yet.</p>
      )}
    </div>
  );
}

export default AirlineInfo;