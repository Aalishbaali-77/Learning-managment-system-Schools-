import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from 'react-native';
import {ScaledSheet, moderateScale} from 'react-native-size-matters';
import {useUser} from '../../Context/UserContext';
import api from '../../api';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {StudentTest} from '../../types';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';
import {ScrollView} from 'react-native-gesture-handler';
import RenderItem from './RenderItemForTest';

type TestIdProps = NativeStackScreenProps<any, any>;
const TeacherCheckTest: React.FC<TestIdProps> = props => {
  const [testData, setTestData] = useState([]);
  const {user} = useUser();
  const testId = props.route.params?.testId;
  const subjectName = props.route.params?.subjectName;
  // console.log('TESTID:', testId);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownValues, setDropdownValues] = useState({});
  const [selectedDates, setSelectedDates] = useState({});
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentStudentId, setCurrentStudentId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [studentsData, setStudentsData] = useState<StudentTest[]>([]);
  const navigation = useNavigation();
  const [temporaryMarks, setTemporaryMarks] = useState<{[id: string]: string}>(
    {},
  );
  const [marks, setMarks] = useState<{[id: string]: string}>({});

  const [stats, setStats] = useState({
    totalStudents: 0,
    submittedCount: 0,
    absentCount: 0,
  });
  const tests = props.route.params?.tests;
  const currentTest = tests?.find(test => test.id === testId);

  const handleMarksChange = useCallback((id, value) => {
    setTemporaryMarks(prev => ({...prev, [id]: value}));
  }, []);

  const fetchStudentList = async () => {
    if (!testId) {
      Alert.alert('Error', 'Test ID is missing!');
      return;
    }

    setLoading(true);
    try {
      const response = await api.protected.post(
        'teacher/assign-tests/studentList',
        {
          test_id: testId,
        },
      );

      if (response?.data?.success) {
        const studentList = response.data.data.map(student => ({
          id: student.id,
          student_id: student.student_id,
          name: student.student_name,
          rollNo: student.registration_no,
          marks: student.is_absent
            ? 'Absent'
            : student.no_of_marks_recieved || '',
          assign_test_status: student.assign_test_status,
          is_absent: student.is_absent,
        }));

        setStudentsData(studentList); // Update state with processed data
        setTestData(studentList); // Initialize testData to match studentsData

        // Calculate statistics
        const totalStudents = response.data.status_counts.total_count;
        const submittedCount = response.data.status_counts.submitted_count;
        const absentCount = response.data.status_counts.absent_count;

        setStats({
          totalStudents,
          submittedCount,
          absentCount,
        });
      } else {
       // console.error('API Response Error:', response?.data);
        Alert.alert(
          'Error',
          response?.data?.message || 'Failed to fetch student list.',
        );
      }
    } catch (error) {
      //console.error('Error fetching student list:', error);
      Alert.alert(
        'Error',
        'Unable to fetch student list. Please try again later.',
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch student list on component mount
  useEffect(() => {
    fetchStudentList();
  }, [testId]);

  const postStudentTest = async () => {
    const assign_test_id = props.route.params?.testId;
    const payload = {
      school_id: user?.company_id,
      school_campus_id: user?.school_campus_id,

      testArray: studentsData
        .map(student => {
          const updatedMarks = temporaryMarks[student.id]; // Marks entered by the user
          const originalMarks = student.marks; // Existing marks

          // Check if marks have been updated
          if (
            updatedMarks !== undefined && // Ensure marks were provided
            updatedMarks !== originalMarks // Ensure they differ from original marks
          ) {
            // console.log(
            //   `Updating marks for student ${student.id}, new marks: ${updatedMarks}`,
            // );

            const marksNumber =
              updatedMarks === 'Absent'
                ? null
                : parseFloat(updatedMarks.toString());

            return {
              assign_test_id: assign_test_id,
              student_id: student.student_id,
              assign_test_status: 2, // Set status to 2 only for updated students
              no_of_marks_recieved: marksNumber,
            };
          } else {
            // console.log(`Skipping student ${student.id}, no updated marks.`);
          }

          return null;
        })
        .filter(Boolean),
    };

    // console.log('Payload being sent:', JSON.stringify(payload, null, 2));

    if (payload.testArray.length === 0) {
      Alert.alert('Error', 'No valid marks to update.');
      // console.log('No valid marks to update. Exiting function.');
      return;
    }

    setLoading(true);
    try {
      // console.log('Sending request to API...');
      const response = await api.protected.post(
        'teacher/assign-tests/update-multiple-student-test-status',
        payload,
      );

      // console.log('API response received:', response);

      if (response?.data?.success) {
        Alert.alert(
          'Success',
          'Test statuses updated successfully!',
        );
        // console.log('Task statuses updated successfully!');
        saveUpdatedMarks(payload.testArray);
        navigation.goBack();
      } else {
        // console.error('API Error:', response?.data);
        Alert.alert(
          'Error',
          response?.data?.message || 'Failed to update task statuses.',
        );
        // console.error('Failed to update task statuses:', response?.data);
      }
    } catch (error) {
      // console.error('Error:', error);
      if (error.response) {
        // console.error('API response error:', error.response.data); // Log detailed error from the API
      }
      Alert.alert(
        'Error',
        'Unable to update task statuses. Please try again later.',
      );
      // console.error('Error while sending request:', error);
    } finally {
      setLoading(false);
      // console.log('Loading state reset');
    }
  };

  const saveUpdatedMarks = updatedStudents => {
    // Ensure that marks are parsed as floats before saving
    const updatedStudentsWithFloatMarks = updatedStudents.map(student => ({
      ...student,
      no_of_marks_recieved: student.no_of_marks_recieved
        ? parseFloat(student.no_of_marks_recieved) // Parse marks as a float
        : null, // Handle null or empty values
    }));

    // Store the updated marks in AsyncStorage
    AsyncStorage.setItem(
      'updatedMarks',
      JSON.stringify(updatedStudentsWithFloatMarks),
    )
      .then(() => {
        // console.log('Updated marks saved.');
      })
      .catch(error => {
        // console.error('Error saving updated marks:', error);
      });
  };

  useEffect(() => {
    const loadSavedMarks = async () => {
      try {
        const savedMarks = await AsyncStorage.getItem('updatedMarks');
        if (savedMarks) {
          const savedMarksData = JSON.parse(savedMarks);

          // Update the studentsData with the saved marks, ensuring marks are floats
          const updatedStudents = studentsData.map(student => {
            const updatedStudent = savedMarksData.find(
              item => item.student_id === student.student_id,
            );
            if (updatedStudent) {
              return {
                ...student,
                marks:
                  updatedStudent.no_of_marks_recieved !== null
                    ? parseFloat(updatedStudent.no_of_marks_recieved) // Ensure marks are parsed as a float
                    : '', // If marks are null, set as empty string
              };
            }
            return student;
          });
          setStudentsData(updatedStudents);
        }
      } catch (error) {
      //  console.error('Error loading saved marks:', error);
      }
    };

    loadSavedMarks();
  }, []); // Runs only once when the component mounts

  const filteredData = React.useMemo(
    () =>
      testData.filter(
        item =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.rollNo.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [testData, searchQuery],
  );

  const memoizedFilteredData = useMemo(() => filteredData, [filteredData]);

  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{flex: 1}}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={{flex: 1, backgroundColor: '#FFFFFF'}} // Ensure ScrollView has a white background
            contentContainerStyle={{flexGrow: 1}}
            keyboardShouldPersistTaps="handled">
            <View style={styles.container}>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <Icon name="arrow-back" size={moderateScale(24)} color="#000" />
                </TouchableOpacity>
                <Text style={styles.title}>Check Test</Text>
                <TouchableOpacity>
                  <View />
                </TouchableOpacity>
              </View>

              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search Task"
                  placeholderTextColor="#999"
                  value={searchQuery}
                  onChangeText={setSearchQuery} // Update search query
                />
                <TouchableOpacity>
                  <Text style={styles.searchIcon}>🔍</Text>
                </TouchableOpacity>
              </View>

              {/* Test Marks Section */}
              <View style={styles.testMarksContainer}>
                <Text style={styles.testMarksTitle}>
                  Test Marks: {parseFloat(currentTest?.no_of_marks) || 'N/A'}
                </Text>

                <Text style={styles.testStats}>
                  Total Students: {stats.totalStudents} | Tests Submitted:{' '}
                  {stats.submittedCount} | Absent: {stats.absentCount}
                </Text>
              </View>

              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderText}>Test Name</Text>
                <Text style={styles.tableHeaderText}>Roll No</Text>
                <Text style={styles.tableHeaderText}>Marks</Text>
              </View>

              {/* Test Data */}
              
              {memoizedFilteredData.map(item => (
                <RenderItem
                  key={item.id}
                  item={item}
                  temporaryMarks={temporaryMarks}
                  handleMarksChange={handleMarksChange}
                  currentTest={currentTest}
                  styles={styles}
                />
              ))}
              {/* Save Button */}
              <TouchableOpacity
                style={styles.saveButton}
                onPress={postStudentTest} // Trigger the API call
                disabled={loading} // Disable button during loading
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: '16@ms',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16@vs',
  },
  backButton: {
    fontSize: '18@ms',
    color: '#000',
    fontFamily: 'Poppins-Regular',
  },
  title: {
    fontSize: '20@ms',
    color: '#000',
    fontFamily: 'Poppins-Bold',
  },
  notificationBell: {
    width: '24@ms',
    height: '24@ms',
    borderRadius: '12@ms',
    backgroundColor: '#000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    borderRadius: '8@ms',
    paddingHorizontal: '8@ms',
    marginBottom: '16@vs',
  },
  searchInput: {
    flex: 1,
    fontSize: '14@ms',
    color: '#000',
    fontFamily: 'Poppins-Regular',
  },
  searchIcon: {
    fontSize: '16@ms',
    color: '#999',
  },
  testMarksContainer: {
    alignItems: 'center',
    marginBottom: '16@vs',
  },
  testMarksTitle: {
    fontSize: '16@ms',
    color: '#000',
    fontFamily: 'Poppins-SemiBold',
    marginBottom: '4@vs',
  },
  testStats: {
    fontSize: '11@ms',
    color: '#3b3b3b',
    fontFamily: 'Poppins-Regular',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',

    paddingVertical: '10@vs',
    paddingHorizontal: '8@ms',
  },
  tableHeaderText: {
    fontSize: '13@ms',
    color: '#000',
    fontFamily: 'Poppins-SemiBold',
    flex: 1,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: '12@vs',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tableCell: {
    fontSize: '12@ms',
    color: '#000',
    fontFamily: 'Poppins-Regular',
    flex: 1,
    textAlign: 'center',
  },
  nameCell: {
    // textAlign: 'left',
  },
  absentText: {
    color: '#FF0000',
    fontFamily: 'Poppins-Bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: '4@ms',
    paddingHorizontal: '4@ms',
    paddingVertical: '2@vs',
    textAlign: 'center',
    color: '#000',
    fontFamily: 'Poppins-Regular',
  },
  saveButton: {
    backgroundColor: '#f00',
    paddingVertical: '12@vs',
    borderRadius: '8@s',
    alignItems: 'center',
    marginTop: '16@vs',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: '16@ms',
    fontFamily: 'Poppins-Bold',
  },
});

export default TeacherCheckTest;
