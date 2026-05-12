import {useNavigation} from '@react-navigation/native';
import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {moderateScale, ScaledSheet} from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../api'; // Adjust the import to match your API utility
import {useSubjects} from '../../Context/TeacherSubjectContext';
import {useUser} from '../../Context/UserContext';

const TeacherTestHistory: React.FC<SubjectsProps> = props => {
  const navigation = useNavigation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const {user} = useUser();
  const {sectionId} = useSubjects();
  const subject_id = props.route.params?.subjectId;
  const subjectName = props.route.params?.subjectName

  const fetchTaskHistory = async () => {
    setLoading(true);
    try {
      const payload = {
        school_id: user?.company_id,
        school_campus_id: user?.school_campus_id,
        section_id: sectionId,
        employee_id: user?.emp_id,
        subject_id: subject_id,
        tyoe: 1,
      };

      // console.log('Fetching task history with payload:', payload);
      const response = await api.protected.post(
        'teacher/assign-tests',
        payload,
      );

      if (response.data.status === 'success') {
        // console.log('Task data fetched successfully:', response.data.data);
        setTasks(response.data.data);
      } else {
        // console.error('Failed to fetch tasks:', response.data.message);
      }
    } catch (error) {
      // console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskHistory();
  }, []);

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const renderTask = ({item}) => (
    <View style={styles.taskRow}>
      <Text style={[styles.taskText, styles.column]}>{item.title}</Text>
      <Text style={[styles.taskText, styles.column]}>{item.start_date}</Text>
      <Text
        style={[
          styles.taskText,
          styles.column,
          
        ]}>
        {parseFloat(item.no_of_marks)}
      </Text>
      <TouchableOpacity
        style={[styles.column, {alignItems: 'flex-end'}]}
        onPress={() =>
          navigation.navigate('TeacherTestHistoryDetail', {test_id: item.id, subjectName:subjectName})
        }>
        <Icon
          name="chevron-right"
          size={moderateScale(18)}
          color="#000"
          style={styles.detailbutton}
        />
      </TouchableOpacity>
    </View>
  );

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
        <Text style={styles.headerTitle}>Test History</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('TeacherAnnouncement')}>
          <Icon name="notifications" size={moderateScale(24)} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Test"
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Icon name="search" size={moderateScale(20)} color="#000" />
      </View>

      

      <View style={styles.summaryContainer}>
        <Text style={styles.subjectsummaryText}>
          {tasks.title} Subject: {subjectName}
        </Text>
        <Text style={styles.summaryText}>
          {tasks.title} Total Test: {tasks.length}
        </Text>
        <Text style={styles.summaryText}>
          Completed Tests:{' '}
          {tasks.filter(task => task.assign_task_status === 1).length} Pending
          Tests: {tasks.filter(task => task.assign_task_status !== 1).length}
        </Text>
      </View>

      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderText}>Test </Text>
        <Text style={styles.tableHeaderText}>Date</Text>
        <Text style={styles.tableHeaderText}>Marks</Text>
        <Text style={styles.tableHeaderText}>Detail</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderTask}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: '16@ms', // Corrected to use 's' for scaling
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
    marginBottom: '16@vs', // Corrected to use 'vs' for vertical scaling
  },
  headerTitle: {
    fontSize: '17@ms', // Corrected to use 's' for scaling
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F3F3',
    borderRadius: '8@s', // Corrected to use 's' for scaling
    paddingHorizontal: '12@s', // Corrected to use 's' for scaling
    paddingVertical: '10@vs', // Corrected to use 'vs' for vertical scaling
    marginBottom: '20@vs', // Corrected to use 'vs' for vertical scaling
  },
  searchInput: {
    flex: 1,
    fontSize: '14@ms', // Corrected to use 's' for scaling
    color: '#000',
    fontFamily: 'Poppins-Regular',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '20@vs', // Corrected to use 'vs' for vertical scaling
  },
  dateText: {
    fontSize: '14@ms', // Corrected to use 's' for scaling
    color: '#000',
    marginLeft: '8@s', // Corrected to use 's' for scaling
    fontFamily: 'Poppins-Regular',
  },
  summaryContainer: {
    marginBottom: '20@vs', // Corrected to use 'vs' for vertical scaling
  },
  summaryText: {
    fontSize: '12@ms', // Corrected to use 's' for scaling
    color: '#000',
    fontFamily: 'Poppins-Regular',
    lineHeight: '18@vs', // Corrected to use 'vs' for vertical scaling
    alignSelf: 'center',
    marginTop: '8@s', // Corrected to use 's' for scaling
  },
  subjectsummaryText: {
    fontSize: '13@ms', // Corrected to use 's' for scaling
    color: '#000',
    fontFamily: 'Poppins-Medium',
    lineHeight: '18@vs', // Corrected to use 'vs' for vertical scaling
    alignSelf: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#CCC',
    paddingBottom: '12@vs', // Corrected to use 'vs' for vertical scaling
    marginBottom: '16@vs', // Corrected to use 'vs' for vertical scaling
  },
  tableHeaderText: {
    flex: 1,
    fontSize: '14@ms', // Corrected to use 's' for scaling
    fontFamily: 'Poppins-Medium',
    color: '#000',
    textAlign: 'left',
    left: '10@ms', // Corrected to use 'ms' for scaling
  },
  list: {
    marginTop: '12@vs', // Corrected to use 'vs' for vertical scaling
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: '16@vs', // Corrected to use 'vs' for vertical scaling
    borderBottomWidth: 1,
    borderBottomColor: '#F3F3F3',
  },
  taskText: {
    flex: 1,
    left: '10@s', // Corrected to use 'ms' for scaling
    fontSize: '11@ms', // Corrected to use 's' for scaling
    color: '#000',
    fontFamily: 'Poppins-Regular',
    textAlign: 'left',
    lineHeight: '18@vs', // Corrected to use 'vs' for vertical scaling
  },
  column: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: '8@s', // Corrected to use 's' for scaling
  },
  detailbutton: {
    right: '30@s', // Corrected to use 'ms' for scaling
  },
});


export default TeacherTestHistory;
