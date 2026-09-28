import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon path (Leaflet + Vite quirk)
const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface Props {
  latitude: number | null;
  longitude: number | null;
  label?: string;
  accuracy?: number | null;
}

export function LocationMap({ latitude, longitude, label, accuracy }: Props) {
  if (latitude == null || longitude == null) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No GPS location recorded for this report.
      </div>
    );
  }

  return (
    <div className="rounded-md overflow-hidden border">
      <MapContainer
        center={[latitude, longitude]}
        zoom={16}
        style={{ height: 280, width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]} icon={markerIcon}>
          <Popup>
            <div className="text-xs">
              {label ?? 'Reported location'}
              <br />
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
              {accuracy != null && (
                <>
                  <br />
                  ±{Math.round(accuracy)}m accuracy
                </>
              )}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}