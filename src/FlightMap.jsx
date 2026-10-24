import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function FlightMap({ position }) {
  const hasFix =
    position && typeof position.lat === "number" && typeof position.lon === "number";

  if (!hasFix) {
    return (
      <p className="no-data-msg">
        No live position available. The flight may not be airborne yet, or it's outside tracking coverage.
      </p>
    );
  }

  const altitude =
    typeof position.altitude === "number"
      ? Math.round(position.altitude).toLocaleString() + " ft"
      : position.onGround
      ? "On the ground"
      : "N/A";
  const speed = typeof position.speed === "number" ? Math.round(position.speed) + " kt" : "N/A";
  const heading = typeof position.heading === "number" ? Math.round(position.heading) + "°" : "N/A";

  return (
    <div className="map-frame">
      <MapContainer
        center={[position.lat, position.lon]}
        zoom={6}
        style={{ height: "380px", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[position.lat, position.lon]}>
          <Popup>
            Altitude: {altitude}
            <br />
            Speed: {speed}
            <br />
            Heading: {heading}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

export default FlightMap;