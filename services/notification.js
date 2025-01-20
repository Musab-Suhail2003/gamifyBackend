const admin = require('firebase-admin');
const serviceAccount = require('./final-project-190aa-firebase-adminsdk-cfwan-0c8cfcc9ac.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});


async function sendNotification(deviceToken, title, body) {
  const message = {
    token: deviceToken,
    notification: {
      title: title,
      body: body,
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Notification sent:', response);
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}

module.exports = sendNotification;
