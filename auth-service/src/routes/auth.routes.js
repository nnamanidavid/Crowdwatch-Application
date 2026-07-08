const { Router } = require('express');
const AuthController = require('../controllers/auth.controller');
const authenticate = require('../middleware/authenticate');

const router = Router();

// Public routes — no token needed
router.post('/signup', AuthController.signup);
router.post('/login', AuthController.login);

// Called by other services to verify a token is still valid
router.get('/verify', AuthController.verify);

// Example protected route — returns the current user's profile
router.get('/me', authenticate, async (req, res) => {
  const UserModel = require('../models/user.model');
  const user = await UserModel.findById(req.user.sub);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  return res.status(200).json({ user });
});

module.exports = router;
