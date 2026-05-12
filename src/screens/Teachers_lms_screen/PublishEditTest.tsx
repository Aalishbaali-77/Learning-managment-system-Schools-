import DateTimePicker from '@react-native-community/datetimepicker';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {Calendar} from 'react-native-calendars';
import {moderateScale, ScaledSheet} from 'react-native-size-matters';
import {useSubjects} from '../../Context/TeacherSubjectContext';
import {useUser} from '../../Context/UserContext';
import api from '../../api';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {CommonActions, useNavigation} from '@react-navigation/native';

type testProps = NativeStackScreenProps<any, any>;

const PublishEditTest: React.FC<testProps> = props => {
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<string>('4 December 2024');
  const [scheduledTime, setScheduledTime] = useState<string>('17:12');
  const test = props.route.params?.test;
 // console.log('Received test:', test);
  const [fullTestDetails, setFullTestDetails] = useState<any>(null);
  const subjectId = props.route.params?.subjectId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dueDate, setDueDate] = useState<string>(test.end_date || '');
  const [showCalendar, setShowCalendar] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const {sectionId} = useSubjects();
  const {user} = useUser();
  const navigation = useNavigation();
  const [isCalendarVisible, setCalendarVisible] = useState(false);
  const [no_of_marks, setNo_of_marks] = useState('');

  // If `test` is an array, access the first element
  const testDetails = test 

  // Handle the case where `test` might be undefined
  if (!test) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Test data is missing</Text>
      </View>
    );
  }

  useEffect(() => {
    if (!testDetails?.id) {
      setError('Test ID is missing');
      setLoading(false);
      return;
    }
  
    const fetchTestDetails = async () => {
      setLoading(true); // Start loading before API call
      try {
        const response = await api.protected.get(
          `teacher/assign-tests/detail/${testDetails.id}`,
        );
        if (response.data.status === 'success') {
          setFullTestDetails(response.data.data);
          setDueDate(response.data.data.end_date || '');
        } else {
          setError('Failed to fetch test details');
        }
      } catch (err) {
        // console.error('Error fetching test details:', err);
        setError('An error occurred while fetching test details');
      } finally {
        setLoading(false); // Stop loading regardless of success/failure
      }
    };
  
    fetchTestDetails();
  }, [testDetails?.id]);
  
  useEffect(() => {
    if (fullTestDetails) {
      const marks = fullTestDetails.no_of_marks;
      if (marks !== undefined && marks !== null) {
        const formattedMarks = parseFloat(marks).toString(); // This will turn 80.00 -> '80', 85.5 -> '85.5'
        setNo_of_marks(formattedMarks);
      } else {
        setNo_of_marks('');
      }
    }
  }, [fullTestDetails]);
  

  const handleSave = async () => {
    if (!fullTestDetails) {
     // console.error('Full test details are not available');
      return;
    }

    // Prepare request body
    const body = {
      assign_test_id: fullTestDetails.id, // Use ID from the fetched task details
      title: fullTestDetails.title, // Title from fetched details
      description: fullTestDetails.description, // Description from fetched details
      start_date: fullTestDetails.start_date, // Start date from fetched details
      end_date: dueDate, // Use the updated due date
      no_of_marks: no_of_marks,
    };

    // Log the body being sent to the API
    // console.log('Request Body:', body);

    try {
      const response = await api.protected.post(
        'teacher/assign-tests/update',
        body,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      // Handle success
      if (response.data.status === 'success') {
        Alert.alert('Success', 'Test has been updated successfully!', [
          {text: 'OK', onPress: () => props.navigation.goBack()},
        ]);

         Alert.alert('Success', 'Test edited successfully!');
          
                // ✅ Go back and pass a param or flag
                navigation.dispatch(
                  CommonActions.goBack()
                );
          
                
                navigation.navigate({
                  name: 'TeachersSubjectDetails',
                  params: { onUpdated: true },
                  merge: true, // ✅ ensures params are merged into the current route
                });
      } else {
        // If the response is successful but the status is not 'success'
        Alert.alert('Error', 'Failed to update the test. Please try again.');
      }
    } catch (error) {
      // console.error(
      //   'Error updating test:',
      //   error.response ? error.response.data : error,
      // );

      // Show detailed error message
      if (error.response && error.response.data) {
        Alert.alert(
          'Error',
          `Error: ${
            error.response.data.message || 'An unexpected error occurred.'
          }`,
        );
      } else {
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      }
    }
  };

  const handleDateSelect = (date: string) => {
    // console.log('Selected date:', date);
    setDueDate(date);
    setShowCalendar(false);
  };

  const handleTimeChange = (event: any, selectedDate: Date | undefined) => {
    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      setScheduledTime(`${hours}:${minutes}`);
    }
    setShowTimePicker(false);
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={moderateScale(24)} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Publish Edit Test</Text>
        <TouchableOpacity>
          <View />
        </TouchableOpacity>
      </View>

      {/* Task Title */}
      <Text style={styles.label}>Test Title</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter test title"
         placeholderTextColor='#999'
        value={fullTestDetails?.title}
        editable={false}
      />

      {/* Description */}
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.descriptionInput]}
        placeholder="Enter test description"
        value={fullTestDetails?.description}
         placeholderTextColor='#999'
        multiline={true}
        editable={false}
      />
      {/* Task marks */}
      <Text style={styles.label}>Total Marks</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter test marks"
        placeholderTextColor='#999'
        value={no_of_marks}
        onChangeText={setNo_of_marks}
      />

      {/* Subject & Due Date */}
      <View style={styles.row}>
        <View style={styles.column}>
          <Text style={styles.label}>Subject</Text>
          <TouchableOpacity style={styles.dropdown}>
            <Text style={styles.dropdownText}>
              {fullTestDetails?.subject?.subject_name || 'Select Subject'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.column}>
          <Text style={styles.label}>Due Date</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setCalendarVisible(true)}>
            <Text style={styles.dropdownText}>{dueDate || 'Select Date'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scheduled Task */}
      {/* <Text style={styles.label}>Scheduled Test</Text>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.input, styles.smallInput]}>
          <Text style={styles.dropdownText}>{scheduledDate}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.input, styles.smallInput]}
          onPress={() => setShowTimePicker(true)}>
          <Text style={styles.dropdownText}>{scheduledTime}</Text>
        </TouchableOpacity>
      </View> */}

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Edit</Text>
      </TouchableOpacity>

      {/* Calendar Modal */}
      <Modal
        visible={isCalendarVisible}
        transparent={true}
        animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.calendarContainer}>
            <Calendar
              onDayPress={(day: any) => handleDateSelect(day.dateString)}
              markedDates={{
                [dueDate]: {
                  selected: true,
                  marked: true,
                  selectedColor: '#DC3545',
                },
              }}
              theme={{
                selectedDayBackgroundColor: '#DC3545',
                todayTextColor: '#DC3545',
                arrowColor: '#DC3545',
              }}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setCalendarVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: '16@s', // Corrected to use 's' for scaling
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Transparent overlay
  },
  calendarContainer: {
    backgroundColor: '#FFF',
    width: '90%', // Adjust width to fit screen
    borderRadius: '10@s', // Corrected to use 's' for scaling
    padding: '16@s', // Corrected to use 's' for scaling
    alignItems: 'center', // Center content inside
  },
  closeButton: {
    marginTop: '16@vs', // Corrected to use 'vs' for vertical scaling
    backgroundColor: '#DC3545',
    padding: '12@s', // Corrected to use 'vs' for vertical scaling
    borderRadius: '8@s', // Corrected to use 's' for scaling
    alignItems: 'center',
    width: '50%', // Corrected width as a percentage of parent
  },
  closeButtonText: {
    fontSize: '14@ms', // Corrected to use 'ms' for scaling
    color: '#FFF',
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16@vs', // Corrected to use 'ms' for scaling
  },
  backButton: {
    fontSize: '18@ms', // Corrected to use 'ms' for scaling
    color: '#000',
    fontFamily: 'Poppins-Regular',
  },
  title: {
    fontSize: '20@ms', // Corrected to use 'ms' for scaling
    color: '#000',
    fontFamily: 'Poppins-Bold',
  },
  notificationBell: {
    width: '24@s', // Corrected to use 's' for scaling
    height: '24@vs', // Corrected to use 's' for scaling
    borderRadius: '12@s', // Corrected to use 's' for scaling
    backgroundColor: '#000',
  },
  label: {
    fontSize: '14@ms', // Corrected to use 'ms' for scaling
    color: '#000',
    marginBottom: '8@vs', // Corrected to use 'ms' for scaling
    fontFamily: 'Poppins-Regular',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: '8@s', // Corrected to use 's' for scaling
    padding: '10@s', // Corrected to use 's' for scaling
    fontSize: '14@ms', // Corrected to use 'ms' for scaling
    marginBottom: '16@vs', // Corrected to use 'ms' for scaling
    backgroundColor: '#F9F9F9',
    fontFamily: 'Poppins-Regular',
    color: '#000',
  },
  descriptionInput: {
    height: '80@vs', // Corrected to use 'vs' for vertical scaling
    textAlignVertical: 'top',
    fontFamily: 'Poppins-Regular',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: '16@vs', // Corrected to use 'ms' for scaling
  },
  column: {
    flex: 1,
    marginRight: '8@s', // Corrected to use 's' for scaling
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: '8@s', // Corrected to use 's' for scaling
    padding: '10@s', // Corrected to use 's' for scaling
    backgroundColor: '#F9F9F9',
    fontFamily: 'Poppins-Regular',
  },
  dropdownText: {
    fontSize: '14@ms', // Corrected to use 'ms' for scaling
    color: '#3b3b3b',
    fontFamily: 'Poppins-Regular',
  },
  smallInput: {
    flex: 1,
    marginRight: '8@s', // Corrected to use 's' for scaling
  },
  saveButton: {
    backgroundColor: '#DC3545',
    borderRadius: '8@s', // Corrected to use 's' for scaling
    paddingVertical: '12@vs', // Corrected to use 'vs' for vertical scaling
    alignItems: 'center',
    marginTop: '24@vs', // Corrected to use 'vs' for vertical scaling
  },
  saveButtonText: {
    fontSize: '16@ms', // Corrected to use 'ms' for scaling
    color: '#FFF',
    fontFamily: 'Poppins-Bold',
  },
  calendar: {
    marginTop: '20@vs', // Corrected to use 'vs' for vertical scaling
    bottom: '200@vs', // Corrected to use 'vs' for vertical scaling
  },
});


export default PublishEditTest;
