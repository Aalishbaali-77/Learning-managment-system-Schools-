import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

const LanguageToggle: React.FC = () => {
  const { i18n } = useTranslation();
  const [isEnabled, setIsEnabled] = useState<boolean>(i18n.language === 'mi');

  useEffect(() => {
    setIsEnabled(i18n.language === 'mi');
  }, [i18n.language]);

  const toggleSwitch = async () => {
    const newLang = isEnabled ? 'en' : 'mi';
    await i18n.changeLanguage(newLang);
    await AsyncStorage.setItem('language', newLang);
    setIsEnabled(!isEnabled);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {isEnabled ? 'Māori' : 'English'}
      </Text>
      <Switch
        trackColor={{ false: '#767577', true: '#4CAF50' }}
        thumbColor={isEnabled ? '#ffffff' : '#f4f3f4'}
        ios_backgroundColor="#3e3e3e"
        onValueChange={toggleSwitch}
        value={isEnabled}
        style={styles.switch}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    
  },
  label: {
    fontSize: moderateScale(16),
    marginRight: scale(10),
    fontWeight: '500',
    color: '#fff',
    fontFamily: 'Poppins-Regular',
    
  },
  switch: {
    transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }],
  },
});

export default LanguageToggle;
