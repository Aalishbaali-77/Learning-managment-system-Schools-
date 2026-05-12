import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {ScaledSheet, moderateScale} from 'react-native-size-matters';
import {Calendar} from 'react-native-calendars';
import DateTimePicker from '@react-native-community/datetimepicker';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import api from '../../api';
import moment from 'moment';
import {useSubjects} from '../../Context/TeacherSubjectContext';
import {useUser} from '../../Context/UserContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {CommonActions, useNavigation} from '@react-navigation/native';

type taskProps = NativeStackScreenProps<any, any>;

const PublishEditTaskScreen: React.FC<taskProps> = props => {
  const task = props.route.params?.task;
  console.log('Received task:', task);
  const [fullTaskDetails, setFullTaskDetails] = useState<any>(null);
  const subjectId = props.route.params?.subjectId;
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<string>('4 December 2024');
  const [scheduledTime, setScheduledTime] = useState<string>('17:12');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dueDate, setDueDate] = useState<string>(task.end_date || '');
  const [showCalendar, setShowCalendar] = useState(false);
  const [isCalendarVisible, setCalendarVisible] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const {sectionId} = useSubjects();
  const {user} = useUser();
  const navigation = useNavigation();

  // Handle the case where task might be undefined
  if (!task) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Task data is missing</Text>
      </View>
    );
  }

  useEffect(() => {
    if (!task?.id) {
      setError('Task ID is missing');
      setLoading(false);
      return;
    }

    const fetchTaskDetails = async () => {
      try {
        const response = await api.protected.get(
          `teacher/assign-tasks/detail/${task.id}`,
        );
        if (response.data.status === 'success') {
          setFullTaskDetails(response.data.data);
          setDueDate(response.data.data.end_date || '');
        } else {
          setError('Failed to fetch task details');
        }
      } catch (err) {
       // console.error('Error fetching task details:', err);
        setError('An error occurred while fetching task details');
      } finally {
        setLoading(false);
      }
    };

    fetchTaskDetails();
  }, [task?.id]);

  const handleSave = async () => {
    if (!fullTaskDetails) {
    //  console.error('Full task details are not available');
      return;
    }

    const body = {
      assign_task_id: fullTaskDetails.id, // Use ID from the fetched task details
      title: fullTaskDetails.title, // Title from fetched details
      description: fullTaskDetails.description, // Description from fetched details
      start_date: fullTaskDetails.start_date, // Start date from fetched details
      end_date: dueDate, // Use the updated due date
    };

    try {
      const response = await api.protected.post(
        'teacher/assign-tasks/update',
        body,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data.status === 'success') {
        Alert.alert('Success', 'Task has been updated successfully!', [
          {text: 'OK', onPress: () => props.navigation.goBack()},
        ]);

         Alert.alert('Success', 'Task edited successfully!');
          
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
        Alert.alert('Error', 'Failed to update the task. Please try again.');
      }
    } catch (error) {
     // console.error('Error updating task:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
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
        <Text style={styles.title}>Publish Edit Task</Text>
        <TouchableOpacity>
          <View />
        </TouchableOpacity>
      </View>

      {/* Task Title */}
      <Text style={styles.label}>Task Title</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter task title"
        value={fullTaskDetails?.title}
        editable={false}
      />

      {/* Description */}
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.descriptionInput]}
        value={fullTaskDetails?.description}
        placeholder="Enter task description"
        multiline={true}
        editable={false}
      />

      {/* Subject & Due Date */}
      <View style={styles.row}>
        <View style={styles.column}>
          <Text style={styles.label}>Subject</Text>
          <TouchableOpacity style={styles.dropdown}>
            <Text style={styles.dropdownText}>
              {fullTaskDetails?.subject?.subject_name || 'Select Subject'}
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
      {/* <Text style={styles.label}>Scheduled Task</Text>
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
    padding: '16@s',
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
    width: '90%', // This remains relative to the parent, as it's intended to fit screen width
    borderRadius: '10@s',
    padding: '16@ms',
    alignItems: 'center', // Center content inside
  },
  closeButton: {
    marginTop: '16@vs',
    backgroundColor: '#DC3545',
    padding: '12@ms',
    borderRadius: '8@s',
    alignItems: 'center',
    width: '150@ms', // Scaled width instead of percentage
  },
  closeButtonText: {
    fontSize: '14@ms',
    color: '#FFF',
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
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
    height: '24@vs',
    borderRadius: '12@s',
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
    borderRadius: '8@s',
    padding: '10@ms',
    fontSize: '14@ms',
    color: '#3b3b3b',
    marginBottom: '16@vs',
    backgroundColor: '#F9F9F9',
    fontFamily: 'Poppins-Regular',
  },
  descriptionInput: {
    height: '80@vs',
    textAlignVertical: 'top',
    fontFamily: 'Poppins-Regular',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: '16@vs',
  },
  column: {
    flex: 1,
    marginRight: '8@s',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: '8@s',
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
    marginRight: '8@s',
  },
  saveButton: {
    backgroundColor: '#DC3545',
    borderRadius: '8@s',
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
    marginTop: '20@vs',
    bottom: '200@vs',
  },
});

export default PublishEditTaskScreen;
