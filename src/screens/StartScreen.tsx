import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  BackHandler,
  ImageBackground,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Image } from 'react-native-animatable';
import { ScaledSheet } from 'react-native-size-matters';
import api from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAccessToken, setUserData } from '../utils/storage';
import { useUser } from '../Context/UserContext';
import { API_URL } from '@env';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';

const StartScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { user, updateUser } = useUser();
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useTranslation();

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

    try {
      // console.log(API_URL);

      // Retrieve FCM token from AsyncStorage
      const fcmToken = await AsyncStorage.getItem('fcmToken');

      const payload = {
        email,
        password,
        device_token: fcmToken || '', // Send empty string if no token is found
      };
      const response = await api.public.post('lmslogin', payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // console.log('Response:', response.data);

      if (response.data.status === 'success') {
        Alert.alert('Success', 'Login successful');
        const token = response?.data?.data?.access_token;
        await setAccessToken(token);

        const user = response.data.data.user;
        // console.log('Saving user data to AsyncStorage:', user);

        // Dynamically set user data

        // Navigate based on the role
        if (user.acc_type === 'superadmin') {
          // Parse school_campus_ids_array
          const campusIds = JSON.parse(user.school_campus_ids_array);
          // console.log('acdjshdbchsdcbhsdjc', campusIds.length);

          if (campusIds.length > 1) {
            navigation.navigate('CampusSelection', {
              user: user,
            });
          } else {
            // Save user with campus ID in context and redirect to teacher's home
            const userData = {
              id: user.id,
              emp_type_multiple_campus: user.emp_type_multiple_campus,
              emp_id: user.emp_id == 0 ? null : user.emp_id,
              student_id: user.student_id === 0 ? null : user.student_id,
              emp_ids_array: user.emp_ids_array,
              acc_type: user.acc_type,
              company_id: user.company_id,
              school_campus_id: user.school_campus_id,
              school_campus_ids_array: user.school_campus_ids_array,
              username: user.username,
              mobile_no: user.mobile_no,
              cnic_no: user.cnic_no,
              sgpe: user.sgpe,
              name: user.name,
              email: user.email,
              profile_pic: user.profile_pic,
            };

            await updateUser(userData);
            // console.log('logincontext', userData);
            navigation.navigate('TeachersHome', {
              empId: user.emp_id,
              companyId: user.company_id,
              schoolCampusId: user.school_campus_id,
            });
          }
        } else if (user.acc_type === 'user') {
          const userData = {
            id: user.id,
            emp_type_multiple_campus: user.emp_type_multiple_campus,
            emp_id: user.emp_id == 0 ? null : user.emp_id,
            student_id: user.student_id === 0 ? null : user.student_id,
            emp_ids_array: user.emp_ids_array,
            acc_type: user.acc_type,
            company_id: user.company_id,
            school_campus_id: user.school_campus_id,
            school_campus_ids_array: user.school_campus_ids_array,
            username: user.username,
            mobile_no: user.mobile_no,
            cnic_no: user.cnic_no,
            sgpe: user.sgpe,
            name: user.name,
            email: user.email,
            profile_pic: user.profile_pic,
          };

          await updateUser(userData);
          // console.log('logincontext', userData);
          navigation.navigate('Home', {
            empId: user.emp_id,
            companyId: user.company_id,
            schoolCampusId: user.school_campus_id,
          });
        } else {
          Alert.alert('Error', 'Invalid user role');
        }
      } else {
        Alert.alert(
          'Verification failed',
          response.data.message || 'Invalid credentials',
        );
      }
    } catch (error) {
      if (error.response) {
        // API responded with an error (e.g. 401 Unauthorized)
        const status = error.response.status;
        const errorMessage =
          error.response.data?.message || 'Something went wrong. Please try again.';

        Alert.alert('Login Failed', errorMessage);
      } else if (error.request) {
        // Request was made but no response received
        Alert.alert('Network Error', 'No response from server. Please check your internet connection.');
        console.error('No response received:', error.request);
      } else {
        // Something else happened while setting up the request
        Alert.alert('Error', error.message);
        console.error('Login Error:', error.message);
      }
    }

  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <View style={styles.container}>
      <View style={styles.topHalf}>
        <View style={styles.imageBackground}>
          <Image
            source={require('../assets/Images/TePoutamaaLogo2.png')}
            style={styles.logoContainer}
          />
          <Text style={styles.title}>
            {t('welcome_login_message')}
          </Text>
        </View>
      </View>

      <View style={styles.bottomHalf}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={t('enter_email')}
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
              placeholder={t('enter_password')}
              placeholderTextColor="#B3B3B3"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(prev => !prev)}>
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
          <Text style={styles.loginButtonText}>{t('login')}</Text>
        </TouchableOpacity>

        <View style={styles.resetButtonContainer}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => navigation.navigate('TeachersRequestEmail')}>
            <Text style={styles.resetButtonText}>{t('reset_password')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>{t('email_password_info_1')}</Text>
          <Text style={styles.infoText}>{t('email_password_info_2')}</Text>
        </View>

        <Text style={styles.footerText}>{t('poweredBy')}</Text>
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
    borderBottomRightRadius: '30@s',
    backgroundColor: '#FAA51A',
    overflow: 'hidden', // Ensures the border radius works correctly with ImageBackground
  },
  imageBackgroundStyle: {
    borderBottomLeftRadius: '30@s',
    borderBottomRightRadius: '30@s',
  },
  topHalf: {
    flex: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: '30@s',
    borderBottomRightRadius: '30@s',
  },
  bottomHalf: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: '25@vs',
  },
  logoContainer: {
    width: '220@ms',
    height: '120@vs',
    resizeMode: 'contain',
    borderRadius: '20@s',
    marginBottom: '20@vs',
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
    marginTop: '35@vs',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: '8@s',
    paddingVertical: '10@vs',
    paddingHorizontal: '15@ms',
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
    paddingHorizontal: '10@ms',
  },
  passwordInput: {
    flex: 1,
    paddingVertical: '10@vs',
    paddingRight: '40@s', // Give space for the eye icon
    fontSize: '14@ms',
    fontFamily: 'Poppins-Regular',
    color: '#333333',
  },
  eyeButton: {
    position: 'absolute',
    right: '10@s',
    padding: '8@ms',
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

export default StartScreen;
