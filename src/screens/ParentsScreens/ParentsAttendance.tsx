import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {ScaledSheet, moderateScale} from 'react-native-size-matters';
import {Calendar} from 'react-native-calendars';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../api';
import { useUser } from '../../Context/UserContext';
import { useNavigation } from '@react-navigation/native';


const ParentsAttendance = () => {
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
  const [monthAttendanceData, setMonthAttendanceData] = useState({})
  const [markedDates, setMarkedDates] = useState({});
  const [loading, setLoading] = useState(true)

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
        payload
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
            attendance_percentage: Number(attendance.attendance_percentage) || 0,
          });
        }
      } else {
        Alert.alert(
          'Error',
          response?.data?.message || 'Failed to fetch attendance data.'
        );
      }
    } catch (error) {
     // console.error('Error fetching attendance data:', error);
      Alert.alert(
        'Error',
        'Unable to fetch attendance data. Please try again.'
      );
    }
  };

  const fetchMonthAttendance = async (selectedMonth?: string) => {
    try {
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1; // getMonth() is zero-based

      // Use the selected month if provided, otherwise default to the current month
      const monthToFetch = selectedMonth || `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

      const payload = {
        student_id: user?.student_id,
        school_id: user?.company_id,
        school_campus_id: user?.school_campus_id,
        month: monthToFetch,
      };

      // console.log('Payload for Attendance:', payload);

      const response = await api.protected.post('student/getMonthWiseAttendance', payload);
      // console.log('Attendance Data:', response?.data);

      if (response?.data?.status === 'success') {
        const attendance = response.data.data.day_wise_attendance;

        // Transform fetched attendance to marked dates
        const [year, month] = monthToFetch.split('-').map(Number);
        const newMarkedDates = transformAttendanceToMarkedDates(attendance, year, month);

        // Merge new marked dates with existing ones
        setMarkedDates((prevMarkedDates) => ({
          ...prevMarkedDates,
          ...newMarkedDates,
        }));

        setMonthAttendanceData(response.data.data.month_summary); // Update summary
      } else {
        Alert.alert('Error', response?.data?.message || 'Failed to fetch attendance data.');
      }
    } catch (error) {
     // console.error('Error fetching attendance data:', error);
      Alert.alert('Error', 'Unable to fetch attendance data. Please try again.');
    }
  };

  // UseEffect to fetch current month attendance on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchAttendanceData();
      await fetchMonthAttendance();
      setLoading(false);
    };

    loadData();
  }, []);

  // Attendance Colors
  const attendanceColors = {
    1: '#82c885', // Present
    2: '#f56b6b', // Absent
    3: '#ffc83d', // Late
  };

  // Transform Attendance to Marked Dates
  const transformAttendanceToMarkedDates = (attendanceData: DayAttendance[], year: number, month: number): MarkedDates => {
    const markedDates: MarkedDates = {};

    attendanceData.forEach((day) => {
      const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day.date).padStart(2, '0')}`;

      markedDates[formattedDate] = {
        selected: true,
        selectedColor: attendanceColors[day.attendence_type as number] || 'orange',
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
        <Text style={styles.headerTitle}>Attendance</Text>
        <TouchableOpacity onPress={() => navigaiton.navigate('ParentsAnnouncement')}>
          <Icon name="notifications" size={moderateScale(24)} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Attendance Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Attendance Summary</Text>

            <Text style={styles.dropdownText}>Yearly</Text>

          </View>
          <View style={styles.summaryDetails}>
            <View>
              <Text style={styles.summaryText}>Total Days</Text>
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
              Days Attended
            </Text>
            <Text style={styles.countText}>
              Days Absent
            </Text>
            <Text style={styles.countText}>
              Days Late
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
          <Text style={styles.statusTitle}>Status :</Text>
          <View style={styles.statusTags}>
            <View style={[styles.statusTag, { backgroundColor: '#82c885' }]}>
              <Text style={styles.statusText}>Present</Text>
            </View>
            <View style={[styles.statusTag, { backgroundColor: '#f56b6b' }]}>
              <Text style={styles.statusText}>Absent</Text>
            </View>
            <View style={[styles.statusTag, { backgroundColor: '#ffc83d' }]}>
              <Text style={styles.statusText}>Late</Text>
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
          <Text style={styles.progressLabel}>Total Days</Text>
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
          <Text style={styles.monthText}>{currentMonthName} Present: {monthAttendanceData?.present}</Text>
          <Text style={styles.monthText}>{currentMonthName} Absent: {monthAttendanceData?.absent}</Text>
          <Text style={styles.monthText}>{currentMonthName} Late: {monthAttendanceData?.late}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: '15@s', // Horizontal padding
    paddingTop: '20@vs', // Vertical padding
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20@vs', // Vertical margin
  },
  headerTitle: {
    fontSize: '15@ms', // Font size scaling
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
    fontSize: '16@ms',
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
    fontSize: '12@ms',
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
  },
  statusTag: {
    borderRadius: '5@s', // Corner radius
    paddingHorizontal: '15@s', // Horizontal padding
    paddingVertical: '5@vs', // Vertical padding
    marginTop: '8@vs',
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
  },
  monthText: {
    fontSize: '11@ms',
    fontFamily: 'Poppins-Regular',
    color: '#000',
    marginBottom: '5@vs', // Vertical margin
  },
});

export default ParentsAttendance;
