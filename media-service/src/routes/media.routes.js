const { Router } = require('express');
const MediaController = require('../controllers/media.controller');
const authenticate = require('../middleware/authenticate');

const router = Router();

router.post('/presign', authenticate, MediaController.getPresignedUrl);
router.post('/confirm', authenticate, MediaController.confirmUpload);
router.get('/report/:reportId', authenticate, MediaController.getByReport);

module.exports = router;
