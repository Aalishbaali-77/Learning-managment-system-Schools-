import React, {useEffect, useState} from 'react';
import {View, Text, FlatList, Image, ActivityIndicator} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {ProgressBar} from 'react-native-paper';
import {TouchableOpacity} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useUser} from '../../Context/UserContext';
import {useSubjects} from '../../Context/TeacherSubjectContext';
import api from '../../api';
import {useNavigation} from '@react-navigation/native';
import {getAccessToken} from '../../utils/storage';
import { ASSET_URL_UNIFORM } from '../../constants';


const UpdatedClassProgress = ({route}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigation = useNavigation();
  const {class_name, sectionName} = route.params;

  const {user} = useUser();
  const {sectionId} = useSubjects();
  const empId = user?.emp_id;
  const schoolCampusId = user?.school_campus_id;
  const formattedData =
    data.length % 2 !== 0
      ? [...data, {id: 'placeholder', isPlaceholder: true}]
      : data;
  const [classDetails, setClassDetails] = useState({
    className: '',
    sectionName: '',
  });

  const fetchClassTeacherDetails = async () => {
    try {
      const response = await api.protected.get(
        `teacher/classTeacher?employee_id=${empId}&school_campus_id=${schoolCampusId}`,
      );

      if (response?.data?.status === 'success') {
        const data = response.data.data; // This is an object
        if (data) {
          setClassDetails({
            className: data.class_name, // Correctly access the fields
            sectionName: data.section_name,
          });
        } else {
          // console.log('No Class Details');
        }
        // console.log(data); // Debugging
      } else {
        Alert.alert(
          'Error',
          response?.data?.message || 'Failed to fetch class details',
        );
      }
    } catch (error) {
     // console.error('Error fetching class details:', error);
    }
  };

  // Fetch student progress data from API
  const fetchStudentProgress = async () => {
    try {
      const payload = {
        section_id: sectionId,
        school_id: user?.company_id,
        school_campus_id: user?.school_campus_id,
      };
      //console.log('Payload for updated student progress:', payload);

      const response = await api.protected.post(
        'teacher/progress/section-student-performance',
        payload,
      );
      if (response.data.status === 'success') {
        const formattedData = response.data.data.map((item: any) => ({
          id: item.student_id.toString(),
          name: item.student_name,
          profile_picture: `${ASSET_URL_UNIFORM}${item.profile_picture}`, // Include profile picture URL
          attendance: `${item.attendance.present_days}/${item.attendance.total_days}`,
          test: `${item.test.marks_obtained}/${item.test.marks_possible}`,
          exam: `${item.exam.marks_obtained}/${item.exam.marks_possible}`,
          task: `${item.tasks.completed}/${item.tasks.total}`,
        }));
        setData(formattedData);
        
      } else {
        //console.error('Failed to fetch data:', response?.message);
      }
    } catch (error) {
      //console.error('Error fetching student progress:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const accessToken = await getAccessToken(); // Await the token from AsyncStorage
        if (user && accessToken) {
          // Fetch data only after user and token are available
          await fetchClassTeacherDetails();
          await fetchStudentProgress();
        }
      } catch (error) {
        //console.error('Error fetching access token or data:', error);
      } finally {
        setLoading(false);
        // console.log('Finished fetching data.');
      }
    };
    fetchData();
  }, [user]);

  const renderItem = ({item, index}: {item: any; index: number}) => {
    if (item.isPlaceholder) {
      return <View style={styles.placeholderCard} />;
    }

    return (
      <View style={styles.cardWrapper}>
        <TouchableOpacity
          style={styles.card}
          onPress={() =>
            navigation.navigate('UpdatedClassProgressDetail', {
              studentName: item.name,
              student_id: item.id,
              class_name: class_name,
              sectionName: sectionName,
            })
          }>
          {/* Profile Image Container */}
          <View style={styles.profileContainer}>
            <View style={styles.profilePlaceholder}>
              <Image
                source={{uri: item.profile_picture}}
                style={styles.profilePlaceholder}/>
            </View>
          </View>
          <Text style={styles.studentName}>{item.name}</Text>
          <View style={styles.progressContainer}>
            {/* Attendance */}
            <View style={styles.progressRow}>
              <View style={styles.labelPercentageRow}>
                <Text style={styles.categoryText}>Attendance</Text>
                <Text style={styles.scoreText}>{item.attendance}</Text>
              </View>

              <ProgressBar
                progress={
                  parseFloat(item.attendance.split('/')[0]) /
                    parseFloat(item.attendance.split('/')[1]) || 0
                }
                color="green"
                style={styles.progressBar}
              />
            </View>

            {/* Other Categories (Test, Exam, Task) */}
            {[
              {label: 'Test', value: item.test, color: 'blue'},
              {label: 'Exam', value: item.exam, color: 'yellow'},
              {label: 'Task', value: item.task, color: 'red'},
            ].map((category, index) => (
              <View key={index} style={styles.progressRow}>
                {/* Label and Percentage in the same row */}
                <View style={styles.labelPercentageRow}>
                  <Text style={styles.categoryText}>{category.label}</Text>
                  <Text style={styles.scoreText}>{category.value}</Text>
                </View>
                {/* Progress Bar below the label and percentage */}
                <ProgressBar
                  progress={
                    parseFloat(category.value.split('/')[0]) /
                      parseFloat(category.value.split('/')[1]) || 0
                  }
                  color={category.color}
                  style={styles.progressBar}
                />
              </View>
            ))}
          </View>
        </TouchableOpacity>
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Student Progress</Text>
        <TouchableOpacity onPress={()=>navigation.navigate('TeacherAnnouncement')}>
          <Icon name="notifications" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Class Name and Your Subjects Button */}
      <View style={styles.classRow}>
        <Text style={styles.classText}>
          Class {class_name}-{sectionName}
        </Text>
        <TouchableOpacity
          style={styles.subjectsButton}
          onPress={() => navigation.navigate('SubjectProgress')}>
          <Text style={styles.subjectsButtonText}>Your Subjects</Text>
        </TouchableOpacity>
      </View>

      {/* Student List */}
      <FlatList
        data={formattedData}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: '10@s',
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
    paddingVertical: '10@vs',
  },
  title: {
    fontSize: '18@ms',
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },
  classRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10@vs',
  },
  classText: {
    fontSize: '16@ms',
    fontFamily: 'Poppins-Medium',
    marginBottom: '10@vs',
    color: '#000',
  },
  subjectsButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: '20@s',
    paddingVertical: '5@vs',
    paddingHorizontal: '8@s',
  },
  subjectsButtonText: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Regular',
    color: '#000',
  },
  listContainer: {
    alignItems: 'center',
  },
  cardWrapper: {
    width: '47%', // Match the card width
    margin: '5@s', // Match the card margin
  },
  card: {
    width: '100%', // Take up the full width of the wrapper
    backgroundColor: '#f9f9f9',
    borderRadius: '10@s',
    padding: '10@s',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    position: 'relative', // Allows absolute positioning of child elements
    marginTop: '30@s', // Ensures space for the profile image overflow
  },
  profileContainer: {
    position: 'absolute',
    top: '-25@s', // Moves the image outside the card
    alignItems: 'center',
    justifyContent: 'center',
    width: '50@s',
    height: '50@s',
  },
  profilePlaceholder: {
    width: '50@s',
    height: '50@s',
    borderRadius: '25@s', // Makes it a circle
    backgroundColor: '#ccc',
  },
  studentName: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-Medium',
    color: '#000',
    marginTop: '10@vs', // Moves the name down so it's not blocked by the image
  },
  progressContainer: {
    width: '100%',
    marginTop: '10@vs',
  },
  progressRow: {
    width: '100%',
    marginVertical: '5@vs',
  },
  labelPercentageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  categoryText: {
    fontSize: '12@ms',
    color: '#000',
    fontFamily: 'Poppins-Regular',
  },
  scoreText: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Regular',
    color: '#000',
  },
  progressBar: {
    width: '100%', // Full width of the card
    height: '5@vs',
    borderRadius: '5@s',
    marginTop: '3@vs',
  },
  placeholderCard: {
    width: '48%', // Same width as other cards
    backgroundColor: 'transparent', // Make it invisible
  },
});

export default UpdatedClassProgress;
