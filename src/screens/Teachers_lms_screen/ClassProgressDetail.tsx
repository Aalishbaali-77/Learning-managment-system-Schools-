import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../api'; // Replace with your actual API utility import
import {useUser} from '../../Context/UserContext';
import {useNavigation} from '@react-navigation/native';

const ClassProgressDetail = ({route}: any) => {
  const {studentId} = route.params; // Receive studentId from navigation params
  const [studentData, setStudentData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const {user} = useUser();
  const navigation = useNavigation();
   const empId = user?.emp_id;
    const schoolCampusId = user?.school_campus_id;
    const [classDetails, setClassDetails] = useState({
        className: '',
        sectionName: '',
      });

  // Fetch subject-wise student progress
  const fetchSubjectWiseProgress = async () => {
    setLoading(true);
    try {
      const payload = {
        school_id: user?.company_id,
        school_campus_id: user?.school_campus_id,
        student_id: studentId,
      };
      const response = await api.protected.post(
        'teacher/progress/subjectWiseStudentProgress',
        payload,
      );
      if (response.data.status === 'success') {
        setStudentData(response.data.data);
      } else {
       // console.error('Failed to fetch data:', response?.message);
      }
    } catch (error) {
     // console.error('Error fetching subject-wise progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassTeacherDetails = async () => {
        try {
          const response = await api.protected.get(
            `teacher/classTeacher?employee_id=${empId}&school_campus_id=${schoolCampusId}`,
          );
    
          if (response?.data?.status === 'success') {
            
            const data = response.data.data; // This is an object
            
            if (data) {
              setClassDetails({
                className: data.class_name, // Correctly access the fields
                sectionName: data.section_name,
              });
            } else {
              // console.log('No Class Details');
            }
            // console.log(data); // Debugging
          } else {
            Alert.alert(
              'Error',
              'Failed to fetch class details',
            );
          }
        } catch (error) {
          // console.error('Error fetching class details:', error);
        }
      };

  useEffect(() => {
    fetchSubjectWiseProgress();
    fetchClassTeacherDetails();
  }, []);

  const ProgressBar = ({value, color}: {value: number; color: string}) => (
    <View style={styles.progressBarContainer}>
      <View
        style={[
          styles.progressBar,
          {width: `${value}%`, backgroundColor: color},
        ]}
      />
    </View>
  );

  const renderItem = ({item}: {item: any}) => (
    <View style={styles.card}>
      <Text style={styles.subjectTitle}>{item.subject_name}</Text>
      <View style={styles.metricRow}>
        <Text style={styles.metricLabel}>Test</Text>
        <ProgressBar value={item.test_percentage } color="blue" />
        <Text style={styles.metricValue}>{`${item.test_percentage.toFixed(
          2,
        )}%`}</Text>
      </View>
      <View style={styles.metricRow}>
        <Text style={styles.metricLabel}>Exam</Text>
        <ProgressBar
          value={item.exam_percentage || 0}
          color="gold"
        />
        <Text style={styles.metricValue}>{`${item.exam_percentage.toFixed(
          2,
        )}%`}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={moderateScale(24)} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Student Progress</Text>
        <TouchableOpacity>
          <View />
        </TouchableOpacity>
      </View>
      <Text style={styles.subHeader}>
        {`Class ${classDetails?.className}-${classDetails?.sectionName} - ${studentData?.student_name || ''}`}
      </Text>

      <FlatList
        data={studentData?.subjects || []}
        renderItem={renderItem}
        keyExtractor={item => item.subject_id.toString()}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

import { moderateScale, ScaledSheet } from 'react-native-size-matters';

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    paddingHorizontal: '16@s', // Scaled horizontally
    paddingTop: '16@vs', // Scaled vertically
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)', // Optional semi-transparent background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16@vs', // Scaled vertical margin
  },
  headerTitle: {
    fontSize: '18@ms', // Scaled font size
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },
  notificationBadge: {
    position: 'absolute',
    top: '-4@vs', // Scaled vertical offset
    right: '-4@s', // Scaled horizontal offset
    width: '8@ms', // Scaled width
    height: '8@ms', // Scaled height
    backgroundColor: 'red',
    borderRadius: '4@s', // Scaled radius
  },
  subHeader: {
    fontSize: '16@ms', // Scaled font size
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
    marginBottom: '16@vs', // Scaled vertical margin
    color: '#000',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: '8@s', // Scaled radius
    padding: '16@ms', // Scaled padding
    marginBottom: '16@vs', // Scaled vertical margin
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: '4@s', // Scaled shadow radius
    elevation: 2,
  },
  subjectTitle: {
    fontSize: '16@ms', // Scaled font size
    fontFamily: 'Poppins-Medium',
    marginBottom: '8@vs', // Scaled vertical margin
    color: '#000',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '8@vs', // Scaled vertical margin
  },
  metricLabel: {
    flex: 2,
    fontSize: '14@ms', // Scaled font size
    fontFamily: 'Poppins-Regular',
    color: '#000',
  },
  progressBarContainer: {
    flex: 4,
    height: '8@vs', // Scaled vertical height
    backgroundColor: '#E0E0E0',
    borderRadius: '4@s', // Scaled radius
    overflow: 'hidden',
    marginHorizontal: '8@s', // Scaled horizontal margin
  },
  progressBar: {
    height: '100%',
    borderRadius: '4@s', // Scaled radius
  },
  metricValue: {
    flex: 2,
    fontSize: '12@ms', // Scaled font size
    textAlign: 'right',
    fontFamily: 'Poppins-Regular',
    color: '#000',
  },
});



export default ClassProgressDetail;
