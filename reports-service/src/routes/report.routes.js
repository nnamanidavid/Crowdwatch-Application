const { Router } = require('express');
const ReportController = require('../controllers/report.controller');
const authenticate = require('../middleware/authenticate');

const router = Router();

// All report routes require a valid JWT
router.post('/', authenticate, ReportController.create);
router.get('/nearby', authenticate, ReportController.nearby);   // ?lat=&lng=&radius=
router.get('/:id', authenticate, ReportController.getOne);
router.patch('/:id/resolve', authenticate, ReportController.resolve);
router.post('/subscriptions', authenticate, ReportController.subscribe);

module.exports = router;
