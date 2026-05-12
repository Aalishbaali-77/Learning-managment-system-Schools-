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

const TeacherTestHistoryDetail = ({ route }) => {
  const { test_id } = route.params; // Task ID passed from the previous screen.
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [testDetail, setTestDetail] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [summary, setSummary] = useState({});
  const [filteredStudents, setFilteredStudents] = useState([]);
  const navigation = useNavigation();
  const { subjectName } = route.params;

  useEffect(() => {
    const fetchStudentList = async () => {
      setLoading(true);
      try {
        const payload = { test_id: test_id };
        const response = await api.protected.post('teacher/assign-tests/studentList', payload);
        if (response.data.success) {
          setStudents(response.data.data);
          setFilteredStudents(response.data.data); // Initially, show all students
          setSummary(response.data.status_counts);
        } else {
        //  console.error('Failed to fetch student list');
        }
      } catch (error) {
       // console.error('Error fetching student list:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchTestDetail = async () => {
      setLoading(true);
      try {
        const response = await api.protected.get(`teacher/assign-tests/detail/${test_id}`);
        if (response.data.status=='success') {
          setTestDetail(response.data.data);
        } else {
         // console.error('Failed to fetch testdetail list');
        }
      } catch (error) {
        //console.error('Error fetching testdetail list:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentList();
    fetchTestDetail();
  }, [test_id]);

  // Filter students based on search query
  useEffect(() => {
    if (searchQuery) {
      const filtered = students.filter(student =>
        student.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.registration_no.toString().includes(searchQuery)
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
      <Text style={styles.registrationColumn}>{item.registration_no}</Text>
      <Text style={styles.marksColumn}>{parseFloat(item.no_of_marks_recieved)}</Text>
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
        <TouchableOpacity onPress={()=>navigation.goBack()}>
          <Icon name="arrow-back" size={moderateScale(24)} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Test History Detail</Text>
        <TouchableOpacity onPress={()=>navigation.navigate('TeachersAnnouncement')}>
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
        <Text style={styles.title}>{testDetail.title}</Text>
      </View>

      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderText}>Name</Text>
        <Text style={styles.tableHeaderText}>Roll No</Text>
        <Text style={styles.tableHeaderText}>Marks{'\n'}Obtained</Text>
      </View>

      <FlatList
        data={students}
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
    padding: '16@ms',
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
    marginBottom: '16@vs',
  },
  headerTitle: {
    fontSize: '17@ms', // Used ms for font size scaling
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
    fontSize: '14@ms', // Used ms for font size scaling
    color: '#000',
    fontFamily: 'Poppins-Regular',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '16@vs',
  },
  dateText: {
    fontSize: '14@ms', // Used ms for font size scaling
    color: '#000',
    marginLeft: '8@s',
    fontFamily: 'Poppins-Regular',
  },
  summaryContainer: {
    marginBottom: '16@vs',
    alignItems: 'center',
  },
  title: {
    fontSize: '14@ms', // Used ms for font size scaling
    fontFamily: 'Poppins-Medium',
    color: '#000',
    marginBottom: '4@vs',
  },
  summaryText: {
    fontSize: '13@ms', // Used ms for font size scaling
    color: '#000',
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
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
    fontSize: '13@ms', // Used ms for font size scaling
    fontFamily: 'Poppins-Medium',
    color: '#000',
    left: '10@ms',
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
  },
  nameColumn: {
    flex: 1,
    paddingRight: '8@s',
  },
  registrationColumn: {
    flex: 2,
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
    color: '#000',
    fontSize: '11@ms', // Used ms for font size scaling
  },
  marksColumn: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
    color: '#000',
    fontSize: '11@ms', // Used ms for font size scaling
  },
  taskText: {
    fontSize: '11@ms', // Used ms for font size scaling
    color: '#000',
    fontFamily: 'Poppins-Regular',
  },
  completed: {
    color: '#28A745',
  },
  unsubmitted: {
    color: '#FF0000',
  },
});



export default TeacherTestHistoryDetail;
