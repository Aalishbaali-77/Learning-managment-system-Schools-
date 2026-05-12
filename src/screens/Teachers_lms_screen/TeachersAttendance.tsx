import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {ScaledSheet, moderateScale} from 'react-native-size-matters';
import api from '../../api'; // Replace with the actual path to your API service
import {useUser} from '../../Context/UserContext';
import {useSubjects} from '../../Context/TeacherSubjectContext';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import DropDownPicker from 'react-native-dropdown-picker';
import {Dropdown} from 'react-native-element-dropdown';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Student {
  id: number;
  name: string;
  rollNo: string;
  attendence_type: string;
  isDropdownOpen?: boolean;
}

const TeachersAttendance: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [attendanceSaved, setAttendanceSaved] = useState<boolean>(false);
  const {user} = useUser();
  const {sectionId} = useSubjects();
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const navigation = useNavigation();

  // Fetch data from the API
  const fetchStudents = async () => {
    setLoading(true);

    try {
      const payload = {
        employee_id: user?.emp_id,
        school_campus_id: user?.school_campus_id,
        section_id: sectionId,
        school_id: user?.company_id,
        attendence_date: new Date().toISOString().split('T')[0],
      };

      // Fetch data from the API
      const response = await api.protected.post(
        `teacher/student-attendance/studentList`,
        payload,
      );

      if (response?.data?.status === 'success') {
        const apiData = response.data.data.map((student: any) => {
          let attendenceType = 'Present';

          if (
            student.attendence_type === null ||
            student.attendence_type === 1
          ) {
            attendenceType = 'Present';
          } else if (student.attendence_type === 2) {
            attendenceType = 'Absent';
          } else if (student.attendence_type === 3) {
            attendenceType = 'Late';
          }

          return {
            id: student.id,
            name: student.student_name,
            rollNo: student.registration_no,
            attendence_type: attendenceType,
          };
        });

        setStudents(apiData);
        // console.log('iiiii', apiData);
      } else {
        Alert.alert(
          'Error',
          response?.data?.message || 'Failed to fetch students.',
        );
      }
    } catch (error) {
     // console.error('Error fetching students:', error);
      Alert.alert('Error', 'An error occurred while fetching students.');
    } finally {
      setLoading(false);
    }
  };

  // Save attendance and persist to AsyncStorage
  const saveAttendance = async () => {
    const currentDate = new Date().toISOString().split('T')[0];
    setLoading(true);
    try {
      const payload = {
        attendence_date: currentDate,
        employee_id: user?.emp_id,
        section_id: sectionId,
        school_id: user?.company_id,
        school_campus_id: user?.school_campus_id,
        students: students.map(student => ({
          student_id: student.id,
          attendence_type:
            student.attendence_type === 'Present'
              ? 1
              : student.attendence_type === 'Absent'
              ? 2
              : 3,
        })),
      };

      // console.log('Payload being sent:', payload);

      const response = await api.protected.post(
        'teacher/student-attendance/storeMassAttendance',
        payload,
      );

      if (response?.data?.status === 'success') {
        Alert.alert('Success', response.data.message);
        // console.log('API Response Summary:', response.data.summary);

        // Set attendanceSaved to true after successful save
        setAttendanceSaved(true);

        await AsyncStorage.setItem('attendanceSaved', 'true');

        // await saveAttendanceToStorage(); // Save the updated attendance data to AsyncStorage
      } else {
        Alert.alert(
          'Error',
          response?.data?.message || 'Failed to save attendance.',
        );
      }
    } catch (error) {
     // console.error('Error saving attendance:', error);
      Alert.alert('Error', 'An error occurred while saving attendance.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (
    id: number,
    newStatus: 'Present' | 'Absent' | 'Late',
  ) => {
    const updatedStudents = students.map(student => {
      if (student.id === id) {
        return {...student, attendence_type: newStatus}; // Update only the matching student
      }
      return student; // Keep the other students unchanged
    });
    // console.log('Updated Students:', updatedStudents);
    setStudents(updatedStudents);
  };
  const checkAttendanceSaved = async () => {
    const savedStatus = await AsyncStorage.getItem('attendanceSaved');
    if (savedStatus === 'true') {
      setAttendanceSaved(true);
    }
  };

  const handleMultiSelectStatusChange = (
    newStatus: 'Present' | 'Absent' | 'Late',
  ) => {
    const updatedStudents = students.map(student => {
      if (selectedStudents.includes(student.id)) {
        return {...student, attendence_type: newStatus};
      }
      return student;
    });

    setStudents(updatedStudents);
  };

  const handlePressAndHold = (id: number) => {
    if (!isMultiSelect) {
      setIsMultiSelect(true); // Enable multi-select mode
    }

    if (!selectedStudents.includes(id)) {
      setSelectedStudents(prev => [...prev, id]); // Add student to selected list
    } else {
      setSelectedStudents(prev => prev.filter(studentId => studentId !== id)); // Deselect student
    }
  };

  const renderDropdownForMultiSelect = () => {
    const statusOptions = [
      {label: 'Present', value: 'Present'},
      {label: 'Absent', value: 'Absent'},
      {label: 'Late', value: 'Late'},
    ];

    return (
      <Dropdown
        data={statusOptions}
        labelField="label"
        valueField="value"
        value="Present" // Default value
        onChange={selectedOption =>
          handleMultiSelectStatusChange(selectedOption.value)
        }
        style={styles.picker}
        placeholder="Select status"
        containerStyle={styles.multidropdownContainer}
        renderItem={option => (
          <Text style={{color: '#000', fontSize: 14, padding: 10}}>
            {option.label}
          </Text>
        )}
        selectedTextStyle={{color: '#000', fontSize: 14}}
        itemTextStyle={{ fontSize: moderateScale(12), fontFamily: 'Poppins-Regular', color: '#000' }}
            iconStyle={{ tintColor: '#000' }}
      />
    );
  };

  useEffect(() => {
    checkAttendanceSaved(); // Check if attendance is saved when the component mounts
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchStudents(); // Re-fetch the students' data when the screen comes into focus
    }, []),
  );

  const renderStudent = ({item}: {item: Student}) => {
    const statusOptions = [
      {label: 'Present', value: 'Present', color: '#fff'},
      {label: 'Absent', value: 'Absent', color: '#fff'},
      {label: 'Late', value: 'Late', color: '#fff'},
    ];

    const statusColor =
      item.attendence_type === 'Present'
        ? '#28A745'
        : item.attendence_type === 'Absent'
        ? '#DC3545'
        : '#FFC107';

    const isSelected = selectedStudents.includes(item.id); // Check if student is selected

    return (
      <TouchableOpacity
        onLongPress={() => handlePressAndHold(item.id)} // Handle long press
        onPress={() => {
          if (isMultiSelect) {
            // Toggle selection on multi-select mode
            if (isSelected) {
              setSelectedStudents(prev =>
                prev.filter(studentId => studentId !== item.id),
              );
            } else {
              setSelectedStudents(prev => [...prev, item.id]);
            }
          } else {
            // Handle regular press (single selection mode)
            handleStatusChange(item.id, item.attendence_type);
          }
        }}>
        <View style={styles.studentRow}>
          {/* Show tick if the student is selected */}
          {isMultiSelect && (
            <Icon
              name={isSelected ? 'check-box' : 'check-box-outline-blank'}
              size={20}
              color={isSelected ? '#28A745' : '#ccc'}
              style={styles.tickIcon}
            />
          )}
          <Text style={styles.studentText}>{item.name}</Text>
          <Text style={styles.studentText}>{item.rollNo}</Text>
          <View
            style={[styles.statusContainer, {backgroundColor: statusColor}]}>
            <Dropdown
              data={statusOptions}
              labelField="label"
              valueField="value"
              iconColor='#fff'
              itemTextStyle={{ fontSize: moderateScale(12), fontFamily: 'Poppins-Regular', color: '#000' }}
            
              value={item.attendence_type}
              onChange={selectedOption =>
                handleStatusChange(item.id, selectedOption.value)
              }
              style={styles.picker}
              placeholder="Select status"
              containerStyle={styles.dropdownContainer}
              renderItem={option => (
                <Text style={{color: '#000', fontSize: 14, padding: 10}}>
                  {option.label}
                </Text>
              )}
              selectedTextStyle={{color: '#FFF', fontSize: 14}}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  const currentDate = new Date().toISOString().split('T')[0];

  return (
    <View style={styles.container}>
      {/* Header */}

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={moderateScale(24)} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Class 10-A</Text>
        <TouchableOpacity>
          <View />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Student"
          placeholderTextColor="#A0A0A0"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Summary Section */}
      <View style={styles.summaryContainer}>
        <Text style={styles.totalSummaryText}>
          Total Students in Class:{' '}
          <Text style={styles.boldText}>{students.length}</Text>
        </Text>
        <Text style={styles.summaryText}>
          Present:{' '}
          <Text style={styles.boldText}>
            {students.filter(s => s.attendence_type === 'Present').length}
          </Text>{' '}
          Absent:{' '}
          <Text style={styles.boldText}>
            {students.filter(s => s.attendence_type === 'Absent').length}
          </Text>{' '}
          Late:{' '}
          <Text style={styles.boldText}>
            {students.filter(s => s.attendence_type === 'Late').length}
          </Text>
        </Text>
        <Text style={styles.dateText}>{currentDate}</Text>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate('AttandeneHistory')}>
          <Text style={styles.historyButtonText}>View History</Text>
        </TouchableOpacity>
      </View>

      {isMultiSelect && (
        <View style={styles.multiSelectDropdownContainer}>
          <Text style={styles.multiSelectLabel}>
            Select status for all selected students:
          </Text>
          {renderDropdownForMultiSelect()}
        </View>
      )}

      {/* Student List */}
      <FlatList
        data={students.filter(student =>
          student.name?.toLowerCase()?.includes(searchQuery.toLowerCase()),
        )}
        renderItem={renderStudent}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        style={{zIndex: 0}} // Adjust as needed for dropdown layering
      />
      <TouchableOpacity
        style={styles.saveButton} // Trigger the API call
        disabled={loading} // Disable button during loading
        onPress={saveAttendance}>
        <Text style={styles.saveButtonText}>
          {loading ? 'Saving...' : attendanceSaved ? 'Update' : 'Save'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingHorizontal: '16@ms',
    paddingVertical: '10@vs',
    overflow: 'visible',
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
    marginBottom: '20@ms',
    marginTop: '10@vs',
  },
  backButton: {
    fontSize: '20@ms',
    color: '#000',
    fontFamily: 'Poppins-Regular',
  },
  title: {
    fontSize: '18@ms',
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },
  multiSelectDropdownContainer: {
    marginTop: '15@vs',
    padding: '15@ms',
    backgroundColor: '#f1f1f1',
    borderRadius: '8@ms',
    marginBottom: '20@vs', // Add bottom margin to create space between the dropdown and the student list
  },
  
  multiSelectLabel: {
    fontSize: '14@ms',
    color: '#333',
    marginBottom: '10@vs',
  },
  notificationBell: {
    width: '24@ms',
    height: '24@ms',
    borderRadius: '12@ms',
    backgroundColor: '#000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    borderRadius: '8@ms',
    marginBottom: '12@ms',
    paddingHorizontal: '12@ms',
    height: '40@vs',
  },
  saveButton: {
    backgroundColor: '#f00',
    paddingVertical: '12@vs',
    borderRadius: '8@s',
    alignItems: 'center',
    marginTop: '16@vs',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: '16@ms',
    fontFamily: 'Poppins-Bold',
  },
  searchInput: {
    flex: 1,
    fontSize: '14@ms',
    color: '#000',
    fontFamily: 'Poppins-Regular',
  },
  summaryContainer: {
    marginBottom: '12@vs',
  },
  dropdown: {
    width: '120@s', // Scale width
    height: '40@vs', // Use vertical scaling for height
    borderRadius: '5@s', // Scale border radius
    borderColor: '#ccc',
    borderWidth: '1@s', // Scale border width
    backgroundColor: '#fff',
  },
  dropdownContainer: {
    zIndex: 1000, // Ensure dropdown is above other components
    borderBottomRightRadius: '20@s', // Scale border radius
    borderBottomLeftRadius: '20@s', // Scale border radius
  },
  multidropdownContainer: {
    zIndex: 1000, // Ensure dropdown is above other components
    borderBottomRightRadius: '20@s', // Scale border radius
    borderBottomLeftRadius: '20@s', // Scale border radius
    top: '20@vs', // Use vertical scaling for top position
  },  
  summaryText: {
    fontSize: '13@ms',
    color: '#000',
    marginBottom: '6@vs',
    justifyContent: 'space-between',
    margin: '10@ms',
    fontFamily: 'Poppins-Regular',
  },
  totalSummaryText: {
    fontSize: '16@ms',
    color: '#000',
    marginBottom: '6@vs',
    justifyContent: 'space-between',
    margin: '10@ms',
    fontFamily: 'Poppins-SemiBold',
  },
  boldText: {
    fontFamily: 'Poppins-Bold',
  },
  dateText: {
    fontSize: '14@ms',
    color: '#000',
    bottom: '62@vs',
    left: '240@ms',
    fontFamily: 'Poppins-Regular',
  },
  historyButton: {
    backgroundColor: '#DC3545',
    paddingHorizontal: '12@ms',
    paddingVertical: '6@vs',
    borderRadius: '6@ms',
    alignSelf: 'flex-end',
    bottom: '50@vs',
  },
  historyButtonText: {
    color: '#FFF',
    fontSize: '12@ms',
    fontFamily: 'Poppins-Bold',
  },
  listContainer: {
    paddingBottom: '20@vs',
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '15@vs',
    padding: '15@ms',
    backgroundColor: '#F9F9F9',
    borderRadius: '8@ms',
    position: 'relative',
    overflow: 'visible',
  },
  studentText: {
    fontSize: '12@ms',
    color: '#000',
    flex: 1,
    fontFamily: 'Poppins-Regular',
  },
  statusContainer: {
    flexGrow: 1,
    borderRadius: '10@ms',
    overflow: 'hidden',
    height: '30@vs',
    left: '10@ms',
  },
  picker: {
    padding: 10,
    justifyContent: 'center', // Center content vertically
    alignItems: 'center',
    left: '10@ms', // Center content horizontally
  },
  tickIcon: {
    marginRight: '10@ms', // Add spacing between the tick and the student name
  },
});

export default TeachersAttendance;
