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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useUser } from '../../Context/UserContext';
import api from '../../api';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';


type SubjectIdProps = NativeStackScreenProps<any, any>;

const ParentsTaskHistory: React.FC<SubjectIdProps> = (props) => {
   const [loading, setLoading] = useState(true);
   const [students, setStudents] = useState([]);
   const [summary, setSummary] = useState({});
   const subjectId = props.route.params?.subjectId;
   const subject = props.route.params?.subject
   const { user } = useUser()
   const [searchQuery, setSearchQuery] = useState('');
   const navigation = useNavigation();
   const selectedTabFromParams = props.route.params?.selectedTab || 'diary'; // Get selectedTab from params or default to 'diary'
   const [selectedTab, setSelectedTab] = useState(selectedTabFromParams); // Set the selectedTab based on passed param
 
   
    
     const fetchStudentsTaskHistory = async () => {
       setLoading(true); // Set loading state before starting API call
       try {
         const payload = {
           student_id: user?.student_id,
           subject_id: subjectId,
           school_id: user?.company_id,
           school_campus_id: user?.school_campus_id,
           ...(selectedTab === 'diary' ? { task_filter: 2 } : { test_filter: 2 })
         };
         const endpoint =
           selectedTab === 'diary' ? 'student/taskList' : 'student/testList'; // Set endpoint based on selectedTab
   
        //  console.log('Selected Tab:', selectedTab);
        //  console.log('Sending payload:', payload);
        //  console.log('Hitting endpoint:', endpoint);
   
         const response = await api.protected.post(endpoint, payload);
   
         if (response?.data?.success) {
           const { data, total_task_count, completed_count, uncompleted_count, counts } = response.data;
 
           
   
           if (Array.isArray(data)) {
             setStudents(data);
             
             if (selectedTab === 'diary') {
               // For tasks, use task-specific counts
               setSummary({
                 completed: total_task_count || 0,
                 pending: uncompleted_count || 0,
                 total: total_task_count || 0,
               });
             } else if (counts) {
               // For tests, use test-specific counts
               setSummary({
                 tests_completed: counts.completed_tests || 0,
                 tests_pending: counts.pending_tests || 0,
                 tests_total: counts.total_tests || 0,
               });
             }
           } else {
            // console.error('Unexpected data format:', data);
           }
   
           
         } else {
          // console.error('Failed to fetch student task history:', response?.data?.message);
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
           await fetchStudentsTaskHistory();  // Fetch attendance data
           
         } catch (error) {
         //  console.error('Error fetching student details:', error);
         } finally {
           setLoading(false); // Set loading to false after all fetch operations complete
         }
       };
     
       fetchData(); // Call the async function
   }, [user?.student_id, subjectId, selectedTab]); // Add dependencies to ensure proper updates
 
   const filteredStudents = students.filter(item => {
     const name = selectedTab === 'diary' ? item.task_title : item.test_name;
     return name?.toLowerCase().includes(searchQuery.toLowerCase());
   });
 
  
 
   const renderTask = ({ item }) => (
     <View style={styles.taskRow}>
       <Text style={styles.taskText}>{item?.task_title}</Text>
       <Text style={styles.taskText}>{item?.start_date}</Text>
       <Text
         style={[
           styles.taskStatusText,
           item?.assign_task_status === 1 || item?.assign_task_status == null ? styles.unsubmitted :  styles.completed,
         ]}
       >
         {item?.assign_task_status === 1 || item?.assign_task_status == null ? 'Unsubmit' : 'Completed' }
       </Text>
     </View>
   );
 
   const renderTest = ({ item }) => {
       // Log the marks_received and total_marks values before rendering
      //  console.log('Marks Received:', item.marks_received);
      //  console.log('Total Marks:', item.total_marks);
     
       // Display the values safely
       return (
         <View style={styles.taskRow}>
           <Text style={styles.taskText}>{item.test_name}</Text>
           <Text style={styles.taskText}>{item.start_date}</Text>
           <Text style={styles.taskStatusText}>
             {parseFloat(item.marks_received) || 0}/{parseFloat(item.total_marks) || 0}
           </Text>
         </View>
       );
     };
   
 
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
         <TouchableOpacity onPress={()=>navigation.goBack()}>
           <Icon name="arrow-back" size={moderateScale(24)} color="#000" />
         </TouchableOpacity>
         <Text style={styles.headerTitle}>{selectedTab === 'diary'? 'Task History' : 'Test History'}</Text>
         <TouchableOpacity onPress={() => navigation.navigate('ParentsAnnouncement')}>
           <Icon name="notifications" size={moderateScale(24)} color="#000" />
         </TouchableOpacity>
       </View>
 
       <View style={styles.searchContainer}>
       <TextInput
           style={styles.searchInput}
           placeholder={`Search ${selectedTab === 'diary' ? 'Task' : 'Test'}`}
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
       <View style={styles.pickerContainer}>
         <Picker
           selectedValue={selectedTab}
           onValueChange={itemValue => setSelectedTab(itemValue)}
           style={styles.picker}>
           <Picker.Item label="Diary" value="diary" style = {styles.pickerLabel} />
           <Picker.Item label="Tests" value="test" style = {styles.pickerLabel} />
         </Picker>
       </View>
 
       <View style={styles.summaryContainer}>
         <View style = {{flexDirection: 'row'}}>
         <Text style={styles.titleName}>Subject name:  </Text>
         <Text style={styles.titleName}>{subject.subject_name}</Text>
         </View>
         {selectedTab === 'diary' ? (
         <View style = {styles.summaryTextContainer}>
         <Text style={styles.summaryText}>
           Completed Tasks: {summary?.completed || 0}  
           
         </Text>
         <Text style={styles.summaryText}>
           
            Unsubmitted Tasks: {summary?.pending || 0} 
          
         </Text>
         <Text style={styles.summaryText}>
          
           Total Tasks: {summary?.total || 0}
         </Text>
         </View>
         ): (
           <View style = {styles.summaryTextContainer}>
         <Text style={styles.summaryText}>
           Completed Tests: {summary?.tests_completed || 0}  
           
         </Text>
         <Text style={styles.summaryText}>
           
            Unsubmitted Tests: {summary?.tests_pending || 0} 
          
         </Text>
         <Text style={styles.summaryText}>
          
           Total Tests: {summary?.tests_total || 0}
         </Text>
         </View>
         )}
       </View>
         
       <View style={styles.tableHeader}>
         <Text style={styles.tableHeaderText}>{selectedTab === 'diary' ? 'Task Name' : 'Test Name'}</Text>
         <Text style={styles.tableHeaderText}>Assigned Date</Text>
         <Text style={styles.tableHeaderText}>{selectedTab === 'diary' ? 'Status' : 'Total Marks'}</Text>
       </View>
 
       <FlatList
         data={filteredStudents}
         keyExtractor={(item) => item.id}
         renderItem={selectedTab === 'diary' ? renderTask : renderTest}
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
     marginBottom: '16@vs',
   },
   headerTitle: {
     fontSize: '15@ms',
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
     top: '20@vs'
   },
   pickerContainer: {
     backgroundColor: '#F5F5F5',
     borderRadius: '8@ms',
     marginLeft: '220@s',
     right: '220@s',
     
   },
   picker: {
     height: '30@vs',
     width: '110%',
     bottom: '6@vs',
   },
   pickerLabel: {
     fontSize: '10@ms',
     fontFamily: 'Poppins-Regular'
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
     marginHorizontal: '5@s'
     
   },
   tableHeader: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     marginBottom: '8@vs',
     
     paddingBottom: '8@vs',
     margin: '15@ms',
     top: '15@vs',
   },
   tableHeaderText: {
     fontSize: '13@ms',
     fontFamily: 'Poppins-Medium',
     color: '#000',
   },
   list: {
     marginTop: '8@vs',
   },
   taskRow: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingVertical: '12@vs',
     top: '10@vs'
     
   },
   summaryTextContainer: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     marginHorizontal: '10@s'
   },
   taskText: {
     flex: 1,
     fontSize: '11@ms',
     fontFamily: 'Poppins-Regular',
     color: '#000',
     left: '15@s'
   },
   taskStatusText: {
     flex: 1,
     fontSize: '11@ms',
     fontFamily: 'Poppins-Regular',
     color: '#000',
     left: '40@s'
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


export default ParentsTaskHistory;
