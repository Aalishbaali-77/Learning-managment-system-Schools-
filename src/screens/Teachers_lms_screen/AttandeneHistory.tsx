import {Picker} from '@react-native-picker/picker'; // Dropdown picker component
import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {Calendar} from 'react-native-calendars'; // Import Calendar component
import Modal from 'react-native-modal'; // Import Modal for bottom sheet
import Icon from 'react-native-vector-icons/MaterialIcons'; // For bell icon
import api from '../../api';
import {useNavigation} from '@react-navigation/native';
import {useUser} from '../../Context/UserContext';
import {useSubjects} from '../../Context/TeacherSubjectContext';
import {Dropdown} from 'react-native-element-dropdown';
import {moderateScale, ScaledSheet} from 'react-native-size-matters';
import {getAccessToken} from '../../utils/storage';

const AttendanceHistory = () => {
  const [selectedStatus, setSelectedStatus] = useState('Status');
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [summary, setSummary] = useState({
    present: 0,
    absent: 0,
    late: 0,
    leave: 0,
  });
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState('Select Date');
  const [isCalendarVisible, setIsCalendarVisible] = useState(false); // State to control calendar visibility
  const {user} = useUser();
  const {sectionId} = useSubjects();

  // Replace with actual values
  const employee_id = user?.emp_id;
  const school_campus_id = user?.school_campus_id;
  const section_id = sectionId;
  const school_id = user?.company_id;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const accessToken = await getAccessToken(); // Await the token from AsyncStorage
        if (user && accessToken) {
          // Fetch data only after user and token are available
          await fetchAttendanceHistory();
        }
      } catch (error) {
        // console.error('Error fetching access token or data:', error);
      } finally {
        setLoading(false);
        // console.log('Finished fetching data.');
      }
    };
    fetchData();
  }, [user, selectedStatus, selectedDate]); // Trigger fetch when selectedStatus or selectedDate changes

  const fetchAttendanceHistory = async () => {
    // Map the selected status to its corresponding attendence_type value
    const attendenceTypeMapping = {
      Present: '1',
      Absent: '2',
      Late: '3',
      Leave: '4',
    };

    const attendence_type = attendenceTypeMapping[selectedStatus];

    // Log the payload
    // console.log('log for student attendance history payload', {
    //   employee_id,
    //   section_id,
    //   school_id,
    //   school_campus_id,
    //   attendence_type:
    //     selectedStatus === 'Status' ? undefined : attendence_type,
    //   selectedDate, // Send selectedDate as part of the payload if needed
    // });

    try {
      const response = await api.protected.post('teacher/student-attendance', {
        employee_id,
        section_id,
        school_id,
        school_campus_id,
        attendence_type,
        attendence_date:
          selectedDate === 'Select Date' ? undefined : selectedDate,
      });

      if (response.data.status === 'success') {
        setStudents(response.data.data); // Set student data
        setSummary(response.data.counts); // Set attendance summary
      } else {
       // console.error('Failed to fetch attendance:', response.data.message);
      }
    } catch (error) {
      // console.error(
      //   'Error fetching attendance history:',
      //   error.response?.data || error.message,
      // );
    } finally {
    }
  };

  // Format the date as "4 Dec 2024"
  const formatDate = date => {
    if (date === 'Select Date') {
      return date; // Return "Select Date" as-is
    }

    const options = {year: 'numeric', month: 'short', day: 'numeric'};
    return new Date(date).toLocaleDateString('en-GB', options);
  };

  // Handle day press on the calendar
  const onDayPress = day => {
    setSelectedDate(day.dateString);
    setIsCalendarVisible(false); // Close calendar after selecting a date
  };

  const filteredStudents = students.filter(
    item =>
      item.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.registration_no.toLowerCase().includes(searchQuery.toLowerCase()),
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
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={moderateScale(24)} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Attendance History</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('TeacherAnnouncement')}>
          <Icon name="notifications" size={moderateScale(24)} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search Student"
        placeholderTextColor="#999"
        value={searchQuery}
        onChangeText={text => setSearchQuery(text)}
      />

      {/* Dropdown and Date */}
      <View style={styles.dropdownContainer}>
        <View style={styles.dropdownWrapper}>
          <Dropdown
            style={[
              styles.dropdown,
              {
                backgroundColor:
                  selectedStatus === 'Present'
                    ? '#00FF00' // Green
                    : selectedStatus === 'Absent'
                    ? '#FF0000' // Red
                    : selectedStatus === 'Late'
                    ? '#FFFF00' // Yellow
                    : '#FFFFFF', // Default background for "Status"
              },
            ]}
            data={[
              {label: 'Status', value: 'Status'},
              {label: 'Present', value: 'Present', color: '#00FF00'},
              {label: 'Absent', value: 'Absent', color: '#FF0000'},
              {label: 'Late', value: 'Late', color: '#FFFF00'},
            ]}
            labelField="label"
            valueField="value"
            placeholder="Status"
            placeholderStyle={styles.placeholderStyle} // Apply placeholder style
            selectedTextStyle={styles.selectedTextStyle} // Apply selected text style
            iconStyle={styles.iconStyle}
            itemTextStyle={{ fontSize: moderateScale(12), fontFamily: 'Poppins-Regular', color: '#000' }}
            
            value={selectedStatus} // Current selected value
            onChange={item => setSelectedStatus(item.value)}
            renderItem={item => (
              <View
                style={[styles.dropdownItem, {backgroundColor: item.color}]}>
                <Text style={styles.dropdownItemText}>{item.label}</Text>
              </View>
            )} // Update state on change
          />
        </View>

        {/* Date Text with onPress to show calendar */}
        <TouchableOpacity onPress={() => setIsCalendarVisible(true)}>
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
        </TouchableOpacity>
      </View>

      {/* Attendance Summary */}
      <Text style={styles.summaryText}>
        Total Students in Class: {students.length}
      </Text>
      <Text style={styles.summaryDetails}>
        Present: {summary.present} Absent: {summary.absent} Late: {summary.late}
      </Text>

      {/* Attendance List */}
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={item => item.id.toString()}
          renderItem={({item}) => (
            <View style={styles.studentRow}>
              <Text style={styles.studentText}>{item.student_name}</Text>
              <Text style={styles.studentText}>{item.registration_no}</Text>
              <Text style={styles.studentText}>
                {item.attendence_type === 1
                  ? 'Present'
                  : item.attendence_type === 2
                  ? 'Absent'
                  : item.attendence_type === 3
                  ? 'Late'
                  : 'Leave'}
              </Text>
            </View>
          )}
        />
      )}

      {/* Modal for Calendar */}
      <Modal
        isVisible={isCalendarVisible}
        onBackdropPress={() => setIsCalendarVisible(false)} // Close modal when tapping outside
        onBackButtonPress={() => setIsCalendarVisible(false)} // Close modal on back button press
        style={styles.modal}>
        <View style={styles.modalContent}>
          <Calendar
            current={selectedDate === 'Select Date' ? undefined : selectedDate}
            onDayPress={onDayPress}
            markedDates={
              selectedDate !== 'Select Date'
                ? {
                    [selectedDate]: {
                      selected: true,
                      selectedColor: 'blue',
                      selectedTextColor: 'white',
                    },
                  }
                : {}
            }
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: '16@s',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '16@vs',
  },
  headerText: {
    fontSize: '18@ms',
    color: '#000',
    fontFamily: 'Poppins-Bold',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: '8@ms',
    paddingHorizontal: '12@s',
    paddingVertical: '8@vs',
    marginTop: '16@vs',
    color: '#000',
    fontFamily: 'Poppins-Regular',
  },
  dropdownContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '16@vs',
  },
  dropdownWrapper: {
    borderRadius: '8@ms',
    flex: 0.5,
  },
  dropdown: {
    height: '40@vs',
    width: '100%',
    borderRadius: '8@ms',
    paddingHorizontal: '8@s',
    justifyContent: 'center',
  },
  dropdownItem: {
    paddingVertical: '8@vs',
    paddingHorizontal: '12@s',
    borderRadius: '8@ms',
    marginVertical: '4@vs',
  },
  dropdownItemText: {
    fontSize: '14@ms',
    color: '#000',
    fontFamily: 'Poppins-Regular',
  },
  placeholderStyle: {
    fontSize: '14@ms',
    color: '#000',
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  selectedTextStyle: {
    fontSize: '14@ms',
    color: '#000',
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  iconStyle: {
    width: '20@s',
    height: '20@vs',
    tintColor: '#000',
  },
  dateText: {
    fontSize: '16@ms',
    color: '#000',
    textDecorationLine: 'underline',
    fontFamily: 'Poppins-Regular',
  },
  summaryText: {
    fontSize: '16@ms',
    color: '#000',
    fontFamily: 'Poppins-Bold',
    marginTop: '16@vs',
  },
  summaryDetails: {
    fontSize: '14@ms',
    color: '#555',
    marginBottom: '16@vs',
    fontFamily: 'Poppins-Regular',
  },
  studentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: '8@vs',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  studentText: {
    fontSize: '14@ms',
    flex: 1,
    textAlign: 'center',
    color: '#000',
    fontFamily: 'Poppins-Regular',
  },
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '20@s',
    borderTopLeftRadius: '20@ms',
    borderTopRightRadius: '20@ms',
  },
});


export default AttendanceHistory;
