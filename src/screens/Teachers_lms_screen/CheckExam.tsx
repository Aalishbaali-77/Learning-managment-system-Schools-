import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { moderateScale, ScaledSheet } from 'react-native-size-matters';
import FontAwesome from 'react-native-vector-icons/MaterialIcons';
import api from '../../api';
import { useUser } from '../../Context/UserContext';
import { getAccessToken } from '../../utils/storage';
import StudentRow from './RenderItemForExam';

type CheckExamProps = NativeStackScreenProps<any, any>;

const CheckExam: React.FC<CheckExamProps> = ({ route }) => {
  // console.log('Rendering CheckExam component');
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const teacherExam = route.params?.teacherExam;
  const [students, setStudents] = useState([]);
  const [counts, setCounts] = useState([]);
  const [temporaryMarks, setTemporaryMarks] = useState<{ [id: string]: string }>(
    {},
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const navigation = useNavigation();
  const { user } = useUser();
  const memoizedFilteredStudents = useMemo(() => {
    // console.log('Recomputing memoizedFilteredStudents');
    if (!searchQuery) return students; // Return all students if no search query
    return students.filter(student =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery, students]);
  const [selectedExam, setSelectedExam] = useState(
    teacherExam.length > 0
      ? {
        label: teacherExam[0].subject_name,
        value: teacherExam[0].exam_subject_id,
        exam_id: teacherExam[0].exam_id,
        exam_subject_id: teacherExam[0].exam_subject_id,
        exam_date: teacherExam[0].exam_date,
      }
      : null,
  );

  const temporaryMarksRef = useRef(temporaryMarks);

  const handleMarksChange = useCallback(
    (id, value) => {
      // Only update the state if the value has changed
      if (temporaryMarksRef.current[id] !== value) {
        temporaryMarksRef.current = {
          ...temporaryMarksRef.current,
          [id]: value,
        };
        setTemporaryMarks(prevMarks => ({
          ...prevMarks,
          [id]: value, // Update only the changed mark
        }));
      }
    },
    [temporaryMarks],
  );

  const saveMarks = () => {
    const updatedStudents = students.map(student =>
      temporaryMarks[student.id]
        ? { ...student, marks: temporaryMarks[student.id] }
        : student
    );

    setStudents(updatedStudents);
    setTemporaryMarks({});

    // Save updated students to AsyncStorage
    AsyncStorage.setItem('savedMarks', JSON.stringify(updatedStudents))
      // .then(() => console.log('Marks saved to AsyncStorage.'))
      // .catch(error => console.error('Error saving marks:', error));
  };

  useEffect(() => {
    const loadSavedMarks = async () => {
      try {
        const savedMarks = await AsyncStorage.getItem('savedMarks');
        if (savedMarks) {
          const parsedMarks = JSON.parse(savedMarks);
          setStudents(parsedMarks); // Update the state with saved marks
        }
      } catch (error) {
      //  console.error('Error loading marks:', error);
      }
    };

    loadSavedMarks();
  }, []);

  useEffect(() => {
    if (!user || !selectedExam) return; // Ensure required dependencies are present

    const fetchData = async () => {
      try {
        setLoading(true);
        const accessToken = await getAccessToken(); // Await the token from AsyncStorage
        if (accessToken) {
          await fetchCheckExams(
            selectedExam.exam_id,
            selectedExam.exam_subject_id,
          );
        }
      } catch (error) {
       // console.error('Error fetching access token or data:', error);
        Alert.alert(
          'Error',
          'Unable to fetch exam data. Please try again later.',
        );
      } finally {
        setLoading(false);
        // console.log('Finished fetching data.');
      }
    };

    fetchData();
  }, [user, selectedExam]); // Include 'user' and 'selectedExam' in dependencies

  useEffect(() => {
    // Filter students based on the search query
    if (searchQuery) {
      setFilteredStudents(
        students.filter(student =>
          student.name.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      );
    } else {
      setFilteredStudents(students); // Reset to all students if no search query
    }
  }, [searchQuery, students]);

  const fetchCheckExams = async (examId, examSubjectId) => {
    try {
      const payload = {
        exam_id: examId,
        exam_subject_id: examSubjectId,
      };
      const response = await api.protected.post(
        'teacher/exams/getStudentListForSubjectExam',
        payload,
      );
      if (response?.data?.status === 'success') {
        const data = response.data.data.students;
        const countData = response.data.data;
        const formattedData = data.map(student => ({
          id: student.student_id.toString(),
          name: student.student_name,
          rollNo: student.registration_no,
          marks: student.no_of_marks_recieved,
          isAbsent: student.is_absent,
        }));

        setStudents(prevStudents => {
          if (JSON.stringify(prevStudents) !== JSON.stringify(formattedData)) {
            return formattedData;
          }
          return prevStudents; // Prevent unnecessary state updates
        });
    

        setCounts(countData);
      } else {
        Alert.alert(
          'Error',
          response?.data?.message || 'Failed to fetch students',
        );
      }
    } catch (error) {
     // console.error('Error fetching students:', error);
      Alert.alert('Error', 'Unable to fetch students. Please try again later.');
    }
  };

  const handleDropdownChange = async item => {
    setSelectedExam({
      label: item.label,
      value: item.value,
      exam_id: item.exam_id,
      exam_subject_id: item.exam_subject_id,
      exam_date: item.exam_date,
    });

    await fetchCheckExams(item.exam_id, item.exam_subject_id);

    // Optionally load saved marks for this exam
    const savedMarks = await AsyncStorage.getItem('savedMarks');
    if (savedMarks) {
      const parsedMarks = JSON.parse(savedMarks);
      setStudents(parsedMarks);
    }
  };


  const handleSave = async () => {

     // Validate if entered marks exceed the total marks
  const totalMarks = parseFloat(teacherExam?.marks || '100'); // Default to 50 if not provided
  const invalidMarks = students.filter(student => {
    const enteredMarks =
      temporaryMarks[student.id] !== undefined
        ? parseFloat(temporaryMarks[student.id])
        : parseFloat(student.marks || '0');
    return enteredMarks > totalMarks;
  });

  // If there are students with invalid marks, show an error
  if (invalidMarks.length > 0) {
    Alert.alert(
      'Error',
      'Entered marks cannot exceed the total marks. Please review the entered marks.'
    );
    return;
  }
    // Filter out absent students
    const presentStudents = students
      .filter(student => !student.isAbsent)
      .map(student => ({
        student_id: student.id,
        marks: temporaryMarks[student.id] !== undefined ? temporaryMarks[student.id] : student.marks, // Only send marks for present students
      }));

    // If there are no present students, you might want to show an alert
    if (presentStudents.length === 0) {
      Alert.alert('Error', 'No students are present to update marks.');
      return;
    }
    

    const payload = {
      exam_id: selectedExam.exam_id,
      exam_subject_id: selectedExam.exam_subject_id,
      students: presentStudents, // Send only present students
    };
    console.log('payload of exam', payload);
    
    try {
      const response = await api.protected.post(
        'teacher/exams/updateMarksForMultipleStudents',
        payload,
      );

      if (response?.data?.status === 'success') {
       
  
        

        

        // Save updated students locally
        // Update the students state and save the updated marks to AsyncStorage
        const updatedStudents = students.map(student => {
          if (!student.isAbsent) {
            return {
              ...student,
              marks: temporaryMarks[student.id] || student.marks, // Update marks for present students
            };
          }
          return student;
        });

        setStudents(updatedStudents);
        saveMarks(updatedStudents); // Pass updatedStudents to saveMarks
        
        Alert.alert('Marks updated successfully')
        
        // Optionally reset the students state or navigate
      } else {
        Alert.alert(
          'Error',
          response?.data?.message || 'Failed to update marks',
        );
      }
    } catch (error) {
     // console.error('Error saving marks:', error);
      Alert.alert('Error', 'Unable to save marks. Please try again later.');
    }

  };

  // const StudentRow = React.memo(
  //   ({item, handleMarksChange, styles, temporaryMarks}) => {
  //     console.log(`Rendering StudentRow for ID: ${item.id}`);

  //     const marksValue =
  //       temporaryMarks[item.id] !== undefined
  //         ? temporaryMarks[item.id].toString()
  //         : (parseFloat(item.marks || '0') || '').toString();

  //     return (
  //       <View style={styles.tableRow}>
  //         <Text style={[styles.cell, styles.nameCell]}>{item.name}</Text>
  //         <Text style={[styles.cell, styles.rollNoCell]}>{item.rollNo}</Text>
  //         {item.isAbsent ? (
  //           <Text style={[styles.cell, styles.absentCell]}>Absent</Text>
  //         ) : (
  //           <TextInput
  //             style={[styles.cell, styles.marksInput]}
  //             placeholder="__/500"
  //             placeholderTextColor="#aaa"
  //             keyboardType="numeric"
  //             value={marksValue}
  //             onChangeText={value => handleMarksChange(item.id, value)}
  //           />
  //         )}
  //       </View>
  //     );
  //   },
  //   (prevProps, nextProps) => {
  //     // Only re-render if the marks for this student have changed
  //     return (
  //       prevProps.temporaryMarks[prevProps.item.id] ===
  //         nextProps.temporaryMarks[nextProps.item.id] &&
  //       prevProps.item.id === nextProps.item.id
  //     );
  //   },
  // );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableWithoutFeedback
        onPress={Keyboard.dismiss}>
        <ScrollView
          style={{ flex: 1, backgroundColor: '#FFFFFF' }} // Ensure ScrollView has a white background
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <FontAwesome
                  name="arrow-back"
                  size={moderateScale(24)}
                  color="#333"
                />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Check Exam</Text>
              <TouchableOpacity>
                <FontAwesome
                  name="notifications"
                  size={moderateScale(24)}
                  color="#333"
                />
              </TouchableOpacity>
            </View>


            {/* Search Bar */}
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="#aaa"
              value={searchQuery}
              onChangeText={setSearchQuery} // Update search query on text change
            />

            {/* Exam Info */}
            <View style={styles.examInfo}>
              <Text style={styles.dateText}>
                {selectedExam ? selectedExam.exam_date : 'Select an exam'}
              </Text>
              <Dropdown
                data={teacherExam.map(exam => ({
                  label: exam.subject_name,
                  value: exam.exam_subject_id,
                  exam_id: exam.exam_id,
                  exam_subject_id: exam.exam_subject_id,
                  exam_date: exam.exam_date,
                }))}
                labelField="label"
                valueField="value"
                placeholder="Select an exam"
                value={selectedExam?.value}
                onChange={handleDropdownChange}
                style={styles.dropdown}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                iconStyle={styles.iconStyle}
                itemTextStyle={{
                  fontSize: moderateScale(12),
                  fontFamily: 'Poppins-Regular',
                  color: '#000',
                }}
              />
            </View>

            {/* Exam Title */}
            <Text style={styles.examTitle}>
              {selectedExam ? `${selectedExam.label} Exam` : 'Select an exam'}
            </Text>
            <Text style={styles.examStats}>
              Total Students: {counts.total_student_count} Absent:{' '}
              {counts.absent_count}
            </Text>

            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={styles.headerCell}>Name</Text>
              <Text style={styles.headerCell}>Roll No</Text>
              <Text style={styles.headerCell}>Marks</Text>
            </View>

            {/* Student List */}
            
            <View style={styles.tableBody}>
              {memoizedFilteredStudents.map(item => (
                <StudentRow
                  key={item.id}
                  item={item}
                  handleMarksChange={handleMarksChange}
                  temporaryMarks={temporaryMarks}
                  teacherExam={teacherExam}
                  styles={styles}
                />
              ))}
            </View>


            {/* Save Button */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: '20@s',
    paddingVertical: '20@vs',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16@vs',
  },
  headerTitle: {
    fontSize: '18@ms',
    fontWeight: 'bold',
    color: '#000',
  },
  searchInput: {
    height: '40@vs',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: '8@s',
    paddingHorizontal: '8@s',
    fontSize: '14@ms',
    color: '#000',
    marginBottom: '16@vs',
  },
  examInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16@vs',
  },
  dateText: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Regular',
    color: '#000',
  },
  nameCell: {
    flex: 1,
    fontSize: '11@ms',
    fontFamily: 'Poppins-Regular',
    color: '#000',
    textAlign: 'center',
    paddingHorizontal: '4@s',
    overflow: 'hidden',
    textAlignVertical: 'center',
    height: '100%',
    right: '10@s',
  },
  rollNoCell: {
    flex: 1,
    fontSize: '11@ms',
    fontFamily: 'Poppins-Regular',
    color: '#000',
    textAlign: 'center',
    paddingHorizontal: '4@s',
    overflow: 'hidden',
    textAlignVertical: 'center',
    height: '100%',
  },
  dropdown: {
    width: '150@s',
    backgroundColor: 'purple',
    borderRadius: '8@s',
    paddingHorizontal: '8@s',
    paddingVertical: '4@vs',
  },
  dropdownPlaceholder: {
    color: '#fff',
    fontSize: '14@ms',
  },
  dropdownSelectedText: {
    color: '#fff',
    fontSize: '14@ms',
  },
  iconStyle: {
    tintColor: '#fff',
    width: '20@s',
    height: '20@s',
  },
  placeholderStyle: {
    color: '#fff',
    fontSize: '14@ms',
  },
  selectedTextStyle: {
    color: '#fff',
    fontSize: '14@ms',
    fontWeight: 'bold',
  },
  examTitle: {
    fontSize: '16@ms',
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
    textAlign: 'center',
    marginBottom: '4@vs',
  },
  examStats: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Regular',
    color: '#000',
    textAlign: 'center',
    marginBottom: '16@vs',
    top: '10@vs',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: '8@vs',
    paddingHorizontal: '16@s',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: '8@vs',
    alignItems: 'center',
    height: '50@vs',
  },
  cell: {
    flex: 1,
    fontSize: '11@ms',
    fontFamily: 'Poppins-Regular',
    color: '#000',
    textAlign: 'center',
    height: '30@vs',
    lineHeight: '30@vs',
    paddingHorizontal: '4@s',
    left: '10@s',
  },
  headerCell: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-Medium',
    color: '#000',
    textAlign: 'center',
  },
  absentCell: {
    color: 'red',
    fontFamily: 'Poppins-SemiBold',
    fontSize: '11@ms',
    textAlign: 'center',
    height: '30@vs',
    lineHeight: '30@vs',
    flex: 1,
  },
  marksInput: {
    borderWidth: 0.5,
    borderColor: '#3B3B3B',
    borderRadius: '4@s',
    height: '30@vs',
    textAlign: 'center',
    fontSize: '14@ms',
    color: '#000',
    flex: 1,
    paddingVertical: 0,
  },
  saveButton: {
    marginTop: '16@vs',
    backgroundColor: 'red',
    paddingVertical: '12@vs',
    borderRadius: '8@s',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: '16@ms',
    fontWeight: 'bold',
  },
});


export default CheckExam;
