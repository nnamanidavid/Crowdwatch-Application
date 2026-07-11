import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { reportsService } from '../services/api';
import { Report, Category, Subscription } from '../types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  Flame,
  Droplet,
  Car,
  AlertOctagon,
  HelpCircle,
  Search,
  Sliders,
  Crosshair,
  Compass,
  CheckCircle,
  Clock,
  ExternalLink,
  Plus,
  Bell,
  Trash2,
  AlertTriangle,
  Info
} from 'lucide-react';

// Fix Vite-Leaflet icon asset paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CATEGORY_META = {
  all: { label: 'All Incidents', icon: Compass, color: 'text-gray-600 border-gray-200 bg-gray-50' },
  fire: { label: 'Fire Hazard', icon: Flame, color: 'text-red-500 border-red-200 bg-red-50/50' },
  flood: { label: 'Flooding', icon: Droplet, color: 'text-blue-500 border-blue-200 bg-blue-50/50' },
  accident: { label: 'Accident', icon: Car, color: 'text-amber-500 border-amber-200 bg-amber-50/50' },
  crime: { label: 'Crime/Safety', icon: AlertOctagon, color: 'text-orange-500 border-orange-200 bg-orange-50/50' },
  other: { label: 'Other', icon: HelpCircle, color: 'text-gray-500 border-gray-200 bg-gray-50/50' },
} as const;

// Custom high contrast marker creators (adds custom emojis or icons)
const getCategoryEmoji = (cat: Category): string => {
  switch (cat) {
    case 'fire': return '🔴';
    case 'flood': return '🔵';
    case 'accident': return '🟡';
    case 'crime': return '🟠';
    default: return '📍';
  }
};

function MapEventHandler({ onMoveEnd }: { onMoveEnd: (center: L.LatLng) => void }) {
  useMapEvents({
    moveend: (e) => {
      onMoveEnd(e.target.getCenter());
    },
  });
  return null;
}

export default function MapPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [center, setCenter] = useState<{ lat: number; lng: number }>({ lat: 6.5244, lng: 3.3792 }); // Lagos Default
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [radius, setRadius] = useState<number>(10); // Default 10km
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [subscribing, setSubscribing] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const mapRef = useRef<any>(null);

  // Auto-detect browser location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          if (mapRef.current) {
            mapRef.current.setView([pos.coords.latitude, pos.coords.longitude], 13);
          }
        },
        () => {} // Fallback to Lagos silently
      );
    }
    loadSubscriptions();
  }, []);

  // Reload reports when center or radius changes
  useEffect(() => {
    loadReports(center);
  }, [center, radius]);

  const loadReports = async (coords: { lat: number; lng: number }) => {
    setLoading(true);
    setError('');
    try {
      const data = await reportsService.getNearby(coords.lat, coords.lng, radius);
      setReports(data);
    } catch {
      setError('Failed to fetch nearby incidents. Please verify database connection.');
    } finally {
      setLoading(false);
    }
  };

  const loadSubscriptions = async () => {
    try {
      const subs = await reportsService.getSubscriptions();
      setSubscriptions(subs);
    } catch {
      // Ignored if API not fully matching subscription schema in prod yet
    }
  };

  const handleCreateSubscription = async () => {
    setSubscribing(true);
    try {
      await reportsService.subscribe(center.lat, center.lng, radius);
      await loadSubscriptions();
    } catch {
      setError('Could not set alert subscription zone.');
    } finally {
      setSubscribing(false);
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    try {
      await reportsService.removeSubscription(id);
      await loadSubscriptions();
    } catch {
      setError('Could not remove subscription.');
    }
  };

  const handleResolveReport = async (id: string) => {
    try {
      await reportsService.resolve(id);
      // Reload matching reports list
      loadReports(center);
    } catch {
      setError('Could not mark report as resolved.');
    }
  };

  const handleFlyToReport = (report: Report) => {
    setSelectedReport(report);
    if (mapRef.current) {
      mapRef.current.setView([report.lat, report.lng], 15);
    }
  };

  // Filter and search reports
  const filteredReports = reports.filter(report => {
    const matchesCategory = selectedCategory === 'all' || report.category === selectedCategory;
    const matchesSearch =
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate totals for counters
  const getCategoryCount = (cat: Category | 'all'): number => {
    if (cat === 'all') return reports.length;
    return reports.filter(r => r.category === cat).length;
  };

  const timeSince = (dateString: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + 'y ago';
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + 'mo ago';
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + 'd ago';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + 'h ago';
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + 'm ago';
    return 'Just now';
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] w-full overflow-hidden bg-gray-50">
      
      {/* Sidebar - Controls & Lists */}
      <div className="w-full lg:w-[420px] bg-white border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col h-[50vh] lg:h-full shrink-0 z-10">
        
        {/* Search & Radius Slider Panel */}
        <div className="p-4 border-b border-gray-50 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-gray-900 text-lg flex items-center gap-1.5">
              <Compass className="h-5 w-5 text-rose-500" />
              Incidents Cockpit
            </h2>
            {loading && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-rose-50 border border-rose-100 text-rose-600 px-2.5 py-0.5 rounded-full font-semibold animate-pulse">
                Fetching Data
              </span>
            )}
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-2.5 text-[11px] text-red-600 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Search Inputs */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports by title, keyword..."
              className="block w-full rounded-xl border border-gray-100 bg-gray-50/50 py-2 pl-9 pr-3 text-xs text-gray-900 placeholder:text-gray-400 focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          {/* Alert Radius Control */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              <span className="flex items-center gap-1"><Sliders className="h-3 w-3" /> Search Radius</span>
              <span className="text-rose-500 font-mono font-bold">{radius} KM</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
              className="w-full accent-rose-500 h-1.5 bg-gray-100 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Categories Tabs Horizonal Scroller */}
        <div className="px-4 py-2 bg-gray-50/20 border-b border-gray-50 flex gap-2 overflow-x-auto no-scrollbar">
          {(Object.keys(CATEGORY_META) as Array<Category | 'all'>).map((cat) => {
            const isSelected = selectedCategory === cat;
            const meta = CATEGORY_META[cat];
            const Icon = meta.icon;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                  isSelected
                    ? 'border-rose-500 bg-rose-50 text-rose-600 ring-2 ring-rose-500/10'
                    : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{meta.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {getCategoryCount(cat)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Interactive List Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/20">
          <AnimatePresence mode="popLayout">
            {filteredReports.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 text-center text-gray-400 border border-dashed border-gray-100 rounded-2xl bg-white/50"
              >
                <MapPin className="h-10 w-10 text-gray-300 stroke-[1.2] mx-auto mb-3" />
                <p className="text-xs font-medium">No active reports matching criteria</p>
                <p className="text-[10px] text-gray-400 mt-1 max-w-[240px] mx-auto">Try extending your search radius or modifying category filters.</p>
              </motion.div>
            ) : (
              filteredReports.map((report) => {
                const isSelected = selectedReport?.id === report.id;
                const catMeta = CATEGORY_META[report.category] || CATEGORY_META.other;
                const CatIcon = catMeta.icon;
                return (
                  <motion.div
                    key={report.id}
                    layoutId={`rep-card-${report.id}`}
                    onClick={() => handleFlyToReport(report)}
                    className={`group relative flex flex-col p-4 rounded-xl border bg-white cursor-pointer transition-all hover:shadow-md hover:border-gray-200 ${
                      isSelected
                        ? 'border-rose-500 ring-2 ring-rose-500/10 bg-rose-50/5 shadow-md shadow-rose-500/5'
                        : 'border-gray-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <div className={`p-1.5 rounded-lg ${catMeta.color} border border-current/10`}>
                          <CatIcon className="h-3.5 w-3.5" />
                        </div>
                        <h3 className="font-display font-semibold text-xs text-gray-900 group-hover:text-rose-500 transition-colors">
                          {report.title}
                        </h3>
                      </div>
                      
                      {report.resolved ? (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                          <CheckCircle className="h-2.5 w-2.5" /> Resolved
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-rose-50 border border-rose-100 px-2 py-0.5 text-[9px] font-bold text-rose-700 animate-pulse">
                          Active
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-xs text-gray-500 leading-relaxed line-clamp-2">
                      {report.description}
                    </p>

                    {/* Metadata indicators */}
                    <div className="mt-3.5 flex items-center gap-4 text-[10px] text-gray-400 border-t border-gray-50 pt-3 font-medium">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {timeSince(report.created_at)}</span>
                      {report.distance_m !== undefined && (
                        <span className="flex items-center gap-1 text-rose-600 font-semibold font-mono">
                          📍 {Math.round(report.distance_m / 100) / 10} km away
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* Alert Subscriptions Control Card */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
              <Bell className="h-4 w-4 text-rose-500" />
              Alert Subscriptions
            </span>
            <button
              onClick={handleCreateSubscription}
              disabled={subscribing}
              className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-500 hover:bg-rose-600 disabled:bg-rose-400 text-white px-2.5 py-1 rounded-lg transition-colors shadow-sm"
            >
              <Plus className="h-3 w-3" /> Set Here
            </button>
          </div>
          
          {subscriptions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 p-3 bg-white text-center">
              <p className="text-[10px] text-gray-400">
                Subscribe to notifications in this {radius}km area. We will trigger real-time alerts if any safety reports arrive!
              </p>
            </div>
          ) : (
            <div className="max-h-24 overflow-y-auto space-y-2 pr-1">
              {subscriptions.map(sub => (
                <div key={sub.id} className="flex items-center justify-between p-2 rounded-lg border border-gray-100 bg-white text-[10px]">
                  <div className="flex items-center gap-1.5 text-gray-600 font-medium">
                    <MapPin className="h-3 w-3 text-rose-500" />
                    <span>Zone alert ({sub.radius_km}km radius)</span>
                  </div>
                  <button
                    onClick={() => handleDeleteSubscription(sub.id)}
                    className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Main Map Frame */}
      <div className="flex-1 h-[50vh] lg:h-full relative bg-gray-100">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={13}
          ref={mapRef}
          style={{ width: '100%', height: '100%', zIndex: 1 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEventHandler onMoveEnd={(coords) => setCenter({ lat: coords.lat, lng: coords.lng })} />

          {filteredReports.map((report) => (
            <Marker
              key={report.id}
              position={[report.lat, report.lng]}
              eventHandlers={{
                click: () => {
                  setSelectedReport(report);
                }
              }}
            >
              <Popup>
                <div className="w-64 p-1 space-y-3">
                  {/* Category and Title */}
                  <div className="flex items-start justify-between gap-1 border-b border-gray-100 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base select-none">{getCategoryEmoji(report.category)}</span>
                      <h4 className="font-display font-bold text-xs text-gray-900 leading-tight">
                        {report.title}
                      </h4>
                    </div>
                    {report.resolved ? (
                      <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                        Resolved
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded-full whitespace-nowrap animate-pulse">
                        Active
                      </span>
                    )}
                  </div>

                  {/* Attached photo if present */}
                  {report.media_url && (
                    <div className="rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                      <img
                        src={report.media_url}
                        alt={report.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-24 object-cover"
                      />
                    </div>
                  )}

                  {/* Description */}
                  <p className="text-[11px] text-gray-600 leading-normal font-sans">
                    {report.description}
                  </p>

                  {/* Meta Indicators */}
                  <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium font-mono pt-1">
                    <span>{report.category.toUpperCase()}</span>
                    <span>{timeSince(report.created_at)}</span>
                  </div>

                  {/* Resolution action button for safety staff */}
                  {!report.resolved && (
                    <button
                      onClick={() => handleResolveReport(report.id)}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-1.5 text-xs shadow-md shadow-emerald-500/10 transition-colors"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Resolve Incident
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Float Instructions Banner */}
        <div className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg border border-gray-100 flex items-center gap-2 max-w-sm pointer-events-none select-none">
          <Info className="h-4 w-4 text-rose-500 shrink-0" />
          <p className="text-[10px] text-gray-500 font-medium leading-tight">
            Drag and pan the map to scan other coordinates. We auto-load nearby incident reports dynamically.
          </p>
        </div>
      </div>

    </div>
  );
}
