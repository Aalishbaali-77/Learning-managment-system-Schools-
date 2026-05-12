import {useNavigation} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import {ScaledSheet, moderateScale} from 'react-native-size-matters';
import FontAwesome from 'react-native-vector-icons/MaterialIcons';
import api from '../../api';
import {useSubjects} from '../../Context/TeacherSubjectContext';
import {useUser} from '../../Context/UserContext';
import {ClassSubjects} from '../../types';
import {getAccessToken} from '../../utils/storage';

type SubjectsProps = NativeStackScreenProps<any, any>;

const TeachersSubjects: React.FC<SubjectsProps> = props => {
  const navigation = useNavigation();
  const schoolCampusId = props.route.params?.schoolCampusId;
  const sectionId = props.route.params?.sectionId;
  const empId = props.route.params?.empId;
  const classInfo = props.route.params?.classInfo;

  const {user} = useUser();
  const [loading, setLoading] = useState(true);
  const {setSubjects} = useSubjects();
  const [classDetails, setClassDetails] = useState({
    className: '',
    sectionName: '',
  });
  const colors = ['#D32F2F', '#388E3C', '#1976D2', '#F57C00'];

  const [teacherSubjects, setTeacherSubjects] = useState<ClassSubjects[]>([]);
  const [teacherExams, setTeacherExams] = useState([]);

  useEffect(() => {
    const sectionId = props.route.params?.sectionId;

    const fetchData = async () => {
      try {
        setLoading(true);
        const accessToken = await getAccessToken(); // Await the token from AsyncStorage
        if (user && accessToken) {
          // Fetch data only after user and token are available
          await fetchClassSubjects();
          await fetchClassTeacherDetails();
          await fetchExams();
        }
      } catch (error) {
        // console.error('Error fetching access token or data:', error);
      } finally {
        setLoading(false);
        // console.log('Finished fetching data.');
      }
    };
    fetchData();
  }, [user, sectionId]); // Dependency array with 'user'

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

  const fetchClassSubjects = async () => {
    try {
      const response = await api.protected.get(
        `teacher/subjectList?employee_id=${props.route.params?.empId}&school_campus_id=${props.route.params?.schoolCampusId}&section_id=${props.route.params?.sectionId}`,
      );
      if (response?.data?.status === 'success') {
        const data = response.data.data; // Assuming the API returns an array of subjects
        if (data && data.length > 0) {
          setTeacherSubjects(data);
          setSubjects(data); // Save subjects to context
        } else {
          // Alert.alert('Error', 'No subjects found.');
        }
      } else {
        Alert.alert(
          'Error',
          response?.data?.message || 'Failed to fetch subjects',
        );
      }
    } catch (error) {
      //console.error('Error fetching class subjects:', error);
      // console.log(
      //   'Error',
      //   'Unable to fetch class subjects. Please try again later.',
      // );
    }
  };

  const fetchExams = async () => {
    try {
      const payload = {
        section_id: sectionId,
        school_id: user?.company_id,
        school_campus_id: user?.school_campus_id,
        employee_id: user?.emp_id,
      };
      const response = await api.protected.post('teacher/exams', payload);
      if (response?.data?.status === 'success') {
        const data = response.data.data;
        if (data) {
          setTeacherExams(data);
        } else {
          Alert.alert('Error', 'No exams found.');
        }
      } else {
        Alert.alert(
          'Error',
          response?.data?.message || 'Failed to fetch exams',
        );
      }
    } catch (error) {
     // console.error('Error fetching exams:', error);
    } finally {
    }
  };

  const renderExamRow = ({item}) => (
    <View style={styles.row}>
      <Text style={styles.cell}>{item.subject_name}</Text>
      <Text style={styles.cell}>{item.exam_date}</Text>
      <Text style={styles.cell}>{item.start_time}</Text>
      <Text style={styles.cell}>{item.marks}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ScrollView style={{flex: 1}}>
      <View style={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <FontAwesome
              name="arrow-back"
              size={moderateScale(24)}
              color="#333"
            />
          </TouchableOpacity>
          <Text style={styles.title}>My Subjects</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('TeacherAnnouncement')}>
            <FontAwesome
              name="notifications"
              size={moderateScale(24)}
              color="#333"
            />
          </TouchableOpacity>
        </View>

        {/* Teacher Information */}
        <View style={styles.teacherInfo}>
          <View style={styles.profilePlaceholder} />
          <View>
            <Text style={styles.teacherName}>{user?.name}</Text>
            <Text style={styles.teacherRole}>
              You are the Class Teacher of Class {classDetails.className}-
              {classDetails.sectionName}.
            </Text>
          </View>
        </View>

        {/* Class Section */}
        <View style={styles.classSection}>
          <Text style={styles.classTitle}>
            Class {classInfo?.className}-{classInfo?.sectionName}.
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.addTaskButton}
              onPress={() => {
                // console.log(
                //   'Navigating to AddTaskScreen with subjectId:',
                //   teacherSubjects[0]?.subject_id,
                // );
                navigation.navigate('AddTaskScreen', {
                  subjectId: teacherSubjects,
                  sectionId,
                });
              }}>
              <Text style={styles.addTaskText}>Add Task</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addTestButton}
              onPress={() =>
                navigation.navigate('AddTestScreen', {
                  subjectId: teacherSubjects[0]?.subjectId,
                  sectionId,
                })
              }>
              <Text style={styles.addTestText}>Add Test</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Subject Cards */}
        <View style={styles.cardsContainer}>
          {teacherSubjects.map((subject, index) => (
            <TouchableOpacity
              onPress={() => {
                // console.log(
                //   'Navigating to TeachersSubjectDetails with subjectId:',
                //   subject.subject_id,
                // );
                navigation.navigate('TeachersSubjectDetails', {
                  subjectId: subject.subject_id,
                  subjectName: subject.subject_name, // Logging the subjectId before navigating
                });
              }}
              key={subject.subjectId}
              style={[
                styles.card,
                {backgroundColor: colors[index % colors.length]}, // Cycle through colors
              ]}>
              <View style={styles.cardHeader}>
                <FontAwesome
                  name="book"
                  size={moderateScale(30)}
                  color="#FFF"
                />
                <Text style={styles.taskCount}>{subject.taskCount}</Text>
              </View>
              <Text style={styles.subjectTitle}>{subject.subject_name}</Text>
              <Text style={styles.subjectTime}>
                {subject.time_slot.start_time}-{subject.time_slot.end_time}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  // console.log(
                  //   'Navigating to TeachersSubjectDetails with subjectId:',
                  //   subject.subject_id,
                  // );
                  navigation.navigate('TeachersSubjectDetails', {
                    subjectId: subject.subject_id, // Logging the subjectId before navigating
                    subjectName: subject.subject_name,
                    sectionId: sectionId,
                  });
                }}>
                <Text style={styles.viewTaskText}>View Task</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.examcontainer}>
          <View style={styles.examheader}>
            <Text style={styles.examtitle}>Exam Schedule</Text>
            {teacherExams.length > 0 && (
              <TouchableOpacity
                style={styles.addMarksButton}
                onPress={() =>
                  navigation.navigate('CheckExam', {
                    teacherExam: teacherExams, // Pass the teacher exam data here
                  })
                }>
                <Text style={styles.addMarksText}>Add Marks</Text>
              </TouchableOpacity>
            )}
          </View>
          {teacherExams.length === 0 ? (
            // Display this when there are no exams
            <View style={styles.noExamsContainer}>
              <Text style={styles.noExamsText}>
                There are no exams currently scheduled
              </Text>
            </View>
          ) : (
            // Display the header and exam schedule
            <>
              <View style={styles.tableHeader}>
                <Text style={styles.headerCell}>Name</Text>
                <Text style={styles.headerCell}>Date</Text>
                <Text style={styles.headerCell}>Time</Text>
                <Text style={styles.headerCell}>Marks</Text>
              </View>

              {teacherExams.map(item => (
                <View key={item.exam_subject_id.toString()} style={styles.row}>
                  <Text style={styles.cell}>{item.subject_name}</Text>
                  <Text style={styles.cell}>{item.exam_date}</Text>
                  <Text style={styles.cell}>{item.start_time}</Text>
                  <Text style={styles.cell}>{item.marks}</Text>
                </View>
              ))}
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: '15@ms',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)', // Optional semi-transparent background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20@vs',
  },
  title: {
    fontSize: '18@ms',
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  teacherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '20@vs',
  },
  profilePlaceholder: {
    width: '50@ms',
    height: '50@vs',
    borderRadius: '25@ms',
    backgroundColor: '#E0E0E0',
    marginRight: '10@s',
  },
  teacherName: {
    fontSize: '16@ms',

    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  teacherRole: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Regular',
    color: '#3b3b3b',
  },
  classSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15@vs',
  },
  classTitle: {
    fontSize: '16@ms',

    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row', // Align buttons in a row
    gap: moderateScale(10), // Space between buttons
  },
  addTaskButton: {
    backgroundColor: '#FF0000',
    borderRadius: '5@ms',
    paddingVertical: '5@vs',
    paddingHorizontal: '10@s',
  },
  addTestButton: {
    backgroundColor: 'transparent',
    borderColor: '#FF0000',
    borderWidth: '2@ms',
    borderRadius: '5@ms',
    paddingVertical: '5@vs',
    paddingHorizontal: '10@s',
  },
  addTaskText: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Bold',
    color: '#FFF',
  },
  addTestText: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '47%',
    borderRadius: '15@ms',
    padding: '10@ms',
    marginBottom: '15@vs',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10@vs',
  },
  taskCount: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-Bold',
    color: '#FFF',
  },
  subjectTitle: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-Bold',
    color: '#FFF',
    marginBottom: '5@vs',
  },
  subjectTime: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Regular',
    color: '#FFF',
    marginBottom: '10@vs',
  },
  viewTaskText: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Bold',
    color: '#FFF',
    textDecorationLine: 'underline',
  },
  examcontainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: '16@ms',
  },
  noExamsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20@ms',
  },
  noExamsText: {
    fontSize: '16@ms',
    fontFamily: 'Poppins-Regular',
    color: '#000',
    textAlign: 'center',
  },
  examheader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontFamily: 'Poppins-Regular',
    alignItems: 'center',
    marginBottom: '16@vs',
  },
  examtitle: {
    fontSize: '15@ms',
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },
  addMarksButton: {
    backgroundColor: '#000',
    paddingVertical: '8@vs',
    paddingHorizontal: '16@s',
    fontFamily: 'Poppins-Regular',
    borderRadius: '4@ms',
  },
  addMarksText: {
    color: '#fff',
    fontSize: '14@ms',
    fontFamily: 'Poppins-Regular',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    paddingVertical: '8@vs',
    paddingHorizontal: '4@s',
  },
  headerCell: {
    flex: 1,
    fontSize: '14@ms',
    fontFamily: 'Poppins-Regular',
    color: '#000',
    textAlign: 'center',
  },
  tableBody: {
    marginTop: '8@vs',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: '8@vs',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  cell: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: '10@ms',
    color: '#000',
    textAlign: 'center',
  },
});

export default TeachersSubjects;
