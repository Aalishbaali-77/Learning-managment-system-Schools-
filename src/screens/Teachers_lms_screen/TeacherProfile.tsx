import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import {ScaledSheet, moderateScale} from 'react-native-size-matters';
import api from '../../api';
import {useSubjects} from '../../Context/TeacherSubjectContext';
import {UserContext, useUser} from '../../Context/UserContext';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {
  removeAccessToken,
  removeUserData,
  setUserData,
} from '../../utils/storage';

const TeacherProfile = () => {
  const {setSubjects, setSectionId} = useSubjects();
  const {logout} = useUser();
  const navigation = useNavigation();
  const [teacherDetail, setTecherDetail] = useState({});

  const handleLogout = async () => {
    try {
      const response = await api.protected.post('lmslogout');
      if (response.data.status === 'success') {
        // Clear the contexts

        setSubjects([]);
        setSectionId(null);
        logout();

        navigation.navigate('StartScreen');

        // Optionally navigate to the login screen or show a success message
        Alert.alert(
          'Logout Successful',
          'You have been logged out successfully.',
        );
      } else {
        Alert.alert(
          'Logout Failed',
          'An error occurred during logout. Please try again.',
        );
      }
    } catch (error) {
     // console.error('Logout error:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  const TeacherDetail = async () => {
    try {
      const response = await api.protected.get('teacher/detail');
      if (response.data.status === 'success') {
        setTecherDetail(response.data.data);
      } else {
        //console.error('Failed to fetch teacher detail');
      }
    } catch (error) {
      //console.error('TeacherDetail error:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  useEffect(() => {
    TeacherDetail(); // Call the function
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profile Image */}
      <View style={styles.profileImageContainer}>
        <TouchableOpacity>
          <Image
            source={require('../../assets/Images/profile_image.png') // Path to your local image
            }
            style={styles.profileImage}
          />
        </TouchableOpacity>
      </View>

      {/* User Info */}
      <View style={styles.infoCard}>
        <Text style={styles.userName}>{teacherDetail.emp_name || 'N/A'}</Text>

        <Text style={styles.infoLabel}>Name:</Text>
        <Text style={styles.infoText}>{teacherDetail.emp_name || 'N/A'}</Text>

        <Text style={styles.infoLabel}>Joining Date:</Text>
        <Text style={styles.infoText}>
          {teacherDetail.date_of_joining || 'N/A'}
        </Text>

        <Text style={styles.sectionHeader}>Personal Details</Text>

        <Text style={styles.infoLabel}>Phone Number:</Text>
        <Text style={styles.infoText}>{teacherDetail.phone_no || 'N/A'}</Text>

        <Text style={styles.infoLabel}>Residential Address:</Text>
        <Text style={styles.infoText}>{teacherDetail.address || 'N/A'}</Text>

        <Text style={styles.infoLabel}>CNIC:</Text>
        <Text style={styles.infoText}>{teacherDetail.cnic_no || 'N/A'}</Text>

        <Text style={styles.infoLabel}>Date of Birth:</Text>
        <Text style={styles.infoText}>
          {teacherDetail.date_of_birth || 'N/A'}
        </Text>

        <Text style={styles.infoLabel}>Email:</Text>
        <Text style={styles.infoText}>{teacherDetail.emp_email || 'N/A'}</Text>

        {/* Logout Button */}
        {/* <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log out</Text>
        </TouchableOpacity> */}
      </View>
    </ScrollView>
  );
};

const styles = ScaledSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f9f9f9',
    padding: '20@ms',
    alignItems: 'center',
  },
  profileImageContainer: {
    marginBottom: '20@ms',
    alignItems: 'center',
  },
  profileImage: {
    width: '80@ms',
    height: '80@vs',
    borderRadius: '40@ms',
    backgroundColor: '#e0e0e0',
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: '10@ms',
    padding: '20@ms',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userName: {
    fontSize: '16@ms',
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
    marginBottom: '10@ms',
  },
  sectionHeader: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-Bold',
    color: '#000',
    marginVertical: '10@vs',
  },
  infoLabel: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Regular',
    color: '#666666',
  },
  infoText: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Regular',
    marginBottom: '8@ms',
    color: '#333333',
  },
  logoutButton: {
    marginTop: '20@vs',
    backgroundColor: '#f8d047',
    paddingVertical: '10@vs',
    borderRadius: '10@ms',
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-Bold',
    color: '#ffffff',
  },
});

export default TeacherProfile;
