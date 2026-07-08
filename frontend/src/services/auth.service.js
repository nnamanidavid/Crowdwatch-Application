import api from './api';

export const authService = {
  async signup(email, password, username) {
    const { data } = await api.post('/auth/signup', { email, password, username });
    localStorage.setItem('token', data.token);
    return data;
  },

  async login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    return data;
  },

  logout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
  },

  isLoggedIn() {
    return !!localStorage.getItem('token');
  },
};
