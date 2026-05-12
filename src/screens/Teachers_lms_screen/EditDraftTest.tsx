import DateTimePicker from '@react-native-community/datetimepicker';
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
import api from '../../api';
import {useSubjects} from '../../Context/TeacherSubjectContext';
import {useUser} from '../../Context/UserContext';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { CommonActions, useNavigation } from '@react-navigation/native';

type testProps = NativeStackScreenProps<any, any>;

const EditDraftTest: React.FC<testProps> = props => {
  const test = props.route.params?.test;
  // console.log('Received test:', test);

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<string>('4 December 2024');
  const [scheduledTime, setScheduledTime] = useState<string>('17:12');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullTestDetails, setFullTestDetails] = useState<any>(null);
  const [dueDate, setDueDate] = useState<string>(test.end_date || '');
  const [showCalendar, setShowCalendar] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const {sectionId} = useSubjects();
  const {user} = useUser();
  const [no_of_marks, setNo_of_marks] = useState('');
  const [testTitle, setTestTitle] = useState('');
  const [testDescription, setTestDescription] = useState('');
  const [isCalendarVisible, setCalendarVisible] = useState(false);
  const navigation = useNavigation();

  // Ensure the test is available before proceeding
  const testDetails = test ? test : null;

  if (!testDetails) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Test data is missing</Text>
      </View>
    );
  }

  useEffect(() => {
    if (fullTestDetails) {
      setTestTitle(fullTestDetails.title || '');
      setTestDescription(fullTestDetails.description || '');
      
      // Format no_of_marks if it exists
      const marks = fullTestDetails.no_of_marks;
      if (marks !== undefined && marks !== null) {
        const formattedMarks = parseFloat(marks).toString(); // This will turn 80.00 -> '80', 85.5 -> '85.5'
        setNo_of_marks(formattedMarks);
      } else {
        setNo_of_marks('');
      }
    }
  }, [fullTestDetails]);
  

  

  useEffect(() => {
    if (testDetails?.id) {
      const fetchTestDetails = async () => {
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
          //console.error('Error fetching test details:', err);
          setError('An error occurred while fetching test details');
        } finally {
          setLoading(false);
        }
      };

      fetchTestDetails();
    } else {
      setError('Test ID is missing');
      setLoading(false);
    }
  }, [testDetails?.id]);

  const handleSave = async () => {
    if (!fullTestDetails) {
      //console.error('Full test details are not available');
      return;
    }

    // Prepare request body
    const body = {
      assign_test_id: fullTestDetails.id,
      title: testTitle,
      description: testDescription,
      start_date: fullTestDetails.start_date,
      end_date: dueDate,
      no_of_marks: parseFloat(no_of_marks),
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
                          name: 'DraftTest',
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
        <TouchableOpacity onPress={()=>navigation.goBack()}>
          <Icon name="arrow-back" size={moderateScale(24)} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Draft Test</Text>
        <TouchableOpacity onPress={()=>navigation.navigate('TeachersAnnouncement')}>
        <Icon name="notifications" size={moderateScale(24)} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Task Title */}
      <Text style={styles.label}>Test Title</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter test title"
        value={testTitle}
        onChangeText={setTestTitle}
      />

      {/* Description */}
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.descriptionInput]}
        placeholder="Enter test description"
        value={testDescription}
        onChangeText={setTestDescription}
        multiline={true}
      />
      {/* Task marks */}
      <Text style={styles.label}>Total Marks</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter test marks"
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
    padding: '16@ms',
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
    marginBottom: '16@vs',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  calendarContainer: {
    backgroundColor: '#FFF',
    marginHorizontal: '20@ms',
    borderRadius: '10@ms',
    padding: '16@ms',
  },
  closeButton: {
    marginTop: '16@vs',
    backgroundColor: '#DC3545',
    padding: '12@ms',
    borderRadius: '8@ms',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: '14@ms',
    color: '#FFF',
    fontFamily: 'Poppins-Bold',
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
  label: {
    fontSize: '14@ms',
    color: '#000',
    marginBottom: '8@vs',
    fontFamily: 'Poppins-Regular',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: '8@ms',
    padding: '10@ms',
    fontSize: '14@ms',
    marginBottom: '16@vs',
    backgroundColor: '#F9F9F9',
    fontFamily: 'Poppins-Regular',
    color: '#000',
  },
  descriptionInput: {
    height: '80@vs',
    textAlignVertical: 'top',
    fontFamily: 'Poppins-Regular',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: '16@ms',
  },
  column: {
    flex: 1,
    marginRight: '8@ms',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: '8@ms',
    padding: '10@ms',
    backgroundColor: '#F9F9F9',
    fontFamily: 'Poppins-Regular',
  },
  dropdownText: {
    fontSize: '14@ms',
    color: '#3b3b3b',
    fontFamily: 'Poppins-Regular',
  },
  smallInput: {
    flex: 1,
    marginRight: '8@ms',
  },
  saveButton: {
    backgroundColor: '#DC3545',
    borderRadius: '8@ms',
    paddingVertical: '12@vs',
    alignItems: 'center',
    marginTop: '24@vs',
  },
  saveButtonText: {
    fontSize: '16@ms',
    color: '#FFF',
    fontFamily: 'Poppins-Bold',
  },
  calendar: {
    bottom: '400@vs',
  },
});


export default EditDraftTest;
