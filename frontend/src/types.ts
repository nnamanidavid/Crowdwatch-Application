export type Category = 'fire' | 'flood' | 'accident' | 'crime' | 'other';

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface Report {
  id: string;
  title: string;
  description: string;
  category: Category;
  lat: number;
  lng: number;
  resolved: boolean;
  created_at: string;
  user_id?: string;
  distance_m?: number;
  media_url?: string;
}

export interface Subscription {
  id: string;
  lat: number;
  lng: number;
  radius_km: number;
  created_at: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  created_at: string;
  read: boolean;
}
