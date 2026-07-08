const ReportModel = require('../models/report.model');
const { publishNewReport } = require('../sqs/publisher');

const ReportController = {
  async create(req, res) {
    const { title, description, category, lat, lng } = req.body;
    const userId = req.user.sub;

    if (!title || !category || lat == null || lng == null) {
      return res.status(400).json({ error: 'title, category, lat, and lng are required.' });
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: 'Invalid coordinates.' });
    }

    try {
      const report = await ReportModel.create({ userId, title, description, category, lat, lng });

      // After saving, find nearby subscribers and publish an SQS event.
      // Notification Service will consume this and alert those users.
      // We don't await the SQS publish — if it fails, the report still saved.
      publishNewReport(report).catch((err) =>
        console.error('SQS publish failed (non-fatal):', err.message)
      );

      return res.status(201).json({ report });
    } catch (err) {
      console.error('create report error:', err.message);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  },

  async getOne(req, res) {
    try {
      const report = await ReportModel.findById(req.params.id);
      if (!report) return res.status(404).json({ error: 'Report not found.' });
      return res.status(200).json({ report });
    } catch (err) {
      console.error('getOne error:', err.message);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  },

  async nearby(req, res) {
    const { lat, lng, radius } = req.query;

    if (lat == null || lng == null) {
      return res.status(400).json({ error: 'lat and lng query params are required.' });
    }

    try {
      const reports = await ReportModel.findWithinRadius({
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        radiusKm: radius ? parseFloat(radius) : 5,
      });
      return res.status(200).json({ reports });
    } catch (err) {
      console.error('nearby error:', err.message);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  },

  async resolve(req, res) {
    try {
      const report = await ReportModel.resolve(req.params.id, req.user.sub);
      if (!report) {
        return res.status(404).json({ error: 'Report not found or not yours.' });
      }
      return res.status(200).json({ report });
    } catch (err) {
      console.error('resolve error:', err.message);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  },

  async subscribe(req, res) {
    const { lat, lng, radius_km } = req.body;
    const userId = req.user.sub;

    if (lat == null || lng == null) {
      return res.status(400).json({ error: 'lat and lng are required.' });
    }

    try {
      const sub = await ReportModel.subscribe({ userId, lat, lng, radiusKm: radius_km });
      return res.status(201).json({ subscription: sub });
    } catch (err) {
      console.error('subscribe error:', err.message);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  },
};

module.exports = ReportController;
