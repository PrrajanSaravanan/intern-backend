const request = require('supertest');
const app = require('../server');
const { registerUser, createJob } = require('./helpers');

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

let employerToken, seekerToken;

beforeEach(async () => {
  const employer = await registerUser(EMPLOYER_DATA);
  const seeker = await registerUser(SEEKER_DATA);
  employerToken = employer.token;
  seekerToken = seeker.token;
});

describe('POST /api/jobs', () => {
  test('employer creates a job successfully', async () => {
    const res = await createJob(employerToken);
    expect(res.job).toBeDefined();
    expect(res.job.title).toBe('Test Engineer');
    expect(res.job.isActive).toBe(true);
  });

  test('seeker is blocked with 403', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${seekerToken}`)
      .send({ title: 'X', company: 'X', location: 'X', type: 'full-time', description: 'X' });
    expect(res.status).toBe(403);
  });

  test('unauthenticated request is blocked with 401', async () => {
    const res = await request(app).post('/api/jobs').send({ title: 'X' });
    expect(res.status).toBe(401);
  });

  test('rejects a job with an invalid type enum', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${employerToken}`)
      .send({ title: 'X', company: 'X', location: 'X', type: 'gig', description: 'X' });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

describe('GET /api/jobs', () => {
  beforeEach(async () => {
    await createJob(employerToken, { title: 'Node Developer', location: 'Chennai', type: 'full-time' });
    await createJob(employerToken, { title: 'React Developer', location: 'Bangalore', type: 'contract' });
    await createJob(employerToken, { title: 'DevOps Engineer', location: 'Chennai', type: 'full-time' });
  });

  test('returns all active jobs with pagination metadata', async () => {
    const res = await request(app).get('/api/jobs?page=1&limit=10');
    expect(res.status).toBe(200);
    expect(res.body.jobs.length).toBe(3);
    expect(res.body.total).toBe(3);
    expect(res.body.page).toBe(1);
    expect(res.body.pages).toBeDefined();
  });

  test('respects the limit parameter', async () => {
    const res = await request(app).get('/api/jobs?page=1&limit=2');
    expect(res.body.jobs.length).toBe(2);
    expect(res.body.total).toBe(3);
  });

  test('filters by location (case-insensitive)', async () => {
    const res = await request(app).get('/api/jobs?location=chennai');
    expect(res.status).toBe(200);
    expect(res.body.jobs.every((j) => /chennai/i.test(j.location))).toBe(true);
    expect(res.body.jobs.length).toBe(2);
  });

  test('filters by type', async () => {
    const res = await request(app).get('/api/jobs?type=contract');
    expect(res.status).toBe(200);
    expect(res.body.jobs.length).toBe(1);
    expect(res.body.jobs[0].type).toBe('contract');
  });
});

describe('GET /api/jobs/:id', () => {
  test('returns a job by its ID', async () => {
    const { job } = await createJob(employerToken);
    const res = await request(app).get(`/api/jobs/${job._id}`);
    expect(res.status).toBe(200);
    expect(res.body.job._id).toBe(job._id);
  });

  test('returns 404 for a non-existent ID', async () => {
    const res = await request(app).get('/api/jobs/6a0ae76d88989b8719f6fc41');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/jobs/employer/me', () => {
  test('returns only the authenticated employer\'s jobs', async () => {
    await createJob(employerToken);
    await createJob(employerToken);
    const res = await request(app)
      .get('/api/jobs/employer/me')
      .set('Authorization', `Bearer ${employerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.jobs.length).toBe(2);
    expect(res.body.jobs.every((j) => j.createdBy === res.body.jobs[0].createdBy)).toBe(true);
  });

  test('blocks a seeker with 403', async () => {
    const res = await request(app)
      .get('/api/jobs/employer/me')
      .set('Authorization', `Bearer ${seekerToken}`);
    expect(res.status).toBe(403);
  });
});

describe('PUT /api/jobs/:id', () => {
  test('employer updates their own job', async () => {
    const { job } = await createJob(employerToken);
    const res = await request(app)
      .put(`/api/jobs/${job._id}`)
      .set('Authorization', `Bearer ${employerToken}`)
      .send({ title: 'Updated Title' });
    expect(res.status).toBe(200);
    expect(res.body.job.title).toBe('Updated Title');
  });

  test('returns 404 when updating another employer\'s job', async () => {
    const { job } = await createJob(employerToken);
    const other = await registerUser({ ...EMPLOYER_DATA, email: 'other@test.com' });
    const res = await request(app)
      .put(`/api/jobs/${job._id}`)
      .set('Authorization', `Bearer ${other.token}`)
      .send({ title: 'Hijacked' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/jobs/:id', () => {
  test('soft-deletes a job — it disappears from public listing', async () => {
    const { job } = await createJob(employerToken);
    const del = await request(app)
      .delete(`/api/jobs/${job._id}`)
      .set('Authorization', `Bearer ${employerToken}`);
    expect(del.status).toBe(200);

    const get = await request(app).get(`/api/jobs/${job._id}`);
    expect(get.status).toBe(404);
  });

  test('returns 404 when deleting another employer\'s job', async () => {
    const { job } = await createJob(employerToken);
    const other = await registerUser({ ...EMPLOYER_DATA, email: 'other@test.com' });
    const res = await request(app)
      .delete(`/api/jobs/${job._id}`)
      .set('Authorization', `Bearer ${other.token}`);
    expect(res.status).toBe(404);
  });
});
