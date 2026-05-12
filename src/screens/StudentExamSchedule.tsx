import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ScaledSheet, moderateScale, verticalScale } from 'react-native-size-matters';
import api from '../api';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useUser } from '../Context/UserContext';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { useSubjects } from '../Context/TeacherSubjectContext';
import { Dropdown } from 'react-native-element-dropdown';

type SubjectIdProps = NativeStackScreenProps<any, any>;

const StudentExamSchedule: React.FC<SubjectIdProps> = (props) => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState({});
  const subjectId = props.route.params?.subjectId;
  const subject = props.route.params?.subject
  const { user } = useUser()
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();
  const selectedTabFromParams = props.route.params?.selectedTab || 'diary'; // Get selectedTab from params or default to 'diary'
  const [selectedTab, setSelectedTab] = useState(null); // Set the selectedTab based on passed param
    const {sectionId} = useSubjects();
    const [isFocus, setIsFocus] = useState(false);
    const student_id = user?.student_id;
    const [studentClassDetails, setStudentClassDetails] = useState({
        class_id: Number,
        className: '',
        sectionName: '',
        student_name: '',
        registration_no: '',
      });
  
    const data = [
        { label: 'Diary', value: 'diary' },
        { label: 'Tests', value: 'test' },
      ];
      
      const fetchStudentDetails = async () => {
          try {
            const response = await api.protected.post('student/detail', {student_id});
            if (response?.data?.status === 'success') {
              const data = response.data.data; // This is an object
              if (data) {
                // Update state with class and section names
                setStudentClassDetails({
                  class_id: data.class_id,
                  className: data.class_name, // Access properties directly
                  sectionName: data.section_name,
                  student_name: data.student_name,
                  registration_no: data.registration_no,
                });
              } else {
                Alert.alert('Error', 'No class details found.');
              }
              // console.log(data); // Debugging
            } else {
              Alert.alert(
                'Error',
                response?.data?.message || 'Failed to fetch class details',
              );
            }
          } catch (error) {
          //  console.error('Error fetching class details:', error);
          }
        };
      

    const fetchStudentExamSchedule = async () => {
        setLoading(true); // Set loading state before starting API call
        try {
          const payload = {
            school_id: user?.company_id,
            school_campus_id: user?.school_campus_id,
            section_id: sectionId,
          };
          const endpoint = 'student/examScedule';
      
          const response = await api.protected.post(endpoint, payload);
      
          if (response?.data?.status === 'success') {
            const data = response.data.data;
            const formattedData = Object.keys(data).map((key) => ({
              examId: data[key].exam_id,
              termName: data[key].term_name,
              subjects: data[key].subjects,
            }));
      
            setStudents(formattedData); // Save the formatted data to state
          } else {
            // console.error(
            //   'Failed to fetch student task history:',
            //   response?.data?.message,
            // );
          }
        } catch (error) {
         // console.error('Error fetching student task history:', error);
        } finally {
          setLoading(false); // Stop loading state after API call
        }
      };

    useEffect(() => {
    
      const fetchData = async () => {
        setLoading(true); // Set loading to true before starting fetch
    
        try {
          await fetchStudentExamSchedule();  // Fetch attendance data
          await fetchStudentDetails()
        } catch (error) {
         // console.error('Error fetching student details:', error);
        } finally {
          setLoading(false); // Set loading to false after all fetch operations complete
        }
      };
    
      fetchData(); // Call the async function
  }, []); // Add dependencies to ensure proper updates

 

  const regNo = studentClassDetails?.registration_no

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={moderateScale(24)} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exam Schedule</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Announcements')}>
          <Icon name="notifications" size={moderateScale(24)} color="#000" />
        </TouchableOpacity>
      </View>
  
      {/* ScrollView added here */}
      <ScrollView contentContainerStyle={{ paddingBottom: verticalScale(5) }} showsVerticalScrollIndicator={false}>
      <Text style={styles.regNo}>Roll No: {regNo}</Text>
  {students.map((examSchedule, index) => (
    <View key={index} style={{marginTop: verticalScale(30)}}>
      {/* Term Name */}
      <View >
        <Text style={styles.termTitle}>{examSchedule.termName}</Text>
        
      </View>

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderText}>Date</Text>
        <Text style={styles.tableHeaderText}>Subject</Text>
        <Text style={styles.tableHeaderText}>Time</Text>
      </View>

      {/* Render Subjects */}
      {examSchedule.subjects.map((subject) => (
        <View key={subject.exam_subject_id} style={styles.subjectRow}>
          <Text style={styles.subjectText}>{subject.exam_date}</Text>
          <Text style={styles.taskStatusText}>{subject.subject_name}</Text>
          <Text style={styles.taskStatusText}>
            {subject.start_time} - {subject.end_time}
          </Text>
        </View>
      ))}
    </View>
  ))}
</ScrollView>
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: '16@ms', // Changed to ms for general padding
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)', // No scaling needed for colors
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16@vs', // Vertical margin
  },
  headerTitle: {
    fontSize: '15@ms',
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },
  examCard: {
    right: '15@s',
  },
  termTitle: {
    fontSize: '15@ms',
    fontFamily: 'Poppins-SemiBold',
    marginBottom: '8@vs', // Changed to vertical scaling for margin
    color: '#000',
    left: '5@s',
  },
  regNo: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-Medium',
    marginBottom: '8@vs', // Vertical margin scaling
    color: '#000',
    left: '155@s',
    top: '61@vs', // Vertical scaling for positioning
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F3F3',
    borderRadius: '8@s',
    paddingHorizontal: '12@s',
    paddingVertical: '8@vs',
    marginBottom: '16@vs',
  },
  searchInput: {
    flex: 1,
    fontSize: '14@ms',
    fontFamily: 'Poppins-Regular',
    color: '#000',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '16@vs',
  },
  dateText: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-Regular',
    color: '#000',
    marginLeft: '8@s',
  },
  summaryContainer: {
    marginBottom: '16@vs',
    alignItems: 'center',
    top: '20@vs',
    right: '110@s',
  },
  pickerContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: '8@s', // Changed to s for consistency with borderRadius
    marginLeft: '220@ms',
    right: '20@ms',
  },
  picker: {
    height: '30@vs',
    width: '110%', // No scaling needed for percentage
  },
  pickerLabel: {
    fontSize: '10@ms',
    fontFamily: 'Poppins-Regular',
  },
  pickerFocus: {
    borderBottomColor: '#000', // No scaling needed for colors
  },
  title: {
    fontSize: '16@ms',
    fontFamily: 'Poppins-Bold',
    color: '#000',
    marginBottom: '4@vs',
  },
  titleName: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-Medium',
    color: '#000',
    marginBottom: '4@vs',
  },
  summaryText: {
    fontSize: '11@ms',
    fontFamily: 'Poppins-Regular',
    color: '#000',
    textAlign: 'center',
    top: '10@vs',
    marginHorizontal: '5@s',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: '15@ms', // Changed to ms for general margin
    marginHorizontal: '40@s',
    marginBottom: '8@vs',
    paddingBottom: '8@vs',
    right: '33@s',
  },
  tableHeaderText: {
    fontSize: '13@ms',
    fontFamily: 'Poppins-Medium',
    color: '#000',
  },
  list: {
    marginTop: '8@vs',
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: '12@vs',
  },
  summaryTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: '10@s',
  },
  subjectText: {
    flex: 1,
    fontSize: '11@ms',
    fontFamily: 'Poppins-Regular',
    color: '#000',
    left: '5@ms', // Positioning should use ms
  },
  taskStatusText: {
    flex: 1,
    fontSize: '11@ms',
    fontFamily: 'Poppins-Regular',
    color: '#000',
  },
  completed: {
    fontFamily: 'Poppins-Regular',
    color: '#28A745', // Green for "Completed"
  },
  unsubmitted: {
    fontFamily: 'Poppins-Regular',
    color: '#FF0000', // Red for "Pending"
  },
});



export default StudentExamSchedule;
