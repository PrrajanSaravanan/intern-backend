const router = require('express').Router();
const { applyToJob, getApplicants, updateStatus, getMyApplications } = require('../controllers/appController');
const { protect, requireRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/jobs/:jobId/apply',       protect, requireRole('seeker'),   upload.single('resume'), applyToJob);
router.get('/jobs/:jobId/applicants',   protect, requireRole('employer'), getApplicants);
router.patch('/:id/status',             protect, requireRole('employer'), updateStatus);
router.get('/me',                       protect, requireRole('seeker'),   getMyApplications);

module.exports = router;
