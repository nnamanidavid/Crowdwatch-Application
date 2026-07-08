import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { reportsService } from '../services/reports.service';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet's default marker icons break with bundlers like Vite.
// This fixes them by pointing to the CDN-hosted icon images directly.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// This inner component uses the map's event system to detect
// when the user stops moving the map, then loads reports for that area.
function MapEventHandler({ onMoveEnd }) {
  useMapEvents({ moveend: (e) => onMoveEnd(e.target.getCenter()) });
  return null;
}

export default function MapPage() {
  const [reports, setReports] = useState([]);
  const [center, setCenter] = useState({ lat: 6.5244, lng: 3.3792 }); // Lagos default
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Try to get the user's real location on load.
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {} // silently fall back to Lagos if denied
      );
    }
  }, []);

  // Load reports whenever the map center changes.
  useEffect(() => {
    loadReports(center);
  }, [center]);

  const loadReports = async ({ lat, lng }) => {
    setLoading(true);
    try {
      const data = await reportsService.getNearby(lat, lng, 10);
      setReports(data);
    } catch {
      setError('Failed to load reports.');
    } finally {
      setLoading(false);
    }
  };

  const categoryColors = {
    fire: '🔴', flood: '🔵', accident: '🟡', crime: '🟠', other: '⚪',
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Live Incidents</h2>
        {loading && <span style={styles.loadingBadge}>Loading...</span>}
        <span style={styles.count}>{reports.length} active reports nearby</span>
      </div>
      {error && <div style={styles.error}>{error}</div>}

      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        style={styles.map}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEventHandler onMoveEnd={setCenter} />

        {reports.map((report) => (
          <Marker key={report.id} position={[report.lat, report.lng]}>
            <Popup>
              <div style={styles.popup}>
                <strong>{categoryColors[report.category] || '📍'} {report.title}</strong>
                <p style={styles.popupDesc}>{report.description}</p>
                <span style={styles.popupMeta}>
                  {report.category} · {Math.round(report.distance_m / 1000 * 10) / 10}km away
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)' },
  header: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px',
            background: '#fff', borderBottom: '1px solid #eee' },
  title: { margin: 0, fontSize: 16, color: '#1a1a2e' },
  count: { fontSize: 13, color: '#666', marginLeft: 'auto' },
  loadingBadge: { fontSize: 12, background: '#fff3cd', padding: '2px 8px', borderRadius: 10 },
  map: { flex: 1 },
  error: { background: '#fff0f0', color: '#c0392b', padding: '8px 16px', fontSize: 13 },
  popup: { minWidth: 160 },
  popupDesc: { fontSize: 12, color: '#555', margin: '4px 0' },
  popupMeta: { fontSize: 11, color: '#999' },
};
