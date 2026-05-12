import { useNavigation } from '@react-navigation/native';
import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {moderateScale, ScaledSheet} from 'react-native-size-matters';
// Import your desired icon library
import Icon from 'react-native-vector-icons/MaterialIcons';

const TaskHistoryScreen = () => {
  const [selectedDate, setSelectedDate] = useState('Date'); // For dropdown
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');

  const tasks = [
    {id: '1', name: 'Algebra', date: '01 Dec 2024', status: 'Completed'},
    {id: '2', name: 'Essay Writing', date: '01 Dec 2024', status: 'Completed'},
  ];

  const filteredTasks = tasks.filter(task => {
    return task.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const renderTaskItem = ({item}) => (
    <View style={styles.tableRow}>
      <Text style={styles.tableCell}>{item.name}</Text>
      <Text style={styles.tableCell}>{item.date}</Text>
      <Text style={[styles.tableCell, styles.statusCell]}>{item.status}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconContainer} onPress={()=>navigation.goBack()}>
          <Icon name="arrow-back" size={moderateScale(24)} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task History</Text>
        <TouchableOpacity style={styles.iconContainer} onPress={()=>navigation.navigate('TeacherAnnouncement')}>
          <Icon name="notifications" size={moderateScale(24)} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Search Box */}
      <TextInput
        placeholder="Search Task"
        style={styles.searchInput}
        placeholderTextColor="#aaa"
        value={searchQuery}
        onChangeText={setSearchQuery} // Update the search query
      />

      {/* Summary */}
      <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>Mathematics Total Task: 50</Text>
        <TouchableOpacity style={styles.dateDropdown}>
          <Text style={styles.dateText}>{selectedDate}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.statsText}>
        Completed Tasks: 40 Pending Tasks: 8 Overdue Tasks: 2
      </Text>

      {/* Table */}
      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderText}>Task Name</Text>
        <Text style={styles.tableHeaderText}>Assigned Date</Text>
        <Text style={styles.tableHeaderText}>Status</Text>
      </View>
      <FlatList
        data={filteredTasks}
        keyExtractor={item => item.id}
        renderItem={renderTaskItem}
        contentContainerStyle={styles.tableContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: '16@s',
    paddingTop: '20@vs',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: '10@s',
    marginBottom: '16@vs',
  },
  headerTitle: {
    fontSize: '18@s',
    color: '#000',
    textAlign: 'center',
    flex: 1, // Ensure title is centered
    fontFamily: 'Poppins-Bold',
  },
  iconContainer: {
    width: '40@s', // For consistent alignment
    alignItems: 'center',
  },
  notificationIcon: {
    width: '24@ms',
    height: '24@vs',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '12@s',
    backgroundColor: '#f00',
  },
  notificationBadge: {
    color: '#fff',
    fontSize: '12@ms',
    fontFamily: 'Poppins-Regular',
  },
  searchInput: {
    marginTop: '16@vs',
    height: '40@vs',
    borderWidth: '1@s',
    borderColor: '#ccc',
    borderRadius: '8@s',
    paddingHorizontal: '10@s',
    color: '#000',
    fontFamily: 'Poppins-Regular',
  },
  summaryRow: {
    marginTop: '16@vs',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: '16@ms',
    color: '#000',
    fontFamily: 'Poppins-Bold',
  },
  dateDropdown: {
    borderWidth: '1@s',
    borderColor: '#ccc',
    borderRadius: '8@s',
    paddingHorizontal: '12@s',
    paddingVertical: '6@vs',
  },
  dateText: {
    fontSize: '14@ms',
    color: '#000',
    fontFamily: 'Poppins-Regular',
  },
  statsText: {
    marginTop: '8@vs',
    fontSize: '14@s',
    color: '#3b3b3b',
    fontFamily: 'Poppins-Regular',
  },
  tableHeader: {
    marginTop: '16@vs',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: '1@s',
    borderBottomColor: '#ccc',
    paddingBottom: '8@vs',
  },
  tableHeaderText: {
    fontSize: '14@ms',
    color: '#000',
    flex: 1,
    fontFamily: 'Poppins-Bold',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: '8@vs',
    borderBottomWidth: '1@s',
    borderBottomColor: '#f0f0f0',
  },
  tableCell: {
    flex: 1,
    fontSize: '14@ms',
    color: '#000',
    fontFamily: 'Poppins-Regular',
  },
  statusCell: {
    color: 'green', // Adjust color dynamically based on status
    fontFamily: 'Poppins-Regular',
  },
  tableContent: {
    paddingBottom: '16@vs', // Add padding or other styles for the FlatList container
  },
});


export default TaskHistoryScreen;
