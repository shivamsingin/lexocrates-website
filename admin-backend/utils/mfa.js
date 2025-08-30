const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

class MFAService {
  // Generate TOTP secret
  static generateSecret(userEmail) {
    return speakeasy.generateSecret({
      name: `Lexocrates (${userEmail})`,
      issuer: 'Lexocrates',
      length: 32
    });
  }

  // Generate QR code for authenticator app
  static async generateQRCode(otpauthUrl) {
    try {
      return await QRCode.toDataURL(otpauthUrl);
    } catch (error) {
      throw new Error('Failed to generate QR code');
    }
  }

  // Verify TOTP token
  static verifyToken(token, secret) {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps (60 seconds) for clock skew
    });
  }

  // Generate backup codes
  static generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      codes.push({
        code: this.generateRandomCode(),
        used: false
      });
    }
    return codes;
  }

  // Generate random backup code
  static generateRandomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Verify backup code
  static verifyBackupCode(code, backupCodes) {
    const backupCode = backupCodes.find(bc => bc.code === code && !bc.used);
    if (backupCode) {
      backupCode.used = true;
      return true;
    }
    return false;
  }

  // Check if MFA is required for user
  static isMFARequired(user) {
    return user.mfaEnabled && user.role !== 'client';
  }

  // Get MFA setup data
  static getMFASetupData(secret, userEmail) {
    const otpauthUrl = speakeasy.otpauthURL({
      secret: secret.ascii,
      label: userEmail,
      issuer: 'Lexocrates',
      algorithm: 'sha1'
    });

    return {
      secret: secret.base32,
      otpauthUrl: otpauthUrl,
      qrCode: null // Will be generated separately
    };
  }
}

module.exports = MFAService;
