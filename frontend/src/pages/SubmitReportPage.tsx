import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { reportsService, mediaService } from '../services/api';
import { motion } from 'motion/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Flame,
  Droplet,
  Car,
  AlertOctagon,
  HelpCircle,
  FileText,
  UploadCloud,
  Crosshair,
  CheckCircle,
  ArrowLeft,
  X
} from 'lucide-react';

const CATEGORIES = [
  { id: 'fire', label: 'Fire Hazard', icon: Flame, color: 'bg-red-500 text-white ring-red-200' },
  { id: 'flood', label: 'Flooding', icon: Droplet, color: 'bg-blue-500 text-white ring-blue-200' },
  { id: 'accident', label: 'Accident', icon: Car, color: 'bg-amber-500 text-white ring-amber-200' },
  { id: 'crime', label: 'Crime/Safety', icon: AlertOctagon, color: 'bg-orange-500 text-white ring-orange-200' },
  { id: 'other', label: 'Other', icon: HelpCircle, color: 'bg-gray-500 text-white ring-gray-200' },
] as const;

// Interactive map component to handle click pin dropping
function ClickToDropPin({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function SubmitReportPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'other' as 'fire' | 'flood' | 'accident' | 'crime' | 'other',
    lat: 6.5244,
    lng: 3.3792,
  });

  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<any>(null);

  // Auto detect user location on mount
  useEffect(() => {
    handleUseMyLocation();
  }, []);

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setForm(f => ({ ...f, lat, lng }));
          setLocating(false);

          // Fly map center to user location
          if (mapRef.current) {
            mapRef.current.setView([lat, lng], 15);
          }
        },
        () => {
          setError('Could not fetch location automatically. Drop a pin on the map instead.');
          setLocating(false);
        }
      );
    }
  };

  const handleMapClicked = (lat: number, lng: number) => {
    setForm(f => ({ ...f, lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFilePreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      setFile(selectedFile);
      setFilePreview(URL.createObjectURL(selectedFile));
    }
  };

  const removeSelectedFile = () => {
    setFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    if (!form.title.trim()) {
      setError('Please specify a title for the incident.');
      setLoading(false);
      return;
    }

    try {
      // Step 1: Create the incident report
      const report = await reportsService.create({
        title: form.title,
        description: form.description,
        category: form.category,
        lat: form.lat,
        lng: form.lng,
      });

      // Step 2: Upload photo if selected
      if (file) {
        await mediaService.upload(file, report.id);
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to incidents map
        </button>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-mono">
          Form Incident #CW-NEW
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-100/50"
      >
        <div className="border-b border-gray-50 bg-gray-50/50 px-6 py-5">
          <h1 className="font-display text-xl font-bold text-gray-900">Report an Incident</h1>
          <p className="mt-1 text-xs text-gray-500 leading-relaxed">
            Help safeguard your community. Fill out details and point out the coordinate boundaries of the active incident.
          </p>
        </div>

        {error && (
          <div className="border-l-4 border-red-500 bg-red-50 p-4 mx-6 mt-6 rounded-r-xl text-xs text-red-700 flex gap-2.5">
            <AlertOctagon className="h-4.5 w-4.5 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="border-l-4 border-emerald-500 bg-emerald-50 p-4 mx-6 mt-6 rounded-r-xl text-xs text-emerald-700 flex items-center gap-2.5">
            <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
            <span className="font-medium">Incident registered successfully! Redirecting to board...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Category selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Select Category</label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {CATEGORIES.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = form.category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, category: cat.id }))}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-rose-500 bg-rose-50/25 ring-2 ring-rose-500/10'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isSelected ? cat.color : 'bg-gray-100 text-gray-500'}`}>
                      <IconComponent className="h-4.5 w-4.5" />
                    </div>
                    <span className="mt-2 text-xs font-medium text-gray-900">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Incident Title</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <FileText className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    className="block w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    placeholder="E.g., Admiralty Way Water Build-up"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Description</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="block w-full rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
                  placeholder="Provide precise details, traffic impact, and immediate safety guidance..."
                />
              </div>

              {/* Drag Drop Photo Uploader */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Attach Photo (Optional)</label>
                {filePreview ? (
                  <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-2 flex items-center gap-3">
                    <img
                      src={filePreview}
                      alt="Selected preview"
                      referrerPolicy="no-referrer"
                      className="h-14 w-14 rounded-lg object-cover"
                    />
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-xs font-semibold text-gray-800">{file?.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono">
                        {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={removeSelectedFile}
                      className="p-1 rounded-full bg-white hover:bg-gray-100 text-gray-400 hover:text-red-500 border border-gray-100 shadow-sm transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-5 cursor-pointer text-center transition-colors ${
                      dragActive
                        ? 'border-rose-500 bg-rose-50/10'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/30'
                    }`}
                  >
                    <UploadCloud className="h-8 w-8 text-gray-400 stroke-[1.5]" />
                    <p className="mt-2 text-xs font-medium text-gray-700">Drag photo here, or <span className="text-rose-500">browse</span></p>
                    <p className="text-[10px] text-gray-400 mt-1">Supports PNG, JPG, JPEG formats</p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Geo Location Map Selection */}
            <div className="space-y-2 flex flex-col h-full min-h-[320px]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Pinpoint Location</label>
                <button
                  type="button"
                  disabled={locating}
                  onClick={handleUseMyLocation}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500 hover:text-rose-600 border border-rose-100 bg-rose-50/50 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors"
                >
                  <Crosshair className={`h-3 w-3 ${locating ? 'animate-spin' : ''}`} />
                  Use Current Location
                </button>
              </div>

              {/* Mini Map */}
              <div className="relative flex-1 min-h-[220px] rounded-xl border border-gray-100 overflow-hidden shadow-inner bg-gray-50">
                <MapContainer
                  center={[form.lat, form.lng]}
                  zoom={13}
                  ref={mapRef}
                  style={{ width: '100%', height: '100%', zIndex: 1 }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <ClickToDropPin onMapClick={handleMapClicked} />
                  <Marker position={[form.lat, form.lng]} />
                </MapContainer>
                <div className="absolute bottom-2 left-2 z-10 bg-white/95 backdrop-blur-sm shadow border border-gray-100 px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-medium text-gray-600 select-none">
                  Lat: {form.lat} | Lng: {form.lng}
                </div>
              </div>
              <p className="text-[11px] text-gray-400 mt-1 leading-normal italic text-center">
                🗺️ Click anywhere on the map above to move the report coordinates precisely.
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-50 pt-6">
            <button
              type="button"
              disabled={loading}
              onClick={() => navigate('/')}
              className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-lg bg-rose-500 hover:bg-rose-600 disabled:bg-rose-400 text-sm font-semibold text-white shadow-md shadow-rose-500/10 transition-colors"
            >
              {loading ? 'Submitting Report...' : 'Publish Incident'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
