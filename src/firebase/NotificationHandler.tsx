import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import messaging from '@react-native-firebase/messaging';

export const NotificationHandler = () => {
  const [notification, setNotification] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const handleNotification = (remoteMessage) => {
    setNotification(remoteMessage.notification);
    setShowNotification(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowNotification(false));
    }, 3000);
  };

  messaging().onMessage(async (remoteMessage) => {
    // console.log('Notification received:', remoteMessage.notification);
    handleNotification(remoteMessage);
  });

  return showNotification && notification ? (
    <Animated.View style={[styles.notificationCard, { opacity: fadeAnim }]}>
      <Text style={styles.title}>{notification.title}</Text>
      <Text style={styles.body}>{notification.body}</Text>
      <TouchableOpacity onPress={() => setShowNotification(false)}>
        <Text style={styles.dismiss}>Dismiss</Text>
      </TouchableOpacity>
    </Animated.View>
  ) : null;
};

const styles = ScaledSheet.create({
  notificationCard: {
    position: 'absolute',
    top: '20@vs',
    left: '20@s',
    right: '20@s',
    backgroundColor: '#fff',
    padding: '15@ms',
    borderRadius: '10@ms',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: '2@vs' },
    shadowOpacity: 0.3,
    shadowRadius: '4@ms',
    elevation: 5,
    zIndex: 999,
  },
  title: {
    fontSize: '16@ms',
    fontWeight: 'bold',
    marginBottom: '5@vs',
    color: '#000', // Add color explicitly for Text
  },
  body: {
    fontSize: '14@ms',
    color: '#555',
  },
  dismiss: {
    marginTop: '10@vs',
    fontSize: '12@ms',
    color: '#007BFF',
  },
});
