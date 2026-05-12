import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ScaledSheet, scale } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
import BellIcon from 'react-native-vector-icons/Ionicons';
import { Dropdown } from 'react-native-element-dropdown';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../../api';
import { useUser } from '../../Context/UserContext';
import { useSubjects } from '../../Context/TeacherSubjectContext';


interface MessageItem {
  id: string;
  subject: string;
  message: string;
  time: string;
  unreadCount: number;
}

const messages: MessageItem[] = [
  { id: '1', subject: 'Mathematics', message: 'when an unknown printer took a galley of type and..', time: '9:00 AM', unreadCount: 1 },
  { id: '2', subject: 'English', message: 'when an unknown printer took a galley of type and..', time: '9:00 AM', unreadCount: 0 },
  { id: '3', subject: 'Urdu', message: 'when an unknown printer took a galley of type and..', time: '9:00 AM', unreadCount: 6 },
  { id: '4', subject: 'Science', message: 'when an unknown printer took a galley of type and..', time: '9:00 AM', unreadCount: 0 },
];

const classOptions = [
  { label: 'Class 10-A', value: '10-A' },
  { label: 'Class 10-B', value: '10-B' },
  { label: 'Class 9-A', value: '9-A' },
  { label: 'Class 9-B', value: '9-B' },
];

const TeachersChats: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState('10-A');
  const { sectionId } = useSubjects();
  const { user } = useUser();
  const navigation = useNavigation();
  const [chats, setChats] = useState('')
  const [loading, setLoading] = useState(false)
  const section_id = sectionId
  const [seenChats, setSeenChats] = useState<{ [key: string]: boolean }>({});
  const user_id = user?.id
  const school_campus_id = user?.school_campus_id
  const school_id = user?.company_id
  const isFirstLoad = useRef(true); // ✅ Track first load

useFocusEffect(
  useCallback(() => {
    const interval = setInterval(() => {
      fetchChats(false); // ❌ No loading for interval updates
    }, 1000);

    return () => clearInterval(interval); // ✅ Cleanup on screen unfocus
  }, [])
);

useEffect(() => {
  const fetchData = async () => {
    await fetchChats(true); // ✅ Trigger loader only for first call
    isFirstLoad.current = false; // ✅ Mark first load as completed
  };

  if (isFirstLoad.current) {
    fetchData(); // ✅ Call only on first mount
  }
}, []);

const fetchChats = async (showLoader: boolean) => {
  if (showLoader) setLoading(true); // ✅ Only show loader when explicitly needed

  try {
    const response = await api.protected.post('chat-room/get-chat-rooms', { user_id, school_id, school_campus_id, section_id });

    if (response.data.status === 'success') {
      const formattedChats = response.data.data.map((chat: any) => ({
        id: chat.id,
        subject: chat.subject_name,
        message: chat.last_message ? chat.last_message : 'No messages yet',
        time: chat.last_message_time || '',
        unreadCount: chat.unread_count,
      }));

      setChats(formattedChats);
    } else {
      setChats([]);
    }
  } catch (error) {
    //console.error('Error fetching chats:', error);
  } finally {
    if (showLoader) setLoading(false); // ✅ Only hide loader if it was shown
  }
};


  const handleChatOpen = (chatId: string) => {
    setSeenChats((prevSeenChats) => ({
      ...prevSeenChats,
      [chatId]: true, // Mark as seen
    }));

    navigation.navigate('TeachersChatRoom', { chatId });
  };

  const renderItem = ({ item }: { item: MessageItem }) => (
    <TouchableOpacity style={styles.messageItem} onPress={() => handleChatOpen(item.id)}>
      <View style={styles.profilePlaceholder} />
      <View style={styles.messageContent}>
        <Text style={styles.subject}>{item.subject}</Text>
        <Text style={styles.messageText}>{item.message}</Text>
      </View>
      <View style={styles.timeContainer}>
        <Text style={styles.time}>{item.time}</Text>
        {item.unreadCount > 0 && !seenChats[item.id] && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unreadCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={scale(24)} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity onPress={() => navigation.navigate('TeacherAnnouncement')}>
          <Icon name="notifications" size={scale(24)} color="black" />

        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={scale(18)} color="#888" style={styles.searchIcon} />
        <TextInput placeholder="Search Chat" placeholderTextColor='#999' style={styles.searchInput} />
      </View>

      {/* Dropdown with react-native-element-dropdown */}
      {/* <Dropdown
        data={classOptions}
        labelField="label"
        valueField="value"
        value={selectedClass}
        onChange={(item) => setSelectedClass(item.value)}
        style={styles.classDropdown}
        containerStyle={styles.dropdownContainer}
        selectedTextStyle={styles.classText}
        placeholderStyle={styles.classText}
        renderRightIcon={() => <Icon name="chevron-down" size={scale(16)} color="black" />}
      /> */}

      {/* Messages List */}
      <FlatList data={chats} renderItem={renderItem} keyExtractor={(item) => item.id.toString()} />
    </View>
  );
};


const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: '15@s',
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
    paddingVertical: '15@vs',
  },
  headerTitle: {
    fontSize: '18@ms',
    fontFamily: 'Poppins-Bold',
    color: 'black',
  },
  notificationDot: {
    position: 'absolute',
    top: '2@vs',
    right: '2@s',
    width: '8@ms',
    height: '8@vs',
    borderRadius: '4@ms',
    backgroundColor: 'red',
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: '8@ms',
    alignItems: 'center',
    paddingHorizontal: '10@s',
    height: '40@vs',
  },
  searchIcon: {
    marginRight: '10@s',
  },
  searchInput: {
    flex: 1,
    fontSize: '14@ms',
    fontFamily: 'Poppins-Regular',
    color: '#333',
  },
  classDropdown: {
    alignSelf: 'flex-end',
    backgroundColor: '#f0f0f0',
    paddingVertical: '5@vs',
    paddingHorizontal: '10@s',
    borderRadius: '8@ms',
    marginTop: '10@vs',
    marginBottom: '5@vs',
    width: '110@ms',
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderRadius: '8@ms',
  },
  classText: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Regular',
    color: 'black',
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: '12@vs',
    borderBottomWidth: '1@ms',
    borderBottomColor: '#eee',
  },
  profilePlaceholder: {
    width: '45@ms',
    height: '45@vs',
    borderRadius: '25@ms',
    backgroundColor: '#ccc',
    marginRight: '10@s',
  },
  messageContent: {
    flex: 1,
  },
  subject: {
    fontSize: '16@ms',
    fontFamily: 'Poppins-Bold',
    color: 'black',
  },
  messageText: {
    fontSize: '13@ms',
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginTop: '3@vs',
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  time: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
  unreadBadge: {
    backgroundColor: 'orange',
    width: '20@ms',
    height: '20@vs',
    borderRadius: '10@ms',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '5@vs',
  },
  unreadText: {
    color: 'white',
    fontSize: '12@ms',
    fontFamily: 'Poppins-Bold',
  },
});

export default TeachersChats;
