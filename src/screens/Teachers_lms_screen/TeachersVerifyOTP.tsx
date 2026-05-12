import {API_URL} from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import React, {useCallback, useState} from 'react';
import {
  Alert,
  BackHandler,
  ImageBackground,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {Image} from 'react-native-animatable';
import {ScaledSheet} from 'react-native-size-matters';
import {useUser} from '../../Context/UserContext';
import api from '../../api';
import {setAccessToken} from '../../utils/storage';
import Icon from 'react-native-vector-icons/FontAwesome';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

type EmailProps = NativeStackScreenProps<any, any>;

const TeachersVerifyOTP: React.FC<EmailProps> = props => {
  const navigation = useNavigation();
  const [token, setToken] = useState('');
  const email = props.route.params?.email;

  const type = props.route.params?.type;

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

  const handleVerifyOTP = async () => {
    try {
      // console.log('API_URL:', API_URL);

      const response = await api.public.post('verifyotp', {token, email});

      // console.log('Response:', response.data);

      if (response.data.status === 'success') {
        Alert.alert('Success, You can reset your password now');
        navigation.navigate('TeachersResetPassword', {email, type});
      } else if (response.data.status === 'warning') {
        Alert.alert('Error', response.data.message);
      }
    } catch (error) {
      // console.log('OTP sent to API:', email);
      // console.log('Type:', type);
      // console.log('Error:', error);

      Alert.alert('Error', 'An error occured');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topHalf}>
        <View
          
          style={styles.imageBackground}
          
        >
          <Image
            source={require('../../assets/Images/GleeGatherlogo.png')}
            style={styles.logoContainer}
          />
        </View>
      </View>
      <View style={styles.bottomHalf}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter OTP"
            placeholderTextColor="#B3B3B3"
            value={token} // Bind email state
            onChangeText={setToken} // Update email state
            keyboardType="email-address" // Optional: Email-specific keyboard
            autoCapitalize="none" // Prevent auto-capitalization for email
            autoCorrect={false} // Disable autocorrect for email
          />

          {/* <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter children's reg no         "
                            placeholderTextColor="#B3B3B3"
                           
                            value={regNo} // Bind password state
                            onChangeText={setRegNo} // Update password state
                        />
                        
                    </View> */}
        </View>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => handleVerifyOTP()}>
          <Text style={styles.loginButtonText}>Verify OTP</Text>
        </TouchableOpacity>
        <View style={styles.infoContainer}>
          {/* <Text style={styles.infoText}>
            Your email and password have been provided by your school
          </Text>
          <Text style={styles.infoText}>
            If you have forgotten your password, please contact your school
            administrator for assistance
          </Text> */}
        </View>
        <Text style={styles.footerText}>Powered By Data N Dashboard.</Text>
      </View>
    </View>
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
    backgroundColor:'#FAA51A',
    height: '100%',
    borderBottomLeftRadius: '30@s',
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
    borderRadius: '60@s',
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
  },
  eyeButton: {
    position: 'absolute',
    right: '10@s',
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

export default TeachersVerifyOTP;
