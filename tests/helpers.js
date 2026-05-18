const request = require('supertest');
const app = require('../server');

// Minimal valid PDF bytes — enough for multer's mimetype check
const PDF_BUFFER = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
  '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
  '3 0 obj<</Type/Page/MediaBox[0 0 612 792]>>endobj\n' +
  'xref\n0 4\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n0\n%%EOF'
);

const registerUser = (data) =>
  request(app).post('/api/auth/register').send(data).then((r) => r.body);

const loginUser = (email, password) =>
  request(app).post('/api/auth/login').send({ email, password }).then((r) => r.body);

const createJob = (token, overrides = {}) =>
  request(app)
    .post('/api/jobs')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Test Engineer',
      company: 'TestCorp',
      location: 'Chennai',
      type: 'full-time',
      description: 'Write tests and break things',
      ...overrides,
    })
    .then((r) => r.body);

const applyToJob = (token, jobId, coverNote = '') =>
  request(app)
    .post(`/api/applications/jobs/${jobId}/apply`)
    .set('Authorization', `Bearer ${token}`)
    .attach('resume', PDF_BUFFER, { filename: 'cv.pdf', contentType: 'application/pdf' })
    .field('coverNote', coverNote)
    .then((r) => r.body);

module.exports = { PDF_BUFFER, registerUser, loginUser, createJob, applyToJob };
