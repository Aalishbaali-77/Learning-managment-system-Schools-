import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {AnimatedCircularProgress} from 'react-native-circular-progress';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';
import {useUser} from '../../Context/UserContext';
import api from '../../api';
import {useSubjects} from '../../Context/TeacherSubjectContext';
import {getAccessToken} from '../../utils/storage';
import {Dropdown} from 'react-native-element-dropdown';
import Svg, {Circle} from 'react-native-svg';

const SubjectProgress = ({route}) => {
  const [data, setData] = useState([]);
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const {user} = useUser();
  const {sectionId} = useSubjects();
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [classList, setClassList] = useState<[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState([]); // State for subjects
  const [selectedSubject, setSelectedSubject] = useState(null); // State for selected subject

  // Dropdown data
  const classOptions = [
    {label: 'Class 10', value: '10'},
    {label: 'Class 9', value: '9'},
    {label: 'Class 8', value: '8'},
  ];

  const sectionOptions = [
    {label: 'Section A', value: 'A'},
    {label: 'Section B', value: 'B'},
    {label: 'Section C', value: 'C'},
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const accessToken = await getAccessToken(); // Await the token from AsyncStorage
        if (user && accessToken) {
          // Fetch data only after user and token are available
          await fetchClassesList(); // Fetch class list first
          if (selectedClass) {
            await fetchClassSubjects(); // Fetch subjects if a class is selected
          }
          if (selectedClass && selectedSubject) {
            await fetchStudentSubjectPerformance(); // Fetch performance data if both class and subject are selected
          }
        }
      } catch (error) {
      //  console.error('Error fetching access token or data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedClass, selectedSubject]); // Add selectedClass and selectedSubject as dependencies

  useEffect(() => {
    if (selectedClass) {
      fetchClassSubjects(); // Fetch subjects when selectedClass changes
    }
  }, [selectedClass]);

  const fetchStudentSubjectPerformance = async () => {
    try {
      // Ensure that both selectedClass and selectedSubject are available
      if (!selectedClass || !selectedSubject) {
        Alert.alert('Error', 'Please select both a class and a subject.');
        return;
      }

      const payload = {
        school_id: user?.company_id,
        school_campus_id: user?.school_campus_id,
        section_id: selectedClass, // Use the selected class (section_id)
        subject_id: selectedSubject, // Use the selected subject (subject_id)
      };
     // console.log('Payload for subject progress:', payload);

      const response = await api.protected.post(
        'teacher/progress/section-subject-performance',
        payload,
      );

      if (response.data.status === 'success') {
        const formattedData = {
          subjectId: response.data.data.subject_id,
          subjectName: response.data.data.subject_name,
          students: response.data.data.students.map(student => ({
            studentId: student.student_id,
            studentName: student.student_name,
            registrationNo: student.registration_no,
            test: {
              marksObtained: student.test.marks_obtained,
              marksPossible: student.test.marks_possible,
              percentage: student.test.percentage,
            },
            exam: {
              marksObtained: student.exam.marks_obtained,
              marksPossible: student.exam.marks_possible,
              percentage: student.exam.percentage,
            },
            tasks: {
              totalTasks: student.tasks.total_tasks,
              completedTasks: student.tasks.completed_tasks,
              lateTasks: student.tasks.late_tasks,
              percentage: student.tasks.percentage,
            },
          })),
        };

        setData(formattedData);
      } else {
        //console.error('Failed to fetch data:', response?.message);
      }
    } catch (error) {
      //console.error('Error fetching student subject performance:', error);
    }
  };

  const fetchClassesList = async () => {
    try {
      const response = await api.protected.get(
        `teacher/classesList?employee_id=${user?.emp_id}&school_campus_id=${user?.school_campus_id}`,
      );

      if (response?.data?.status === 'success') {
        const data = response.data.data;
        if (data && data.length > 0) {
          const classListArray = data.map((item: any) => ({
            value: item.section_id, // Use section_id as the value
            label: `${item.class_name}-${item.section_name}`, // Combine class_name and section_name for the label
          }));
          setClassList(classListArray); // Set the classList state
          if (!selectedClass) {
            setSelectedClass(classListArray[0]?.value); // Set the first section_id as the default selected value
          }
        }
      }
    } catch (error) {
     // console.error('Error fetching class details:', error);
    }
  };

  const fetchClassSubjects = async () => {
    try {
      // Log the selectedClass value to verify it is valid
      //console.log('Selected Class:', selectedClass);

      // Check if selectedClass is valid
      if (!selectedClass) {
       // console.warn('No class selected. Skipping fetchClassSubjects.');
        return;
      }

      // Log the user details to ensure they are available
      // console.log('User Details:', {
      //   emp_id: user?.emp_id,
      //   school_campus_id: user?.school_campus_id,
      // });

      // Construct the API URL and log it
      const apiUrl = `teacher/subjectList?employee_id=${user?.emp_id}&school_campus_id=${user?.school_campus_id}&section_id=${selectedClass}`;
      //console.log('API Request URL:', apiUrl);

      // Make the API call
      const response = await api.protected.get(apiUrl);

      // Log the full API response
      //console.log('API Response:', response);

      if (response?.data?.status === 'success') {
        const data = response.data.data;
        if (data && data.length > 0) {
          const subjectListArray = data.map((item: any) => ({
            value: item.subject_id,
            label: item.subject_name,
          }));
          setTeacherSubjects(subjectListArray);

          // Log the fetched subjects
        //  console.log('Fetched Subjects:', subjectListArray);

          // Set the first subject as the default selected subject
          if (!selectedSubject) {
            setSelectedSubject(subjectListArray[0]?.value);
          //  console.log('Default Subject Set:', subjectListArray[0]?.value);
          }
        } else {
         // console.warn('No subjects found for the selected class.');
          Alert.alert('Error', 'No subjects found.');
        }
      } else {
        //console.error('Failed to fetch subjects:', response?.data?.message);
        Alert.alert(
          'Error','Failed to fetch subjects',
        );
      }
    } catch (error) {
      // Log the full error details
      // console.error('Error fetching class subjects:', {
      //   error: error,
      //   message: error.message,
      //   response: error.response?.data, // Axios-specific error details
      // });

      Alert.alert(
        'Error',
        'Unable to fetch class subjects. Please try again later.',
      );
    }
  };

  const MultiColorCircularProgress = ({completed, late, unsubmit}) => {
    const radius = 35;
    const strokeWidth = 6;
    const circumference = 2 * Math.PI * radius;

    // Avoid division by zero
    const total = completed + late + unsubmit;
    // If all values are zero, just render the background circle
    if (total === 0) {
      return (
        <Svg width={80} height={80} viewBox="0 0 80 80">
          <Circle
            cx="40"
            cy="40"
            r={radius}
            stroke="#e0e0e0"
            strokeWidth={strokeWidth}
            fill="none"
          />
        </Svg>
      );
    }

    // Calculate percentages
    const completedPercentage = (completed / total) * 100;
    const latePercentage = (late / total) * 100;
    const unsubmitPercentage = (unsubmit / total) * 100;

    // Convert percentage to stroke length
    const unsubmitStroke = (unsubmitPercentage / 100) * circumference;
    const lateStroke = (latePercentage / 100) * circumference;
    const completedStroke = (completedPercentage / 100) * circumference;

    return (
      <Svg width={80} height={80} viewBox="0 0 80 80">
        {/* Background Circle */}
        <Circle
          cx="40"
          cy="40"
          r={radius}
          stroke="#e0e0e0"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Unsubmit Progress (Blue) */}
        <Circle
          cx="40"
          cy="40"
          r={radius}
          stroke="#62D9FF"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${unsubmitStroke}, ${circumference}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform="rotate(-90 40 40)"
        />

        {/* Late Progress (Purple) */}
        <Circle
          cx="40"
          cy="40"
          r={radius}
          stroke="#A833FF"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${lateStroke}, ${circumference}`}
          strokeDashoffset={-unsubmitStroke}
          strokeLinecap="round"
          transform="rotate(-90 40 40)"
        />

        {/* Completed Progress (Red) */}
        <Circle
          cx="40"
          cy="40"
          r={radius}
          stroke="#FF4D4D"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${completedStroke}, ${circumference}`}
          strokeDashoffset={-(unsubmitStroke + lateStroke)}
          strokeLinecap="round"
          transform="rotate(-90 40 40)"
        />
      </Svg>
    );
  };

  const renderStudent = ({item}: {item: any}) => {
    const test = item.test || {
      marksObtained: 0,
      marksPossible: 1,
      percentage: 0,
    };
    const exam = item.exam || {
      marksObtained: 0,
      marksPossible: 1,
      percentage: 0,
    };
    const tasks = item.tasks || {
      totalTasks: 0,
      completedTasks: 0,
      lateTasks: 0,
      percentage: 0,
    };

    return (
      <View style={styles.subjectCard}>
        {/* Student Name */}
        <Text style={styles.subjectTitle}>{item.studentName}</Text>

        {/* First Row - Test & Exam */}
        <View style={styles.rowContainer}>
          {[
            {label: 'Test', data: test, color: '#62D9FF'},
            {label: 'Exam', data: exam, color: '#FFD700'},
          ].map((category, index) => (
            <View key={index} style={styles.progressItem}>
              <View style={styles.circleContainer}>
                <AnimatedCircularProgress
                  size={75}
                  width={6}
                  fill={category.data.percentage || 0} // Ensure percentage is a number
                  tintColor={category.color}
                  backgroundColor="#e0e0e0"
                  lineCap="round"
                  rotation={360}
                />
                <View style={styles.textContainer}>
                  <Text style={styles.progressText}>
                    {category.label} {'\n'} {category.data.marksObtained} /{' '}
                    {category.data.marksPossible}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Second Row - Legends (Left) & Task Circle (Right) */}
        <View style={styles.secondRow}>
          {/* Legends */}
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, {backgroundColor: '#62D9FF'}]} />
              <Text>
                Unsubmit:{' '}
                {tasks.totalTasks > 0
                  ? (
                      ((tasks.totalTasks - tasks.completedTasks) /
                        tasks.totalTasks) *
                      100
                    ).toFixed(1) + '%'
                  : '0%'}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, {backgroundColor: '#A833FF'}]} />
              <Text>
                Late:{' '}
                {tasks.totalTasks > 0
                  ? ((tasks.lateTasks / tasks.totalTasks) * 100).toFixed(1) +
                    '%'
                  : '0%'}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, {backgroundColor: '#FF4D4D'}]} />
              <Text>
                On Time Submit: {Number((tasks.percentage || 0).toFixed(1))}%
              </Text>
            </View>
          </View>

          {/* Task Progress */}
          <View style={styles.taskContainer}>
            <View style={styles.circleContainer}>
              <MultiColorCircularProgress
                completed={tasks.completedTasks}
                late={tasks.lateTasks}
                unsubmit={
                  tasks.totalTasks - tasks.completedTasks - tasks.lateTasks
                }
              />
              <View style={styles.textContainer}>
                <Text style={styles.progressText}>
                  Task {'\n'} {tasks.completedTasks} / {tasks.totalTasks}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

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
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Student Progress</Text>
        <TouchableOpacity onPress={()=>navigation.navigate('TeacherAnnouncement')}>
          <Icon name="notifications" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Dropdowns */}
      <View style={styles.dropdownContainer}>
        <Dropdown
          style={styles.dropdown}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          data={classList} // Use classList as the data source
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder="Select Class"
          value={selectedClass}
          onChange={item => setSelectedClass(item.value)}
        />
        <Dropdown
          style={styles.dropdown}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          data={teacherSubjects} // Use teacherSubjects as the data source
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder="Select Subject"
          value={selectedSubject}
          onChange={item => setSelectedSubject(item.value)}
        />
      </View>
      <FlatList
        data={data?.students ?? []} // Render students instead of subjects
        keyExtractor={item => item.studentId.toString()}
        renderItem={renderStudent} // Use renderStudent instead of renderSubject
      />
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: '10@s',
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
    paddingVertical: '10@vs',
  },
  title: {
    fontSize: '18@ms',
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },
  dropdownContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: '10@vs',
  },
  dropdown: {
    flex: 1,
    marginHorizontal: '20@s',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: '8@s',
    paddingHorizontal: '10@s',
    backgroundColor: '#fff',
  },
  placeholderStyle: {
    fontSize: '12@ms',
    color: '#999',
    fontFamily: 'Poppins-Regular',
  },
  selectedTextStyle: {
    fontSize: '12@ms',
    color: '#000',
    fontFamily: 'Poppins-Regular',
  },
  classText: {
    fontSize: '16@ms',
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    marginBottom: '10@vs',
    textAlign: 'center',
    color: '#000',
  },
  subjectCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: '10@s',
    padding: '10@s',
    marginVertical: '10@vs',
  },
  subjectTitle: {
    fontSize: '16@ms',
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
    color: '#000',
    marginBottom: '10@vs',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  secondRow: {
    flexDirection: 'row', // Changed from 'row-reverse' to 'row'
    justifyContent: 'space-between', // Pushes legends to the left and task to the right
    alignItems: 'center',
    marginTop: '10@vs',
  },
  progressItem: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: '10@ms',
    color: '#000',
    fontWeight: 'Poppins-Regular',
    textAlign: 'center',
    marginTop: '5@vs',
  },
  legendContainer: {
    flex: 1, // Takes up remaining space (pushing Task to the right)
    alignItems: 'flex-start',
    left: '20@s', // Ensures legends are on the left
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: '3@vs',
  },
  legendDot: {
    width: '10@s',
    height: '10@s',
    borderRadius: '5@s',
    marginRight: '5@s',
  },

  taskContainer: {
    flex: 1,
    alignItems: 'center',
    Left: '30@s', // Ensures the task circle is aligned to the right
  },
  circleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Text Container */
  textContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SubjectProgress;
