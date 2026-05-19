const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const express = require('express');
const supertest = require('supertest');
const tokenMiddleware = require('../src/token-middleware');

describe('TokenMiddleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(tokenMiddleware);
    app.post('/test', (req, res) => {
      res.json({ token: req.anonToken });
    });
  });

  it('returns 401 when X-Anonymous-Token header is missing', async () => {
    await supertest(app)
      .post('/test')
      .expect(401);
  });

  it('passes token from header to req.anonToken', async () => {
    const res = await supertest(app)
      .post('/test')
      .set('X-Anonymous-Token', 'my-token-123')
      .expect(200);
    assert.strictEqual(res.body.token, 'my-token-123');
  });
});
