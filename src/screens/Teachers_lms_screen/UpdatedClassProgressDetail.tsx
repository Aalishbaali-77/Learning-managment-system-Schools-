import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {AnimatedCircularProgress} from 'react-native-circular-progress';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';
import {useUser} from '../../Context/UserContext';
import api from '../../api';
import {getAccessToken} from '../../utils/storage';
import Svg, {Circle} from 'react-native-svg';

const UpdatedClassProgressDetail = ({route}) => {
  const {student_id} = route.params; // Access student_id from navigation params
  const [data, setData] = useState([]);
  const {studentName} = route.params;
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const {user} = useUser();
  const {class_name, sectionName} = route.params;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const accessToken = await getAccessToken();
        if (user && accessToken) {
          await fetchStudentSubjectPerformance(); // ✅ Await it
        }
      } catch (error) {
        // Handle error if needed
      } finally {
        setLoading(false); // Now runs after actual fetch is done
      }
    };
    fetchData();
  }, []);
  

  const fetchStudentSubjectPerformance = async () => {
    try {
      const payload = {
        school_id: user?.company_id, // From your user context
        school_campus_id: user?.school_campus_id, // From your user context
        student_id: student_id, // Received from the previous screen
      };
    //  console.log('Payload:', payload); // Debugging log

      const response = await api.protected.post(
        'teacher/progress/student-subject-performance',
        payload,
      );

      if (response.data.status === 'success') {
      //  console.log('Student Subject Performance:', response.data.data); // Debugging log

        const {
          student_id,
          student_name,
          registration_no,
          attendance,
          subjects,
        } = response.data.data;

        // Format the data for easier use in the UI
        const formattedData = {
          studentId: student_id,
          studentName: student_name,
          registrationNo: registration_no,
          attendance: {
            presentDays: attendance.present_days,
            absentDays: attendance.absent_days,
            leaveDays: attendance.leave_days,
            percentage: attendance.percentage,
          },
          subjects: subjects.map(subject => ({
            subjectId: subject.subject_id,
            subjectName: subject.subject_name,
            test: {
              totalTests: subject.test.total_tests,
              marksObtained: subject.test.marks_obtained,
              marksPossible: subject.test.marks_possible,
              percentage: subject.test.percentage,
            },
            exam: {
              marksObtained: subject.exam.marks_obtained,
              marksPossible: subject.exam.marks_possible,
              percentage: subject.exam.percentage,
            },
            tasks: {
              totalTasks: subject.tasks.total_tasks,
              completedTasks: subject.tasks.completed_tasks,
              pendingTasks: subject.tasks.pending_tasks,
              lateTasks: subject.tasks.late_tasks,
              percentage: subject.tasks.percentage,
            },
          })),
        };

        setData(formattedData);
       // console.log('Formatted Data in State:', formattedData); // Update state with the formatted data
      } else {
      //  console.error('Failed to fetch data:', response?.message);
      }
    } catch (error) {
     // console.error('Error fetching student subject performance:', error);
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

  const renderSubject = ({item}: {item: any}) => {
    //console.log('Rendering Subject Item:', item); // Debugging log
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
      pendingTasks: 0,
      lateTasks: 0,
      percentage: 0,
    };

    return (
      <View style={styles.subjectCard}>
        {/* Subject Name */}
        <Text style={styles.subjectTitle}>{item.subjectName}</Text>

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
              <Text style={styles.LegendText}>
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
              <Text style={styles.LegendText}>
                Late:{' '}
                {tasks.totalTasks > 0
                  ? ((tasks.lateTasks / tasks.totalTasks) * 100).toFixed(1) +
                    '%'
                  : '0%'}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, {backgroundColor: '#FF4D4D'}]} />
              <Text style={styles.LegendText}>
                On Time Submit: {tasks.percentage}%
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
      <Text style={styles.classText}>
        Class {class_name}-{sectionName} - {studentName}
      </Text>
      <FlatList
        data={data?.subjects ?? []}
        keyExtractor={item => item.subjectId.toString()}
        renderItem={renderSubject}
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
  classText: {
    fontSize: '16@ms',
    fontFamily: 'Poppins-Medium',
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
    marginBottom: '10@vs',
    color: '#000',
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
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
    marginTop: '5@vs',
    color: '#000',
  },

  /* Legends (Aligned Left) */
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
    width: '10@ms',
    height: '10@vs',
    borderRadius: '5@s',
    marginRight: '5@s',
  },
  LegendText: {
    fontFamily: 'Poppins-Regular',
    color: '#000',
  },

  /* Task Progress Circle (Aligned Right) */
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

export default UpdatedClassProgressDetail;
