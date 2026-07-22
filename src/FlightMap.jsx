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
  if (!position) {
    return <p className="no-data-msg">No live position available (flight may not be airborne yet, or outside tracking coverage).</p>;
  }

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
            Altitude: {Math.round(position.altitude)} m
            <br />
            Speed: {Math.round(position.speed)} m/s
            <br />
            Heading: {Math.round(position.heading)} deg
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

export default FlightMap;