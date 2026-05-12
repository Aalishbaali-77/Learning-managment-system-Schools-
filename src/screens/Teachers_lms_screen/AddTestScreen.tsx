import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import {moderateScale, ScaledSheet} from 'react-native-size-matters';
import {Calendar} from 'react-native-calendars';
import {useSubjects} from '../../Context/TeacherSubjectContext';
import {Picker} from '@react-native-picker/picker';
import {useUser} from '../../Context/UserContext';
import api from '../../api';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Dropdown} from 'react-native-element-dropdown';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';

type SubjectsProps = NativeStackScreenProps<any, any>;

const AddTestScreen: React.FC<SubjectsProps> = props => {
  const [dueDate, setDueDate] = useState('Select Date');
  const [isCalendarVisible, setCalendarVisible] = useState(false);
  const [testTitle, setTestTitle] = useState('');
  const [description, setDescription] = useState('');
  const [studentIdsArray, setStudentIdsArray] = useState([]); // Assuming you need student IDs as well
  const [totalMarks, setTotalMarks] = useState('');
  const [assignTaskStatus, setAssignTaskStatus] = useState(null); // Assuming a default value
  const [selectedSubject, setSelectedSubject] = useState<any>('');
  const {user} = useUser();
  const sectionId = props.route.params?.sectionId;
  const [subjects, setSubjects] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    if (subjects.length > 0) {
      const initialSubject = subjects[0];
      if (initialSubject && initialSubject.subject_id) {
        setSelectedSubject(initialSubject);
      } else {
        console.warn('Subject does not have an ID');
      }
    }
  }, [subjects]);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const employee_id = user?.emp_id;
        const school_campus_id = user?.school_campus_id;
        const section_id = sectionId; // Adjust if section_id comes from a different source

        const response = await api.protected.post(
          'teacher/assign-tasks/subjectList',
          {
            employee_id,
            school_campus_id,
            section_id,
          },
        );

        if (response.data.success) {
          setSubjects(response.data.data);
        } else {
          // console.error('Error fetching subjects:', response.data.message);
        }
      } catch (error) {
        //console.error('Error fetching subjects:', error);
        Alert.alert('Error', 'Failed to fetch subjects. Please try again.');
      }
    };

    fetchSubjects();
  }, [user]);

  const handleDateSelect = (date: string) => {
    setDueDate(date);
    setCalendarVisible(false); // Close the calendar
  };

  const subjectItems = subjects.map(subject => ({
    label: subject.subject_name, // The name displayed in the dropdown
    value: subject.subject_id.toString(), // The value associated with the subject
  }));

  const handlePublishTask = async (status: number) => {
    if (!sectionId) {
      Alert.alert('Error', 'Section ID is missing.');
      return;
    }
    if (!selectedSubject) {
      // Adjusted to check the selected subject directly
      Alert.alert('Error', 'No subject selected.');
      return;
    }
    // Construct the body for the API
    const body = {
      employee_id: user?.emp_id,
      section_id: sectionId,
      type: '1',
      student_ids_array: studentIdsArray.length > 0 ? studentIdsArray : [1], // Placeholder ID
      title: testTitle,
      description: description,
      start_date: new Date().toISOString().split('T')[0],
      end_date: dueDate,
      no_of_marks: totalMarks,
      assign_test_status: status,
      school_id: user?.company_id,
      school_campus_id: user?.school_campus_id,
      subject_id: selectedSubject,
    };

    // console.log('Body being sent to API:', JSON.stringify(body));

    try {
      const response = await api.protected.post(
        'teacher/assign-tests/store',
        body,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      // console.log('API Response:', response.data);

      if (response.data.success) {
        const successMessage =
          status === 1
            ? 'Test assigned successfully!'
            : 'Test added to draft successfully.';
        Alert.alert('Success', successMessage);
        navigation.goBack();
      } else {
        // console.log('Error assigning test:', response.data.message);
        Alert.alert('Error', 'Failed to assign task.');
      }
    } catch (error) {
      // console.error('Full Error Object:', error);

      // Log more details about the error
      if (error.response) {
        // console.error('Error Response Status:', error.response.status);
        // console.error('Error Response Data:', error.response.data);
        // console.error('Error Response Headers:', error.response.headers);
        Alert.alert('Error', 'Unknown error');
      } else if (error.request) {
        // console.error('Error Request:', error.request);
        Alert.alert('Error', 'No response received from the server.');
      } else {
        // console.error('Error Message:', error.message);
        Alert.alert('Error', 'An unexpected error occurred.');
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={moderateScale(24)} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Add A Test</Text>
        <TouchableOpacity>
          <View />
        </TouchableOpacity>
      </View>

      {/* Form Fields */}
      <View style={styles.formContainer}>
        {/* Task Title */}
        <Text style={styles.label}>Test Title</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter test title"
          placeholderTextColor={'#3b3b3b'}
          value={testTitle}
          onChangeText={setTestTitle}
        />

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Enter description"
          placeholderTextColor={'#3b3b3b'}
          multiline={true}
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.label}>Total Marks</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter total marks"
          placeholderTextColor={'#3b3b3b'}
          value={totalMarks}
          onChangeText={setTotalMarks}
        />

        {/* Subject and Due Date */}
        <View style={styles.row}>
          {/* Subject */}
          <View style={styles.rowItem}>
            <Text style={styles.label}>Subject</Text>
            <Dropdown
              style={styles.dropdown}
              data={subjectItems}
              labelField="label"
              valueField="value"
              value={selectedSubject}
              selectedTextStyle={{
                fontSize: moderateScale(12),
                fontFamily: 'Poppins-Regular',
                color: '#000', // ✅ Set selected text color here
              }}
              
              onChange={item => setSelectedSubject(item.value)}
              placeholderStyle={styles.placeholderStyle}
              placeholder="Select Subject"
              itemTextStyle={{
                fontSize: moderateScale(12),
                fontFamily: 'Poppins-Regular',
                color: '#000',
              }}
              iconStyle={{tintColor: '#000'}}
            />
          </View>

          {/* Due Date */}
          <View style={styles.rowItem}>
            <Text style={styles.label}>Due Date</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setCalendarVisible(true)}>
              <Text style={styles.dropdownText}>{dueDate}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Save Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => handlePublishTask(1)}>
          <Text style={styles.saveButtonText}>Publish Test</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => handlePublishTask(2)}>
          <Text style={styles.saveButtonText}>Save Draft</Text>
        </TouchableOpacity>
      </View>

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
  formContainer: {
    marginTop: '16@vs',
  },
  label: {
    fontSize: '14@ms',
    color: '#000',
    marginBottom: '8@vs',
    fontFamily: 'Poppins-Regular',
  },
  input: {
    backgroundColor: '#F2F2F2',
    borderRadius: '8@ms',
    fontSize: '14@ms',
    padding: '10@ms',
    marginBottom: '16@vs',
    color: '#000',
    fontFamily: 'Poppins-Regular',
  },
  textArea: {
    height: '80@ms',
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: '16@vs',
  },
  rowItem: {
    flex: 1,
    marginRight: '8@s',
  },
  dropdown: {
    backgroundColor: '#F2F2F2',
    borderRadius: '8@ms',
    paddingVertical: '12@vs',
    paddingHorizontal: '8@ms',
    justifyContent: 'center',
  },
  dropdownText: {
    fontSize: '14@ms',
    color: '#3b3b3b',
    fontFamily: 'Poppins-Regular',
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  saveButton: {
    backgroundColor: '#DC3545',
    borderRadius: '8@ms',
    alignItems: 'center',
    margin: '25@ms',
    marginTop: '30@vs',
    padding: '12@ms',
  },
  saveButtonText: {
    fontSize: '14@ms',
    color: '#FFF',
    fontFamily: 'Poppins-Bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  calendarContainer: {
    backgroundColor: '#FFF',
    marginHorizontal: '20@vs',
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
  placeholderStyle: {
    fontSize: '16@ms',
    color: '#3b3b3b',
  
  },
  selectedTextStyle: {
    fontSize: '16@ms',
    color: '#3b3b3b',
  },
  iconStyle: {
    width: '20@ms',
    height: '20@ms',
  },
  inputSearchStyle: {
    height: '40@ms',
    fontSize: '16@ms',
  },
});

export default AddTestScreen;
