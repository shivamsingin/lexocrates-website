const mongoose = require('mongoose');

const DownloadTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true, index: true },
  fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: true },
  usedAt: { type: Date, default: null }
});

// TTL index to automatically remove expired tokens
DownloadTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('DownloadToken', DownloadTokenSchema);


