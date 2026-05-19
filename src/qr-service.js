const QRCode = require('qrcode');

class QRService {
  static async generate(url) {
    if (!url) throw new Error('URL is required');
    return QRCode.toDataURL(url);
  }
}

module.exports = QRService;
