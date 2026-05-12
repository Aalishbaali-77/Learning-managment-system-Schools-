import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import api from '../../api';
import { useUser } from '../../Context/UserContext';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { useSubjects } from '../../Context/TeacherSubjectContext';
import { ScaledSheet, moderateScale } from 'react-native-size-matters';
import CustomModal from '../CustomModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserData } from '../../utils/storage';
import { ASSET_URL } from '../../constants';

const CustomTeacherDrawerContent = props => {
  // Replace with actual student data

  const { user, updateUser } = useUser();
  const { logout } = useUser();
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const student_id = user?.student_id;

  const { setSubjects, setSectionId } = useSubjects();

  const handleLogout = async () => {
    try {
      const response = await api.protected.post('lmslogout');
      if (response?.data?.status === 'success') {
        // Clear the contexts

        setSubjects([]);
        setSectionId(null);
        logout();

        // Set the modal to be visible
        setModalVisible(true);

        // Delay the navigation to allow the modal to show
        navigation.dispatch(
          CommonActions.reset({
            index: 0, // The index of the active route in the new navigation state
            routes: [{ name: 'LoginSelection' }], // Set the new route
          }),
        );
      } else {
        Alert.alert(
          'Logout Failed',
          response?.data?.message ||
          'An error occurred during logout. Please try again.',
        );
      }
    } catch (error) {
      //  console.error('Logout error:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  const handleSwitchCampus = async () => {
    try {
      // console.log('Switching campus...');

      // Ensure user exists before updating
      if (!user) {
        console.warn('No user data available to switch campus.');
        return;
      }

      // Check if user has the required properties before updating
      const updatedUser = {
        ...user,
        school_campus_id: null, // Set only school_campus_id to null, keep the rest intact
      };

      // console.log('Before update, user data:', user);
      // console.log('Updating with:', updatedUser);

      // Update user context and AsyncStorage
      await updateUser(updatedUser);

      // Fetch the updated user data from AsyncStorage to ensure it's saved correctly
      const savedUser = await getUserData();
      // console.log('After update, saved user data:', savedUser);

      // Ensure that user data is available before navigating
      if (savedUser) {
        // If the user data is correctly saved, navigate to CampusSelection
        navigation.navigate('CampusSelection', { user: savedUser });
      } else {
        // console.error('User data is not available after update.');
        Alert.alert('Error', 'Failed to retrieve updated user data.');
      }
    } catch (error) {
      //console.error('Error while switching campus:', error);
      Alert.alert('Error', 'Failed to switch campus. Please try again.');
    }
  };

  // Fetch class teacher details

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('TeacherProfile')}>
          {user?.profile_pic ? (
            <Image
              source={{ uri: `${ASSET_URL}${user.profile_pic}` }}
              style={styles.profileImage}
            />
          ) : (
            <Image
              source={require('../../assets/Images/profile_image.png')}
              style={styles.profileImage}
            />
          )}
        </TouchableOpacity>
        <View style={styles.userInfo}>
          <Text style={styles.name}>{user?.name}</Text>
        </View>

        <CustomModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          title="Logout Successful"
          message="You have been logged out successfully."
        />
      </View>
      {/* Drawer Items */}

      <DrawerItemList {...props} />
      <View style={styles.logoutbutton}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
      {/* <View style={styles.logoutbutton}>
        <TouchableOpacity
          style={styles.CampusSelection}
          onPress={() => handleSwitchCampus()}>
          <Text style={styles.CampusSelectionText}>Switch Campus</Text>
        </TouchableOpacity>
      </View> */}
    </DrawerContentScrollView>
  );
};

const styles = ScaledSheet.create({
  header: {
    alignItems: 'center',
    padding: '20@ms', // Scaled padding
  },
  logoutbutton: {
    alignItems: 'center',
    padding: '30@ms', // Scaled padding
  },
  profileImage: {
    width: '95@ms', // Scaled width
    height: '80@vs', // Scaled height
    borderRadius: '40@ms', // Scaled border radius for circular shape
    marginBottom: '10@vs', // Scaled margin
  },
  userInfo: {
    alignItems: 'center',
  },
  name: {
    fontSize: '18@ms', // Scaled font size
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },
  subtext: {
    fontSize: '14@ms', // Scaled font size
    fontFamily: 'Poppins-Regular',
    color: '#3b3b3b',
  },
  logoutButton: {
    marginTop: '20@vs', // Scaled margin
    backgroundColor: '#FAA51A', // Button background color
    paddingVertical: '10@vs', // Scaled padding
    borderRadius: '10@ms', // Scaled border radius
    alignItems: 'center',
    paddingHorizontal: '62@s',
  },
  CampusSelection: {
    bottom: '30@vs',
    borderWidth: '1@s',
    borderColor: '#FAA51A',
    paddingVertical: '10@vs', // Corrected padding for vertical alignment
    borderRadius: '10@ms', // Scaled border radius
    alignItems: 'center',
    justifyContent: 'center', // Ensures text is centered
    paddingHorizontal: '30@s', // Adjusted padding to fit text in one line
  },
  logoutButtonText: {
    fontSize: '15@ms', // Scaled font size
    fontFamily: 'Poppins-Bold',
    color: '#ffffff', // Text color
  },
  CampusSelectionText: {
    fontSize: '13@ms', // Scaled font size
    fontFamily: 'Poppins-Bold',
    color: '#000', // Text color
  },
});

export default CustomTeacherDrawerContent;
