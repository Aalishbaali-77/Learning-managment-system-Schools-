import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
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
import { ScaledSheet, moderateScale } from 'react-native-size-matters';
import api from '../../api';
import { useUser } from '../../Context/UserContext';
import { useSubjects } from '../../Context/TeacherSubjectContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Tasks } from '../../types';
import Icon from 'react-native-vector-icons/MaterialIcons';
type SubjectsProps = NativeStackScreenProps<any, any>;

const DraftTest: React.FC<SubjectsProps> = props => {
  const navigation = useNavigation();
  const [tests, setTests] = useState<Tasks[]>([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const route = useRoute()
  const sectionId = props.route.params?.sectionId
  // API Params
  const school_id = user?.company_id;
  const employee_id = user?.emp_id;
  const school_campus_id = user?.school_campus_id;
  const subject_id = props.route.params?.subjectId;
  const type = '2'; // Always 2 for draft tasks

  const [testIds, setTestIds] = useState([]); // Store extracted assign_test_ids
  const [expandedCardIndex, setExpandedCardIndex] = useState(null);
  const [cardHeights, setCardHeights] = useState<number[]>([]);

  // useEffect(() => {
  //   const fetchSubjects = async () => {
  //     try {
  //       const employee_id = user?.emp_id;
  //       const school_campus_id = user?.school_campus_id;
  //       const section_id = sectionId; // Adjust if section_id comes from a different source

  //       const response = await api.protected.post(
  //         'teacher/assign-tasks/subjectList',
  //         {
  //           employee_id,
  //           school_campus_id,
  //           section_id,
  //         },
  //       );

  //       if (response.data.success) {
  //         setSubjects(response.data.data);
  //       } else {
  //         console.error('Error fetching subjects:', response.data.message);
  //       }
  //     } catch (error) {
  //       console.error('Error fetching subjects:', error);
  //       Alert.alert('Error', 'Failed to fetch subjects. Please try again.');
  //     }
  //   };

  //   fetchSubjects();
  // }, [user]);

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
    const { height } = event.nativeEvent.layout;
    setCardHeights(prevHeights => {
      const updatedHeights = [...prevHeights];
      updatedHeights[index] = height; // Update the height of the specific card
      return updatedHeights;
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchDraftTests();

      if (route.params?.onUpdated) {
        await fetchDraftTests();

        // Avoid directly mutating route.params
        route.params.onUpdated = false;
      }
    };

    fetchData();
  }, [route.params?.onUpdated]);


  const fetchDraftTests = async () => {
    setLoading(true); // Start loading indicator
    try {
      // console.log({
      //   school_id,
      //   employee_id,
      //   school_campus_id,
      //   subject_id,
      //   section_id: sectionId,
      //   type,
      // });
      const response = await api.protected.post('teacher/assign-tests', {
        school_id,
        employee_id,
        school_campus_id,
        subject_id,
        section_id: sectionId,
        type,
      });

      if (response.data.status === 'success') {
        setTests(response.data.data); // Save tasks to state

        // Extract assign_test_ids and save them
        const ids = response.data.data.map(test => test.id); // Assuming `id` is the key
        setTestIds(ids);
      } else {
        // console.error('Failed to fetch draft tasks:', response.data.message);
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

  const fetchDraftPublishTest = async (assign_test_id: string) => {
    try {
      setLoading(true);

      const response = await api.protected.post(
        'teacher/assign-tests/change-status',
        {
          assign_test_id,
          assign_test_status: 1,
        },
      );

      if (
        response.data.success === true ||
        response.data.message === 'Test published successfully!'
      ) {
        setTests(prevTests =>
          prevTests.filter(test => test.id !== assign_test_id),
        );

        Alert.alert('Success', 'Test published successfully!');

        // ✅ Go back and pass a param or flag
        navigation.dispatch(
          CommonActions.goBack()
        );


        navigation.navigate({
          name: 'TeachersSubjectDetails',
          params: { onUpdated: true },
          merge: true, // ✅ ensures params are merged into the current route
        });

      } else {
        Alert.alert('Error', response.data.message || 'Failed to publish test.');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
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
        <Text style={styles.title}>Draft tests</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('TeachersAnnouncement')}>
          <Icon name="notifications" size={moderateScale(24)} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Task List */}
      <ScrollView>
        {tests.map((test, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.taskCard,
              { borderColor: test.status === 'done' ? '#28A745' : '#DC3545' },
            ]}
            onLayout={event => handleLayout(index, event)}
            onPress={() => handleCardPress(index)}>
            <View style={styles.taskDateContainer}>
              <Text style={styles.taskDateDay}>
                {new Date(test.start_date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  day: '2-digit',
                })}
              </Text>
            </View>
            <View style={styles.taskDetails}>
              <Text style={styles.taskTitle}>{test.title}</Text>
              <Text style={styles.taskDueDate}>Due Date: {test.end_date}</Text>
              {expandedCardIndex === index && (
                <Text style={styles.taskDescription}>{test.description}</Text>
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
            {tests.map(test => (
              <TouchableOpacity
                key={test.id}
                style={styles.publishButton}
                onPress={() => fetchDraftPublishTest(test.id)}>
                <Text style={styles.statusButtonText}>Publish</Text>
              </TouchableOpacity>
            ))}

            {/* Edit Button */}
            {expandedCardIndex === index && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() =>
                  navigation.navigate('EditDraftTest', { test })
                }>
                <Icon name="edit" size={20} color="#000" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// const tasks = [
//   {
//     date: {day: 'Wed 23', month: 'Nov'},
//     title: 'Algebra Worksheet 3',
//     dueDate: '1-Dec-2024',
//     description:
//       'Solve questions 1-10 from the Algebra Worksheet provided. Make sure to show all your steps clearly. Submit the completed worksheet to your teacher during class on 1st December.',
//     status: 'pending',
//   },
//   {
//     date: {day: 'Wed 10', month: 'Nov'},
//     title: 'Algebra Worksheet 3',
//     dueDate: '1-Dec-2024',
//     description: 'Solve questions 1-10 from the attached worksheet.',
//     status: 'done',
//   },
// ];

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
    borderRadius: '8@s',
    backgroundColor: '#DC3545',
  },
  notificationBell: {
    width: '24@ms',
    height: '24@vs',
    borderRadius: '12@s',
    backgroundColor: '#000',
  },
  dropdown: {
    height: '50@vs',
    borderColor: '#ccc',
    borderWidth: '1@s',
    borderRadius: '8@s',
    paddingHorizontal: '8@s',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    borderRadius: '8@s',
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
    borderRadius: '8@s',
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
    borderRadius: '8@s',
    width: '85@ms',
    height: '40@vs',
  },
  DrafttaskButton: {
    backgroundColor: '#000',
    paddingVertical: '10@vs',
    paddingHorizontal: '5@s',
    marginHorizontal: '5@s',
    borderRadius: '8@s',
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
    borderRadius: '12@s',
    marginBottom: '12@vs',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: '4@s',
    padding: '12@ms',
  },
  taskDateContainer: {
    alignItems: 'center',
    width: '70@ms',
    justifyContent: 'center',
    backgroundColor: '#6F42C1',
    padding: '12@ms',
    borderRadius: '12@s',
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
    borderRadius: '8@s',
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
    borderRadius: '8@s',
    marginRight: '40@s',
  },
  picker: {
    height: '45@vs',
    width: '120%',
    bottom: '6@vs',
  },
  editButton: {
    position: 'absolute',
    right: '10@s',
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
    top: '75@vs',
    left: '150@s',
    padding: '4@ms',
    zIndex: 1,
  },
  toggleText: {
    fontSize: '12@ms',
    color: '#000',
    fontFamily: 'Poppins-Medium',
    right: '60@s',
    bottom: '15@vs',
  },
});

export default DraftTest;
