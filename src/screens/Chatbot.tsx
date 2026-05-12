import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  StyleSheet,
  Platform,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { ScaledSheet, scale, verticalScale } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import * as ImagePicker from 'react-native-image-picker';
import { request, PERMISSIONS, RESULTS, check } from 'react-native-permissions';  // Import permissions
import { requestGalleryPermission } from '../utils/permissions';
import { useFocusEffect } from '@react-navigation/native';


interface Message {
  id: string;
  text?: string;
  imageUri?: string;
  sender: 'user' | 'bot';
}

const ChatbotScreen = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Hello! How can I assist you today?', sender: 'bot' },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState<boolean>(false); // State to track permission check
  const [permissionChecked, setPermissionChecked] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const handleSend = async () => {
    if (inputText.trim().length === 0) return;

    // Add user message to the chat
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
    };
    setMessages((prev) => [...prev, userMessage]);

    setInputText('');
    setIsLoading(true);

    // Call handleReceive to fetch the bot's response
    await handleReceive(inputText);
  };

  const handleSendImage = async (imageUri: string) => {
    // Add user image message to the chat
    const userImageMessage: Message = {
      id: Date.now().toString(),
      imageUri,
      sender: 'user',
    };
    setMessages((prev) => [...prev, userImageMessage]);

    setIsLoading(true);

    // Call handleReceive to fetch the bot's response for images
    await handleReceive('Image sent');
  };

  const handleReceive = async (userMessage: string) => {
    try {
      const response = await axios.get('http://192.168.100.48:5000/chatbot-message', {
        params: { user_message: userMessage },
      });

      const botMessage: Message = {
        id: Date.now().toString(),
        text: response.data.message || "Sorry, I couldn't fetch a message. Please try again!",
        sender: 'bot',
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      //console.error('Error fetching bot response:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: 'Something went wrong. Please try again later.',
        sender: 'bot',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  


  const checkPermission = useCallback(async () => {
    if (checkingPermission || permissionChecked) return; // Avoid multiple checks and only check if not already done
  
    setCheckingPermission(true); // Set to true to indicate permission check is in progress
    try {
      const permissionStatus = await requestGalleryPermission();
      // console.log('Permission status:', permissionStatus);
      setHasPermission(permissionStatus);
  
      if (permissionStatus === false) {
        Alert.alert(
          'Permission Blocked',
          'You have blocked access to the gallery. Please enable it from Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings(),
            },
          ]
        );
      
      }
      setPermissionChecked(true); // Mark permission as checked
      return permissionStatus;
    } catch (error) {
     // console.error('Error checking permission:', error);
    } finally {
      setCheckingPermission(false); // Reset the flag after permission check
    }
  }, [checkingPermission, permissionChecked]);

  useFocusEffect(
    useCallback(() => {
      checkPermission();
    }, [checkPermission])
  );
  

  const openImagePicker = () => {
    ImagePicker.launchImageLibrary(
      {
        mediaType: 'photo',
        maxWidth: 800,
        maxHeight: 800,
      },
      (response) => {
        if (response.didCancel) {
          return;
        }
        if (response.errorCode) {
          Alert.alert('Image Picker Error', response.errorMessage || 'Unknown error');
        } else if (response.assets && response.assets[0].uri) {
          handleSendImage(response.assets[0].uri);
        }
      }
    );
  };

  

  const chooseImage = async () => {
    try {
      const permissionStatus = await request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
  
      if (permissionStatus === RESULTS.GRANTED) {
        // Permission granted, proceed to open the image picker
        openImagePicker();
        checkPermission()
      } else if (permissionStatus === RESULTS.DENIED) {
        // Permission denied, ask the user again
        const permissionRequest = await request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
        if (permissionRequest === RESULTS.GRANTED) {
          openImagePicker();
          checkPermission()
        } else {
          Alert.alert(
            'Permission Denied',
            'You need to grant permission to access the gallery.'
          );
        }
      } else if (permissionStatus === RESULTS.BLOCKED) {
        // Permission is permanently denied, open app settings
        Alert.alert(
          'Permission Blocked',
          'You have blocked access to the gallery. Please enable it from Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings(),
            },
          ]
        );
      }
    } catch (error) {
    //  console.error('Error requesting permission:', error);
      Alert.alert('Permission Error', 'Something went wrong while requesting permission.');
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    return (
      <View
        style={[styles.messageContainer, isUser ? styles.userMessage : styles.botMessage]}
      >
        {item.text && <Text style={styles.messageText}>{item.text}</Text>}
        {item.imageUri && <Image source={{ uri: item.imageUri }} style={styles.imageMessage} />}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatContainer}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          placeholderTextColor="#aaa"
          value={inputText}
          onChangeText={setInputText}
        />
        <TouchableOpacity
          onPress={handleSend}
          style={styles.sendButton}
          disabled={isLoading}
        >
          <Icon name="send" size={scale(20)} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={chooseImage}
          style={styles.sendButton}
          disabled={isLoading}
        >
          <Icon name="file-upload" size={26} color="#fff" />  
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  chatContainer: {
    padding: '10@vs',
  },
  messageContainer: {
    maxWidth: '80%',
    borderRadius: '10@s',
    padding: '10@s',
    marginVertical: '5@vs',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#0078fe',
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'gray',
  },
  messageText: {
    color: '#fff',
    fontSize: '14@s',
  },
  imageMessage: {
    width: '200@vs',
    height: '200@vs',
    borderRadius: '10@s',
    marginTop: '5@vs',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: '10@s',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  input: {
    flex: 1,
    height: '40@vs',
    backgroundColor: '#f1f1f1',
    borderRadius: '20@s',
    paddingHorizontal: '10@s',
    fontSize: '14@s',
    color: '#333',
  },
  sendButton: {
    marginLeft: '10@s',
    backgroundColor: '#0078fe',
    borderRadius: '20@s',
    padding: '10@s',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatbotScreen;
