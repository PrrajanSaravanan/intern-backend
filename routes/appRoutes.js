const router = require('express').Router();
const {
  applyToJob, getApplicants, updateStatus, getMyApplications,
  analyzeResume, generateCoverLetter,
  previewAnalyze, previewCoverLetter,
} = require('../controllers/appController');
const { protect, requireRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/jobs/:jobId/apply',             protect, requireRole('seeker'),   upload.single('resume'), applyToJob);
router.post('/jobs/:jobId/preview-analyze',   protect, requireRole('seeker'),   upload.memory.single('resume'), previewAnalyze);
router.post('/jobs/:jobId/preview-cover-letter', protect, requireRole('seeker'), upload.memory.single('resume'), previewCoverLetter);
router.get('/jobs/:jobId/applicants',         protect, requireRole('employer'), getApplicants);
router.patch('/:id/status',                   protect, requireRole('employer'), updateStatus);
router.get('/me',                             protect, requireRole('seeker'),   getMyApplications);
router.get('/:id/analyze',                    protect, requireRole('employer', 'seeker'), analyzeResume);
router.get('/:id/cover-letter',               protect, requireRole('employer', 'seeker'), generateCoverLetter);

module.exports = router;
