import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { ScaledSheet, moderateScale } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../api'; // Assuming your API helper is set up here.

const TeacherTaskHistoryDetail = ({ route }) => {
  const { taskId } = route.params; // Task ID passed from the previous screen.
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [summary, setSummary] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const { subjectName } = route.params;
  const navigaiton = useNavigation();

  useEffect(() => {
    const fetchStudentList = async () => {
      setLoading(true);
      try {
        const payload = { task_id: taskId };
        const response = await api.protected.post('teacher/assign-tasks/studentList', payload);
        if (response.data.success) {
          setStudents(response.data.data);
          setFilteredStudents(response.data.data); // Initially, show all students
          setSummary(response.data.status_counts);
        } else {
         // console.error('Failed to fetch student list');
        }
      } catch (error) {
       // console.error('Error fetching student list:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentList();
  }, [taskId]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = students.filter(student =>
        student.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.student_id.toString().includes(searchQuery)
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students); // If no query, show all students
    }
  }, [searchQuery, students]);

  const renderTask = ({ item }) => (
    <View style={styles.taskRow}>
      <View style={styles.nameColumn}>
        <Text style={styles.taskText} numberOfLines={2}>
          {item.student_name}
        </Text>
      </View>
      <Text style={styles.registrationColumn}>{item.student_id}</Text>
      <Text
        style={[
          styles.statustaskText,
          item.assign_task_status === 2 ? styles.completed : styles.unsubmitted,
        ]}
      >
        {item.assign_task_status === 2 ? 'Completed' : 'Pending'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={()=>navigaiton.goBack()}>
          <Icon name="arrow-back" size={moderateScale(24)} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task History Detail</Text>
        <TouchableOpacity onPress={()=>navigaiton.navigate('TeachersAnnouncement')}>
          <Icon name="notifications" size={moderateScale(24)} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
      <TextInput
          style={styles.searchInput}
          placeholder="Search Task"
          placeholderTextColor="#999"
          value={searchQuery} // Bind the search query to the input field
          onChangeText={setSearchQuery} // Update the search query state as user types
        />
        <Icon name="search" size={moderateScale(20)} color="#000" />
      </View>

      

      <View style={styles.summaryContainer}>
        <Text style={styles.title}>Subject: {subjectName}</Text>
        <Text style={styles.summaryText}>
          Completed Tasks: {summary['Completed Count']} | 
          Pending Tasks: {summary['Pending Count']} | 
          Overdue Tasks: {summary['Late Count']}
        </Text>
      </View>

      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderText}>Name</Text>
        <Text style={styles.tableHeaderText}>Roll No</Text>
        <Text style={styles.tableHeaderText}>Status</Text>
      </View>

      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => item.id.toString()}
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
    padding: '16@ms', // Corrected to use 's' for scaling
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)', // Optional semi-transparent background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16@vs', // Corrected to use 'vs' for vertical scaling
  },
  headerTitle: {
    fontSize: '17@ms', // Corrected to use 's' for scaling
    fontFamily: 'Poppins-Bold', // Replaced fontWeight: 'bold' with fontFamily: 'Poppins-Bold'
    color: '#000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F3F3',
    borderRadius: '8@s', // Corrected to use 's' for scaling
    paddingHorizontal: '12@s', // Corrected to use 's' for scaling
    paddingVertical: '8@vs', // Corrected to use 'vs' for vertical scaling
    marginBottom: '16@vs', // Corrected to use 'vs' for vertical scaling
  },
  searchInput: {
    flex: 1,
    fontSize: '14@ms', // Corrected to use 's' for scaling
    color: '#000',
    fontFamily: 'Poppins-Regular', // Regular font for input text
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '16@vs', // Corrected to use 'vs' for vertical scaling
  },
  dateText: {
    fontSize: '14@ms', // Corrected to use 's' for scaling
    color: '#000',
    marginLeft: '8@s', // Corrected to use 's' for scaling
    fontFamily: 'Poppins-Regular', // Regular font for date text
  },
  summaryContainer: {
    marginBottom: '16@vs', // Corrected to use 'vs' for vertical scaling
    alignItems: 'center',
  },
  title: {
    fontSize: '16@ms', // Corrected to use 's' for scaling
    fontFamily: 'Poppins-Medium', // Replaced fontWeight: 'bold' with fontFamily: 'Poppins-Bold'
    color: '#000',
    marginBottom: '4@vs', // Corrected to use 'vs' for vertical scaling
  },
  summaryText: {
    fontSize: '12@ms', // Corrected to use 's' for scaling
    color: '#000',
    textAlign: 'center',
    fontFamily: 'Poppins-Regular', // Regular font for summary text
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: '8@vs', // Corrected to use 'vs' for vertical scaling
    borderBottomWidth: 1,
    borderBottomColor: '#CCC',
    paddingBottom: '8@vs', // Corrected to use 'vs' for vertical scaling
  },
  tableHeaderText: {
    fontSize: '14@ms', // Corrected to use 's' for scaling
    fontFamily: 'Poppins-Medium', // Replaced fontWeight: 'bold' with fontFamily: 'Poppins-Bold'
    color: '#000',
  },
  list: {
    marginTop: '8@vs', // Corrected to use 'vs' for vertical scaling
  },
  taskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: '12@vs', // Corrected to use 'vs' for vertical scaling
    borderBottomWidth: 1,
    borderBottomColor: '#F3F3F3',
  },
  nameColumn: {
    flex: 2, // Larger flex for the name column to allow wrapping
    paddingRight: '8@s', // Corrected to use 's' for scaling
  },
  registrationColumn: {
    flex: 6, // Adjust flex to align with other columns
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
    color: '#000',
    fontSize: '11@ms', // Corrected to use 's' for scaling
  },
  marksColumn: {
    flex: 1, // Adjust flex to align with other columns
    textAlign: 'center', // Align text to the center of the column
    fontFamily: 'Poppins-Regular',
    color: '#000',
    fontSize: '11@ms', // Corrected to use 's' for scaling
  },
  taskText: {
    fontSize: '11@ms', // Corrected to use 's' for scaling
    color: '#000',
    fontFamily: 'Poppins-Regular',
  },
  statustaskText: {
    flex: 2, // Adjust flex to align with other columns
    textAlign: 'center', // Align text to the center of the column
    fontFamily: 'Poppins-Regular',
    color: '#000',
    fontSize: '11@ms', // Corrected to use 's' for scaling
  },
  completed: {
    color: '#28A745', // Green for "Completed"
  },
  unsubmitted: {
    color: '#FF0000', // Red for "Pending"
  },
});



export default TeacherTaskHistoryDetail;
