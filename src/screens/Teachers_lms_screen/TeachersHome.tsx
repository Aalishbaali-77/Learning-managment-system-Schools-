import {
  DrawerActions,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {Calendar} from 'react-native-calendars';
import {AnimatedCircularProgress} from 'react-native-circular-progress';
import {ScaledSheet, moderateScale, verticalScale} from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/FontAwesome';
import api from '../../api';
import {useSubjects} from '../../Context/TeacherSubjectContext';
import {useUser} from '../../Context/UserContext';
import {ClassItem} from '../../types';
import {getAccessToken} from '../../utils/storage';
import { ASSET_URL_HOE } from '../../constants';

type EmpIdProps = NativeStackScreenProps<any, any>;

const TeachersHome: React.FC<EmpIdProps> = props => {
  const navigation = useNavigation();
  const [classDetails, setClassDetails] = useState({
    className: '',
    sectionName: '',
  });
  const [classList, setClassList] = useState<ClassItem[]>([]);

  const {user} = useUser();
  const {setSectionId} = useSubjects();
  const schoolCampusId = user?.school_campus_id;
  const empId = user?.emp_id;
  const [announcement, setAnnouncement] = useState([]);
  const [loading, setLoading] = useState(false);
  const {sectionId} = useSubjects();
  const [markedDates, setMarkedDates] = useState({});
  const [eventsList, setEventsList] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(
    new Date().toISOString().split('T')[0],
  ); // Default to today's date
  const lastFetchedMonth = useRef<string | null>(null);
  const lastFetchedYear = useRef<string | null>(null);
  const [events, setEvents] = useState([]);
  const [data, setData] = useState({
    attendance_percentage: '0',
    test_percentage: '0',
    exam_percentage: '0',
  });
   const [rankings, setRankings] = useState([]);
  const [attendanceData, setAttendanceData] = useState({
    present: '0',
    absent: '0',
    late: '0',
    leave: '0',
    total_days: 0,
    attendance_percentage: '0.00',
  });
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

  // Fetch class teacher details
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
      // console.error('Error fetching class details:', error);
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

  const fetchClassesList = async () => {
    try {
      const response = await api.protected.get(
        `teacher/classesList?employee_id=${empId}&school_campus_id=${schoolCampusId}`,
      );
      // console.log('response of classes list', response.data);

      if (response?.data?.status === 'success') {
        const data = response.data.data; // Assuming the API returns an object of classes

        if (data && Object.keys(data).length > 0) {
          const classListArray = Object.values(data).map((item: any) => ({
            sectionId: item.section_id,
            className: item.class_name,
            sectionName: item.section_name,
            periodsToday: item.periods_today,
          }));
          setClassList(classListArray); // Set the state with the transformed array

          // Set sectionId in context
          const firstClass = classListArray[0]; // You can choose how to handle section_id
          if (firstClass) {
            setSectionId(firstClass.sectionId); // Set sectionId in the context
          }
        } else {
          // console.log('No class details');
        }
        // console.log(data); // Debugging
      } else {
        // console.log('error fetching class details');
      }
    } catch (error) {
      // console.error('Error fetching class details:', error);
    }
  };

  const fetchAnnouncement = async () => {
    const currentDate = new Date().toISOString().split('T')[0];

    const payload = {
      date: currentDate, // Example date, replace dynamically
      school_id: user?.company_id,
      school_campus_id: user?.school_campus_id,
      section_id: sectionId,
      employee_id: user?.emp_id,
      announcement_type: 2,
      publish: 1,
    };

    try {
      // console.log('Fetching announcement with payload:', payload);

      const response = await api.protected.post(
        'teacher/announcements/today-latest-annoucement',
        payload,
      );

      // console.log('API response received:', response);

      if (response && response.data && response.data.data) {
        setAnnouncement(response.data.data);
        // console.log('Announcement data set successfully:', response.data.data);
      } else {
        // console.warn(
        //   'Unexpected response structure or missing data:',
        //   response,
        // );
      }
    } catch (error) {
      // console.error('Failed to fetch announcement:', error);

      // Detailed error logging
      if (error.response) {
        // Server responded with a status code outside 2xx
        // console.error(
        //   'Server error:',
        //   error.response.status,
        //   error.response.data,
        // );
      } else if (error.request) {
        // No response received from the server
        // console.error('No response received:', error.request);
      } else {
        // Other errors (e.g., setup issues, network problems)
        // console.error('Unexpected error occurred:', error.message);
      }
    } finally {
      // console.log('Finished fetching announcement.');
    }
  };

  const fetchStudentProgress = async () => {
    if (!sectionId) {
      // console.error('Section ID is null or undefined.');
      return; // Early return if sectionId is null
    }

    try {
      const payload = {
        section_id: sectionId,
        school_id: user?.company_id,
        school_campus_id: user?.school_campus_id,
      };
      // console.log('payload of teacher student progress', payload);

      const response = await api.protected.post(
        'teacher/progress/section-performance',
        payload,
      );
      if (response.data.status === 'success') {
        const sectionPerformance = response.data.data;

        // Format and set the data
        const formattedData = {
          attendance_percentage: sectionPerformance.attendance.percentage, // Keep as number
          test_percentage: sectionPerformance.test.percentage,
          exam_percentage: sectionPerformance.exam.percentage, // Keep as number
        };

        setData(formattedData);
      } else {
        // console.error('Failed to fetch data:', response?.message);
      }
    } catch (error) {
      // console.error(
      //   "Error fetching student progress for teacher's home:",
      //   error,
      // );
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
            //console.log(error.response, 'Failed to load rankings');
          }
        } catch (err) {
          //console.log(error.response, 'Failed to load rankings');
        } 
      };

  // Trigger the fetch when sectionId is set or updated
  useEffect(() => {
    if (sectionId && user) {
      fetchStudentProgress();
      fetchRankings();
    }
  }, [user, sectionId]);

  // Use `useEffect` to fetch data on component mount
  useEffect(() => {
    const fetchInitialCalendarData = async () => {
      try {
        setLoading(true);
        const accessToken = await getAccessToken();
  
        if (user && accessToken) {
          // Step 1: Fetch calendar colors first
          await fetchAcademicCalendar(); // sets eventColors internally
  
          // Step 2: Set current month
          const today = new Date();
          const currentMonthName = today.toLocaleString('en-US', { month: 'long' });
          const currentYear = today.getFullYear().toString();
  
          setCurrentMonth(
            `${currentYear}-${(today.getMonth() + 1).toString().padStart(2, '0')}-01`
          );
          lastFetchedMonth.current = currentMonthName;
          lastFetchedYear.current = currentYear;
  
          // Step 3: Small delay to ensure eventColors state is applied (optional)
          await new Promise((res) => setTimeout(res, 50));
  
          // Step 4: Now fetch events with updated colors
          await fetchAcademicEvents(currentMonthName, currentYear);
        }
      } catch (error) {
        console.error('Error fetching teacher calendar data:', error);
      } finally {
        setLoading(false);
      }
    };
  
    const fetchOtherTeacherData = async () => {
      try {
        const accessToken = await getAccessToken();
        if (user && accessToken) {
          // Fetch non-calendar data in parallel
          await Promise.all([
            fetchClassTeacherDetails(),
            fetchClassesList(),
            fetchAnnouncement(),
            fetchStudentProgress(),
          ]);
        }
      } catch (error) {
        console.error('Error fetching teacher dashboard data:', error);
      }
    };
  
    fetchInitialCalendarData();
    fetchOtherTeacherData();
  }, [user]);
  

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}>
          <Icon name="align-left" size={22} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerLeft}>
          {/* Profile Image */}
          {/* <TouchableOpacity
            onPress={() => navigation.navigate('TeacherProfile')}>
            <Image
              source={require('../../assets/Images/EmptyWishlistandCart.png')}
              style={styles.profileImage}
            />
          </TouchableOpacity> */}
          <View>
            <Text style={styles.teacherName}>{user?.name}</Text>
            <Text style={styles.teacherInfo}>
              You are the Class Teacher of Class {classDetails.className}-
              {classDetails.sectionName}.
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.notification}
          onPress={() => navigation.navigate('TeacherAnnouncement')}>
          <Icon name="bell" size={moderateScale(24)} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Class Schedule */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Class Schedule</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {classList.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.classCard}
              onPress={() =>
                navigation.navigate('TeachersSubjects', {
                  sectionId: item.sectionId,
                  empId: user?.emp_id,
                  schoolCampusId: user?.school_campus_id,
                  classInfo: {
                    className: item.className,
                    sectionName: item.sectionName,
                  },
                })
              }>
              <Text style={styles.className}>
                {' '}
                {item.className} {item.sectionName}
              </Text>
              <Text numberOfLines={1} style={styles.classDetails}>
                {item.periodsToday} Periods Today.
              </Text>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('TeachersSubjects', {
                    sectionId: item.sectionId,
                    empId: user?.emp_id,
                    schoolCampusId: user?.school_campus_id,
                    classInfo: {
                      className: item.className,
                      sectionName: item.sectionName,
                    },
                  })
                }>
                <Text style={styles.viewDetails}>View All →</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Attendance */}

      <View style={styles.section}>
        <View style={styles.attendanceHeader}>
          <Text style={styles.sectionTitle}>Attendance</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('TeachersAttendance')}>
            <Text style={styles.viewDetail}>View Detail</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.attendanceCard}>
          <View style={styles.attendanceContent}>
            <View style={styles.attendanceInfo}>
              <Text style={styles.attendanceText}>
                Track your class attendance
              </Text>
              <View style={styles.attendanceTips}>
                <Text style={styles.attendanceTip}>
                  <Text style={styles.greenDot}>●</Text> Green: good attendance
                  (e.g., above 75%).
                </Text>
                <Text style={styles.attendanceTip}>
                  <Text style={styles.redDot}>●</Text> Red: low attendance
                  (e.g., below 50%).
                </Text>
              </View>
              <Text style={styles.attendanceSummary}>
                Keep it up! Great attendance
              </Text>
            </View>
            <View style={styles.circularProgressContainer}>
              <AnimatedCircularProgress
                size={120}
                width={7}
                fill={data?.attendance_percentage} // This is the percentage value
                tintColor="#00ff00" // Green for good attendance
                backgroundColor="#ff0000" // Red for remaining percentage
                rotation={0}
                lineCap="round">
                {() => (
                  <Text style={styles.progressText}>
                    {data?.attendance_percentage}%
                    <Text style={styles.totalAttendance}>
                      {'\n'}Total Attendance
                    </Text>
                  </Text>
                )}
              </AnimatedCircularProgress>
            </View>
          </View>
        </View>
      </View>

      {/* HallOfExcellence Section */}
            
            <View style={styles.hallOfExcellenceContainer}>
            {/* Header */}
            <View style={styles.hallOfExcellenceHeader}>
              <Text style={styles.title}>Hall of Excellence</Text>
              <TouchableOpacity onPress={() => navigation.navigate('TeachersHallOfExcellence')}>
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
          
      {/* Announcements */}
      <View style={styles.section}>
        <View style={styles.attendanceHeader}>
          <Text style={styles.sectionTitle}>Announcement</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('TeacherAnnouncement')}>
            <Text style={styles.viewDetail}>View Detail</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.announcementCard}>
          <Text style={styles.announcementDate}>{announcement.title}</Text>
          <Text style={styles.announcementDate}>
            {announcement.created_date}
          </Text>
          <Text style={styles.announcementText}>
            {announcement.description}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Academic Calendar */}
      <View style={styles.section}>
        <View style={styles.attendanceHeader}>
          <Text style={styles.sectionTitle}>Academic Calendar</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('TeachersAcademicCalendar')}>
            <Text style={styles.viewDetail}>View Details</Text>
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

            textMonthFontSize: 18, // Font size for the month in the header
            textDayHeaderFontSize: 14, // Font size for the weekday headers (e.g., Sun, Mon)
          }}
          style={styles.calendar}
        />
      </View>

      {/* Performance */}
      <View style={styles.section}>
        <View style={styles.performanceHeader}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('UpdatedClassProgress', {
                class_name: classDetails.className,
                sectionName: classDetails.sectionName,
              })
            }>
            <Text style={styles.dropdown}>View Detail</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.progressBarContainer}>
          <Text style={styles.progressLabel}>Attendance</Text>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Number(data?.attendance_percentage) || 0}%`,
                  backgroundColor: 'green',
                },
              ]}
            />
          </View>
          <Text style={styles.rangeLabel}>{data?.attendance_percentage}%</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <Text style={styles.progressLabel}>Test</Text>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Number(data?.test_percentage) || 0}%`,
                  backgroundColor: 'skyblue',
                },
              ]}
            />
          </View>
          <Text style={styles.rangeLabel}>{data?.test_percentage}%</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <Text style={styles.progressLabel}>Exam</Text>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Number(data?.exam_percentage) || 0}%`,
                  backgroundColor: 'yellow',
                },
              ]}
            />
          </View>
          <Text style={styles.rangeLabel}>{data.exam_percentage}%</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
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
    alignItems: 'center', // Ensure the items are aligned in the center vertically
    paddingHorizontal: '20@ms', // Added horizontal padding for spacing
    backgroundColor: '#ffffff',
    height: '70@vs', // Ensure there's enough height for the header
  },
  calendar: {
    marginTop: '12@vs',
    borderRadius: '8@s',
    elevation: 2, // Add shadow for Android
    backgroundColor: '#ffffff',
    padding: '8@ms',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: '25@ms',
    height: '25@vs',
    marginRight: '10@ms',
  },
  headerTitle: {
    fontSize: '18@ms',
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
    flex: 1, // Ensure the title takes available space and remains centered
  },
  profileImage: {
    width: '40@ms',
    height: '40@vs',
    borderRadius: '20@ms', // Ensures the image is round
    marginLeft: '10@ms', // Adjusted margin for spacing
    backgroundColor: '#ccc', // Fallback background color
  },
  teacherName: {
    fontSize: '15@ms',
    fontFamily: 'Poppins-SemiBold',
    marginTop: '5@vs',
    color: '#000', // Space between name and info
  },
  teacherInfo: {
    fontSize: '11@ms',
    color: '#666666',
    fontFamily: 'Poppins-Regular',
  },
  notification: {
    justifyContent: 'center',
  },
  notificationDot: {
    width: '10@ms',
    height: '10@vs',
    backgroundColor: '#ff0000',
    borderRadius: '5@ms',
  },
  section: {
    marginTop: '20@vs',
    paddingHorizontal: '20@ms',
  },
  sectionTitle: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-SemiBold',
    marginBottom: '10@vs',
    color: '#000',
  },
  classCard: {
    width: '120@ms',
    height: '90@vs',
    padding: '10@ms',
    backgroundColor: '#ffffff',
    borderRadius: '10@ms',
    marginRight: '10@ms',
  },
  className: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },
  classDetails: {
    fontSize: '10@ms',
    color: '#666666',
    marginVertical: '5@vs',
    fontFamily: 'Poppins-Regular',
  },
  viewDetails: {
    fontSize: '12@ms',
    color: '#1e90ff',
    fontFamily: 'Poppins-Regular',
  },
  link: {
    fontSize: '14@ms',
    color: '#000',
    fontFamily: 'Poppins-Regular',
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(10),
  },
  viewDetail: {
    fontSize: moderateScale(12),
    color: '#000',
    fontFamily: 'Poppins-Regular',
    bottom: verticalScale(4)
  },
  attendanceCard: {
    backgroundColor: '#ffffff',
    padding: moderateScale(15),
    borderRadius: moderateScale(10),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1, // Adjust the width of the border
    borderColor: '#000',
  },
  attendanceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendanceInfo: {
    flex: 1,
  },
  attendanceText: {
    fontSize: moderateScale(11),
    color: '#666666',
    marginBottom: moderateScale(10),
    fontFamily: 'Poppins-Regular',
  },
  attendanceTips: {
    marginBottom: moderateScale(10),
  },
  attendanceTip: {
    fontSize: moderateScale(11),
    color: '#666666',
    fontFamily: 'Poppins-Regular',
  },
  greenDot: {
    color: '#00ff00',
  },
  redDot: {
    color: '#ff0000',
  },
  attendanceSummary: {
    fontSize: moderateScale(11),
    fontFamily: 'Poppins-SemiBold',
    color: '#666666',
  },
  circularProgressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: moderateScale(20),
  },
  progressText: {
    fontSize: moderateScale(14),
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
    color: '#666666',
  },
  totalAttendance: {
    fontSize: moderateScale(8),
    fontFamily: 'Poppins-Regular',
    color: '#999999',
  },
  announcementCard: {
    backgroundColor: '#ffffff',
    padding: '15@ms',
    borderRadius: '10@ms',
  },
  announcementDate: {
    fontSize: '12@ms',
    color: '#1e90ff',
    marginBottom: '10@ms',
    fontFamily: 'Poppins-Regular',
  },
  announcementText: {
    fontSize: '12@ms',
    color: '#666666',
    fontFamily: 'Poppins-Regular',
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10@vs',
  },
  dropdown: {
    fontSize: '12@ms',
    color: '#000',
    fontFamily: 'Poppins-Regular',
  },
  progressBarContainer: {
    marginBottom: '15@vs',
  },
  progressLabel: {
    fontSize: '12@s',
    color: '#333',
    marginBottom: '5@vs',
    fontFamily: 'Poppins-SemiBold',
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
    fontSize: '10@s',
    color: '#777',
    marginTop: '5@vs',
    fontFamily: 'Poppins-Regular',
  },
  hallOfExcellenceContainer: {
    backgroundColor: '#F9F9F9',
    paddingVertical: '10@vs',
    marginBottom: '5@vs',
    marginTop: '10@vs',

  },
  hallOfExcellenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: '20@s',
    marginBottom: '15@vs',
  },
  title: {
    fontSize: '15@ms',
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
  },
  leaderboardText: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Regular',
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

export default TeachersHome;
