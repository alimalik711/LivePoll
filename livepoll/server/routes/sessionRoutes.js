const express = require('express');
const router = express.Router();
const { createSession ,createQuestion,getSessionDetails,getSessions,getLeaderboard} = require('../controllers/sessionController');
const { protect } = require('../middleware/authMiddleware');

// The "protect" middleware runs BEFORE createSession
router.post('/', protect, createSession);
router.post('/:sessionId/questions', protect, createQuestion);
// GET /api/sessions/:sessionId
router.get('/:sessionId', protect, getSessionDetails);
router.get('/', protect, getSessions); // New route to get all sessions for the logged-in presenter
router.get('/:sessionId/leaderboard', getLeaderboard); // New route to get the leaderboard for a specific session  


module.exports = router;