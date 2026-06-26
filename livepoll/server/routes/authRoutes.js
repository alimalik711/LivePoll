const express = require('express');
const router = express.Router();
const { register,login,getMe,logout} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { createSession } = require('../controllers/sessionController');


router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/', protect, createSession);
router.get('/me', protect, getMe);


module.exports = router;