import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import {moderateScale, ScaledSheet} from 'react-native-size-matters';
import {Calendar} from 'react-native-calendars';
import {useSubjects} from '../../Context/TeacherSubjectContext';
import {Picker} from '@react-native-picker/picker';
import {useUser} from '../../Context/UserContext';
import api from '../../api';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Dropdown} from 'react-native-element-dropdown';
import {useNavigation} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import DocumentPicker from 'react-native-document-picker';
import {launchImageLibrary} from 'react-native-image-picker';
import RNFS from 'react-native-fs';

type SubjectsProps = NativeStackScreenProps<any, any>;

const AddTaskScreen: React.FC<SubjectsProps> = props => {
  const [subjects, setSubjects] = useState([]);
  const [dueDate, setDueDate] = useState('Select Date');
  const [isCalendarVisible, setCalendarVisible] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [description, setDescription] = useState('');
  const [studentIdsArray, setStudentIdsArray] = useState([]); // Assuming you need student IDs as well
  const [noOfMarks, setNoOfMarks] = useState('');
  const [isFocus, setIsFocus] = useState(false);
  const [assignTaskStatus, setAssignTaskStatus] = useState(null); // Assuming a default value

  const [selectedSubject, setSelectedSubject] = useState<any>('');
  const {user} = useUser();
  const sectionId = props.route.params?.sectionId;
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<any>(null);

  const [loading, setLoading] = useState(false);
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

  const handleDateSelect = (date: string) => {
    setDueDate(date);
    setCalendarVisible(false); // Close the calendar
  };

  const subjectItems = subjects
    .filter(subject => subject.subject_id) // Ensure `subject_id` exists
    .map(subject => ({
      label: subject.subject_name || 'Unknown',
      value: subject.subject_id?.toString() || '', // Fallback value
    }));

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
        // console.error('Error fetching subjects:', error);
        Alert.alert('Error', 'Failed to fetch subjects. Please try again.');
      }
    };

    fetchSubjects();
  }, [user]);

  const resolveFilePath = async (fileUri: string, fileName: string) => {
    if (Platform.OS === 'android' && fileUri.startsWith('content://')) {
      const ext = fileName.split('.').pop() || 'jpg'; // Extract actual extension
      const destPath = `${
        RNFS.TemporaryDirectoryPath
      }/upload-${Date.now()}.${ext}`;
      await RNFS.copyFile(fileUri, destPath);
      return `file://${destPath}`;
    }
    return fileUri;
  };

  const handlePublishTask = async (status: number) => {
    if (!sectionId) {
      Alert.alert('Error', 'Section ID is missing.');
      return;
    }

    if (!selectedSubject) {
      Alert.alert('Error', 'No subject selected.');
      return;
    }

    const formData = new FormData();
    //console.log('📝 Final FormData before API call:');
    formData.append('debug_log', 'Checking form data...');
    formData.append('employee_id', user?.emp_id);
    formData.append('section_id', sectionId);
    formData.append('type', '1');
    // formData.append("student_ids_array", JSON.stringify(studentIdsArray.length > 0 ? studentIdsArray : [1])); // Placeholder ID
    formData.append('title', taskTitle);
    formData.append('description', description);
    formData.append('start_date', new Date().toISOString().split('T')[0]);
    formData.append('end_date', dueDate);
    formData.append('no_of_marks', '0');
    formData.append('assign_task_status', status);
    formData.append('school_id', user?.company_id);
    formData.append('school_campus_id', user?.school_campus_id);
    formData.append('subject_id', selectedSubject);

    // console.log('formdata for publish task', formData);
    

    // ✅ Add Attachments (Images & Documents)
    // ✅ Add Attachments (Files)
    if (selectedFile && selectedFile.length > 0) {
      for (const file of selectedFile) {
        try {
          const resolvedFilePath = await resolveFilePath(
            file.uri,
            file.name || `file_${Date.now()}.pdf`,
          );
          formData.append('attachment[]', {
            uri: resolvedFilePath,
            name: file.name || `file_${Date.now()}.pdf`,
            type: file.type || 'application/octet-stream',
          });

          // console.log('📎 Attached File:', {
          //   uri: resolvedFilePath,
          //   name: file.name,
          //   type: file.type,
          // });
        } catch (error) {
          //console.error('❌ Error processing file attachment:', error);
          Alert.alert('Error', 'Failed to process file attachment.');
          return;
        }
      }
    }

    // ✅ Add Attachments (Images)
    if (selectedImage && selectedImage.length > 0) {
      for (const img of selectedImage) {
        try {
          const resolvedImagePath = await resolveFilePath(
            img.uri,
            img.fileName || `image_${Date.now()}.jpg`,
          );
          formData.append('attachment[]', {
            uri: resolvedImagePath,
            name: img.fileName || `image_${Date.now()}.jpg`,
            type: img.type || 'image/jpeg',
          });

          // console.log('🖼️ Attached Image:', {
          //   uri: resolvedImagePath,
          //   name: img.fileName,
          //   type: img.type,
          // });
        } catch (error) {
          // console.error('❌ Error processing image attachment:', error);
          Alert.alert('Error', 'Failed to process image attachment.');
          return;
        }
      }
    }

    try {
      setLoading(true);
      const response = await api.protected.post(
        '/teacher/assign-tasks/store',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      if (response.data.success) {
        const successMessage =
          status === 1
            ? 'Task assigned successfully!'
            : 'Task added to draft successfully.';
        Alert.alert('Success', successMessage);
        navigation.goBack();
      } else {
        Alert.alert('Error', response.data.message || 'Failed to assign task.');
      }
    } catch (error) {
      //console.error('❌ API Error:', error);

      if (error.response) {
        // console.log('🔍 API Response Data:', error.response.data);
        // console.log('📡 API Response Status:', error.response.status);
        // console.log('📝 API Response Headers:', error.response.headers);1
      } else if (error.request) {
        // console.log('🚫 No Response from Server:', error.request);
      } else {
        // console.log('⚠️ API Request Setup Error:', error.message);
      }

      Alert.alert(
        'Error',
        'Failed to assign task. Please check logs for details.',
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // Function to pick a file
  const handleFileUpload = async () => {
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        allowMultiSelection: true, // Enables multiple file selection
      });
      setSelectedFile(res); // Store all selected files
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // console.log('User cancelled file picker');
      } else {
        //  console.log('Unknown error: ', err);
      }
    }
  };

  // Function to pick an image
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
        //  console.log('Error: ', response.errorMessage);
      } else {
        setSelectedImage(response.assets); // Store multiple images
      }
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={moderateScale(24)} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Add A Task</Text>
        <TouchableOpacity>
          <View />
        </TouchableOpacity>
      </View>

      {/* Form Fields */}
      <View style={styles.formContainer}>
        {/* Task Title */}
        <Text style={styles.label}>Task Title</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter task title"
          placeholderTextColor="#3b3b3b"
          value={taskTitle}
          onChangeText={setTaskTitle}
        />

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Enter description"
          placeholderTextColor="#3b3b3b"
          multiline={true}
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
        />

        {/* Upload File & Upload Images */}
        <View style={styles.uploadContainer}>
          {/* Upload File Box */}
          <TouchableOpacity style={styles.uploadBox} onPress={handleFileUpload}>
            <Icon name="insert-drive-file" size={40} color="#000" />
            <Text style={styles.uploadText}>Upload File</Text>

            {selectedFile && selectedFile.length > 0 && (
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

          {/* Upload Images Box */}
          <TouchableOpacity
            style={styles.uploadBox}
            onPress={handleImageUpload}>
            <Icon name="image" size={40} color="#000" />
            <Text style={styles.uploadText}>Upload Image</Text>

            {selectedImage && selectedImage.length > 0 && (
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

        {/* Subject and Due Date */}
        <View style={styles.row}>
          {/* Subject */}
          <View style={styles.rowItem}>
            <Text style={styles.label}>Subject</Text>
            <Dropdown
              style={[styles.dropdown, isFocus && {borderColor: 'blue'}]}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              itemTextStyle={{
                fontSize: moderateScale(12),
                fontFamily: 'Poppins-Regular',
                color: '#000',
              }}
              iconStyle={{tintColor: '#000'}}
              inputSearchStyle={styles.inputSearchStyle}
              data={subjectItems}
              search
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder={!isFocus ? 'Select Subject' : '...'}
              value={selectedSubject}
              onFocus={() => setIsFocus(true)}
              onBlur={() => setIsFocus(false)}
              onChange={item => {
                setSelectedSubject(item.value);
                setIsFocus(false);
              }}
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
          <Text style={styles.saveButtonText}>Publish Task</Text>
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
    marginTop: '10@vs',
  },
  rowItem: {
    flex: 1,
    marginRight: '8@s',
  },
  dropdown: {
    backgroundColor: '#F2F2F2',
    borderRadius: '8@ms',
    paddingVertical: '12@vs',
    paddingHorizontal: '8@s',
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
    marginHorizontal: '20@ms',
    borderRadius: '10@ms',
    padding: '16@ms',
  },
  closeButton: {
    marginTop: '16@ms',
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
  uploadContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: '10@vs',
  },
  uploadBox: {
    width: '48%',
    height: '120@vs',
    borderWidth: '1@ms',
    borderColor: '#ccc',
    borderRadius: '8@ms',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: '5@ms', // Adds space to avoid text overflow
  },
  fileList: {
    marginTop: '5@vs',
    alignItems: 'center',
  },
  fileName: {
    fontSize: '10@ms',
    fontFamily: 'Poppins-Regular',
    color: '#555',
    maxWidth: '90%',
    textAlign: 'center',
  },
  moreText: {
    fontSize: '10@ms',
    fontFamily: 'Poppins-SemiBold',
    color: '#007bff', // Highlighting "+X more..." text
    marginTop: '2@vs',
  },
});

export default AddTaskScreen;
