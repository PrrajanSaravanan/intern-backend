const request = require('supertest');
const app = require('../server');
const { registerUser, createJob, applyToJob, PDF_BUFFER } = require('./helpers');

const EMPLOYER_DATA = {
  name: 'Employer',
  email: 'employer@test.com',
  password: 'secret123',
  role: 'employer',
  company: 'TestCorp',
};
const SEEKER_DATA = {
  name: 'Seeker',
  email: 'seeker@test.com',
  password: 'secret123',
  role: 'seeker',
};

let employerToken, seekerToken, jobId;

beforeEach(async () => {
  const employer = await registerUser(EMPLOYER_DATA);
  const seeker = await registerUser(SEEKER_DATA);
  employerToken = employer.token;
  seekerToken = seeker.token;
  const { job } = await createJob(employerToken);
  jobId = job._id;
});

describe('POST /api/applications/jobs/:jobId/apply', () => {
  test('seeker applies with a valid PDF and gets a pending application', async () => {
    const res = await applyToJob(seekerToken, jobId, 'I am very interested');
    expect(res.application).toBeDefined();
    expect(res.application.status).toBe('pending');
    expect(res.application.coverNote).toBe('I am very interested');
  });

  test('rejects when no file is attached', async () => {
    const res = await request(app)
      .post(`/api/applications/jobs/${jobId}/apply`)
      .set('Authorization', `Bearer ${seekerToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  test('rejects a non-PDF file', async () => {
    const res = await request(app)
      .post(`/api/applications/jobs/${jobId}/apply`)
      .set('Authorization', `Bearer ${seekerToken}`)
      .attach('resume', Buffer.from('not a pdf'), { filename: 'cv.txt', contentType: 'text/plain' });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.message).toMatch(/PDF/i);
  });

  test('prevents a seeker from applying twice to the same job', async () => {
    await applyToJob(seekerToken, jobId);
    const res = await applyToJob(seekerToken, jobId);
    expect(res.message).toMatch(/already applied/i);
  });

  test('blocks an employer from applying with 403', async () => {
    const res = await request(app)
      .post(`/api/applications/jobs/${jobId}/apply`)
      .set('Authorization', `Bearer ${employerToken}`)
      .attach('resume', PDF_BUFFER, { filename: 'cv.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(403);
  });

  test('returns 404 for a non-existent job — and cleans up the uploaded file', async () => {
    const fakeId = '6a0ae76d88989b8719f6fc41';
    const res = await request(app)
      .post(`/api/applications/jobs/${fakeId}/apply`)
      .set('Authorization', `Bearer ${seekerToken}`)
      .attach('resume', PDF_BUFFER, { filename: 'cv.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/applications/jobs/:jobId/applicants', () => {
  beforeEach(async () => {
    await applyToJob(seekerToken, jobId);
  });

  test('employer sees applicants for their job', async () => {
    const res = await request(app)
      .get(`/api/applications/jobs/${jobId}/applicants`)
      .set('Authorization', `Bearer ${employerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.applications.length).toBe(1);
    expect(res.body.applications[0].applicant.email).toBe(SEEKER_DATA.email);
  });

  test('seeker is blocked from viewing applicants with 403', async () => {
    const res = await request(app)
      .get(`/api/applications/jobs/${jobId}/applicants`)
      .set('Authorization', `Bearer ${seekerToken}`);
    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/applications/:id/status', () => {
  let applicationId;

  beforeEach(async () => {
    const body = await applyToJob(seekerToken, jobId);
    applicationId = body.application._id;
  });

  test('employer shortlists an application', async () => {
    const res = await request(app)
      .patch(`/api/applications/${applicationId}/status`)
      .set('Authorization', `Bearer ${employerToken}`)
      .send({ status: 'shortlisted' });
    expect(res.status).toBe(200);
    expect(res.body.application.status).toBe('shortlisted');
  });

  test('employer rejects an application', async () => {
    const res = await request(app)
      .patch(`/api/applications/${applicationId}/status`)
      .set('Authorization', `Bearer ${employerToken}`)
      .send({ status: 'rejected' });
    expect(res.status).toBe(200);
    expect(res.body.application.status).toBe('rejected');
  });

  test('rejects an invalid status value', async () => {
    const res = await request(app)
      .patch(`/api/applications/${applicationId}/status`)
      .set('Authorization', `Bearer ${employerToken}`)
      .send({ status: 'hired' });
    expect(res.status).toBe(400);
  });

  test('blocks a seeker from updating status with 403', async () => {
    const res = await request(app)
      .patch(`/api/applications/${applicationId}/status`)
      .set('Authorization', `Bearer ${seekerToken}`)
      .send({ status: 'shortlisted' });
    expect(res.status).toBe(403);
  });
});

describe('GET /api/applications/me', () => {
  test('seeker sees their own applications', async () => {
    await applyToJob(seekerToken, jobId);
    const res = await request(app)
      .get('/api/applications/me')
      .set('Authorization', `Bearer ${seekerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.applications.length).toBe(1);
    expect(res.body.applications[0].job.title).toBe('Test Engineer');
  });

  test('employer is blocked with 403', async () => {
    const res = await request(app)
      .get('/api/applications/me')
      .set('Authorization', `Bearer ${employerToken}`);
    expect(res.status).toBe(403);
  });

  test('returns empty array when seeker has no applications', async () => {
    const res = await request(app)
      .get('/api/applications/me')
      .set('Authorization', `Bearer ${seekerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.applications).toHaveLength(0);
  });
});
