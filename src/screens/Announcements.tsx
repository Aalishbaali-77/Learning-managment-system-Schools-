import React, {useEffect, useState} from 'react';
import {FlatList, ScrollView, SectionList, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {moderateScale, ScaledSheet} from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';
import api from '../api';
import { useUser } from '../Context/UserContext';
import { useSubjects } from '../Context/TeacherSubjectContext';
import { ActivityIndicator } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

const Announcements: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [announcementDetail, setAnnouncementDetail] = useState<Announcement[]>(
    [],
  );
  const [notificationDetail, setNotificationDetail] = useState<Announcement[]>(
    [],
  );
  const {user} = useUser();
  const {sectionId} = useSubjects();
  const navigation = useNavigation();
  const { t } = useTranslation()

  const fetchNotificationDetail = async () => {
    const currentDate = new Date().toISOString().split('T')[0];
    setLoading(true);
    const payload = {
      student_id: user?.student_id,
    };
  
    try {
      const response = await api.protected.post(
        'teacher/notifications/student-notifications',
        payload
      );
  
      if (response.data.status === 'success') {
        const formattedData = response.data.data.map((item: any) => ({
          id: item.id,
          type: item.type,
          title: item.data.title, // Accessing title from nested 'data'
          description: item.data.description, // Accessing description from nested 'data'
          time: item.created_at, // Adjusted field name
          action: item.data.action,
        }));
        setNotificationDetail(formattedData);
      } else {
       // console.warn('Unexpected response:', response);
      }
    } catch (error) {
     // console.error('Failed to fetch announcement detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncementdetail = async () => {
    const currentDate = new Date().toISOString().split('T')[0];
    setLoading(true);
    const payload = {
      school_id: user?.company_id, // Replace with actual school ID
      school_campus_id: user?.school_campus_id, // Replace with actual campus ID
      section_id: sectionId, // Replace with actual section ID
      annoucement_type: 3, // Replace with actual announcement type
      publish: 1, // Boolean indicating published announcements
    };
    
    try {
      const response = await api.protected.post(
        'teacher/announcements',
        payload,
      );

      if (response.data.status === 'success') {
        const formattedData = response.data.data.map((item: any) => ({
          id: item.id,
          
          title: item.title,
          description: item.description,
          time: item.created_date, 
          
        }));
        setAnnouncementDetail(formattedData);
      } else {
        //console.warn('Unexpected response:', response);
      }
    } catch (error) {
      //console.error('Failed to fetch announcementdetail:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true)
    fetchAnnouncementdetail();
    fetchNotificationDetail();
    setLoading(false)
  }, []);

   // Fetch announcements and notifications
   useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchAnnouncementdetail(), fetchNotificationDetail()]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const sections = [
    {
      title: t('announcements'),
      data: announcementDetail,
    },
    {
      title: t('notifications'),
      data: notificationDetail,
    },
  ];

  // Combine announcements and notifications
  const combinedData = [
    ...announcementDetail.map(item => ({ ...item, type: 'announcement' })),
    ...notificationDetail.map(item => ({ ...item, type: 'notification' })),
  ];

  const filteredData = combinedData.filter(item =>
    (item.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (item.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  // const renderItem = ({ item }: { item: Announcement & { type: string } }) => (
  //   <View style={[styles.card, styles.urgentCard]}>
  //     <Text style={styles.date}>{item.time}</Text>
  //     <Text style={styles.title}>{item.title}</Text>
  //     <Text style={styles.description}>{item.description}</Text>
  //   </View>
  // );

  const renderFilteredData = () => (
    filteredData.map((item, index) => (
      <View key={index} style={[styles.card, styles.urgentCard]}>
        <Text style={styles.date}>{item.time}</Text>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    ))
  );

  const handleNotificationPress = (type: number, action?: object) => {
    
    switch (type) {
      case 1:
      case 2:
        ("Navigating to SubjectTasksScreen with subject_name:", action?.subject_name);
        navigation.navigate('SubjectTasksScreen', {
          subject: {
            subject_id: Number(action?.subject_id),
            subject_name: action?.subject_name,
          },
        });
        break;
      case 3:
        navigation.navigate('Attendance');
        break;
      case 4:
        navigation.navigate('AcademicCalendar');
        break;
      case 5:
        navigation.navigate('StudentExamSchedule');
        break;
      default:
        console.warn('Unknown notification type');
        break;
    }
  };

  const renderItem = ({ item, section }: { item: any; section: any }) => {
    // console.log('Rendering Item:', item);
    if (section.title === 'Notifications') {
      return (
        <TouchableOpacity
          onPress={() => handleNotificationPress(item.type, item.action)}
          style={[styles.card, styles.urgentCard]}>
          <Text style={styles.date}>{item.time}</Text>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </TouchableOpacity>
      );
    }
    return (
      <View style={[styles.card, styles.urgentCard]}>
        <Text style={styles.date}>{item.time}</Text>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    );
  };

  const renderSectionHeader = ({ section: { title } }: { section: any }) => (
    <Text style={styles.sectionTitle}>{title}</Text>
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
          <Icon name="arrow-back" size={moderateScale(24)} style={styles.icon} />
        </TouchableOpacity>
        <Text style={styles.headerText}>{t('announcements')}</Text>
      </View>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Announcements"
          value={searchQuery}
          onChangeText={(text) => setSearchQuery(text)}
        />
        <Icon name="search" size={20} style={styles.searchIcon} />
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
      
      />
    </View>
  );
};


const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    paddingHorizontal: '16@s', // Horizontal padding uses `s`
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '20@vs', // Vertical margin uses `vs`
    marginBottom: '20@vs', // Vertical margin uses `vs`
  },
  headerText: {
    fontSize: '15@ms', // Font size uses `ms`
    fontFamily: 'Poppins-Bold',
    color: '#000',
    right: '90@s', // Horizontal adjustment uses `s`
  },
  icon: {
    color: '#000',
  },
  sectionTitle: {
    fontSize: '14@ms', // Font size uses `ms`
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
    marginBottom: '20@vs', // Vertical margin uses `vs`
    marginTop: '20@vs', // Vertical margin uses `vs`
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: '10@s', // Radius uses `s`
    elevation: 3,
    paddingHorizontal: '10@s', // Horizontal padding uses `s`
    marginBottom: '24@vs', // Vertical margin uses `vs`
  },
  searchInput: {
    flex: 1,
    fontSize: '14@ms', // Font size uses `ms`
    fontFamily: 'Poppins-Regular',
  },
  searchIcon: {
    color: '#888',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24@vs', // Vertical margin uses `vs`
  },
  newAnnouncements: {
    fontSize: '14@ms', // Font size uses `ms`
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
  },
  nonUrgentMarginTop: {
    marginTop: '30@vs', // Vertical margin uses `vs`
  },
  filterText: {
    fontSize: '14@ms', // Font size uses `ms`
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },
  urgentHeader: {
    fontSize: '16@ms', // Font size uses `ms`
    fontWeight: '600',
    color: '#d9534f',
    marginBottom: '15@vs', // Vertical margin uses `vs`
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '10@s', // Radius uses `s`
    padding: '10@ms', // Padding uses `s`
    marginBottom: '12@vs', // Vertical margin uses `vs`
  },
  urgentCard: {
    borderLeftWidth: '5@s', // Border width uses `s`
    borderLeftColor: '#d9534f',
  },
  date: {
    fontSize: '12@ms', // Font size uses `ms`
    fontFamily: 'Poppins-Regular',
    color: 'red',
    marginBottom: '8@vs', // Vertical margin uses `vs`
  },
  title: {
    fontSize: '14@ms', // Font size uses `ms`
    fontFamily: 'Poppins-Medium',
    color: '#000',
    marginBottom: '8@vs', // Vertical margin uses `vs`
  },
  description: {
    fontSize: '13@ms', // Font size uses `ms`
    fontFamily: 'Poppins-Regular',
    color: '#000',
    marginBottom: '8@vs', // Vertical margin uses `vs`
  },
  link: {
    fontSize: '14@ms', // Font size uses `ms`
    fontFamily: 'Poppins-Regular',
    color: '#000',
  },
});



export default Announcements;
