const request = require('supertest');
const app = require('../server');

const EMPLOYER = {
  name: 'Employer One',
  email: 'employer@test.com',
  password: 'secret123',
  role: 'employer',
  company: 'TestCorp',
};
const SEEKER = {
  name: 'Seeker One',
  email: 'seeker@test.com',
  password: 'secret123',
  role: 'seeker',
};

describe('POST /api/auth/register', () => {
  test('registers a new employer and returns a JWT', async () => {
    const res = await request(app).post('/api/auth/register').send(EMPLOYER);
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('employer');
    expect(res.body.user.password).toBeUndefined();
  });

  test('registers a seeker without a company field', async () => {
    const res = await request(app).post('/api/auth/register').send(SEEKER);
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('seeker');
  });

  test('rejects a duplicate email', async () => {
    await request(app).post('/api/auth/register').send(EMPLOYER);
    const res = await request(app).post('/api/auth/register').send(EMPLOYER);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already in use/i);
  });

  test('rejects an invalid role', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...EMPLOYER, role: 'admin' });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  test('rejects missing required fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'missing@test.com' });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(EMPLOYER);
  });

  test('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: EMPLOYER.email, password: EMPLOYER.password });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(EMPLOYER.email);
  });

  test('rejects a wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: EMPLOYER.email, password: 'wrongpass' });
    expect(res.status).toBe(401);
  });

  test('rejects a non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@test.com', password: 'secret123' });
    expect(res.status).toBe(401);
  });

  test('rejects a request with missing password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: EMPLOYER.email });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/me', () => {
  let token;

  beforeEach(async () => {
    const res = await request(app).post('/api/auth/register').send(EMPLOYER);
    token = res.body.token;
  });

  test('returns the current user with a valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(EMPLOYER.email);
    expect(res.body.user.password).toBeUndefined();
  });

  test('rejects a request with no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('rejects a request with an invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer this.is.invalid');
    expect(res.status).toBe(401);
  });
});
