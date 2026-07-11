import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  AlertTriangle,
  LogOut,
  Bell,
  Check,
  User,
  Activity,
  Plus,
  Wifi,
  WifiOff,
  Trash2
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, isDemoMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifs, setNotifs] = useState(() => notificationService.getNotifications());

  const unreadCount = notifs.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead();
    setNotifs(notificationService.getNotifications());
  };

  const handleClearAll = () => {
    notificationService.clearAll();
    setNotifs([]);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/85 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-500 to-orange-400 text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform duration-200">
                <MapPin className="h-5 w-5 animate-pulse" />
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-gray-900">
                Crowd<span className="text-rose-500">watch</span>
              </span>
            </Link>

            {/* Network Indicator Badge */}
            <div className="hidden sm:flex items-center">
              {isDemoMode ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 border border-amber-200/50">
                  <WifiOff className="h-3 w-3" />
                  Demo Sandbox
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 border border-emerald-200/50">
                  <Wifi className="h-3 w-3" />
                  Gateway Connected
                </span>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link
                  to="/"
                  className={`hidden md:inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                    location.pathname === '/'
                      ? 'bg-rose-50 text-rose-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Activity className="h-4 w-4" />
                  Incidents Board
                </Link>

                <Link
                  to="/submit"
                  className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-150 ${
                    location.pathname === '/submit'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-rose-500 hover:bg-rose-600 hover:shadow shadow-rose-500/10'
                  }`}
                >
                  <Plus className="h-4 w-4" />
                  Report Incident
                </Link>

                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => {
                      // Refresh notifications from state on open
                      setNotifs(notificationService.getNotifications());
                      setShowNotifications(!showNotifications);
                    }}
                    className={`relative p-2 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors ${
                      showNotifications ? 'bg-gray-50 text-gray-700' : ''
                    }`}
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white animate-bounce">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown Panel */}
                  <AnimatePresence>
                    {showNotifications && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setShowNotifications(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-2.5 w-80 md:w-96 origin-top-right rounded-2xl border border-gray-100 bg-white p-2 shadow-xl ring-1 ring-black/5 z-40"
                        >
                          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 pb-2.5">
                            <span className="font-display font-semibold text-gray-900">Notifications</span>
                            <div className="flex gap-2">
                              {notifs.length > 0 && (
                                <>
                                  <button
                                    onClick={handleMarkAllRead}
                                    className="text-xs text-rose-500 hover:text-rose-600 font-medium flex items-center gap-1"
                                  >
                                    <Check className="h-3 w-3" /> Mark all read
                                  </button>
                                  <button
                                    onClick={handleClearAll}
                                    className="text-xs text-gray-400 hover:text-red-500 font-medium flex items-center gap-1"
                                    title="Clear All"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="max-h-72 overflow-y-auto py-1">
                            {notifs.length === 0 ? (
                              <div className="py-8 text-center text-gray-400">
                                <AlertTriangle className="h-8 w-8 mx-auto stroke-[1.5] text-gray-300 mb-2" />
                                <p className="text-sm">No new alerts</p>
                                <p className="text-[11px] text-gray-400 mt-1">Set an alert subscription zone on the map to receive live geo-triggers.</p>
                              </div>
                            ) : (
                              notifs.map((n) => (
                                <div
                                  key={n.id}
                                  className={`px-4 py-3.5 transition-colors border-b border-gray-50 last:border-0 ${
                                    n.read ? 'opacity-70 bg-white' : 'bg-rose-50/20'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className="text-xs font-semibold text-gray-900">{n.title}</h4>
                                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-xs text-gray-500 leading-relaxed">{n.body}</p>
                                </div>
                              ))
                            )}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Profile controls */}
                <div className="flex items-center gap-2 border-l border-gray-100 pl-4">
                  <div className="hidden lg:flex flex-col text-right">
                    <span className="text-xs font-semibold text-gray-900">@{user.username}</span>
                    <span className="text-[10px] text-gray-400">{user.email}</span>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600 font-medium text-xs">
                    <User className="h-4 w-4" />
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-red-500 transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  className="rounded-lg px-3.5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="rounded-lg bg-rose-500 hover:bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-rose-500/10 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
