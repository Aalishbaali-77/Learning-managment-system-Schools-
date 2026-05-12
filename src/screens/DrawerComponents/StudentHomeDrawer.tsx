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
import { ASSET_URL } from '../../constants';

const CustomStudentDrawerContent = props => {
  // Replace with actual student data

  const { user } = useUser();
  const { logout } = useUser();
  const navigation = useNavigation();
  const student_id = user?.student_id;
  const [modalVisible, setModalVisible] = useState(false);
  const [studentClassDetails, setStudentClassDetails] = useState({
    class_id: Number,
    className: '',
    sectionName: '',
    student_name: '',
    registration_no: '',
  });

  useEffect(() => {
    fetchStudentDetails();
  }, []);

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
        navigation.dispatch(CommonActions.reset({
          index: 0, // The index of the active route in the new navigation state
          routes: [{ name: 'LoginSelection' }], // Set the new route
        }),);
      } else {
        Alert.alert(
          'Logout Failed',
          response?.data?.message ||
          'An error occurred during logout. Please try again.',
        );
      }
    } catch (error) {
      // console.error('Logout error:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  // Fetch class teacher details
  const fetchStudentDetails = async () => {
    try {
      const response = await api.protected.post('student/detail', { student_id });
      if (response?.data?.status === 'success') {
        const data = response.data.data; // This is an object
        if (data) {
          // Update state with class and section names
          setStudentClassDetails({
            class_id: data.class_id,
            className: data.class_name, // Access properties directly
            sectionName: data.section_name,
            student_name: data.student_name,
            registration_no: data.registration_no,
          });
        } else {
          Alert.alert('Error', 'No class details found.');
        }
        // console.log(data); // Debugging
      } else {
        Alert.alert(
          'Error',
          response?.data?.message || 'Failed to fetch class details',
        );
      }
    } catch (error) {
      // console.error('Error fetching class details:', error);
    }
  };


  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('StudentProfile')}>
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
          <Text style={styles.name}>{studentClassDetails.student_name}</Text>
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
    borderRadius: '50@ms', // Scaled border radius for circular shape
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
    paddingHorizontal: '70@s',
  },
  logoutButtonText: {
    fontSize: '13@ms', // Scaled font size
    fontFamily: 'Poppins-Bold',
    color: '#ffffff', // Text color
  },
});


export default CustomStudentDrawerContent;
