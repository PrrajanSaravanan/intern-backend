const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type:    { type: String, enum: ['application_received', 'application_status'], required: true },
    title:   { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    read:    { type: Boolean, default: false },
    link:    { type: String, default: '/dashboard' },
    meta:    {
      jobId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
      applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
      status:        { type: String },
    },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
