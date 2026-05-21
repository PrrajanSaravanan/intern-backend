const Notification = require('../models/Notification');
const { pushToUser } = require('./notificationHub');

const toClient = (doc) => {
  const n = doc.toObject ? doc.toObject() : doc;
  return {
    _id: n._id,
    type: n.type,
    title: n.title,
    message: n.message,
    read: n.read,
    link: n.link,
    meta: n.meta,
    createdAt: n.createdAt,
  };
};

const createAndPush = async ({ userId, type, title, message, link, meta }) => {
  const notification = await Notification.create({
    user: userId,
    type,
    title,
    message,
    link: link || '/dashboard',
    meta: meta || {},
  });

  const payload = toClient(notification);
  pushToUser(String(userId), { event: 'notification', notification: payload });
  return notification;
};

module.exports = { createAndPush, toClient };
