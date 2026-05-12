import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { moderateScale, ScaledSheet } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../api';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../../Context/UserContext';

const ParentsTimetable = () => {
    const [timetableData, setTimetableData] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();
    const {user} = useUser();
    const student_id = user?.student_id;
     const [studentClassoff, setStudentClassoff] = useState({
        class_id: Number,
        registration_no: '',
        class_name: '',
        section_name: '',
        section_id: '',
      });
  
    
      const fetchTimetable = async () => {
        try {
          const response = await api.protected.get(`student/allPeriodsForSection?section_id=${36}`);
          const data = response.data.data;
  
          // Transform the API response to match the UI structure
          const transformedData = data.map((dayData) => ({
            day: dayData.day_of_week,
            periods: dayData.periods.map((period, index) => ({
              periodNo: (index + 1).toString().padStart(2, '0'),
              subject: period.subject_name,
              teacher: period.teacher_name,
              time: `${period.time_slot.start_time} - ${period.time_slot.end_time}`,
            })),
          }));
  
          setTimetableData(transformedData);
        } catch (error) {
         // console.error('Failed to fetch timetable:', error);
        } finally {
          setLoading(false);
        }
      };
  
      useEffect(() => {
        const fetchData = async () => {
          setLoading(true); // Set loading to true before starting fetch
      
          try {
            await fetchTimetable();  // Fetch attendance data
            
          } catch (error) {
          //  console.error('Error fetching student details:', error);
          } finally {
            setLoading(false); // Set loading to false after all fetch operations complete
          }
        };
      
        fetchData(); // Call the async function
  
      
    }, []);
  
     useEffect(() => {
        
          fetchStudentOff(); // Trigger only when `sectionId` is updated
        
      }, []);
  
    const fetchStudentOff = async () => {
      try {
        const response = await api.protected.post('student/studentOff', {
          student_id,
        });
        
        if (response?.data?.status === 'success') {
          const data = response.data.data; // This is an object
          if (data) {
            // Update state with class and section names
            setStudentClassoff({
              class_id: data.class_id,
              class_name: data.section.class_name, // Access properties directly
              section_name: data.section.section_name,
              registration_no: data.registration_no,
              section_id: data.section.section_id,
            });
    
            // console.log(data); // Debugging
          }
        } else {
          Alert.alert(
            'Error',
            response?.data?.message || 'Failed to fetch student off',
          );
        }
      } catch (error) {
       // console.error('Error fetching student off:', error);
      }
    };
    
    
  
    const renderPeriodRow = ({ item }) => (
      <View style={styles.row}>
        <Text style={[styles.cell, styles.periodNo]}>{item.periodNo}</Text>
        <Text style={styles.cell}>{item.subject}</Text>
        <Text style={styles.cell}>{item.teacher}</Text>
        <Text style={[styles.cell, styles.time]}>{item.time}</Text>
      </View>
    );
  
    const renderTimetable = ({ item }) => (
      <View style={styles.timetableContainer}>
        <Text style={styles.dayHeader}>{item.day}</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, styles.periodNo]}>Period No</Text>
          <Text style={styles.headerCell}>Subject</Text>
          <Text style={styles.headerCell}>Teacher</Text>
          <Text style={[styles.headerCell, styles.time]}>Time</Text>
        </View>
        <FlatList
          data={item.periods}
          renderItem={renderPeriodRow}
          keyExtractor={(period) => period.periodNo}
        />
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
          <TouchableOpacity onPress={()=>navigation.goBack()}>
            <Icon name="arrow-back" size={moderateScale(24)} style={styles.icon} />
          </TouchableOpacity>
          <Text style={styles.headerText}>Class Timetable</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ParentsAnnouncement')}>
            <Icon name="notifications" size={moderateScale(24)} style={styles.icon} />
          </TouchableOpacity>
        </View>
        <Text style={styles.classInfo}>Class {studentClassoff?.class_name}-{studentClassoff?.section_name}</Text>
        <Text style={styles.classTeacher}>Your Class Teacher: Aliza Ahmed</Text>
        <ScrollView >
          <FlatList
            data={timetableData}
            renderItem={renderTimetable}
            keyExtractor={(item) => item.day}
          />
        </ScrollView>
      </View>
    );
  };
  
  const styles = ScaledSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f9f9f9',
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
    headerText: {
      fontSize: '15@ms',
      fontFamily: 'Poppins-Bold',
      color: '#000',
    },
    icon: {
      color: '#000',
    },
    classInfo: {
      fontSize: '14@ms',
      fontFamily: 'Poppins-SemiBold',
      textAlign: 'center',
      marginBottom: '4@vs',
      color: '#000',
    },
    classTeacher: {
      fontSize: '12@ms',
      fontFamily: 'Poppins-Regular',
      textAlign: 'center',
      marginBottom: '16@vs',
      color: '#7a7a7a',
    },
    timetableContainer: {
      backgroundColor: '#fff',
      borderRadius: '8@s',
      marginBottom: '16@vs',
      padding: '8@ms',
    },
    dayHeader: {
      fontSize: '14@ms',
      fontFamily: 'Poppins-SemiBold',
      marginBottom: '8@vs',
      color: '#000',
    },
    tableHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: '#f0f0f0',
      padding: '8@ms',
      borderRadius: '4@s',
      marginBottom: '8@vs',
    },
    headerCell: {
      flex: 1,
      fontSize: '10@ms',
      fontFamily: 'Poppins-SemiBold',
      textAlign: 'center',
      color: '#000',
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: '8@vs',
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
    },
    cell: {
      flex: 1,
      fontSize: '10@ms',
      fontFamily: 'Poppins-Regular',
      textAlign: 'center',
      color: '#000',
    },
    periodNo: {
      flex: 0.5,
    },
    time: {
      flex: 1.5,
    },
    
  });
  



export default ParentsTimetable;
