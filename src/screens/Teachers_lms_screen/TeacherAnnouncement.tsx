import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  SectionList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {moderateScale, ScaledSheet} from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../api';
import {useUser} from '../../Context/UserContext';
import {useSubjects} from '../../Context/TeacherSubjectContext';
import {useNavigation} from '@react-navigation/native';

const TeacherAnnouncement: React.FC = () => {
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

  const fetchNotificationDetail = async () => {
    const currentDate = new Date().toISOString().split('T')[0];
    setLoading(true);
    const payload = {
      employee_id: user?.emp_id,
    };

    try {
      const response = await api.protected.post(
        'teacher/notifications/student-notifications',
        payload,
      );

      if (response.data.status === 'success') {
        const formattedData = response.data.data.map((item: any) => ({
          id: item.id,
          title: item.data.title, // Accessing title from nested 'data'
          description: item.data.description, // Accessing description from nested 'data'
          time: item.created_at, // Adjusted field name
        }));
        setNotificationDetail(formattedData);
      } else {
        console.warn('Unexpected response:', response);
      }
    } catch (error) {
    //  console.error('Failed to fetch announcement detail:', error);
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
      annoucement_type: 2, // Replace with actual announcement type
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
          time: item.created_date, // Adjust based on your API field
        }));
        setAnnouncementDetail(formattedData);
      } else {
        console.warn('Unexpected response:', response);
      }
    } catch (error) {
      //console.error('Failed to fetch announcementdetail:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncementdetail();
    fetchNotificationDetail();
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
      title: 'Announcements',
      data: announcementDetail,
    },
    {
      title: 'Notifications',
      data: notificationDetail,
    },
  ];

  // Combine announcements and notifications
  const combinedData = [
    ...announcementDetail.map(item => ({...item, type: 'announcement'})),
    ...notificationDetail.map(item => ({...item, type: 'notification'})),
  ];

  const filteredData = combinedData.filter(
    item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const renderItem = ({item}: {item: Announcement & {type: string}}) => (
    <View style={[styles.card, styles.urgentCard]}>
      <Text style={styles.date}>{item.time}</Text>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  const renderSectionHeader = ({section}: {section: {title: string}}) => (
    <Text style={styles.sectionTitle}>{section.title}</Text>
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
        <Text style={styles.headerText}>Announcement</Text>
        <TouchableOpacity>
          <Icon name="notifications" size={moderateScale(24)} style={styles.icon} />
        </TouchableOpacity>
      </View>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Announcement"
          value={searchQuery}
          onChangeText={setSearchQuery} // Update search query state
        />
        <Icon name="search" size={20} style={styles.searchIcon} />
      </View>
      <View style={styles.filterContainer}>
        <Text style={styles.newAnnouncements}>
          New Announcement: {announcementDetail.length}
        </Text>
        {/* <TouchableOpacity>
          <Text style={styles.filterText}>Academic ▼</Text>
        </TouchableOpacity> */}
      </View>
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <SectionList
          sections={sections}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={item => item.id.toString()}
        />
      )}
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    paddingHorizontal: '16@s',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)', // Optional semi-transparent background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '20@vs',
    marginBottom: '20@vs',
  },
  headerText: {
    fontSize: '18@ms',
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },
  icon: {
    color: '#000',
  },
  sectionTitle: {
    fontSize: '16@ms',
    fontFamily: 'Poppins-Bold',
    color: '#000',
    marginBottom: '20@vs',
    marginTop: '20@vs',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: '10@s',
    elevation: 3,
    paddingHorizontal: '10@s',
    marginBottom: '24@vs',
  },
  searchInput: {
    flex: 1,
    fontSize: '14@s',
    fontFamily: 'Poppins-Regular',
  },
  searchIcon: {
    color: '#888',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24@vs',
  },
  newAnnouncements: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },
  nonUrgentMarginTop: {
    marginTop: '30@vs', // Adjust this value as needed
  },
  filterText: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },
  urgentHeader: {
    fontSize: '16@ms',
    fontWeight: '600',
    color: '#d9534f',
    marginBottom: '15@vs',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '10@s',
    padding: '10@s',
    marginBottom: '12@vs',
  },
  urgentCard: {
    borderLeftWidth: '5@s',
    borderLeftColor: '#d9534f',
  },
  date: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Regular',
    color: 'red',
    marginBottom: '8@vs',
  },
  title: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-Medium',
    color: '#000',
    marginBottom: '8@vs',
  },
  description: {
    fontSize: '13@ms',
    fontFamily: 'Poppins-Regular',
    color: '#000',
    marginBottom: '8@vs',
  },
  link: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-Regular',
    color: '#000',
  },
});

export default TeacherAnnouncement;
