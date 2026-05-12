import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Function to request user permission for notifications
export async function requestUserPermission(): Promise<void> {
  // console.log('Requesting user permission...');
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      // console.log('Authorization status:', authStatus);
      await getFcmToken();
    } else {
      // console.log('Permission not granted:', authStatus);
    }
  } catch (error) {
    // console.log('Error requesting permission:', error);
  }
}

// Function to get the FCM token and store it
const getFcmToken = async (): Promise<void> => {
  try {
    // let fcmToken = await AsyncStorage.getItem('fcmToken');
    // console.log('Old FCM token:', fcmToken);
    // if (!fcmToken) {
      const newFcmToken = await messaging().getToken();
      if (newFcmToken) {
        // console.log('New FCM token:', newFcmToken);
        await AsyncStorage.setItem('fcmToken', newFcmToken);
      }
    // }
  } catch (error) {
    // console.log('Error getting FCM token:', error);
  }
};

// Call the function to request user permission
requestUserPermission();

// Function to handle notifications
export const NotificationsService = (): void => {
  messaging().onNotificationOpenedApp((remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
    // console.log('Notification caused app to open from background state:', remoteMessage.notification);
  });

  messaging().onMessage(async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
    // console.log('Notification received in foreground:', remoteMessage.notification);
  });

  // Check whether an initial notification is available
  messaging()
    .getInitialNotification()
    .then((remoteMessage: FirebaseMessagingTypes.RemoteMessage | null) => {
      if (remoteMessage) {
        // console.log('Notification caused app to open from quit state:', remoteMessage.notification);
        // Add logic here to set the initial route if necessary
        // Example: setInitialRoute(remoteMessage.data.type);
      }
      // Add logic to indicate that loading has finished if necessary
      // Example: setLoading(false);
    })
    .catch((error: any) => {
      // console.log('Error getting initial notification:', error);
    });
};
