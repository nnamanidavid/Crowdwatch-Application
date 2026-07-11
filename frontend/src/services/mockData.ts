import { Report } from '../types';

export const SEED_REPORTS: Report[] = [
  {
    id: 'rep-1',
    title: 'Third Mainland Bridge Vehicle Breakout',
    description: 'A multi-car collision near the Oworonshoki ramp causing extensive blockages. Emergency responses are on site.',
    category: 'accident',
    lat: 6.5355,
    lng: 3.3982,
    resolved: false,
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
    media_url: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'rep-2',
    title: 'Lekki Phase 1 Flash Flood',
    description: 'Severe water buildup along Admiralty Way following heavy morning rain. Normal sedans are advised to avoid the route.',
    category: 'flood',
    lat: 6.4381,
    lng: 3.4428,
    resolved: false,
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // 2 hours ago
    media_url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'rep-3',
    title: 'Market Square Electrical Spark Fire',
    description: 'Smoke detected from a transformer box near the central market plaza. Fire brigade has been notified.',
    category: 'fire',
    lat: 6.5140,
    lng: 3.3645,
    resolved: false,
    created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(), // 4 hours ago
  },
  {
    id: 'rep-4',
    title: 'Suspicious Activity Near Bank ATM',
    description: 'Two individuals seen trailing customers after transactions. Security patrol has been briefed.',
    category: 'crime',
    lat: 6.4520,
    lng: 3.4210,
    resolved: false,
    created_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(), // 1 hour ago
  },
  {
    id: 'rep-5',
    title: 'Road Construction Blockade',
    description: 'Unannounced lane closure for utility maintenance. Significant traffic backup building up rapidly.',
    category: 'other',
    lat: 6.5444,
    lng: 3.3712,
    resolved: true,
    created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(), // 12 hours ago
  }
];

export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in meters
}
