const mongoose = require('mongoose');

const FileAuditLogSchema = new mongoose.Schema({
  fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action: { type: String, enum: ['upload', 'download', 'delete'], required: true },
  ipAddress: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: false });

module.exports = mongoose.model('FileAuditLog', FileAuditLogSchema);


