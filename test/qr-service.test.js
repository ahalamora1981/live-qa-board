const { describe, it } = require('node:test');
const assert = require('node:assert');
const QRService = require('../src/qr-service');

describe('QRService', () => {
  it('generates a data-URL from a URL string', async () => {
    const dataUrl = await QRService.generate('https://example.com');
    assert.ok(dataUrl.startsWith('data:image/png;base64,'));
  });

  it('throws on empty URL', async () => {
    await assert.rejects(
      () => QRService.generate(''),
      { message: 'URL is required' }
    );
  });
});
