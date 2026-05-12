import { DrawerActions, useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { moderateScale, ScaledSheet } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { studentFees, studentSubjects } from '../../types';
import { UserContext, useUser } from '../../Context/UserContext';
import { useSubjects } from '../../Context/TeacherSubjectContext';
import api from '../../api';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { getAccessToken } from '../../utils/storage';
import moment from 'moment';
import { ASSET_URL_HOE } from '../../constants';


const {width} = Dimensions.get('window');

const ParentsHome = () => {
 const navigation = useNavigation();
  const [studentClassDetails, setStudentClassDetails] = useState({
    class_id: Number,
    className: '',
    sectionName: '',
    student_name: '',
    registration_no: '',
  });
  const [studentClassoff, setStudentClassoff] = useState({
    class_id: Number,
    registration_no: '',
    class_name: '',
    section_name: '',
    section_id: '',
  });
  const [studentSubjectList, setStudentSubjectList] = useState<
    studentSubjects[]
  >([]);
  const [latestAnnouncement, setLatestAnnouncement] = useState({
    date: '',
    title: '',
    description: '',
  });
  const [feeVouchers, setFeeVouchers] = useState<studentFees[]>([]);
  const [studentProgress, setStudentProgress] = useState({});
  const { setSectionId } = useSubjects();
  const { sectionId } = useSubjects();
  const { user } = useUser();
  const student_id = user?.student_id;
  const [markedDates, setMarkedDates] = useState({});
  const [eventsList, setEventsList] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(
    new Date().toISOString().split('T')[0],
  ); // Default to today's date
  const lastFetchedMonth = useRef<string | null>(null);
  const lastFetchedYear = useRef<string | null>(null);
  const [events, setEvents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({
    present: '0',
    absent: '0',
    late: '0',
    leave: '0',
    total_days: 0,
    attendance_percentage: '0.00',
  });

   const [rankings, setRankings] = useState([]);

  const [loading, setLoading] = useState(true); // Loading state
  const [examSchedule, setExamSchedule] = useState([]);
  const [eventColors, setEventColors] = useState<Record<string, string>>({});
    const [eventNames, setEventNames] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        BackHandler.exitApp();
        return true; // Prevent default back action
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation]),
  );

  useEffect(() => {
    const fetchCalendarData = async () => {
      try {
        const accessToken = await getAccessToken();
        setLoading(true);
  
        if (user && accessToken) {
          // Step 1: Fetch academic calendar (sets up event colors)
          await fetchAcademicCalendar();
  
          // Step 2: Set current visible month
          const today = new Date();
          const currentMonthName = today.toLocaleString('en-US', { month: 'long' });
          const currentYear = today.getFullYear().toString();
  
          setCurrentMonth(
            `${currentYear}-${(today.getMonth() + 1).toString().padStart(2, '0')}-01`
          );
          lastFetchedMonth.current = currentMonthName;
          lastFetchedYear.current = currentYear;
  
          // Step 3: Fetch academic events *after* calendar colors are ready
          await fetchAcademicEvents(currentMonthName, currentYear);
        }
      } catch (error) {
        console.error('Error fetching calendar data:', error);
      }
    };
  
    const fetchOtherData = async () => {
      try {
        const accessToken = await getAccessToken();
  
        if (user && accessToken) {
          await Promise.all([
            fetchStudentOff(),
            fetchStudentDetails(),
            fetchLatestAnnouncement(),
            fetchAttendanceData(),
            fetchFeeVouchers(),
            fetchStudentProgress(),
          ]);
        }
  
        if (sectionId) {
          await Promise.all([
            fetchSubjectList(),
            fetchStudentExamSchedule(),
            fetchRankings(),
          ]);
        }
      } catch (error) {
        console.error('Error fetching other data:', error);
      }
    };
  
    // First, fetch calendar data
    fetchCalendarData();
  
    // Then fetch other data in parallel
    fetchOtherData();
  }, [user, sectionId]);
  
  

  // Function to get closest exam schedule
  const getClosestExamSchedule = (examData) => {
    const today = moment();

    // Extract terms with the last exam date
    const termsWithLastExamDate = Object.keys(examData).map((key) => {
      const subjects = examData[key].subjects;
      const lastExamDate = moment(subjects[subjects.length - 1].exam_date); // Get last subject's date
      return {
        termName: examData[key].term_name,
        lastExamDate,
        subjects,
      };
    });

    // Filter out terms with past last exam dates
    const upcomingTerms = termsWithLastExamDate.filter((term) =>
      term.lastExamDate.isSameOrAfter(today)
    );

    // Sort terms by closest date to today
    upcomingTerms.sort((a, b) => a.lastExamDate.diff(today) - b.lastExamDate.diff(today));

    // Return the term with the closest last exam date
    return upcomingTerms.length > 0 ? upcomingTerms[0] : null;
  };

  const fetchStudentExamSchedule = async () => {
    setLoading(true); // Set loading state before starting API call
    try {
      const payload = {
        school_id: user?.company_id,
        school_campus_id: user?.school_campus_id,
        section_id: sectionId,
      };
      console.log('section id in parents home', payload);
      
      const endpoint = 'student/examScedule';

      const response = await api.protected.post(endpoint, payload);

      if (response?.data?.status === 'success') {
        const data = response.data.data;

        // Get the closest exam schedule
        const closestExam = getClosestExamSchedule(data);

        if (closestExam) {
          setExamSchedule(closestExam); // Save the closest exam data to state
        } else {
          // console.log('No upcoming exams found');
        }
      } else {
        // console.error('Failed to fetch student exam schedule:', response?.data?.message);
      }
    } catch (error) {
      // console.error('Error fetching student exam schedule:', error);
    } finally {
      setLoading(false); // Stop loading state after API call
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
    //  console.error('Error fetching class details:', error);
    }
  };

  const fetchStudentOff = async () => {
    try {
      const response = await api.protected.post('student/studentOff', {
        student_id,
      });
      if (response?.data?.status === 'success') {
        const data = response.data.data; // This is an object
        if (data) {
          // Update state with class and section names
          setStudentClassoff({
            class_id: data.class_id,
            class_name: data.section.class_name, // Access properties directly
            section_name: data.section.section_name,
            registration_no: data.registration_no,
            section_id: data.section.section_id,
          });
          const sectionId = data.section.section_id; // You can choose how to handle section_id
          if (sectionId) {
            setSectionId(sectionId); // Set sectionId in the context
          }
          ('log of student section id', sectionId);
        } else {
          Alert.alert('Error', 'No class details found.');
        }
        // console.log(data); // Debugging
      } else {
        Alert.alert(
          'Error',
          response?.data?.message || 'Failed to fetch student off',
        );
      }
    } catch (error) {
     // console.error('Error fetching student off:', error);

    }
  };

  const fetchSubjectList = async () => {
    try {
      const payload = {
        section_id: sectionId,
        school_id: user?.company_id,
        school_campus_id: user?.school_campus_id,
        student_id: user?.student_id,
      };
      // console.log('Section ID of API:', sectionId);

      const response = await api.protected.post(`student/subjectList`, payload);

      if (response?.data?.status === 'success') {
        const data = response.data.data; // This is an array
        if (Array.isArray(data) && data.length > 0) {
          setStudentSubjectList(
            data.map(subject => ({
              subject_id: subject.subject_id,
              subject_name: subject.subject_name,
              teacher_name: subject.teacher_name,
              // Pick the first time slot or use logic to select the desired one
              start_time: subject.time_slots[0]?.start_time || 'N/A',
              end_time: subject.time_slots[0]?.end_time || 'N/A',
              task_count: subject.task_count,
            })),
          );
          // console.log('Subject List Data:', data);
        } else {
          Alert.alert('Error', 'No subject list found.');
        }
      } else {
        Alert.alert(
          'Error',
          response?.data?.message || 'Failed to fetch subject list',
        );
      }
    } catch (error) {
    //  console.error('Error fetching subject list:', error);
    }
  };


  const fetchLatestAnnouncement = async () => {
    try {
      const payload = {
        date: '2024-12-20', // Example date, replace dynamically if needed
        school_id: user?.company_id, // Replace with actual school ID
        school_campus_id: user?.school_campus_id, // Replace with actual campus ID
        section_id: sectionId, // Replace with actual section ID
        announcement_type: 3, // Replace with actual announcement type
        publish: 1, // Boolean indicating published announcements
      };
      // console.log('payload of student announcement', payload);

      const response = await api.protected.post(
        'teacher/annoucements/today-latest-annoucement',
        payload,
      );

      if (response?.data?.status === 'success') {
        const announcement = response.data.data; // Extract the announcement data
        if (announcement) {
          // Update state with announcement details
          setLatestAnnouncement({
            date: announcement.created_date, // Use created_date for display
            title: announcement.title, // Title of the announcement
            description: announcement.description, // Description of the announcement
          });
        } else {
          Alert.alert('Error', 'No announcement found.');
        }
      }
    } catch (error) {
    //  console.error('Error fetching announcement:', error);
    }
  };

  const fetchFeeVouchers = async () => {
    try {
      const payload = {
        student_id: user?.student_id, // Replace with actual student ID
        school_id: user?.company_id, // Replace with actual school ID
        school_campus_id: user?.school_campus_id, // Replace with actual campus ID
      };

      const response = await api.protected.post(
        'teacher/fees/student-wise-generated-fee-voucher-list',
        payload,
      );

      if (response?.data?.status === 'success') {
        setFeeVouchers(response.data.data);
      } else {
        Alert.alert(
          'Error',
          response?.data?.message || 'Failed to fetch fee vouchers.',
        );
      }
    } catch (error) {
    //  console.error('Error fetching fee vouchers:', error);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      const payload = {
        student_id: user?.student_id, // Replace with actual student ID
        school_id: user?.company_id, // Replace with actual school ID
        school_campus_id: user?.school_campus_id, // Replace with actual campus ID
      };
      // console.log('payload for student attendance', payload);

      const response = await api.protected.post(
        'student/getYearWiseAttendance',
        payload,
      );
      // console.log('Attendance Data:', response?.data);

      if (response?.data?.status === 'success') {
        const attendance = response.data.data[0]; // Extract the first item from the array

        // Ensure numerical conversion where necessary
        setAttendanceData({
          present: attendance.present || '0',
          absent: attendance.absent || '0',
          late: attendance.late || '0',
          leave: attendance.leave || '0',
          total_days: attendance.total_days || 0,
          attendance_percentage:
            Number(attendance.attendance_percentage) || 0,
        });

      } else {
        Alert.alert(
          'Error', 'Failed to fetch attendance data.',
        );
      }
    } catch (error) {
    //  console.error('Error fetching attendance data:', error);

    }
  };

  // Helper function to convert month names to numbers
  const getMonthNumber = (month: any) => {
    const months = {
      January: 'January',
      February: 'February',
      March: 'March',
      April: 'April',
      May: 'May',
      June: 'June',
      July: 'July',
      August: 'August',
      September: 'September',
      October: 'October',
      November: 'November',
      December: 'December',
    };
    return months[month];
  };

  const predefinedColors = [
        '#4D96FF', // Blue
        '#F7347A', // Pink
        '#FFD700', // Yellow
        '#1ABC9C', // Teal
        '#9B59B6', // Purple
        '#E67E22', // Orange
        '#2ECC71', // Green
      ];
      
      const generateEventColors = (eventData: any[]) => {
        const colors: Record<string, string> = {};
        let colorIndex = 0;
      
        eventData.forEach((event) => {
          if (!colors[event.name]) {
            colors[event.name] = predefinedColors[colorIndex % predefinedColors.length];
            colorIndex++;
          }
        });
      
        return colors;
      };
    
      // Fetch events for a specific month
      const fetchAcademicEvents = async (month: string, year: string) => {
        const school_campus_id = user?.school_campus_id;
        if (!school_campus_id) return;
      
        setEvents([]);
        setMarkedDates({});
      
        try {
          const response = await api.protected.post(
            'teacher/academic-detail/listAcademicDetailsByMonth',
            { school_campus_id, month, year }
          );
      
          if (response.data.success) {
            const eventData = response.data.data || [];
            setEvents(eventData);
      
            const newMarkedDates: Record<string, any> = {};
            eventData.forEach((event: any) => {
              newMarkedDates[event.start_date] = {
                marked: true,
                dotColor: eventColors[event.status] || '#000',
              };
            });
      
            setMarkedDates(newMarkedDates);
          }
        } catch (error) {
          console.error('Error fetching events:', error);
        }
      };
      
      const handleVisibleMonthChange = (months: any[]) => {
        if (months && months.length > 0) {
          const visibleMonth = months[0];
          const {year, month} = visibleMonth;
    
          // Convert numeric month to full month name
          const fullMonthName = new Date(year, month - 1).toLocaleString('en-US', {
            month: 'long',
          });
    
          // Avoid redundant API calls for the same month
          if (
            lastFetchedMonth.current === fullMonthName &&
            lastFetchedYear.current === year.toString()
          ) {
            return;
          }
    
          lastFetchedMonth.current = fullMonthName;
          lastFetchedYear.current = year.toString();
    
          // Update the state for the calendar's current month
          setCurrentMonth(`${year}-${month.toString().padStart(2, '0')}-01`);
    
          // Fetch events for the new month and year
          fetchAcademicEvents(fullMonthName, year.toString());
        }
      };
    
      const fetchAcademicCalendar = async () => {
        const school_id = user?.company_id;
        const school_campus_id = user?.school_campus_id;
      
        try {
          // Step 1: Get event types & generate dynamic colors
          const eventNamesResponse = await api.protected.post(
            'teacher/academic-detail/academic-status',
            { school_campus_id }
          );
      
          let generatedEventColors: Record<string, string> = {};
          if (eventNamesResponse.data.success) {
            const eventData = eventNamesResponse.data.data;
            setEventNames(eventData);
            generatedEventColors = generateEventColors(eventData);
            setEventColors(generatedEventColors);
          }
      
          // Step 2: Get calendar data
          const response = await api.protected.post('teacher/academic-detail', {
            school_id,
            school_campus_id,
          });
      
          const { success, data: monthsData } = response.data;
      
          if (success) {
            const newMarkedDates: Record<string, any> = {};
            const newEvents: any[] = [];
      
            Object.keys(monthsData).forEach((month) => {
              monthsData[month].forEach((item: any) => {
                const dateKey = `2023-${getMonthNumber(month)}-${item.start_date.padStart(2, '0')}`;
                const dotColor = generatedEventColors[item.academic_status] || '#000';
      
                newMarkedDates[dateKey] = { marked: true, dotColor };
      
                newEvents.push({
                  date: item.start_date,
                  title: item.title,
                  dateFull: `${item.start_date} ${month} 2023`,
                  color: dotColor,
                });
              });
            });
      
            setMarkedDates(newMarkedDates);
            setEventsList(newEvents);
          }
        } catch (error) {
          console.error('Error fetching academic calendar:', error);
        }
      };
    const getRankSymbol = (rank: number) => {
      switch (rank) {
        case 1:
          return require('../../assets/Images/gold-medal.png');
        case 2:
          return require('../../assets/Images/silver-medal.png');
        case 3:
          return require('../../assets/Images/bronze-medal.png');
        default: return rank.toString();
      }
    };
    
      const fetchRankings = async () => {
        const payload = {
            section_id: sectionId,
            school_campus_id: user?.school_campus_id,
            school_id: user?.company_id,
        }
        try {
          const response = await api.protected.post('teacher/progress/hall-of-excellence', payload );
          
          
          if (response.data.status === 'success') {
            setRankings(response.data.data)
          } else {
           // console.log(error.response, 'Failed to load rankings');
          }
        } catch (err) {
          //console.log(error.response, 'Failed to load rankings');
        } 
      };



  const fetchStudentProgress = async () => {
    try {
      const payload = {
        student_id: user?.student_id, // Replace with actual student ID
        school_id: user?.company_id, // Replace with actual school ID
        school_campus_id: user?.school_campus_id, // Replace with actual campus ID
      };

      const response = await api.protected.post(
        'teacher/progress/getStudentProgress',
        payload,
      );

      if (response?.data?.status === 'success') {
        setStudentProgress(response.data.data);
      } else {
        Alert.alert(
          'Error',
          response?.data?.message || 'Failed to fetch fee vouchers.',
        );
      }
    } catch (error) {
     // console.error('Error fetching fee vouchers:', error);

    }
  };

  const colors = [
    '#9A0DA1', // Cyan
    '#1EA10D', // Orange
    '#A1120D', // Purple
    '#A10D6B', // Red
    '#CBB600', // Light Green
    '#A1120D', // Red-Orange
    '#1EA10D', // Green
    '#9A0DA1', // Blue
    '#FF33A8', // Pink
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} >
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}>
          <Icon name="menu-open" size={moderateScale(22)} color="#000" />
        </TouchableOpacity>
        {/* <TouchableOpacity onPress={() => navigation.navigate('StudentProfile')}>
          <Image
            source={require('../assets/Images/EmptyWishlistandCart.png')}
            style={styles.profileImage}
          />
        </TouchableOpacity> */}
        <View style={styles.userInfo}>
          <Text style={styles.name}>{studentClassDetails.student_name}</Text>
          <Text style={styles.subtext}>
            Admission No: {studentClassoff.registration_no} | Class{' '}
            {studentClassoff.class_name}-{studentClassoff.section_name}
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('ParentsAnnouncement')}>
          <Icon name="notifications" size={moderateScale(22)} color="black" />
        </TouchableOpacity>
      </View>

      {/* Subjects Section */}
      <View style={styles.section}>
        <View style={styles.buttonContainer}>
          <Text style={styles.sectionTitle}>Subjects</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ParentsTimetable')}>
            <Text style={styles.viewDetailSubjectText}>View Timetable</Text>

          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.subjectScrollView}>
          {studentSubjectList.map((subject, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.subjectCard,
                { backgroundColor: colors[index % colors.length] },
              ]}
              onPress={() =>{
                // console.log('Navigating with subject:', subject)
                navigation.navigate('ParentsSubjectTasks', {
                  
                  subjectId: subject.subject_id,
                  subject: subject,
                })
              }}>
              {/* Replace with your desired icon */}
              <View style={styles.subjectIcon}>
                <Icon name='auto-stories' size={moderateScale(24)} color='#000' />
              </View>

              <View style={styles.subjectContent}>
                <Text style={styles.subjectName}>{subject.subject_name}</Text>
                <View style={styles.subjectDetails}>
                  <Icon name='person' size={moderateScale(18)} color='#fff' style={styles.userIcon} />
                  <Text style= {styles.text}>{subject.teacher_name}</Text>
                </View>
                <View style={styles.subjectDetails}>
                  <Icon name='watch-later' size={moderateScale(18)} color='#fff' style={styles.userIcon} />
                  <Text style= {styles.text}>{subject.start_time} - {subject.end_time}</Text>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('ParentsSubjectTasks', {
                      subjectId: subject.subject_id,
                      subject: subject,
                    })
                  }>
                  <Text style={styles.viewTask}>View Task ➔</Text>
                </TouchableOpacity>
              </View>

              {/* Notification Badge */}
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {subject.task_count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Exam schedule */}

      <View style={styles.ExamHeaderContainer}>
        <Text style={styles.sectionTitle}>Exam Schedule</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ParentsStudentExamSchedule')}>
          <Text style={styles.viewDetailAttendanceText}>View Detail</Text>

        </TouchableOpacity>
      </View>
      <View style={styles.examSection}>
        {examSchedule && examSchedule.subjects && examSchedule.subjects.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {examSchedule.subjects.map((subject, index) => (
              <View key={index} style={styles.classCard}>
                <Text style={styles.className}>{subject.subject_name}</Text>
                <View style={styles.detailsRow}>
                  <Icon name='watch-later' size={moderateScale(20)} color='#000' style={styles.icon} />
                  <Text style={styles.classDetails}>
                    {moment(subject.start_time, 'HH:mm:ss').format('hh:mm A')} - {moment(subject.end_time, 'HH:mm:ss').format('hh:mm A')}
                  </Text>
                </View>
                <View style={styles.detailsRow}>
                  <Icon name='calendar-month' size={moderateScale(20)} color='#000' style={styles.icon} />
                  <Text style={styles.classDetails}>
                    {moment(subject.exam_date).format('DD MMMM YYYY')}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text>No upcoming exams found</Text>
        )}
      </View>

      {/* Header */}
      <View style={styles.attendanceHeaderContainer}>
        <Text style={styles.sectionTitle}>Attendance</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ParentsAttendance')}>
          <Text style={styles.viewDetailAttendanceText}>View Detail</Text>
        </TouchableOpacity>
      </View>
      {/* Attendance Section */}
      <View style={styles.attendanceSection}>
        {/* Subtitle */}
        <Text style={styles.attendanceHeaderText} >
          Stay consistent to achieve your goals!
        </Text>

        {/* Legend */}
        <View style={styles.attendanceLegendContainer}>
          <Text style={styles.attendanceLegendText}><Text style={styles.greenDot}>●</Text> Present</Text>
          <Text style={styles.attendanceLegendText}><Text style={styles.redDot}>●</Text>Absent</Text>
        </View>

        {/* Circular Progress */}
        <View style={styles.attendanceCircleContainer}>
          {/* Background for the remaining portion (red) */}
          <AnimatedCircularProgress
            size={moderateScale(120)}
            width={moderateScale(10)}
            fill={100} // Always filled to 100%
            tintColor="red" // Red for the remaining part
            backgroundColor="#ddd"
            rotation={0}
            lineCap="round"
            style={styles.circularProgressBackground}
          />
          {/* Foreground for the filled portion (green) */}
          <AnimatedCircularProgress
            size={moderateScale(120)}
            width={moderateScale(10)}
            fill={attendanceData.attendance_percentage} // The actual attendance percentage
            tintColor="green" // Green for the filled part
            backgroundColor="transparent" // Make the background transparent
            rotation={0}
            lineCap="round"
            style={styles.circularProgressForeground}>
            {fill => (
              <View style={styles.circularTextContainer}>
                <Text style={styles.attendancePercentageText}>
                  {Math.round(fill)}%
                </Text>
                <Text style={styles.attendanceSubText}>Total Attendance</Text>
              </View>
            )}
          </AnimatedCircularProgress>
        </View>

        {/* Footer */}
        <Text style={styles.attendanceFooterText}>
          {attendanceData.attendance_percentage}% attendance! You're doing
          well—keep going!
        </Text>
      </View>

       {/* HallOfExcellence Section */}
            
            <View style={styles.hallOfExcellenceContainer}>
            {/* Header */}
            <View style={styles.hallOfExcellenceHeader}>
              <Text style={styles.title}>Hall of Excellence</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ParentsHallOfExcellence')}>
              <Text style={styles.leaderboardText}>Leaderboard</Text>
              </TouchableOpacity>
            </View>
      
            {/* Achiever Card */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {rankings
          .filter(item => item.rank <= 3) // Show only 1st, 2nd, and 3rd
          .map(item => (
            <View key={`${item.student_id}-${item.rank}`} style={styles.hallOfExcellenceCard}>
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: `${ASSET_URL_HOE}${item.profile_picture}` }} // Ensure profile_picture is a valid URL
                  style={styles.hallOfExcellenceProfileImage}
                />
                  {getRankSymbol(item.rank) && (
          <Image source={getRankSymbol(item.rank)} style={styles.medalIcon} />
        )}
              </View>
              <Text style={styles.achieverTitle}>
                {item.rank === 1 ? "Gold Achiever" : item.rank === 2 ? "Silver Achiever" : "Bronze Achiever"}
              </Text>
              <Text style={styles.achieverName}>{item.student_name}</Text>
              <Text style={styles.achieverDescription}>Consistent and high-quality performance</Text>
            </View>
          ))}
      </ScrollView>
      
          </View>

      {/* Announcements Section */}
      <View style={styles.section}>
        <View style={styles.attendanceSectionHeaderContainer}>
          <Text style={styles.sectionTitle}>Announcements</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('ParentsAnnouncement')}>
            <Text style={styles.viewDetailAnnouncementText}>See All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.announcementCard}>
          <Text style={styles.announcementDate}>
            {latestAnnouncement.title}
          </Text>
          <Text style={styles.announcementDate}>{latestAnnouncement.date}</Text>
          <Text style={styles.announcementText}>
            {latestAnnouncement.description}
          </Text>
        </View>
      </View>

      {/* Fees Section */}

      <View style={styles.headerContainer}>
        <Text style={styles.sectionTitle}>Fees</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ParentsFeesHistory')}>
          <Text style={styles.viewDetailText}>History</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.feeSection}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>Month</Text>
          <Text style={styles.tableHeaderText}>Amount</Text>
          <Text style={styles.tableHeaderText}>Due Date</Text>
          <Text style={styles.tableHeaderText}>Status</Text>
        </View>

        {feeVouchers.slice(0, 3).map((voucher, index) => (
          <View key={index} style={styles.feesRow}>
            <Text style={styles.feeText}>
              {new Date(voucher.month_year).toLocaleString('default', {
                month: 'long',
              })}
            </Text>
            <Text style={styles.feeText}>{parseFloat(voucher.amount)}</Text>
            <Text style={styles.feeText}>{voucher.due_date}</Text>
            <Text
              style={[
                styles.feeStatus,
                voucher.fee_voucher_status === 1
                  ? styles.pendingStatus
                  : styles.paidStatus,
              ]}>
              {voucher.fee_voucher_status === 1 ? 'Pending' : 'Paid'}
            </Text>
          </View>
        ))}
      </View>
      {/* Academic Calendar */}
      <View style={styles.section}>
        <View style={styles.academicSectionHeaderContainer}>
          <Text style={styles.sectionTitle}>Academic Calendar</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('AcademicCalendar')}>
            <Text style={styles.viewDetailCalendarText}>View Details</Text>
          </TouchableOpacity>
        </View>
        <Calendar
          current={currentMonth}
          markedDates={markedDates}
          onVisibleMonthsChange={handleVisibleMonthChange}
          theme={{
            selectedDayBackgroundColor: '#4D96FF',
            todayTextColor: '#F7347A',
            arrowColor: '#000',
            dayTextColor: '#000',

            textMonthFontSize: moderateScale(18), // Font size for the month in the header
            textDayHeaderFontSize: moderateScale(14), // Font size for the weekday headers (e.g., Sun, Mon)
          }}
          style={styles.calendar}
        />
      </View>

      {/* Start Learning Today Section */}
      <View style={styles.learningCoursesSection}>
        <Text style={styles.learningSectionTitle}>Start Learning Today</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.card}>
            <Icon name="bolt" size={24} color="#000" style={styles.cardIcon} />
            <Text style={styles.cardDate}>Jan 1 - Mar 30, 2025</Text>
            <Text style={styles.cardTitle}>
              Mastering Artificial Intelligence
            </Text>
            <Text style={styles.cardDetails}>
              👨‍🏫 Dr. Sarah Thompson{'\n'}🕒 2:00 PM - 3:30 PM
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('CourseDetails')}>
              <Text style={styles.cardLink}>View Details →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            <Icon name="bolt" size={moderateScale(24)} color="#000" style={styles.cardIcon} />
            <Text style={styles.cardDate}>Jan 1 - Mar 30, 2025</Text>
            <Text style={styles.cardTitle}>
              Mastering Artificial Intelligence
            </Text>
            <Text style={styles.cardDetails}>
              👨‍🏫 Dr. Sarah Thompson{'\n'}🕒 2:00 PM - 3:30 PM
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('CourseDetails')}>
              <Text style={styles.cardLink}>View Details →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Performance Section */}
      <View style={styles.section}>
        <View style={styles.performanceHeader}>
          <Text style={styles.sectionTitle}>Monthly Performance</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('ParentsStudentProgress')}>
            <Text style={styles.viewDetailCalendarText}>View Details</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.progressBarContainer}>
          <Text style={styles.progressLabel}>Attendance</Text>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Number(studentProgress.attendance_percentage)}%`,
                  backgroundColor: 'green',
                },
              ]}
            />
          </View>
          <Text style={styles.rangeLabel}>
            {studentProgress.attendance_percentage}%
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <Text style={styles.progressLabel}>Test</Text>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Number(studentProgress.combined_percentage)}%`,
                  backgroundColor: 'skyblue',
                },
              ]}
            />
          </View>
          <Text style={styles.rangeLabel}>
            {studentProgress.combined_percentage}%
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <Text style={styles.progressLabel}>Exam</Text>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBar,
                { width: `${Number(studentProgress.exam_percentage)}%`, backgroundColor: 'yellow' },
              ]}
            />
          </View>
          <Text style={styles.rangeLabel}>{studentProgress.exam_percentage}%</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default ParentsHome;

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    padding: '16@ms',
  },
  userInfo: {
    flexDirection: 'column',
  },
  name: {
    fontSize: '15@ms',
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },
  subtext: {
    fontSize: '11@ms',
    fontFamily: 'Poppins-Regular',
    color: 'gray',
  },
  section: {
    padding: '16@ms',
  },
  learningCoursesSection: {
    padding: '16@ms',
    bottom: '70@vs',
  },
  feeSection: {
    padding: '16@ms',
    backgroundColor: '#fff',
    borderRadius: '10@s',
    marginBottom: '16@vs',
    borderColor: '#000',
    borderWidth: 1,
    marginHorizontal: '15@s',
    bottom: '55@vs',
  },
  profileImage: {
    width: '40@ms', // Scaled width
    height: '40@vs', // Scaled height
    borderRadius: '20@ms', // Ensures the image is round
    marginRight: '10@s', // Spacing between image and text
    backgroundColor: '#ccc', // Fallback background color
  },
  subjectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  subjectScrollView: {
    marginVertical: '8@vs',
  },
  subjectCard: {
    width: '180@s',
    marginRight: '12@s',
    padding: '12@ms',
    borderRadius: '10@s',
    position: 'relative',
  },
  subjectIcon: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    padding: '12@ms',
    borderRadius: '50@s',
    marginBottom: '10@vs',
  },
  subjectContent: {
    flex: 1,
  },
  subjectName: {
    fontSize: '16@ms',
    fontFamily: 'Poppins-Bold',
    color: '#fff',
    marginBottom: '4@vs',
  },
  subjectDetails: {
    flexDirection: 'row',
    fontSize: '12@ms',
    fontFamily: 'Poppins-Regular',
    color: '#fff',
    marginBottom: '4@vs',
  },
  text: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Regular',
    color: '#fff',
    left: '3@s',
  },
  viewTask: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Regular',
    color: '#fff',
    marginTop: '8@vs',
    
  },
  subjectTaskCount: {
    color: 'green',
    fontSize: '15@ms',
    fontWeight: 'bold',
    left: '135@s',
    position: 'relative',
    bottom: '40@vs',
  },
  notificationBadge: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: '7@s',
    width: '24@ms',
    height: '24@vs',
    justifyContent: 'center',
    alignItems: 'center',
    left: '150@s',
    bottom: '140@vs',
  },
  notificationBadgeText: {
    fontSize: '11@ms',
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },


  buttonContainer: {
    flexDirection: 'row',
  },
  viewDetailText: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
    
  },
  viewDetailSubjectText: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Medium',
    color: '#000',
    marginLeft: '150@s',
    top: '6@vs'
  },

  viewDetailCalendarText: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Medium',
    color: '#000',
  },
  viewDetailAnnouncementText: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Medium',
    color: '#000',
  },
  viewDetailFeesText: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Medium',
    color: '#000',
    left: '30@s',
  },
  examSection: {
    paddingHorizontal: '20@s',
    marginBottom: '20@vs',
  },
  classCard: {
    width: '200@ms',  // Adjusted width to make it wider
    padding: '15@ms',
    backgroundColor: '#ffffff',
    borderRadius: '10@ms',
    marginRight: '15@s',

  },
  className: {
    fontSize: '15@ms',  // Slightly larger text for better readability
    fontFamily: 'Poppins-SemiBold',
    color: '#000',

  },
  classDetails: {
    fontSize: '12@ms',
    color: '#000',
    fontFamily: 'Poppins-Regular',
    marginLeft: '5@s',
    top: '2@vs',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',

  },
  icon: {
    fontSize: '17@ms',
    color: '#000',
  },


  attendanceSection: {
    padding: '16@ms',
    backgroundColor: '#fff',
    marginBottom: '16@vs',
    borderRadius: '10@ms',
    borderWidth: 1,
    borderColor: '#000',
    margin: '15@ms',
    bottom: '35@vs',
  },
  attendanceHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: '15@ms',
    bottom: '17@vs',
  },
  ExamHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: '15@ms',
    bottom: '5@vs',
  },
  attendanceSectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    bottom: '45@vs',
  },
  academicSectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    bottom: '65@vs',
  },
  sectionTitle: {
    fontSize: '17@ms',
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
  },
  viewDetailAttendanceText: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Medium',
    color: '#000',
   
  },
  attendanceHeaderText: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
    marginVertical: '8@vs',
  },
  attendanceLegendContainer: {
    flexDirection: 'column',
    marginVertical: '8@vs',
    padding: '20@ms',
    marginEnd: '130@ms',
    backgroundColor: '#f9f9f9',
    borderRadius: '6@ms',
    top: '10@vs',
  },
  attendanceLegendText: {
    fontSize: '13@ms',
    fontFamily: 'Poppins-Regular',
    color: '#000',
    marginBottom: '4@vs',

  },
  greenDot: {
    color: '#00ff00',
  },
  redDot: {
    color: '#ff0000',
  },
  attendanceCircleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: '16@vs',
    left: '90@s',
    bottom: '50@vs',
   
    
  },
  circularProgressBackground: {
    position: 'absolute',
    
  },
  circularProgressForeground: {
    position: 'absolute',
    
  },
  circularTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  
  },
  attendancePercentageText: {
    fontSize: '24@ms',
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },
  attendanceSubText: {
    fontSize: '8@ms',
    fontFamily: 'Poppins-Regular',
    color: '#555',
    textAlign: 'center',
    marginTop: '4@vs',
    bottom: '5@vs',
  },
  attendanceFooterText: {
    fontSize: '15@ms',
    fontFamily: 'Poppins-SemiBold',
    color: '#000',

    marginTop: '12@vs',
  },
  announcementCard: {
    padding: '12@ms',
    backgroundColor: '#fff',
    borderRadius: '8@s',
    bottom: '35@vs',
  },
  announcementDate: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Bold',
    color: 'gray',
  },
  announcementText: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-Regular',
    color: '#000',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: '8@vs',
  },
  tableHeaderText: {
    fontSize: '13@ms',
    fontFamily: 'Poppins-Regular',
    color: '#000',
    width: '25%',
    textAlign: 'center',
    margin: '2@ms',
  },
  feesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: '10@vs',
  },
  feeText: {
    fontSize: '11@ms',
    fontFamily: 'Poppins-Regular',
    color: '#000',
    width: '25%',
    textAlign: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8@vs',
    padding: '16@ms',
    bottom: '45@vs',
  },
  feeStatus: {
    fontSize: '10@ms',
    fontFamily: 'Poppins-Regular',
    paddingVertical: '4@vs',
    paddingHorizontal: '8@s',
    borderRadius: '8@s',
    textAlign: 'center',
    width: '20%',
    bottom: '4@vs'
    // height: '50%'
  },
  pendingStatus: {
    backgroundColor: '#ff6f61',
    color: '#fff',
  },
  paidStatus: {
    backgroundColor: '#4caf50',
    color: '#fff',
  },
  calendar: {
    marginTop: '12@ms',
    borderRadius: '8@s',

    backgroundColor: '#ffffff',
    padding: '8@ms',
    bottom: '60@vs',
  },

  calendarDay: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Bold',
    width: '14%',
    textAlign: 'center',
  },
  calendarDate: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Regular',
    width: '14%',
    textAlign: 'center',
    paddingVertical: '4@vs',
  },
  highlightedDate: {
    backgroundColor: '#6200ee',
    color: '#fff',
    borderRadius: '4@s',
  },
  learningContainer: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: '10@ms',
  },
  learningSection: {
    marginBottom: '20@vs',
  },
  learningSectionTitle: {
    fontSize: '17@ms',
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
    marginBottom: '10@vs',
  },
  card: {
    width: width * 0.7,
    backgroundColor: '#fff',
    borderRadius: '10@s',
    borderWidth: 1,
    borderColor: '@000',
    marginRight: '15@s',
    padding: '15@ms',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardIcon: {
    alignSelf: 'flex-start',
    marginBottom: '10@vs',
  },
  cardDate: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Regular',
    color: '#888',
    textAlign: 'right',
    marginBottom: '40@vs',
    marginTop: '-40@vs',
  },
  cardTitle: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
    textAlign: 'left',
    marginBottom: '10@vs',
  },
  cardDetails: {
    fontSize: '11@ms',
    fontFamily: 'Poppins-Regular',
    color: '#555',
    textAlign: 'left',
    marginBottom: '10@vs',
  },
  cardLink: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
    textAlign: 'left',
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10@vs',
    bottom: '80@vs',
  },
  dropdown: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-Regular',
    color: '#0078fe',
  },
  progressBarContainer: {
    marginBottom: '15@vs',
    bottom: '70@vs',
  },
  progressLabel: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Regular',
    color: '#333',
    marginBottom: '5@vs',
  },
  progressBarBackground: {
    width: '100%',
    height: '8@vs',
    borderRadius: '4@s',
    backgroundColor: '#e0e0e0',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: '4@s',
  },
  rangeLabel: {
    fontSize: '10@ms',
    fontFamily: 'Poppins-Regular',
    color: '#777',
    marginTop: '5@vs',
  },
  hallOfExcellenceContainer: {
    backgroundColor: '#F9F9F9',
    paddingVertical: '10@vs',
    marginBottom: '20@vs',
    bottom:'25@vs',
  },
  hallOfExcellenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: '20@s',
    marginBottom: '15@vs',
  },
  title: {
    fontSize: '17@ms',
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
  },
  leaderboardText: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Medium',
    color: '#000',
  },
  hallOfExcellenceCard: {
    backgroundColor: '#FFF',
    marginHorizontal: '15@s',
    borderRadius: '10@s',
    alignItems: 'center',
    paddingVertical: '20@vs',
    
  },
  imageContainer: {
    position: 'relative',
  },
  hallOfExcellenceProfileImage: {
    width: '80@ms',
    height: '80@vs',
    borderRadius: '50@s',
    resizeMode: 'contain',
  },
  medalIcon: {
    resizeMode:'contain',
    width: '30@ms',
    height: '30@vs',
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  achieverTitle: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-Regular',
    color: '#000',
    marginTop: '10@vs',
  },
  achieverName: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
    marginTop: '5@vs',
  },
  achieverDescription: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Regular',
    color: '#000',
    textAlign: 'center',
    marginTop: '5@vs',
    paddingHorizontal: '20@s',
  },
});

