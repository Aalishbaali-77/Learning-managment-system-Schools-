import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import api from '../../api';
import { useUser } from '../../Context/UserContext';
import { useSubjects } from '../../Context/TeacherSubjectContext';

const ParentsProfile = () => {
const {logout} = useUser();
  const navigation = useNavigation();
  const {setSubjects, setSectionId} = useSubjects();
  const [student, setStudent] = useState({});
  const {user} = useUser();
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true); // Set loading to true before starting fetch
        await fetchStudentDetail(); // Await the async operation
      } catch (error) {
      //  console.error('Error fetching student details:', error);
      } finally {
        setLoading(false); // Set loading to false after fetch completes
      }
    };
  
    fetchData(); // Call the async function
  }, []); // Empty dependency array ensures it runs only once
  

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
    //  console.error('Logout error:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  const fetchStudentDetail = async () => {
    try {
      const payload = {
        userType: 2,
        student_id: user?.student_id,
      };

      // Log the payload and API URL
      // console.log('Fetching student details...');
      // console.log('Payload:', JSON.stringify(payload));
      // console.log(
      //   'API URL:',
      //   api.protected.defaults.baseURL + 'student/detail',
      // );

      const response = await api.protected.post('student/detail', payload);

      // Log the response
      // console.log('API Response:', response);

      if (response.data.status === 'success') {
        // console.log('Student data retrieved successfully:', response.data.data);
        setStudent(response.data.data);
      } else {
        // console.warn(
        //   'Studentdetail failed with message:',
        //   response.data.message,
        // );
        Alert.alert(
          'Studentdetail Failed',
          'An error occurred during studentDetail. Please try again.',
        );
      }
    } catch (error) {
      // Log different error cases
      if (error.response) {
        // console.error('Response Error:', error.response.data);
        // console.error('Status Code:', error.response.status);
        // console.error('Headers:', error.response.headers);
      } else if (error.request) {
       // console.error('Request Error:', error.request);
      } else {
        //console.error('General Error:', error.message);
      }

      // Alert the user
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }


  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profile Image */}
      <View style={styles.profileImageContainer}>
        <TouchableOpacity>
          <Image
            source={require('../../assets/Images/profile_image.png')}
            style={styles.profileImage}
          />
        </TouchableOpacity>
      </View>

      {/* User Info */}
      <View style={styles.infoCard}>
        <Text style={styles.userName}>{student.student_name}</Text>

        <Text style={styles.infoLabel}>Registration Number:</Text>
        <Text style={styles.infoText}>{student.registration_no}</Text>

        <Text style={styles.infoLabel}>Date of Admission:</Text>
        <Text style={styles.infoText}>{student.date_of_admission}</Text>

        <Text style={styles.infoLabel}>Date of Birth:</Text>
        <Text style={styles.infoText}>{student.date_of_birth}</Text>

        <Text style={styles.infoLabel}>Previous School:</Text>
        <Text style={styles.infoText}>{student.previous_school}</Text>

        <Text style={styles.infoLabel}>Grade/Class Applied For:</Text>
        <Text style={styles.infoText}>{student.grade_class_applied_for}</Text>

        <Text style={styles.infoLabel}>Reference:</Text>
        <Text style={styles.infoText}>{student.reference}</Text>

        <Text style={styles.infoLabel}>Created By:</Text>
        <Text style={styles.infoText}>{student.created_by}</Text>

        <Text style={styles.infoLabel}>Created Date:</Text>
        <Text style={styles.infoText}>{student.created_date}</Text>

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
    padding: '20@ms', // Correct for general padding
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)', // No scaling for colors
  },
  profileImageContainer: {
    marginBottom: '20@ms', // General spacing, @ms
    alignItems: 'center',
  },
  profileImage: {
    width: '80@ms', // Correct for scaling width
    height: '80@vs', // Correct for scaling height
    borderRadius: '40@ms', // Half of width/height for circle
    backgroundColor: '#e0e0e0', // No scaling needed for colors
  },
  infoCard: {
    width: '100%', // No scaling needed for percentage
    backgroundColor: '#ffffff',
    borderRadius: '10@ms', // Rounded corners with scaling
    padding: '20@ms', // General padding, scaled
    shadowColor: '#000', // No scaling needed
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userName: {
    fontSize: '16@ms', // Correct for text scaling
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
    marginBottom: '10@ms',
  },
  sectionHeader: {
    fontSize: '14@ms', // Correct for text scaling
    fontFamily: 'Poppins-Bold',
    color: '#000',
    marginVertical: '10@vs', // Changed to @vs for vertical margin
  },
  infoLabel: {
    fontSize: '12@ms', // Correct for text scaling
    fontFamily: 'Poppins-Regular',
    color: '#666666',
  },
  infoText: {
    fontSize: '12@ms', // Correct for text scaling
    fontFamily: 'Poppins-Regular',
    marginBottom: '8@ms', // General spacing, scaled
    color: '#333333',
  },
  logoutButton: {
    marginTop: '20@ms', // General spacing, scaled
    backgroundColor: '#f8d047',
    paddingVertical: '10@vs', // Changed to @vs for vertical padding
    borderRadius: '10@ms', // Rounded corners with scaling
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: '14@ms', // Correct for text scaling
    fontFamily: 'Poppins-Bold',
    color: '#ffffff',
  },
});



export default ParentsProfile;
