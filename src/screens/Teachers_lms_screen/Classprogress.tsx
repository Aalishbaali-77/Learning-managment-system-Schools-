import {useNavigation} from '@react-navigation/native';
import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../api'; // Replace with your actual API utility import
import {useUser} from '../../Context/UserContext';
import {useSubjects} from '../../Context/TeacherSubjectContext';

import {moderateScale, ScaledSheet} from 'react-native-size-matters';

const Classprogress = ({route}) => {
  const navigation = useNavigation();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const {user} = useUser();
  const {sectionId} = useSubjects();
  const empId = user?.emp_id;
  const schoolCampusId = user?.school_campus_id;
  const [classDetails, setClassDetails] = useState({
    className: '',
    sectionName: '',
  });

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
          response?.data?.message || 'Failed to fetch class details',
        );
      }
    } catch (error) {
    //  console.error('Error fetching class details:', error);
    }
  };

  // Fetch student progress data from API
  const fetchStudentProgress = async () => {
    setLoading(true);
    try {
      const payload = {
        section_id: sectionId,
        school_id: user?.company_id,
        school_campus_id: user?.school_campus_id,
      };
      const response = await api.protected.post(
        'teacher/progress/studentProgress',
        payload,
      );
      if (response.data.status === 'success') {
        const formattedData = response.data.data.students.map((item: any) => ({
          id: item.student_id.toString(),
          name: item.student_name,
          attendance: `${item.attendance_percentage.toFixed(2)}%`,
          test: `${item.test_percentage.toFixed(2)}%`,
          exam: `${item.exam_percentage.toFixed(2)}%`,
        }));
        setData(formattedData);
      } else {
       // console.error('Failed to fetch data:', response?.message);
      }
    } catch (error) {
    //  console.error('Error fetching student progress:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentProgress();
    fetchClassTeacherDetails();
  }, []);

  const renderItem = ({item}: {item: any}) => (
    <View style={styles.row}>
      <Text style={styles.cell}>{item.name}</Text>
      <Text style={styles.cell}>{item.attendance}</Text>
      <Text style={styles.cell}>{item.test}</Text>
      <Text style={styles.cell}>{item.exam}</Text>
      <TouchableOpacity
        style={styles.detailButton}
        onPress={() =>
          navigation.navigate('ClassProgressDetail', {
            studentId: item.id,
          })
        }>
        <Icon name="chevron-right" size={moderateScale(20)} color="#000" />
      </TouchableOpacity>
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
        Class {classDetails?.className}-{classDetails?.sectionName}
      </Text>
      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderText}>Name</Text>
        <Text style={styles.tableHeaderText}>Attendance</Text>
        <Text style={styles.tableHeaderText}>Test</Text>
        <Text style={styles.tableHeaderText}>Exam</Text>
        <Text style={styles.tableHeaderText}>Detail</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

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
    marginBottom: '16@vs', // Vertical margin
  },
  headerTitle: {
    fontSize: '18@ms', // Use @ms for font scaling
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },
  notificationBadge: {
    position: 'absolute',
    top: '-4@vs', // Scaled vertically
    right: '-4@s', // Scaled horizontally
    width: '8@ms', // Scaled width
    height: '8@s', // Scaled height
    backgroundColor: 'red',
    borderRadius: '4@s', // Scaled radius
  },
  subHeader: {
    fontSize: '16@ms', // Use @ms for font scaling
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
    marginBottom: '16@vs', // Vertical margin
    color: '#000',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#EFEFEF',
    paddingVertical: '8@vs', // Vertical padding
    borderRadius: '8@s', // Scaled radius
    marginBottom: '8@vs', // Vertical margin
    paddingHorizontal: '5@s', // Scaled horizontal padding
  },
  tableHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
    fontSize: '10@ms', // Use @ms for font scaling
    color: '#000',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    paddingVertical: '12@vs', // Vertical padding
    paddingHorizontal: '8@s', // Horizontal padding
    borderBottomWidth: '1@s', // Use scale() for fixed values like border width
    borderBottomColor: '#EFEFEF',
    borderRadius: '8@s', // Scaled radius
  },
  cell: {
    flex: 1,
    textAlign: 'center',
    fontSize: '10@ms', // Use @ms for font scaling
    fontFamily: 'Poppins-Regular',
    color: '#000',
  },
  detailButton: {
    flex: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Classprogress;
