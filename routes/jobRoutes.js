const router = require('express').Router();
const { getJobs, getJob, getMyJobs, createJob, updateJob, deleteJob } = require('../controllers/jobController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.get('/',            getJobs);
router.get('/employer/me', protect, requireRole('employer'), getMyJobs);  // must be before /:id
router.get('/:id',         getJob);
router.post('/',           protect, requireRole('employer'), createJob);
router.put('/:id',         protect, requireRole('employer'), updateJob);
router.delete('/:id',      protect, requireRole('employer'), deleteJob);

module.exports = router;
