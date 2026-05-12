import {useFocusEffect, useNavigation} from '@react-navigation/native';
import React, {useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  BackHandler,
  ImageBackground,
} from 'react-native';
import {Image} from 'react-native-animatable';
import { ToggleButton } from 'react-native-paper';
import {ScaledSheet} from 'react-native-size-matters';
import LanguageToggle from '../i18n/LanguageToggle';
import { useTranslation } from 'react-i18next';

const LoginSelection = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert(
          'Exit App',
          'Are you sure you want to exit?',
          [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Exit', onPress: () => BackHandler.exitApp()},
          ],
          {cancelable: false},
        );
        return true; // Prevent default back action
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation]),
  );

  const handleTeacherStudentLogin = () => {
    navigation.navigate('StartScreen');
  };

  const handleParentLogin = () => {
    navigation.navigate('ParentsLogin');
  };

  return (
    <View style={styles.container}>
      <View style={styles.topHalf}>
        <View style={styles.imageBackground}>
          <LanguageToggle />
          <Image
            source={require('../assets/Images/TePoutamaaLogo2.png')}
            style={styles.logoContainer}
          />
          <Text style={styles.title}>
            {t('welcomeMessage')}
          </Text>
        </View>
      </View>

      <View style={styles.bottomHalf}>
        <TouchableOpacity style={styles.card} onPress={handleTeacherStudentLogin}>
          <Text style={styles.cardText}>{t('loginAsTeacherStudent')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bordercard} onPress={handleParentLogin}>
          <Text style={styles.bordercardText}>{t('loginAsParent')}</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>{t('poweredBy')}</Text>
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
    height: '100%',
    borderBottomLeftRadius: '30@s',
    borderBottomRightRadius: '30@s',
    backgroundColor:'#FAA51A',
    overflow: 'hidden', // Ensures the border radius works correctly with ImageBackground
  },
  imageBackgroundStyle: {
    borderBottomLeftRadius: '30@s',
    borderBottomRightRadius: '30@s',
  },
  topHalf: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: '30@s',
    borderBottomRightRadius: '30@s',
    overflow: 'hidden',
  },
  bottomHalf: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: '20@s',
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
  card: {
    width: '100%',
    backgroundColor: '#FAA51A',
    borderRadius: '8@s',
    paddingVertical: '15@vs',
    alignItems: 'center',
    marginBottom: '20@vs',
  },
  bordercard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: '8@s',
    borderColor: '#FAA51A',
    paddingVertical: '15@vs',
    alignItems: 'center',
    marginBottom: '20@vs',
  },
  cardText: {
    fontSize: '16@ms',
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
  },
  bordercardText: {
    fontSize: '16@ms',
    color: '#000',
    fontFamily: 'Poppins-Bold',
  },
  footerText: {
    color: '#333333',
    fontSize: '10@ms',
    textAlign: 'center',
    marginTop: '20@vs',
  },
});

export default LoginSelection;
