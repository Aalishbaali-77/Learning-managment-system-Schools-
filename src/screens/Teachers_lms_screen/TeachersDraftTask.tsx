import {CommonActions, useNavigation, useRoute} from '@react-navigation/native';
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  LayoutAnimation, 
  UIManager,
  Platform,
} from 'react-native';
import {ScaledSheet, moderateScale} from 'react-native-size-matters';
import api from '../../api';
import {useUser} from '../../Context/UserContext';
import {useSubjects} from '../../Context/TeacherSubjectContext';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Tasks} from '../../types';
import Icon from 'react-native-vector-icons/MaterialIcons';

type SubjectsProps = NativeStackScreenProps<any, any>;

const TeachersDraftTask: React.FC<SubjectsProps> = props => {
  const navigation = useNavigation();
  const [tasks, setTasks] = useState<Tasks[]>([]);
  const route = useRoute()
  const [loading, setLoading] = useState(true);
  const {user} = useUser();
  const { subjects} = useSubjects();
  const sectionId = props.route.params?.sectionId
  // API Params
  const school_id = Number(user?.company_id);
  const employee_id = user?.emp_id;
  const school_campus_id = user?.school_campus_id;
  const subject_id = props.route.params?.subjectId;
  const type = '2'; // Always 2 for draft tasks
  const section_id = sectionId;
  const [taskIds, setTaskIds] = useState([]); // Store extracted assign_task_ids
  const [expandedCardIndex, setExpandedCardIndex] = useState(null);
  const [cardHeights, setCardHeights] = useState<number[]>([]);

  useEffect(() => {
      const fetchData = async () => {
        await fetchDraftTasks();
    
        if (route.params?.onUpdated) {
          await fetchDraftTasks();
    
          // Avoid directly mutating route.params
          route.params.onUpdated = false;
        }
      };
    
      fetchData();
    }, [route.params?.onUpdated]);

    useEffect(() => {
        if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
          UIManager.setLayoutAnimationEnabledExperimental(true);
        }
      }, []);

 const handleCardPress = index => {
   LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
   setExpandedCardIndex(expandedCardIndex === index ? null : index);
 };

  const handleLayout = (index: number, event: any) => {
    const {height} = event.nativeEvent.layout;
    setCardHeights(prevHeights => {
      const updatedHeights = [...prevHeights];
      updatedHeights[index] = height; // Update the height of the specific card
      return updatedHeights;
    });
  };

  const fetchDraftTasks = async () => {
    setLoading(true); // Start loading indicator
    try {
      // console.log({
      //   school_id,
      //   employee_id,
      //   school_campus_id,
      //   subject_id,
      //   section_id,
      //   type,
      // });
      const response = await api.protected.post('teacher/assign-tasks', {
        school_id,
        employee_id,
        school_campus_id,
        subject_id,
        section_id,
        type,
      });

      if (response.data.status === 'success') {
        setTasks(response.data.data); // Save tasks to state
        

        // Extract assign_task_ids and save them
        const ids = response.data.data.map(task => task.id); // Assuming `id` is the key
        setTaskIds(ids);
      } else {
      //  console.error('Failed to fetch draft tasks:', response.data.message);
      }
    } catch (error) {
      // console.error(
      //   'Error fetching draft tasks:',
      //   error.response?.data || error.message,
      // );
    } finally {
      setLoading(false); // Stop loading indicator
    }
  };

  const fetchDraftPublishTask = async (assign_task_id: string) => {
    try {
        setLoading(true); // Start loading indicator

        const response = await api.protected.post(
            'teacher/assign-tasks/change-status',
            {
                assign_task_id, // Pass the task ID
                assign_task_status: 1, // Pass the status
            },
        );

        // Update the condition to check for the correct response message
        if (
            response.data.success === true || 
            response.data.message === 'Task published successfully!' // Update the message
        ) {
            // console.log(`Task ${assign_task_id} updated successfully`);

            // Immediately update the local state to remove the task from drafts
            setTasks(prevTasks =>
                prevTasks.filter(task => task.id !== assign_task_id),
            );

            Alert.alert('Success', 'Task published successfully!');
              
                    // ✅ Go back and pass a param or flag
                    navigation.dispatch(
                      CommonActions.goBack()
                    );
              
                    
                    navigation.navigate({
                      name: 'TeachersSubjectDetails',
                      params: { onUpdated: true },
                      merge: true, // ✅ ensures params are merged into the current route
                    });

            // Optionally re-fetch tasks to ensure the state is synced with the server
            fetchDraftTasks();
        } else {
            // console.error(
            //     `Failed to update task ${assign_task_id}:`,
            //     response.data.message,
            // );
        }
    } catch (error) {
        // console.error(
        //     'Error updating task status:',
        //     error.response?.data || error.message,
        // );
    } finally {
        setLoading(false); // Stop loading indicator
    }
};


  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={moderateScale(24)} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Draft tasks</Text>
        <TouchableOpacity>
          <View />
        </TouchableOpacity>
      </View>

      {/* Task List */}
      <ScrollView>
        {tasks.map((task, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.taskCard,
              {borderColor: task.status === 'done' ? '#28A745' : '#DC3545'},
            ]}
            onLayout={event => handleLayout(index, event)}
            onPress={() => handleCardPress(index)}>
            <View style={styles.taskDateContainer}>
              <Text style={styles.taskDateDay}>
                {new Date(task.start_date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  day: '2-digit',
                })}
              </Text>
              <Text style={styles.taskDateMonth}>
                {new Date(task.start_date).toLocaleDateString('en-US', {
                  month: 'short',
                })}
              </Text>
            </View>
            <View style={styles.taskDetails}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text style={styles.taskDueDate}>Due Date: {task.end_date}</Text>
              {expandedCardIndex === index && (
                <Text style={styles.taskDescription}>{task.description}</Text>
              )}
            </View>

            {/* Dropdown Icon */}
            <TouchableOpacity
                style={[
                  styles.dropdownIconContainer,
                  {
                    top: cardHeights[index]
                      ? cardHeights[index] - 20 // Adjust position based on card height
                      : 60, // Fallback for initial render
                  },
                ]}
                onPress={() => handleCardPress(index)}>
                <Text style={styles.toggleText}>
                  {expandedCardIndex === index
                    ? ''
                    : 'View Detail→'}
                </Text>
              </TouchableOpacity>

            {/* Publish Button */}
            {tasks.map(task => (
              <TouchableOpacity
                key={task.id}
                style={styles.publishButton}
                onPress={() => fetchDraftPublishTask(task.id)} // Pass the individual task ID
              >
                <Text style={styles.statusButtonText}>Publish</Text>
              </TouchableOpacity>
            ))}

            {/* Edit Button */}
            {expandedCardIndex === index && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() =>
                    navigation.navigate('EditDraftTaskScreen', {task})
                  }>
                  <Icon name="edit" size={moderateScale(20)} color="#000" />
                </TouchableOpacity>
              )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};


const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: '16@s',
    paddingTop: '16@vs',
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
  backButton: {
    fontSize: '18@ms',
    color: '#000',
    fontFamily: 'Poppins-Regular',
  },
  title: {
    fontSize: '20@ms',
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },
  publishButton: {
    position: 'absolute',
    top: '8@vs',
    right: '8@s',
    paddingHorizontal: '12@s',
    paddingVertical: '4@vs',
    borderRadius: '8@ms',
    backgroundColor: '#DC3545',
  },
  notificationBell: {
    width: '24@ms',
    height: '24@vs',
    borderRadius: '12@ms',
    backgroundColor: '#000',
  },
  dropdown: {
    height: '50@vs', // Scale height using vertical scaling
    borderColor: '#ccc',
    borderWidth: '1@s', // Scale border width using horizontal scaling
    borderRadius: '8@s', // Scale border radius using horizontal scaling
    paddingHorizontal: '8@s', // Scale horizontal padding
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    borderRadius: '8@ms',
    marginBottom: '16@vs',
    paddingHorizontal: '8@s',
    height: '40@vs',
  },
  searchInput: {
    flex: 1,
    fontSize: '14@ms',
    color: '#000',
    fontFamily: 'Poppins-Regular',
  },
  searchButton: {
    fontSize: '16@ms',
    color: '#000',
    fontFamily: 'Poppins-Regular',
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: '16@vs',
  },
  draftTab: {
    backgroundColor: '#F5F5F5',
    paddingVertical: '8@vs',
    paddingHorizontal: '16@s',
    borderRadius: '8@ms',
  },
  draftTabText: {
    fontSize: '14@ms',
    color: '#000',
    fontFamily: 'Poppins-Regular',
  },
  viewHistoryButton: {
    backgroundColor: '#DC3545',
    paddingVertical: '10@vs',
    paddingHorizontal: '5@s',
    marginHorizontal: '5@s',
    borderRadius: '8@ms',
    width: '85@ms',
    height: '40@vs',
  },
  DrafttaskButton: {
    backgroundColor: '#000',
    paddingVertical: '10@vs',
    paddingHorizontal: '5@s',
    marginHorizontal: '5@s',
    borderRadius: '8@ms',
    width: '85@ms',
    height: '40@vs',
  },
  pickerFont: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-Regular',
  },
  viewHistoryText: {
    fontSize: '12@ms',
    color: '#FFF',
    fontFamily: 'Poppins-Regular',
    // position: 'relative',
  },
  DrafttaskText: {
    fontSize: '12@ms',
    color: '#FFF',
    fontFamily: 'Poppins-Regular',
    left: '5@s',
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: '12@ms',
    marginBottom: '12@vs',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: '4@ms',
    padding: '12@ms',
  },
  taskDateContainer: {
    alignItems: 'center',
    width: '70@ms',
    justifyContent: 'center',
    backgroundColor: '#6F42C1',
    padding: '12@ms',
    borderTopLeftRadius: '12@ms',
    borderTopRightRadius: '12@ms',
    borderBottomLeftRadius: '12@ms',
    borderBottomRightRadius: '12@ms',
  },
  taskDateDay: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
  },
  taskDateMonth: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Regular',
    color: '#FFFFFF',
  },
  taskDetails: {
    flex: 1,
    padding: '12@ms',
  },
  taskTitle: {
    fontSize: '13@ms',
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
    marginBottom: '4@vs',
  },
  taskDueDate: {
    fontSize: '12@ms',
    color: '#3b3b3b',
    marginBottom: '4@vs',
    fontFamily: 'Poppins-Regular',
  },
  taskDescription: {
    fontSize: '12@ms',
    color: '#555',
    fontFamily: 'Poppins-Regular',
  },
  statusButton: {
    alignSelf: 'center',
    paddingHorizontal: '12@s',
    paddingVertical: '4@vs',
    borderRadius: '8@ms',
  },
  statusButtonText: {
    fontSize: '12@ms',
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  statusPending: {
    backgroundColor: '#DC3545',
  },
  statusDone: {
    backgroundColor: '#28A745',
  },
  pickerContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: '8@ms',
    marginRight: '40@s',
  },
  picker: {
    height: '45@vs',
    width: '120%',
    bottom: '6@vs',
  },
  editButton: {
    position: 'absolute', // Ensure the icon stays within the card
    right: '10@s', // Align it to the right
    bottom: '10@vs',
  },
  editButtonText: {
    fontSize: '12@ms',
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  dropdownIconContainer: {
    position: 'absolute',
    marginTop: '10@vs',
    top: '75@vs', // Adjust based on your card height
    alignSelf: 'center',
    borderRadius: '12@ms',
    left: '150@ms',
    padding: '4@ms',
    zIndex: 1, // Ensure it's above other elements
  },
  toggleText: {
    fontSize: '12@ms',
    color: '#000', // Make it appear clickable
    fontFamily: 'Poppins-Medium',
    right:'60@s',
    bottom:'20@vs', // Optional: underline to indicate interactivity
  },
});

export default TeachersDraftTask;
