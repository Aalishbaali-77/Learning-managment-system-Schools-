import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ScaledSheet, moderateScale } from 'react-native-size-matters';
import api from '../api';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useUser } from '../Context/UserContext';
import { useNavigation } from '@react-navigation/native';

type SubjectIdProps = NativeStackScreenProps<any, any>;

const StudentTestHistory: React.FC<SubjectIdProps> = (props) => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [summary, setSummary] = useState({
    completed: 0,
    pending: 0,
    total: 0,
  });
  const subjectId = props.route.params?.subjectId
  const { user } = useUser()
  const navigation = useNavigation();

  useEffect(() => {
    const fetchStudentsTaskHistory = async () => {
      setLoading(true); // Set loading state before starting API call
      try {
        // Prepare the payload
        const payload = {
          student_id: user?.student_id,
          subject_id: subjectId,
          school_id: user?.company_id,
          school_campus_id: user?.school_campus_id,
          test_filter: 2,
        };
  
        // Make the API request
        const response = await api.protected.post('student/testList', payload);
  
        if (response?.data?.success) {
          const { data, counts } = response.data;
  
          // Normalize the data
          if (Array.isArray(data)) {
            const normalizedData = data.map((item) => ({
              ...item,
              marks_received: parseFloat(item.marks_received) || 0,  // Ensure marks_received is a valid number
              total_marks: parseFloat(item.total_marks) || 0,        // Ensure total_marks is a valid number
            }));
  
            // console.log('Normalized Data:', normalizedData);  // Debugging log
  
            setStudents(normalizedData);
          } else {
            //console.error('Unexpected data format:', data);
          }
  
          // Update summary directly with counts object
          if (counts) {
            setSummary({
              completed: counts.completed_tests || 0,
              pending: counts.pending_tests || 0,
              total: counts.total_tests || 0,
            });
          } else {
            console.warn('Status counts missing in response.');
          }
        } else {
          //console.error('Failed to fetch student task history:', response?.data?.message);
        }
      } catch (error) {
        // Handle any errors
        //console.error('Error fetching student task history:', error);
      } finally {
        setLoading(false); // Stop loading state after API call
      }
    };
  
    // Invoke the function
    fetchStudentsTaskHistory();
  }, [user?.student_id, subjectId]); // Add dependencies to ensure proper updates

  const filteredStudents = students.filter(item => 
    item.test_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  

  const renderTask = ({ item }) => {
    // Log the marks_received and total_marks values before rendering
    // console.log('Marks Received:', item.marks_received);
    // console.log('Total Marks:', item.total_marks);
  
    // Display the values safely
    return (
      <View style={styles.taskRow}>
        <Text style={styles.taskText}>{item.test_name}</Text>
        <Text style={styles.taskText}>{item.start_date}</Text>
        <Text style={styles.taskText}>
          {item.marks_received}/{item.total_marks}
        </Text>
      </View>
    );
  };
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={()=>navigation.goBack()}>
          <Icon name="arrow-left" size={moderateScale(24)} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>View Test History</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Announcements')}>
          <Icon name="bell" size={moderateScale(24)} color="#FF0000" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
      <TextInput
          style={styles.searchInput}
          placeholder="Search Test"
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={text => setSearchQuery(text)}
        />

        <Icon name="search" size={moderateScale(20)} color="#000" />
      </View>

      {/* <View style={styles.dateContainer}>
        <Icon name="calendar-outline" size={moderateScale(20)} color="#000" />
        <Text style={styles.dateText}>4 Dec 2024</Text>
      </View> */}

      <View style={styles.summaryContainer}>
        <Text style={styles.title}>Subject name:</Text>
        <Text style={styles.summaryText}>
          Completed Tests: {summary?.completed || 0} |
          Pending Tests: {summary?.pending || 0} |
          Total Tests: {summary?.total || 0}
        </Text>
      </View>
      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderText}>Test Name</Text>
        <Text style={styles.tableHeaderText}>Gained marks</Text>
      </View>

      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: '16@s',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16@vs',
  },
  headerTitle: {
    fontSize: '18@s',
    fontFamily: 'Poppins-Bold',
    color: '#000',
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
    fontSize: '14@s',
    fontFamily: 'Poppins-Regular',
    color: '#000',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '16@vs',
  },
  dateText: {
    fontSize: '14@s',
    fontFamily: 'Poppins-Regular',
    color: '#000',
    marginLeft: '8@s',
  },
  summaryContainer: {
    marginBottom: '16@vs',
    alignItems: 'center',
  },
  title: {
    fontSize: '16@s',
    fontFamily: 'Poppins-Bold',
    color: '#000',
    marginBottom: '4@vs',
  },
  summaryText: {
    fontSize: '14@s',
    fontFamily: 'Poppins-Regular',
    color: '#000',
    textAlign: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: '8@vs',
    borderBottomWidth: 1,
    borderBottomColor: '#CCC',
    paddingBottom: '8@vs',
  },
  tableHeaderText: {
    fontSize: '14@s',
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },
  list: {
    marginTop: '8@vs',
  },
  taskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: '12@vs',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F3F3',
    margin: '5@ms'
  },
  taskText: {
    fontSize: '14@s',
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


export default StudentTestHistory;
