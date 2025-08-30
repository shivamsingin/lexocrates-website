const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  encryptedFileName: { type: String, required: true },
  encryptedFilePath: { type: String, required: true },
  fileSize: { type: Number, required: true },
  encryptedSize: { type: Number, required: true },
  mimeType: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clientId: { type: String, default: null },
  scanResult: {
    isClean: { type: Boolean, default: true },
    assessment: { type: String, default: '' },
    threats: { type: [String], default: [] },
    warnings: { type: [String], default: [] },
    fileHash: { type: String }
  },
  encryptionMetadata: {
    fileKey: { type: String, required: true },
    encryptedAt: { type: Date, default: Date.now },
    userId: { type: String },
    clientId: { type: String }
  },
  status: { type: String, enum: ['encrypted', 'rejected', 'deleted'], default: 'encrypted' }
}, {
  timestamps: true
});

module.exports = mongoose.model('File', FileSchema);


