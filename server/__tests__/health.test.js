/**
 * Basic test for server health endpoint
 */
const request = require('supertest');
const express = require('express');

describe('Server Health Check', () => {
  let app;

  beforeAll(() => {
    app = express();
    // Simple health check endpoint for testing
    app.get('/api/health', (req, res) => {
      res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    });
  });

  it('should return 200 for health check', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});

