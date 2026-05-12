import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { ScaledSheet, moderateScale, scale } from 'react-native-size-matters';
import { Calendar } from 'react-native-calendars';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../api';
import { useUser } from '../Context/UserContext';
import { DayAttendance, MarkedDates, studentSubjects } from '../types';
import { useNavigation } from '@react-navigation/native';
import { useSubjects } from '../Context/TeacherSubjectContext';
import { Dropdown } from 'react-native-element-dropdown';
import { useTranslation } from 'react-i18next';

const StudentProgress = () => {
  const { user } = useUser();
  const navigaiton = useNavigation();
  const [attendanceData, setAttendanceData] = useState({
    present: '0',
    absent: '0',
    late: '0',
    leave: '0',
    total_days: 0,
    attendance_percentage: '0.00',
  });
  const [monthAttendanceData, setMonthAttendanceData] = useState({});
  const [markedDates, setMarkedDates] = useState({});
  const { sectionId } = useSubjects();

  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState({
    completed: 0,
    pending: 0,
    total: 0,
  });
  const [studentSubjectList, setStudentSubjectList] = useState<
    studentSubjects[]
  >([]);
  const [selectedSubject, setSelectedSubject] = useState(null); // For dropdown
  const [loading, setLoading] = useState(true);
  const [examTermList, setExamTermList] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [examProgress, setExamProgress] = useState([]);
  const [studentProgress, setStudentProgress] = useState({});
  const { t } = useTranslation();

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
        if (attendance) {
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
        }
      } else {
        Alert.alert(
          'Error',
          response?.data?.message || 'Failed to fetch attendance data.',
        );
      }
    } catch (error) {
      // console.error('Error fetching attendance data:', error);
      console.log(
        'Error',
        'Unable to fetch attendance data. Please try again.',
      );
    }
  };

  const fetchMonthAttendance = async (selectedMonth?: string) => {
    try {
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1; // getMonth() is zero-based

      // Use the selected month if provided, otherwise default to the current month
      const monthToFetch =
        selectedMonth ||
        `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

      const payload = {
        student_id: user?.student_id,
        school_id: user?.company_id,
        school_campus_id: user?.school_campus_id,
        month: monthToFetch,
      };

      // console.log('Payload for Attendance:', payload);

      const response = await api.protected.post(
        'student/getMonthWiseAttendance',
        payload,
      );
      // console.log('Attendance Data:', response?.data);

      if (response?.data?.status === 'success') {
        const attendance = response.data.data.day_wise_attendance;

        // Transform fetched attendance to marked dates
        const [year, month] = monthToFetch.split('-').map(Number);
        const newMarkedDates = transformAttendanceToMarkedDates(
          attendance,
          year,
          month,
        );

        // Merge new marked dates with existing ones
        setMarkedDates(prevMarkedDates => ({
          ...prevMarkedDates,
          ...newMarkedDates,
        }));

        setMonthAttendanceData(response.data.data.month_summary); // Update summary
      } else {
        Alert.alert(
          'Error',
          response?.data?.message || 'Failed to fetch attendance data.',
        );
      }
    } catch (error) {
      // console.error('Error fetching attendance data:', error);
      console.log(
        'Error',
        'Unable to fetch attendance data. Please try again.',
      );
    }
  };

  // Fetch the subject list on component mount

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
          const formattedSubjects = data.map(subject => ({
            label: subject.subject_name, // For dropdown label
            value: subject.subject_id, // For dropdown value
            teacher_name: subject.teacher_name,
            start_time: subject.time_slots[0]?.start_time || 'N/A',
            end_time: subject.time_slots[0]?.end_time || 'N/A',
            task_count: subject.task_count,
          }));

          setStudentSubjectList(formattedSubjects);
          setSelectedSubject(formattedSubjects[0]?.value); // Set the first subject as default
          // console.log('Subject List Data:', formattedSubjects);
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

  // Fetch test history function
  const fetchStudentsTestHistory = async () => {
    if (!selectedSubject) {
      // console.log('No subject selected, skipping fetch');
      return; // Exit if no subject is selected
    }

    setLoading(true); // Start loading before fetching data

    try {
      const payload = {
        student_id: user?.student_id,
        subject_id: selectedSubject,
        school_id: user?.company_id,
        school_campus_id: user?.school_campus_id,
        test_filter: 2,
      };

      const response = await api.protected.post('student/testList', payload);
      if (response?.data?.success) {
        const { data, counts } = response.data;

        if (Array.isArray(data)) {
          const normalizedData = data.map(item => ({
            ...item,
            marks_received: parseFloat(item.marks_received) || 0,
            total_marks: parseFloat(item.total_marks) || 0,
          }));
          // console.log('Normalized Data:', normalizedData);
          setStudents(normalizedData); // Set normalized student data
        }

        if (counts) {
          setSummary({
            completed: counts.completed_tests || 0,
            pending: counts.pending_tests || 0,
            total: counts.total_tests || 0,
          });
        }
      } else {
        // console.error(
        //   'Failed to fetch student test history:',
        //   response?.data?.message,
        // );
      }
    } catch (error) {
      //  console.error('Error fetching student test history:', error);
    } finally {
      setLoading(false); // End loading after fetching data
    }
  };

  const fetchExamTermList = async () => {
    try {
      const payload = {
        school_id: user?.company_id, // Replace `user` with the actual source of user data
        school_campus_id: user?.school_campus_id,
      };

      // console.log('Payload for API:', payload);

      const response = await api.protected.post(
        'student/examTermTypeList',
        payload,
      );

      // console.log('Full API Response:', response);

      if (response?.data?.status === 'success') {
        const examTermList = response.data.data;
        // console.log('Exam Term List:', examTermList);

        const formattedExamTermList = examTermList.map(term => ({
          label: term.name,
          value: term.id,
        }));

        // console.log(
        //   'Formatted Exam Term List for Dropdown:',
        //   formattedExamTermList,
        // );

        // Set the formatted list and set default selectedTerm to the term at index 1 (if available)
        setExamTermList(formattedExamTermList); // Update state with exam term list
        if (formattedExamTermList[1]) {
          setSelectedTerm(formattedExamTermList[1].value); // Set the second term as default
        }
      } else {
        // console.error(
        //   'API returned an error:',
        //   response?.data?.message || 'Unexpected error',
        // );
      }
    } catch (error) {
      // console.error('Error fetching exam term list:', error);
    }
  };

  const fetchExamProgress = async () => {
    try {
      // Prepare the payload
      const payload = {
        exam_term_type_id: selectedTerm,
        school_id: user?.company_id,
        school_campus_id: user?.school_campus_id,
        student_id: user?.student_id,
      };

      // console.log('Payload for fetching student exam progress:', payload);

      // Make the API call
      const response = await api.protected.post(
        'teacher/progress/examProgress',
        payload,
      );

      // console.log('Full API Response for Exam Progress:', response);

      // Process the response
      if (response?.data?.status === 'success') {
        const examProgressData = response.data.data.subject_progress;
        setExamProgress(examProgressData); // Update state with fetched data
      } else {
        // console.error(
        //   'API returned an error:',
        //   response?.data?.message || 'Unexpected error',
        // );
      }
    } catch (error) {
      // console.error('Error fetching student exam progress:', error);
    } finally {
      setLoading(false);
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

  //   if (loading) {
  //     return <ActivityIndicator size="large" color="#0000ff" />;
  //   }

  //   if (students.length === 0) {
  //     return <Text>No tests available for the selected subject.</Text>;
  //   }

  // First useEffect: Run on component mount (does not depend on selectedSubject)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // Set loading to true before starting fetch

      try {
        await fetchAttendanceData(); // Fetch attendance data
        await fetchMonthAttendance(); // Fetch month attendance
        await fetchSubjectList(); // Fetch subject list
        await fetchExamTermList();
        await fetchStudentProgress();
      } catch (error) {
        // console.error('Error fetching student details:', error);
      } finally {
        setLoading(false); // Set loading to false after all fetch operations complete
      }
    };

    fetchData(); // Call the async function
  }, []); // Empty dependency array ensures this only runs on mount

  // Second useEffect: Run only when selectedSubject changes
  useEffect(() => {
    const fetchStudentsTestHistoryData = async () => {
      if (!selectedSubject) {
        // console.log('No subject selected, skipping fetch');
        return; // Skip if no subject is selected
      }

      setLoading(true); // Set loading to true before starting fetch

      try {
        await fetchStudentsTestHistory(); // Fetch student test history
      } catch (error) {
        //  console.error('Error fetching student test history:', error);
      } finally {
        setLoading(false); // Set loading to false after fetch completes
      }
    };

    fetchStudentsTestHistoryData(); // Call the async function if selectedSubject is available
  }, [selectedSubject]); // Dependency on selectedSubject

  useEffect(() => {
    const fetchStudentsExamProgressData = async () => {
      if (!selectedTerm) {
        ('No term selected, skipping fetch');
        return; // Skip if no subject is selected
      }

      setLoading(true); // Set loading to true before starting fetch

      try {
        await fetchExamProgress(); // Fetch student test history
      } catch (error) {
        // console.error('Error fetching student test history:', error);
      } finally {
        setLoading(false); // Set loading to false after fetch completes
      }
    };

    fetchStudentsExamProgressData(); // Call the async function if selectedSubject is available
  }, [selectedTerm]); // Dependency on selectedSubject

  const renderTest = ({ item }) => {
    // Log the marks_received and total_marks values before rendering
    // console.log('Marks Received:', item.marks_received);
    // console.log('Total Marks:', item.total_marks);

    // Display the values safely
    return (
      <View style={styles.taskRow}>
        <Text style={styles.taskText}>{item.test_name}</Text>
        <Text style={styles.taskText}>{item.start_date}</Text>
        <Text style={styles.taskStatusText}>
          {item.marks_received}/{item.total_marks}
        </Text>
      </View>
    );
  };

  const renderExam = ({ item }) => (
    <View style={styles.examTaskRow}>
      <Text style={styles.taskText}>{item.subject_name}</Text>
      <Text style={styles.taskStatusText}>{item.exam_date}</Text>

      <Text style={styles.taskMarksText}>
        {item.marks_received === '0.00' && item.grade === null
          ? 'N/A/' + item.total_marks
          : `${item.marks_received}/${item.total_marks}`}
      </Text>
      <Text style={styles.taskStatusText}>
        {item.grade !== null ? item.grade : 'N/A'}
      </Text>
    </View>
  );

  // Attendance Colors
  const attendanceColors = {
    1: '#82c885', // Present
    2: '#f56b6b', // Absent
    3: '#ffc83d', // Late
  };

  // Transform Attendance to Marked Dates
  const transformAttendanceToMarkedDates = (
    attendanceData: DayAttendance[],
    year: number,
    month: number,
  ): MarkedDates => {
    const markedDates: MarkedDates = {};

    attendanceData.forEach(day => {
      const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(
        day.date,
      ).padStart(2, '0')}`;

      markedDates[formattedDate] = {
        selected: true,
        selectedColor:
          attendanceColors[day.attendence_type as number] || 'orange',
      };
    });

    return markedDates;
  };

  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigaiton.goBack()}>
          <Icon name="arrow-back" size={moderateScale(24)} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('my_progress')}</Text>
        <TouchableOpacity onPress={() => navigaiton.navigate('Announcements')}>
          <Icon name="notifications" size={moderateScale(24)} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Attendance Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>{t('attendance_summary')}</Text>

            <Text style={styles.dropdownText}>{t('yearly')}</Text>

          </View>
          <View style={styles.summaryDetails}>
            <View>
              <Text style={styles.summaryText}>{t('total_days')}</Text>
              <Text style={styles.summaryValue}>
                {attendanceData?.total_days}
              </Text>
            </View>
            <Text style={styles.progressText}>
              {attendanceData?.attendance_percentage}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Number(attendanceData?.attendance_percentage) || 0}%`, },
              ]}
            />
          </View>
          <View style={styles.attendanceCounts}>
            <Text style={styles.countText}>
              {t('days_attended')}
            </Text>
            <Text style={styles.countText}>
              {t('days_absent')}
            </Text>
            <Text style={styles.countText}>
              {t('days_late')}
            </Text>

          </View>
          <View style={styles.attendanceCountsNumber}>
            <Text style={styles.countTextNumber}>
              {attendanceData?.present}
            </Text>
            <Text style={styles.countTextNumber}>
              {attendanceData?.absent}
            </Text>
            <Text style={styles.countTextNumber}>
              {attendanceData?.late}
            </Text>
          </View>
        </View>

        {/* Status Indicators */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>{t('status')} :</Text>
          <View style={styles.statusTags}>
            <View style={[styles.statusTag, { backgroundColor: '#82c885' }]}>
              <Text style={styles.statusText}>{t('present')}</Text>
            </View>
            <View style={[styles.statusTag, { backgroundColor: '#f56b6b' }]}>
              <Text style={styles.statusText}>{t('absent')}</Text>
            </View>
            <View style={[styles.statusTag, { backgroundColor: '#ffc83d' }]}>
              <Text style={styles.statusText}>{t('late')}</Text>
            </View>
          </View>
        </View>

        {/* Calendar */}
        <Calendar
          style={styles.calendar}
          theme={{
            backgroundColor: '#fff',
            calendarBackground: '#fff',
            textSectionTitleColor: '#000',
            dayTextColor: '#000',
            monthTextColor: '#000',
            arrowColor: '#000',
          }}
          markedDates={markedDates} // Pass dynamic marked dates
          monthFormat="MMMM yyyy"
          hideExtraDays
          firstDay={1}
          onMonthChange={({ year, month }) => {
            const formattedMonth = `${year}-${String(month).padStart(2, '0')}`; // Format to YYYY-MM
            fetchMonthAttendance(formattedMonth); // Call the fetch function with the formatted month
          }}
        />

        <View style={styles.progressBarContainer}>
          <Text style={styles.progressLabel}>{t('total_days')}</Text>
          <Text style={styles.progressLabel}>{monthAttendanceData?.total_days}</Text>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarBottom,
                { width: `${Number(monthAttendanceData?.attendance_percentage) || 0}%`, backgroundColor: 'green' },
              ]}
            />
          </View>
          <Text style={styles.progressLabelPercentage}>{parseFloat(monthAttendanceData?.attendance_percentage)}%</Text>
        </View>

        {/* Monthly Summary */}
        <View style={styles.monthSummary}>
          <Text style={styles.monthText}>{currentMonthName} {t('present')}: {monthAttendanceData?.present}</Text>
          <Text style={styles.monthText}>{currentMonthName} {t('absent')}: {monthAttendanceData?.absent}</Text>
          <Text style={styles.monthText}>{currentMonthName} {t('late')}: {monthAttendanceData?.late}</Text>
        </View>
        <View style={styles.testHeaderSection}>
          <Text style={styles.sectionTitle}>{t('tests')}</Text>
          <View style={styles.dropDownContainer}>
            <Dropdown
              data={studentSubjectList}
              labelField="label"
              valueField="value"
              value={selectedSubject}
              placeholder="Select Subject"
              onChange={item => setSelectedSubject(item.value)}
              style={styles.dropdown}
              selectedTextStyle={{
                color: '#fff',
                fontSize: moderateScale(10),
                fontFamily: 'Poppins-Regular',
                left: scale(5),
              }} // Text color for selected item
              placeholderStyle={{ color: '#fff', fontSize: moderateScale(10) }} // Text color for placeholder
              labelStyle={{ color: '#fff', fontSize: moderateScale(9) }} // Text color for dropdown items
              iconStyle={{ tintColor: '#fff' }}
              itemTextStyle={{
                color: '#000',
                fontSize: moderateScale(10),
                fontFamily: 'Poppins-Regular',
              }}
            />
          </View>
        </View>
        {/* <View style={styles.summaryContainer}>
                <Text style={styles.title}>Subject name:</Text>
                <Text style={styles.summaryTestText}>
                  Completed Tests: {summary?.completed || 0} |
                  Pending Tests: {summary?.pending || 0} |
                  Total Tests: {summary?.total || 0}
                </Text>
              </View> */}

        <View style={styles.testProgressBarContainer}>
          <Text style={styles.progressLabel}>
            {studentProgress?.combined_percentage}%
          </Text>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarBottom,
                {
                  width: `${Number(studentProgress?.combined_percentage) || 0
                    }%`,
                  backgroundColor: 'green',
                },
              ]}
            />
          </View>
          <Text style={styles.progressLabelPercentage}>100%</Text>
        </View>
        <View style={styles.testContainer}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderText}>{t('test_name')}</Text>
            <Text style={styles.tableHeaderText}>{t('assigned_date')}</Text>
            <Text style={styles.tableHeaderText}>{t('gained_marks')}</Text>
          </View>
          <View style={styles.testListContainer}>
            <FlatList
              data={students}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderTest}
              contentContainerStyle={styles.list}
            />
          </View>
        </View>
        <View style={styles.examHeaderSection}>
          <Text style={styles.sectionTitle}>{t('exams')}</Text>
          <View style={styles.dropDownContainer}>
            <Dropdown
              data={examTermList}
              labelField="label"
              valueField="value"
              value={selectedTerm}
              placeholder="Select term"
              onChange={item => setSelectedTerm(item.value)}
              style={styles.dropdown}
              selectedTextStyle={{
                color: '#fff',
                fontSize: moderateScale(11),
                fontFamily: 'Poppins-Regular',
                left: scale(5),
              }} // Text color for selected item
              placeholderStyle={{ color: '#fff', fontSize: scale(10) }} // Text color for placeholder
              labelStyle={{ color: '#fff', fontSize: moderateScale(10) }} // Text color for dropdown items
              iconStyle={{ tintColor: '#fff' }}
              itemTextStyle={{
                color: '#000',
                fontSize: moderateScale(10),
                fontFamily: 'Poppins-Regular',
              }}
            />
          </View>
        </View>
        <View style={styles.examProgressBarContainer}>
          <Text style={styles.progressLabel}>
            {studentProgress?.exam_percentage}%
          </Text>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarBottom,
                {
                  width: `${Number(studentProgress?.exam_percentage) || 0}%`,
                  backgroundColor: 'green',
                },
              ]}
            />
          </View>
          <Text style={styles.progressLabelPercentage}>100%</Text>
        </View>
        <View style={styles.testContainer}>
          <View style={styles.examTableHeader}>
            <Text style={styles.tableHeaderText}>{t('name')}</Text>
            <Text style={styles.tableHeaderText}>{t('date')}</Text>
            <Text style={styles.tableHeaderText}>{t('marks')}</Text>
            <Text style={styles.tableHeaderText}>{t('grade')}</Text>
          </View>
          <View style={styles.examListContainer}>
            <FlatList
              data={examProgress}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderExam}
              contentContainerStyle={styles.list}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: '15@s', // Horizontal scaling
    paddingTop: '20@vs', // Vertical scaling
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
    marginBottom: '20@vs', // Vertical scaling
  },
  headerTitle: {
    fontSize: '15@ms', // Width scaling (font size should generally scale based on width)
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },
  summaryCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: '10@s', // Corner radius uses `s`
    padding: '20@ms', // Padding uses `s`
    marginBottom: '20@vs', // Vertical margin
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15@vs', // Vertical margin
  },
  summaryTitle: {
    fontSize: '13@ms',
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-Regular',
    color: '#000',
    marginRight: '5@s', // Horizontal margin
  },
  summaryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10@vs', // Vertical margin
  },
  summaryText: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-Regular',
    color: '#000',
  },
  summaryValue: {
    fontSize: '16@ms',
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
  },
  progressText: {
    fontSize: '16@ms',
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
  },
  progressBar: {
    height: '10@vs', // Vertical height
    borderRadius: '5@s', // Corner radius uses `s`
    backgroundColor: '#e0e0e0',
    marginBottom: '10@vs', // Vertical margin
  },
  progressFill: {
    width: '69%', // Percentage-based width does not require scaling
    height: '100%',
    backgroundColor: '#82c885',
    borderRadius: '5@s', // Corner radius
  },
  attendanceCounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: '10@s', // Horizontal margin
    right: '10@s', // Horizontal adjustment

  },
  countText: {
    fontSize: '10@ms',
    fontFamily: 'Poppins-Regular',
    color: '#000',
  },
  attendanceCountsNumber: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: '20@s', // Horizontal margin
    right: '15@s', // Horizontal adjustment
  },
  countTextNumber: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Regular',
    color: '#000',
  },
  statusContainer: {
    marginBottom: '20@vs', // Vertical margin
  },
  statusTitle: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-Regular',
    color: '#000',
    marginBottom: '10@vs', // Vertical margin
    top: '10@vs', // Vertical adjustment
  },
  statusTags: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: '45@ms', // Margin scaling
    bottom: '70@vs', // Vertical adjustment
    left: '20@s', // Horizontal adjustment
    gap: '5@s',
  },
  statusTag: {
    borderRadius: '5@s', // Corner radius
    paddingHorizontal: '8@s', // Horizontal padding
    paddingVertical: '5@vs', // Vertical padding
    marginTop: '8@vs'
  },
  statusText: {
    fontSize: '11@ms',
    fontFamily: 'Poppins-Bold',
    color: '#fff',
  },
  calendar: {
    borderRadius: '10@s', // Corner radius
    marginBottom: '20@vs', // Vertical margin

    bottom: '90@vs', // Vertical adjustment
  },
  progressBarContainer: {
    marginBottom: '15@vs', // Vertical margin
    bottom: '70@vs', // Vertical adjustment
  },
  progressLabel: {
    fontSize: '13@ms',
    fontFamily: 'Poppins-Regular',
    color: '#333',
    marginBottom: '5@vs', // Vertical margin
  },
  progressLabelPercentage: {
    fontSize: '13@ms',
    fontFamily: 'Poppins-Regular',
    color: '#333',
    marginBottom: '5@vs', // Vertical margin
    left: '280@s', // Horizontal adjustment
    bottom: '35@vs', // Vertical adjustment
  },
  progressBarBackground: {
    width: '100%', // Percentage-based width
    height: '8@vs', // Vertical height
    borderRadius: '4@s', // Corner radius
    backgroundColor: '#e0e0e0',
    overflow: 'hidden',
  },
  progressBarBottom: {
    height: '100%',
    borderRadius: '4@s', // Corner radius
  },
  rangeLabel: {
    fontSize: '10@ms',
    fontFamily: 'Poppins-Regular',
    color: '#777',
    marginTop: '5@vs', // Vertical margin
  },
  monthSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: '20@vs', // Vertical margin
    marginHorizontal: '10@s', // Horizontal margin
    bottom: '90@vs', // Vertical adjustment
    right: '10@s', // Horizontal adjustment
    gap: '5@s',
  },
  monthText: {
    fontSize: '11@ms',
    fontFamily: 'Poppins-Regular',
    color: '#000',
    marginBottom: '5@vs', // Vertical margin
  },
  examHeaderSection: {
    bottom: '40@s', // Universal scaling (position)
  },
  testHeaderSection: {
    bottom: '25@s', // Universal scaling (position)
  },
  progressBarContainer: {
    marginBottom: '15@vs', // Vertical scaling (margin)
    bottom: '70@vs', // Vertical scaling (position)
  },
  examProgressBarContainer: {
    marginBottom: '15@vs', // Vertical scaling (margin)
    bottom: '120@vs', // Vertical scaling (position)
  },
  testProgressBarContainer: {
    marginBottom: '15@vs', // Vertical scaling (margin)
    bottom: '105@vs', // Vertical scaling (position)
  },
  progressLabel: {
    fontSize: '13@ms', // Universal scaling (font size)
    fontFamily: 'Poppins-Regular',
    color: '#333',
    marginBottom: '5@vs', // Vertical scaling (margin)
  },
  progressLabelPercentage: {
    fontSize: '13@ms', // Universal scaling (font size)
    fontFamily: 'Poppins-Regular',
    color: '#333',
    marginBottom: '5@vs', // Vertical scaling (margin)
    left: '280@s', // Universal scaling (position)
    bottom: '35@vs', // Vertical scaling (position)
  },
  progressBarBackground: {
    width: '100%', // Use percentage for width, doesn't need scaling
    height: '8@vs', // Vertical scaling (height)
    borderRadius: '4@s', // Universal scaling (border radius)
    backgroundColor: '#e0e0e0',
    overflow: 'hidden',
  },
  progressBarBottom: {
    height: '100%', // Vertical scaling (height)
    borderRadius: '4@s', // Universal scaling (border radius)
  },
  rangeLabel: {
    fontSize: '10@ms', // Universal scaling (font size)
    fontFamily: 'Poppins-Regular',
    color: '#777',
    marginTop: '5@vs', // Vertical scaling (margin)
  },
  monthSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: '20@vs', // Vertical scaling (margin)
    marginHorizontal: '10@s', // Universal scaling (horizontal margin)
    bottom: '90@vs', // Vertical scaling (position)
    right: '10@s', // Universal scaling (position)
  },
  monthText: {
    fontSize: '11@ms', // Width scaling (font size)
    fontFamily: 'Poppins-Regular',
    color: '#000',
    marginBottom: '5@vs', // Vertical scaling (margin)
  },
  testContainer: {
    flex: 1,
    bottom: '60@vs', // Vertical scaling (position)
  },
  sectionTitle: {
    fontSize: '15@ms', // Width scaling (font size)
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
    bottom: '50@vs', // Vertical scaling (position)
    left: '10@s', // Universal scaling (position)
  },
  dropDownContainer: {
    paddingHorizontal: '120@s', // Universal scaling (horizontal padding)
    bottom: '90@vs', // Vertical scaling (position)
    left: '100@s', // Universal scaling (position)
  },
  dropdown: {
    height: '40@vs', // Vertical scaling (height)
    borderRadius: '8@s', // Universal scaling (border radius)
    marginBottom: '16@vs', // Use fixed margin, no scaling needed
    backgroundColor: 'green',
    width: '100@ms',
  },
  summaryContainer: {
    marginBottom: '16@vs', // Vertical scaling (margin)
    alignItems: 'center',
  },
  title: {
    fontSize: '16@ms', // Universal scaling (font size)
    fontFamily: 'Poppins-Bold',
    color: '#000',
    marginBottom: '4@vs', // Vertical scaling (margin)
  },
  summaryTestText: {
    fontSize: '14@ms', // Universal scaling (font size)
    fontFamily: 'Poppins-Regular',
    color: '#000',
    textAlign: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: '8@vs', // Vertical scaling (margin)
    paddingBottom: '8@vs', // Vertical scaling (padding)
    margin: '15@ms', // Width scaling (margin)
    bottom: '60@s', // Universal scaling (position)
    gap: '5@s',
  },
  examTableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: '8@vs', // Vertical scaling (margin)
    paddingBottom: '8@vs', // Vertical scaling (padding)
    margin: '15@ms', // Width scaling (margin)
    bottom: '70@s', // Universal scaling (position)
    left: '10@s', // Universal scaling (position)
  },
  tableHeaderText: {
    fontSize: '11@ms', // Universal scaling (font size)
    fontFamily: 'Poppins-Medium',
    color: '#000',
  },
  taskStatusText: {
    flex: 1,
    fontSize: '11@ms', // Universal scaling (font size)
    fontFamily: 'Poppins-Regular',
    color: '#000',
    left: '40@s', // Width scaling (position)
  },
  taskMarksText: {
    flex: 1,
    fontSize: '11@ms', // Universal scaling (font size)
    fontFamily: 'Poppins-Regular',
    color: '#000',
    left: '45@s', // Width scaling (position)
  },
  testListContainer: {
    bottom: '60@s', // Universal scaling (position)
  },
  examListContainer: {
    bottom: '70@s', // Universal scaling (position)
  },
  list: {
    marginTop: '8@vs', // Vertical scaling (margin)
  },
  examList: {
    marginTop: '8@vs', // Vertical scaling (margin)
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: '12@vs', // Vertical scaling (padding)
  },
  examTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: '12@vs', // Vertical scaling (padding)
  },
  summaryTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: '10@s', // Universal scaling (horizontal margin)
  },
  taskText: {
    flex: 1,
    fontSize: '11@ms', // Universal scaling (font size)
    fontFamily: 'Poppins-Regular',
    color: '#000',
    left: '15@s', // Width scaling (position)
  },
  completed: {
    fontFamily: 'Poppins-Regular',
    color: '#28A745', // Green for "Completed"
  },
  unsubmitted: {
    fontFamily: 'Poppins-Regular',
    color: '#FF0000', // Red for "Pending"
  },
});

export default StudentProgress;
