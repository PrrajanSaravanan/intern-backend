const router = require('express').Router();
const {
  list,
  markRead,
  markAllRead,
  stream,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');
const { protectSSE } = require('../middleware/sseAuthMiddleware');

router.get('/stream', protectSSE, stream);
router.get('/', protect, list);
router.patch('/read-all', protect, markAllRead);
router.patch('/:id/read', protect, markRead);

module.exports = router;
