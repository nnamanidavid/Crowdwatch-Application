import api from './api';

export const reportsService = {
  async getNearby(lat, lng, radius = 5) {
    const { data } = await api.get('/reports/nearby', {
      params: { lat, lng, radius },
    });
    return data.reports;
  },

  async create(reportData) {
    const { data } = await api.post('/reports', reportData);
    return data.report;
  },

  async getOne(id) {
    const { data } = await api.get(`/reports/${id}`);
    return data.report;
  },

  async resolve(id) {
    const { data } = await api.patch(`/reports/${id}/resolve`);
    return data.report;
  },

  async subscribe(lat, lng, radius_km = 5) {
    const { data } = await api.post('/reports/subscriptions', { lat, lng, radius_km });
    return data.subscription;
  },
};
