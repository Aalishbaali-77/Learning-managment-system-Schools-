import { API_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  BackHandler,
  ImageBackground,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Image } from 'react-native-animatable';
import { ScaledSheet } from 'react-native-size-matters';
import { useUser } from '../../Context/UserContext';
import api from '../../api';
import { setAccessToken } from '../../utils/storage';
import Icon from 'react-native-vector-icons/FontAwesome';

const ParentsLogin = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { user, updateUser } = useUser();
  const [showPassword, setShowPassword] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate('LoginSelection'); // Navigate to login selection
        return true; // Prevent default back action
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation]),
  );

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation Error', 'Please enter both email and password.');
      return;
    }
    const fcmToken = await AsyncStorage.getItem('fcmToken');

    try {
      // console.log('API_URL:', API_URL);

      const response = await api.public.post(
        'lmslogin',
        { email, password, device_token: fcmToken || '' },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      // console.log('Response:', response.data);

      if (response.data.status === 'success') {
        Alert.alert('Success', 'Login successful');
        const token = response.data.data.access_token;
        await setAccessToken(token);

        const user = response.data.data.user;

        // Prepare user data to be saved
        const userData = {
          id: user.id,
          acc_type: user.acc_type,
          company_id: user.company_id,
          school_campus_id: user.school_campus_id,
          username: user.username,
          mobile_no: user.mobile_no,
          cnic_no: user.cnic_no,
          name: user.name,
          // email: email, // Use the email from input since it's not in the API response
        };

        // console.log('Saving user data:', userData);

        // Update user context or AsyncStorage
        await updateUser(userData);

        // console.log('User data saved to context:', userData);

        // Navigate based on user role or account type
        if (userData.acc_type === 'parent') {
          navigation.navigate('ParentsStudentSelection');
        } else {
          Alert.alert('Error', 'Invalid user role');
        }
      } else {
        Alert.alert(
          'Verification Failed',
          response.data.message || 'Invalid credentials',
        );
      }
    } catch (error) {
      if (error.response) {
        // API responded with an error
        const status = error.response.status;
        const errorMessage =
          error.response.data?.message || 'Login failed. Please try again.';

        Alert.alert('Login Failed', errorMessage);
        console.error('Login error response:', error.response.data);
      } else if (error.request) {
        // No response received
        Alert.alert(
          'Network Error',
          'No response from server. Please check your internet connection.',
        );
        console.error('No response received:', error.request);
      } else {
        // Something else happened
        Alert.alert('Error', error.message);
        console.error('Unexpected login error:', error.message);
      }
    }
  };

  // const formatCNIC = (text: string) => {
  //   // Remove any non-numeric characters
  //   let cleaned = text.replace(/\D/g, "");

  //   // Apply formatting (#####-#######-#)
  //   let formatted = "";
  //   if (cleaned.length <= 5) {
  //     formatted = cleaned;
  //   } else if (cleaned.length <= 12) {
  //     formatted = `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  //   } else {
  //     formatted = `${cleaned.slice(0, 5)}-${cleaned.slice(5, 12)}-${cleaned.slice(12, 13)}`;
  //   }

  //   setEmail(formatted);
  // };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.topHalf}>
          <View

            style={styles.imageBackground}

          >
            <Image
              source={require('../../assets/Images/TePoutamaaLogo2.png')}
              style={styles.logoContainer}
            />

            <Text style={styles.title}>
              Welcome! Login to Continue Your Journey
            </Text>
          </View>
        </View>
        <View style={styles.bottomHalf}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter Your HNI-ID"
              placeholderTextColor="#B3B3B3"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter Password"
                placeholderTextColor="#B3B3B3"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(prev => !prev)}
              >
                <Icon
                  name={showPassword ? 'eye-slash' : 'eye'}
                  size={24}
                  color="#333333"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => handleLogin()}>
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
          <View style={styles.resetButtonContainer}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => navigation.navigate('ParentsRequestEmail')}>
              <Text style={styles.resetButtonText}>Reset your password</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => navigation.navigate('ParentsRequestStudentEmail')}>
              <Text style={styles.resetButtonText}>
                Reset your children's password
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Your email and password have been provided by your school
            </Text>
            <Text style={styles.infoText}>
              If you have forgotten your password, please contact your school
              administrator for assistance
            </Text>
          </View>
          <Text style={styles.footerText}>Powered By Data N Dashboard.</Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  imageBackground: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: '30@s',
    backgroundColor: '#FAA51A',
    borderBottomRightRadius: '30@s',
    overflow: 'hidden', // Ensures the border radius works correctly with ImageBackground
  },
  imageBackgroundStyle: {
    borderBottomLeftRadius: '30@s',
    borderBottomRightRadius: '30@s',
  },
  topHalf: {
    flex: 0.5,
    backgroundColor: '#F7941E',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: '30@s',
    borderBottomRightRadius: '30@s',
  },
  bottomHalf: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: '25@s',
  },
  logoContainer: {
    width: '220@s',
    height: '120@vs',
    resizeMode: 'contain',
    borderRadius: '20@s',
    marginBottom: '20@vs',
  },
  resetButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: '10@s',

    gap: '34@s',
  },
  resetButton: {
    paddingVertical: '10@vs',
    bottom: '10@vs',
  },
  resetButtonText: {
    fontSize: '11@ms',
    color: '#000', // Blue color for a clickable link-like appearance
    textDecorationLine: 'underline',
  },
  title: {
    fontSize: '15@ms',
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: '30@vs',
  },
  inputContainer: {
    width: '100%',
    marginBottom: '20@vs',
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: '8@s',
    paddingVertical: '10@vs',
    paddingHorizontal: '15@s',
    fontSize: '14@ms',
    fontFamily: 'Poppins-Regular',
    color: '#333333',
    marginBottom: '15@vs',
  },

  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: '8@s',
    paddingHorizontal: '15@s',
    paddingVertical: '10@vs',
  },

  passwordInput: {
    flex: 1,
    fontSize: '14@ms',
    fontFamily: 'Poppins-Regular',
    color: '#333333',
  },

  eyeButton: {
    paddingLeft: '10@s',
  },

  loginButton: {
    backgroundColor: '#FAA51A',
    borderRadius: '8@s',
    paddingVertical: '12@vs',
    width: '100%',
    alignItems: 'center',
    marginBottom: '20@vs',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: '16@ms',
    fontFamily: 'Poppins-Bold',
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: '20@vs',
  },
  infoText: {
    color: '#333333',
    fontSize: '12@s',
    textAlign: 'center',
    marginBottom: '5@vs',
  },
  footerText: {
    color: '#333333',
    fontSize: '10@s',
    textAlign: 'center',
  },
});

export default ParentsLogin;
