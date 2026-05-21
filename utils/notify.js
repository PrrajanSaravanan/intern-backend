const { createAndPush } = require('../services/notificationService');

const safeNotify = async (payload) => {
  try {
    await createAndPush(payload);
  } catch (err) {
    console.error('Notification failed:', err.message);
  }
};

const notifyEmployerNewApplication = async ({ employerId, applicantName, jobTitle, jobId, applicationId }) => {
  await safeNotify({
    userId: employerId,
    type: 'application_received',
    title: 'New application',
    message: `${applicantName} applied to "${jobTitle}"`,
    link: '/dashboard',
    meta: { jobId, applicationId },
  });
};

const notifySeekerStatusChange = async ({ seekerId, jobTitle, status, jobId, applicationId }) => {
  if (status !== 'shortlisted' && status !== 'rejected') return;

  const copy = {
    shortlisted: {
      title: "You've been shortlisted!",
      message: `Great news! You were shortlisted for "${jobTitle}".`,
    },
    rejected: {
      title: 'Application update',
      message: `Your application for "${jobTitle}" was not selected.`,
    },
  };

  const { title, message } = copy[status];
  await safeNotify({
    userId: seekerId,
    type: 'application_status',
    title,
    message,
    link: '/dashboard',
    meta: { jobId, applicationId, status },
  });
};

module.exports = { notifyEmployerNewApplication, notifySeekerStatusChange };
