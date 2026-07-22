function AtcLinks({ departureIcao, arrivalIcao }) {
  return (
    <div>
      <p className="section-heading">Live ATC Audio</p>
      <p className="atc-note">
        Streams hosted on LiveATC.net. Availability depends on whether a volunteer feed exists for that airport.
      </p>
      <div className="atc-buttons">
        {departureIcao && (
          <a href={"https://www.liveatc.net/search/?icao=" + departureIcao} target="_blank" rel="noopener noreferrer" className="atc-button">
            Departure &middot; {departureIcao}
          </a>
        )}
        {arrivalIcao && (
          <a href={"https://www.liveatc.net/search/?icao=" + arrivalIcao} target="_blank" rel="noopener noreferrer" className="atc-button">
            Arrival &middot; {arrivalIcao}
          </a>
        )}
      </div>
    </div>
  );
}

export default AtcLinks;