import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
  TouchableWithoutFeedback
} from 'react-native';
import { ScaledSheet, moderateScale, scale } from 'react-native-size-matters';
import { Dropdown } from 'react-native-element-dropdown';
import { Calendar } from 'react-native-calendars';
import { RadioButton } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ScrollView } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import DocumentPicker from 'react-native-document-picker';
import { launchImageLibrary } from 'react-native-image-picker';
import { useUser } from '../../Context/UserContext';
import api from '../../api';
import { useSubjects } from '../../Context/TeacherSubjectContext';

const LeaveForm = () => {
  const [leaveType, setLeaveType] = useState(null);
  const [leaveOptions, setLeaveOptions] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [leaveDays, setLeaveDays] = useState('Half Day');
  const [noOfDays, setNoOfDays] = useState('');
  const [reason, setReason] = useState('');
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [dateType, setDateType] = useState('from');
  const { user } = useUser();
  const { sectionId } = useSubjects();
  const navigation = useNavigation();
  const [selectedFile, setSelectedFile] = useState([]);
  const [selectedImage, setSelectedImage] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // Start loading
      await fetchLeaveTypeList();
      setLoading(false); // Stop loading
    };

    fetchData();
  }, []);

  const fetchLeaveTypeList = async () => {
    try {
      const payload = {
        school_id: user?.company_id,
        school_campus_id: user?.school_campus_id,
      };
      //console.log('🔵 Fetching Leave Type List:', payload);

      const response = await api.protected.post(
        'leave/leave-type-list',
        payload,
      );
      if (response.data.status === 'success') {
        // Transform response data to match Dropdown format
        const formattedData = response.data.data.map(item => ({
          label: item.name, // `name` from API mapped to `label`
          value: item.id, // `id` from API mapped to `value`
        }));
        setLeaveOptions(formattedData);
      } else {
        // console.error(
        //   'Failed to fetch leave type list:',
        //   response.data.message,
        // );
      }
    } catch (err) {
      //console.error('Error fetching leave type list:', err);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle file upload
  const handleFileUpload = async () => {
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        allowMultiSelection: true, // Enables multiple file selection
      });
      setSelectedFile(res); // Store all selected files
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        //console.log('User cancelled file picker');
      } else {
        //console.log('Unknown error: ', err);
      }
    }
  };

  // Function to handle image upload
  const handleImageUpload = async () => {
    const options = {
      mediaType: 'photo',
      quality: 1,
      selectionLimit: 5, // Set to 0 for unlimited selection
    };
    launchImageLibrary(options, response => {
      if (response.didCancel) {
        // console.log('User cancelled image picker');
      } else if (response.errorMessage) {
        //console.log('Error: ', response.errorMessage);
      } else {
        setSelectedImage(response.assets); // Store multiple images
      }
    });
  };

  const applyLeave = async () => {
    try {
      // Create a FormData object
      const formData = new FormData();

      // Append leave details to FormData
      formData.append('school_id', user?.company_id);
      formData.append('school_campus_id', user?.school_campus_id);
      formData.append('student_id', user?.id);
      formData.append('section_id', sectionId);
      formData.append('leave_type_id', leaveType); // Assuming leaveType holds the selected leave_type_id
      formData.append('from_date', fromDate);
      formData.append('to_date', toDate);
      formData.append('leave_days', leaveDays);
      formData.append('no_of_days', noOfDays);
      formData.append('reason_for_leave', reason);

      // Append files to FormData
      if (selectedFile.length > 0) {
        for (const file of selectedFile) {
          const fileObject = {
            uri: file.uri,
            name: file.name || `file_${Date.now()}.pdf`, // Default name if not provided
            type: file.type || 'application/octet-stream', // Default type if not provided
          };
          formData.append('attachment[]', fileObject);
        }
      }

      // Append images to FormData
      if (selectedImage.length > 0) {
        for (const img of selectedImage) {
          const imageObject = {
            uri: img.uri,
            name: img.fileName || `image_${Date.now()}.jpg`, // Default name if not provided
            type: img.type || 'image/jpeg', // Default type if not provided
          };
          formData.append('attachment[]', imageObject);
        }
      }

      // console.log('🟢 Applying Leave with Attachments:', formData);

      // Make the API call
      const response = await api.protected.post('leave/apply-leave', formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Set the content type to multipart/form-data
        },
      });

      if (response.data.status === 'success') {
        // console.log('✅ Leave applied successfully:', response.data.message);
        Alert.alert('Leave applied successfully');
        navigation.goBack();
      } else {
        // console.error('❌ Failed to apply leave:', response.data.message);
        Alert.alert('Failed to apply leave: ' + response.data.message);
      }
    } catch (err) {
      //console.error('⚠️ Error applying leave:', err);
      Alert.alert('Error applying leave. Please try again.');
    }
  };

  useEffect(() => {
    if (fromDate && toDate) {
      const start = new Date(fromDate);
      const end = new Date(toDate);

      if (end >= start) {
        const timeDiff = end.getTime() - start.getTime();
        const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1; // Include start date
        setNoOfDays(days.toString()); // Ensure it's a string for TextInput
      } else {
        setNoOfDays('0'); // Reset if invalid range
      }
    }
  }, [fromDate, toDate]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (

    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }} // Add padding at the bottom
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={moderateScale(24)} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leave Form</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Announcements')}>
          <Icon name="notifications" size={scale(24)} color="#000" />
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Leave Type</Text>
      <Dropdown
        data={leaveOptions}
        labelField="label"
        valueField="value"
        placeholder="Select"
        value={leaveType}
        onChange={item => setLeaveType(item.value)}
        style={styles.dropdown}
        placeholderStyle={styles.placeholderStyle}
      />

      <Text style={styles.label}>From date</Text>
      <TouchableOpacity
        style={styles.dateInput}
        onPress={() => {
          setCalendarVisible(true);
          setDateType('from');
        }}>
        <Text>{fromDate || 'Select Date'}</Text>
      </TouchableOpacity>

      <Text style={styles.label}>To date</Text>
      <TouchableOpacity
        style={styles.dateInput}
        onPress={() => {
          setCalendarVisible(true);
          setDateType('to');
        }}>
        <Text>{toDate || 'Select Date'}</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Upload File & Images</Text>
      <View style={styles.uploadContainer}>
        <TouchableOpacity style={styles.uploadBox} onPress={handleFileUpload}>
          <Icon name="file-upload" size={scale(40)} color="#000" />
          <Text style={styles.uploadText}>Upload File</Text>

          {selectedFile.length > 0 && (
            <View style={styles.fileList}>
              {selectedFile.slice(0, 2).map((file, index) => (
                <Text key={index} numberOfLines={1} style={styles.fileName}>
                  {file.name || `File ${index + 1}`}
                </Text>
              ))}
              {selectedFile.length > 2 && (
                <Text style={styles.moreText}>
                  +{selectedFile.length - 2} more...
                </Text>
              )}
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.uploadBox} onPress={handleImageUpload}>
          <Icon name="image" size={scale(40)} color="#000" />
          <Text style={styles.uploadText}>Upload Image</Text>

          {selectedImage.length > 0 && (
            <View style={styles.fileList}>
              {selectedImage.slice(0, 2).map((img, index) => (
                <Text key={index} numberOfLines={1} style={styles.fileName}>
                  {img.fileName || `Image ${index + 1}`}
                </Text>
              ))}
              {selectedImage.length > 2 && (
                <Text style={styles.moreText}>
                  +{selectedImage.length - 2} more...
                </Text>
              )}
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Leave Days</Text>
      <View style={styles.radioGroup}>
        <RadioButton.Group
          onValueChange={value => setLeaveDays(value)}
          value={leaveDays}>
          <View style={styles.radioRow}>
            <View style={styles.radioItem}>
              <RadioButton value="Half Day" />
              <Text style={styles.radiobutton}>Half Day</Text>
            </View>
            <View style={styles.radioItem}>
              <RadioButton value="Full Day" />
              <Text style={styles.radiobutton}>Full Day</Text>
            </View>
          </View>
        </RadioButton.Group>
      </View>

      <Text style={styles.label}>No of Days</Text>
      <View style={styles.noOfDaysContainer}>
        <Text style={styles.noOfDaysText}>{noOfDays || '0'} Days</Text>
      </View>

      <Text style={styles.label}>Reason</Text>
      <TextInput
        style={styles.input}
        value={reason}
        onChangeText={setReason}
        multiline
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.applyButton} onPress={applyLeave}>
          <Text style={styles.applyText}>Apply Leave</Text>
        </TouchableOpacity>
      </View>

      <Modal
        transparent={true}
        visible={calendarVisible}
        animationType="fade"
        onRequestClose={() => setCalendarVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setCalendarVisible(false)}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback onPress={() => { /* Prevent closing when tapping calendar */ }}>
              <View style={styles.calendarWrapper}>
                <Calendar
                  onDayPress={day => {
                    dateType === 'from'
                      ? setFromDate(day.dateString)
                      : setToDate(day.dateString);
                    setCalendarVisible(false);
                  }}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ScrollView>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    padding: '20@ms',
    backgroundColor: '#fff',
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
  },
  headerTitle: {
    fontSize: '18@ms',
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },
  label: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Medium',
    marginTop: '10@ms',
    color: '#36454F',
  },
  placeholderStyle: {
    color: '#A9A9A9	', // Set the placeholder text color
    fontSize: '12@ms',
    fontFamily: 'Poppins-Regular',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: '5@ms',
    padding: '10@ms',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: '5@ms',
    padding: '10@ms',
    marginTop: '5@ms',
  },
  uploadContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: '10@ms',
  },
  uploadBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: '5@ms',
    padding: '20@ms',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: '5@ms',
  },
  uploadText: {
    marginTop: '8@ms',
    fontSize: '12@ms',
    color: '#000',
  },
  fileList: {
    marginTop: '8@ms',
    alignItems: 'center',
  },
  fileName: {
    fontSize: '12@ms',
    color: '#555',
  },
  moreText: {
    fontSize: '12@ms',
    color: '#555',
    fontStyle: 'italic',
  },
  radioGroup: {
    marginTop: '10@ms',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radiobutton: {
    fontFamily: 'Poppins-Regular',
    fontSize: '12@ms',
    color: '#36454F',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: '5@ms',
    padding: '10@ms',
    marginTop: '5@ms',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  calendarWrapper: {
    backgroundColor: '#fff',
    padding: '20@ms',
    borderRadius: '10@ms',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: '20@ms',
  },
  cancelButton: {
    backgroundColor: '#ddd',
    paddingVertical: '12@ms',
    paddingHorizontal: '20@ms',
    borderRadius: '8@ms',
    flex: 1,
    alignItems: 'center',
    marginRight: '10@ms',
  },
  applyButton: {
    backgroundColor: '#d32f2f',
    paddingVertical: '10@ms',
    paddingHorizontal: '20@ms',
    borderRadius: '8@ms',
    flex: 1,
    alignItems: 'center',
  },
  cancelText: {
    color: '#000',
    fontFamily: 'Poppins-Bold',

  },
  applyText: {
    color: '#fff',
    fontFamily: 'Poppins-Bold',
  },
  noOfDaysContainer: {
    padding: '10@ms',
    backgroundColor: '#f3f3f3',
    borderRadius: '5@ms',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '10@ms',
  },
  noOfDaysText: {
    fontSize: '16@ms',
    fontWeight: 'bold',
    color: '#333',
  },
});

export default LeaveForm;
