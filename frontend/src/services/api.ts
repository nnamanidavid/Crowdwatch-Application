import axios from 'axios';
import { User, Report, Subscription, AppNotification, Category } from '../types';
import { SEED_REPORTS, getDistance } from './mockData';

// Instantiate our axios client pointing to the microservice gateway
const api = axios.create({
  baseURL: '/api',
});

// Configure token injection from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto logout on unauthorized token expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Redirect in production/real environment
      if (!isDemoModeActive()) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// --- DEMO MOCK DATABASE (LocalStorage Backed) ---
// Initialize mock tables
const getStorageItem = <T>(key: string, fallback: T): T => {
  const val = localStorage.getItem(key);
  if (!val) {
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
  try {
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
};

const setStorageItem = <T>(key: string, val: T) => {
  localStorage.setItem(key, JSON.stringify(val));
};

// Global indicator to determine if we are running in full local mock or real gateway mode
let _demoMode = true;

export function isDemoModeActive(): boolean {
  return _demoMode;
}

export function setDemoModeActive(active: boolean) {
  _demoMode = active;
}

// Check on startup if gateway is reachable, if not, stay in demo mode
export async function pingGateway(): Promise<boolean> {
  try {
    await axios.get('/api/auth/me', { timeout: 1000 });
    _demoMode = false;
    return true;
  } catch {
    _demoMode = true; // Gateway unreachable, default to demo mode
    return false;
  }
}

// Initialize seed data if empty
if (!localStorage.getItem('crowd_reports')) {
  setStorageItem('crowd_reports', SEED_REPORTS);
}
if (!localStorage.getItem('crowd_users')) {
  setStorageItem('crowd_users', [
    { id: 'usr-1', username: 'emergency_unit', email: 'admin@crowdwatch.org' }
  ]);
}
if (!localStorage.getItem('crowd_subscriptions')) {
  setStorageItem('crowd_subscriptions', []);
}
if (!localStorage.getItem('crowd_notifications')) {
  setStorageItem('crowd_notifications', [
    {
      id: 'notif-1',
      title: 'Subscription Alert Active',
      body: 'You are now ready to receive real-time updates for your specified geographic alerts.',
      created_at: new Date().toISOString(),
      read: false
    }
  ]);
}

// Helper methods to read/write state
const getReports = () => getStorageItem<Report[]>('crowd_reports', []);
const setReports = (reps: Report[]) => setStorageItem('crowd_reports', reps);
const getUsers = () => getStorageItem<User[]>('crowd_users', []);
const setUsers = (usrs: User[]) => setStorageItem('crowd_users', usrs);
const getSubscriptions = () => getStorageItem<Subscription[]>('crowd_subscriptions', []);
const setSubscriptions = (subs: Subscription[]) => setStorageItem('crowd_subscriptions', subs);
const getNotifications = () => getStorageItem<AppNotification[]>('crowd_notifications', []);
const setNotifications = (notifs: AppNotification[]) => setStorageItem('crowd_notifications', notifs);

// Current logged in user in demo session
const getDemoUser = (): User | null => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  const users = getUsers();
  return users.find(u => u.id === token) || null;
};

// --- AUTH SERVICE ---
export const authService = {
  async signup(email: string, password: string, username: string) {
    if (isDemoModeActive()) {
      const users = getUsers();
      if (users.some(u => u.email === email)) {
        throw { response: { data: { error: 'Email already exists' } } };
      }
      const newUser: User = {
        id: `usr-${Math.random().toString(36).substr(2, 9)}`,
        username: username.toLowerCase().replace(/\s+/g, '_'),
        email,
      };
      users.push(newUser);
      setUsers(users);
      localStorage.setItem('token', newUser.id); // Use userId as simple mock token
      return { user: newUser, token: newUser.id };
    } else {
      const { data } = await api.post('/auth/signup', { email, password, username });
      localStorage.setItem('token', data.token);
      return data;
    }
  },

  async login(email: string, password: string) {
    if (isDemoModeActive()) {
      const users = getUsers();
      const user = users.find(u => u.email === email);
      if (!user) {
        throw { response: { data: { error: 'Invalid email or password' } } };
      }
      localStorage.setItem('token', user.id);
      return { user, token: user.id };
    } else {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      return data;
    }
  },

  async getCurrentUser(): Promise<User | null> {
    if (isDemoModeActive()) {
      return getDemoUser();
    } else {
      try {
        const { data } = await api.get('/auth/me');
        return data.user;
      } catch {
        return null;
      }
    }
  },

  logout() {
    localStorage.removeItem('token');
    if (!isDemoModeActive()) {
      window.location.href = '/login';
    }
  },

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }
};

// --- REPORTS SERVICE ---
export const reportsService = {
  async getNearby(lat: number, lng: number, radius = 10): Promise<Report[]> {
    if (isDemoModeActive()) {
      const reports = getReports();
      // Calculate distances, filter by radius, and sort by distance
      const nearby = reports
        .map(report => {
          const dist = getDistance(lat, lng, report.lat, report.lng);
          return { ...report, distance_m: dist };
        })
        .filter(report => report.distance_m <= radius * 1000);

      return nearby;
    } else {
      const { data } = await api.get('/reports/nearby', {
        params: { lat, lng, radius },
      });
      return data.reports;
    }
  },

  async create(reportData: { title: string; description: string; category: Category; lat: number; lng: number }): Promise<Report> {
    if (isDemoModeActive()) {
      const reports = getReports();
      const user = getDemoUser();
      const newReport: Report = {
        id: `rep-${Math.random().toString(36).substr(2, 9)}`,
        title: reportData.title,
        description: reportData.description,
        category: reportData.category,
        lat: reportData.lat,
        lng: reportData.lng,
        resolved: false,
        created_at: new Date().toISOString(),
        user_id: user?.id || 'anonymous'
      };
      reports.unshift(newReport);
      setReports(reports);

      // --- SIMULATE REAL-TIME SQS TRIGGER IN NOTIFICATION SERVICE ---
      // Check if this new report falls within any user's subscription area!
      const subscriptions = getSubscriptions();
      const notifications = getNotifications();

      subscriptions.forEach(sub => {
        const distance = getDistance(sub.lat, sub.lng, newReport.lat, newReport.lng);
        if (distance <= sub.radius_km * 1000) {
          notifications.unshift({
            id: `notif-${Math.random().toString(36).substr(2, 9)}`,
            title: `⚠️ Alert: Nearby ${newReport.category.toUpperCase()}!`,
            body: `"${newReport.title}" was reported ${Math.round(distance / 100) / 10}km from your active alert zone.`,
            created_at: new Date().toISOString(),
            read: false
          });
        }
      });
      setNotifications(notifications);

      return newReport;
    } else {
      const { data } = await api.post('/reports', reportData);
      return data.report;
    }
  },

  async getOne(id: string): Promise<Report> {
    if (isDemoModeActive()) {
      const reports = getReports();
      const report = reports.find(r => r.id === id);
      if (!report) throw new Error('Report not found');
      return report;
    } else {
      const { data } = await api.get(`/reports/${id}`);
      return data.report;
    }
  },

  async resolve(id: string): Promise<Report> {
    if (isDemoModeActive()) {
      const reports = getReports();
      const index = reports.findIndex(r => r.id === id);
      if (index === -1) throw new Error('Report not found');
      reports[index].resolved = true;
      setReports(reports);
      return reports[index];
    } else {
      const { data } = await api.patch(`/reports/${id}/resolve`);
      return data.report;
    }
  },

  async subscribe(lat: number, lng: number, radius_km = 5): Promise<Subscription> {
    if (isDemoModeActive()) {
      const subs = getSubscriptions();
      const newSub: Subscription = {
        id: `sub-${Math.random().toString(36).substr(2, 9)}`,
        lat,
        lng,
        radius_km,
        created_at: new Date().toISOString()
      };
      subs.push(newSub);
      setSubscriptions(subs);

      // Add a helpful system notification confirmation
      const notifications = getNotifications();
      notifications.unshift({
        id: `notif-${Math.random().toString(36).substr(2, 9)}`,
        title: '🔔 Alert Zone Set',
        body: `You set an alert radius of ${radius_km}km. We will notify you of any local incident reports inside this zone.`,
        created_at: new Date().toISOString(),
        read: false
      });
      setNotifications(notifications);

      return newSub;
    } else {
      const { data } = await api.post('/reports/subscriptions', { lat, lng, radius_km });
      return data.subscription;
    }
  },

  // Get user subscriptions in mock
  async getSubscriptions(): Promise<Subscription[]> {
    if (isDemoModeActive()) {
      return getSubscriptions();
    }
    // Note: User can call their own API endpoint for subscriptions if available
    return [];
  },

  async removeSubscription(id: string): Promise<void> {
    if (isDemoModeActive()) {
      const subs = getSubscriptions();
      const filtered = subs.filter(s => s.id !== id);
      setSubscriptions(filtered);
    }
  }
};

// --- MEDIA SERVICE ---
export const mediaService = {
  async upload(file: File, reportId: string) {
    if (isDemoModeActive()) {
      // In Demo Mode, simulate the upload by creating a local ObjectURL
      const localUrl = URL.createObjectURL(file);
      const reports = getReports();
      const index = reports.findIndex(r => r.id === reportId);
      if (index !== -1) {
        reports[index].media_url = localUrl;
        setReports(reports);
      }
      return { id: `med-${Math.random()}`, report_id: reportId, s3_key: 'mock-key', confirmed: true };
    } else {
      const ext = file.name.split('.').pop();
      // Step 1: Request signed URL
      const { data } = await api.post('/media/presign', {
        report_id: reportId,
        mime_type: file.type,
        file_extension: ext,
      });

      // Step 2: Upload to S3
      await axios.put(data.upload_url, file, {
        headers: { 'Content-Type': file.type },
      });

      // Step 3: Confirm with S3 key
      const { data: confirmed } = await api.post('/media/confirm', {
        s3_key: data.s3_key,
      });
      return confirmed.media;
    }
  },

  async getByReport(reportId: string) {
    if (isDemoModeActive()) {
      const reports = getReports();
      const report = reports.find(r => r.id === reportId);
      return report?.media_url ? [{ id: '1', report_id: reportId, url: report.media_url }] : [];
    } else {
      const { data } = await api.get(`/media/report/${reportId}`);
      return data.media;
    }
  }
};

// --- NOTIFICATION UTILITIES ---
export const notificationService = {
  getNotifications(): AppNotification[] {
    return getNotifications();
  },

  getUnreadCount(): number {
    return getNotifications().filter(n => !n.read).length;
  },

  markAllAsRead() {
    const notifs = getNotifications().map(n => ({ ...n, read: true }));
    setNotifications(notifs);
  },

  clearAll() {
    setNotifications([]);
  }
};
