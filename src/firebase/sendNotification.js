// sendNotification.js

const admin = require('firebase-admin');

// Initialize the Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.applicationDefault(), // or use a service account key
});

// Function to send notification
const sendNotification = async (token, message) => {
  try {
    const response = await admin.messaging().send({
      token,
      notification: {
        title: 'You’ve got a new notification!',
        body: message,
      },
      data: {
        action: 'notification',
      },
    });
    // console.log('Successfully sent message:', response);
  } catch (error) {
   // console.error('Error sending message:', error);
  }
};

module.exports = sendNotification;
    