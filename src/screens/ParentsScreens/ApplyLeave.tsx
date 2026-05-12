import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Dropdown} from 'react-native-element-dropdown';
import {useNavigation} from '@react-navigation/native';
import {Calendar} from 'react-native-calendars';
import api from '../../api';
import {useUser} from '../../Context/UserContext';
import {useSubjects} from '../../Context/TeacherSubjectContext';
import {ASSET_URL} from '../../constants';

const ApplyLeave = () => {
  const [statuses, setStatuses] = useState<{[key: string]: string}>({});
  const [rejectionReasons, setRejectionReasons] = useState<{
    [key: string]: string;
  }>({});
  const navigation = useNavigation();
  const [leaveList, setLeaveList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const {user} = useUser();
  const {sectionId} = useSubjects();
  const [selectedDate, setSelectedDate] = useState('');
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const statusOptions = [
    {label: 'Pending', value: 'Pending'},
    {label: 'Rejected', value: 'Rejected'},
    {label: 'Approved', value: 'Approved'},
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // Start loading
      await fetchLeaveList();
      setLoading(false); // Stop loading
    };

    fetchData();
  }, []);

  const fetchLeaveList = async () => {
    try {
      const payload = {
        school_id: user?.company_id,
        school_campus_id: user?.school_campus_id,
        section_id: sectionId,
        student_id: user?.id,
      };
     // console.log('🔵 Fetching Leave List:', payload);

      const response = await api.protected.post('leave/list', payload);
      if (response.data.status === 'success') {
        setLeaveList(response.data.data);
      } else {
       // console.error('Failed to fetch leave list:', response.data.message);
      }
    } catch (err) {
      //console.error('Error fetching leave list:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectionReasonChange = (id: number, text: string) => {
    setRejectionReasons(prev => ({...prev, [id]: text}));
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 1:
        return 'Pending';
      case 2:
        return 'Approved';
      case 3:
        return 'Rejected';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'red';
      case 'Rejected':
        return 'orange';
      case 'Approved':
        return 'green';
      default:
        return 'gray';
    }
  };

  const renderLeaveCard = ({item}: {item: any}) => {
    const status = statuses[item.id] || 'Pending';

    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          {/* <View style={styles.profileContainer}>
            <View style={styles.profilePlaceholder} />
            <View>
              <Text style={styles.userName}>{item.student_name}</Text>
              <Text style={styles.rollNumber}>
                Roll No: {item.registration_no}
              </Text>
            </View>
          </View> */}
        </View>

        {/* Leave Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Text style={styles.label}>Leave type</Text>
            <Text style={styles.value}>{item.leave_type_name}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.label}>No of Days</Text>
            <Text style={styles.value}>{item.no_of_days}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.label}>Applied on</Text>
            <Text style={styles.value}>{item.created_date}</Text>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Text style={styles.label}>Leave Date</Text>
            <Text style={styles.value}>
              {item.from_date} - {item.to_date}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.label}>Status</Text>
            <Text
              style={[
                styles.value,
                {color: getStatusColor(getStatusText(item.status))},
              ]}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>
        <Text style={styles.label}>Reason for Leave</Text>
        <Text style={styles.value}>{item.reason_for_leave}</Text>

        {/* Attachments Section */}
        {item.attachments?.length > 0 && (
          <View style={styles.attachmentsContainer}>
            <Text style={styles.label}>Attachments</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {item.attachments.map((attachment, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedImage(`${ASSET_URL}${attachment}`)}>
                  <Image
                    source={{uri: `${ASSET_URL}${attachment}`}}
                    style={styles.attachmentImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Full-Screen Image Modal */}
        <Modal
          visible={!!selectedImage}
          transparent={true}
          onRequestClose={() => setSelectedImage(null)}>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedImage(null)}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
            <Image
              source={{uri: selectedImage}}
              style={styles.fullImage}
              resizeMode="contain"
            />
          </View>
        </Modal>

        {/* Full-Screen Image Modal */}
        <Modal
          visible={!!selectedImage}
          transparent={true}
          onRequestClose={() => setSelectedImage(null)}>
          <TouchableOpacity
            style={styles.modalContainer}
            onPress={() => setSelectedImage(null)}>
            <Image
              source={{uri: selectedImage}}
              style={styles.fullImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </Modal>

        {status === 'Rejected' && item.rejected_reason && (
          <View style={styles.rejectionContainer}>
            <Text style={styles.label}>Rejected Reason</Text>
            <Text style={styles.value}>{item.rejected_reason}</Text>
          </View>
        )}
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Leave Request</Text>
        <TouchableOpacity onPress={()=>navigation.navigate('TeacherAnnouncement')}>
          <Icon name="notifications" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Leave Form */}
      <View style={styles.calendarContainer}>
        <TouchableOpacity
          style={styles.dateSelector}
          onPress={() => navigation.navigate('LeaveForm')}>
          <Text style={styles.dateText}>Leave Form</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="blue" />
      ) : (
        <FlatList
          data={leaveList}
          keyExtractor={item => item.id.toString()}
          renderItem={renderLeaveCard}
        />
      )}
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: '10@ms',
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
  calendarContainer: {
    alignSelf: 'flex-end', // Aligns the container to the right
    marginRight: '10@s',
    marginBottom: '10@vs',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E01616',
    paddingVertical: '5@vs',
    paddingHorizontal: '10@s',
    borderRadius: '8@ms',
  },
  dateText: {
    marginLeft: '5@s',
    fontSize: '12@ms',
    fontFamily: 'Poppins-Regular',
    color: '#fff',
  },
  calendarDropdown: {
    position: 'absolute',
    top: '40@ms', // Slightly below the date selector
    right: 0,
    backgroundColor: '#fff',
    borderRadius: '10@ms',
    elevation: 5, // Shadow effect for better UI
    zIndex: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '10@s',
    padding: '10@ms',
    marginBottom: '10@vs',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePlaceholder: {
    width: '40@ms',
    height: '40@vs',
    borderRadius: '20@s',
    backgroundColor: '#CCC',
    marginRight: '10@s',
  },
  userName: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },
  rollNumber: {
    fontSize: '12@ms',
    color: '#000',
    fontFamily: 'Poppins-Regular',
  },
  dropdown: {
    width: '120@ms',
    backgroundColor: '#EFEFEF',
    borderWidth: 0,
  },
  dropdownContainer: {
    width: '120@ms',
  },
  dropdownSelectedText: {
    color: '#fff',
    fontFamily: 'Poppins-Regular',
    fontSize: '12@ms',
    left: '10@s',
  },
  dropdownItem: {
    paddingVertical: '10@vs',
    paddingHorizontal: '15@s',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: '5@vs',
  },
  detailItem: {
    flex: 1, // Makes sure items distribute evenly
    alignItems: 'flex-start', // Aligns label and value properly
  },
  label: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Regular',
    color: '#000',
  },
  value: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-Medium',
    color: '#000',
  },
  attachment: {
    width: '100@ms',
    height: '100@vs',
    borderRadius: '5@s',
    marginVertical: '10@vs',
  },
  rejectionContainer: {
    marginTop: '10@vs',
    padding: '10@ms',
    backgroundColor: '#F0F0F0',
    borderRadius: '5@s',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: '5@s',
    padding: '8@ms',
    marginTop: '5@vs',
  },
  saveButton: {
    backgroundColor: 'red',
    padding: '12@ms',
    borderRadius: '5@s',
    alignItems: 'center',
    marginVertical: '10@vs',
  },
  saveText: {
    color: '#fff',
    fontSize: '16@ms',
    fontFamily: 'Poppins-Bold',
  },
  attachmentsContainer: {
    marginTop: '10@vs',
  },
  attachmentImage: {
    width: '80@ms',
    height: '80@vs',
    borderRadius: '8@ms',
    marginRight: '8@s',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '90%',
    height: '90%',
  },
  closeButton: {
    position: 'absolute',
    top: '30@vs',
    right: '20@s',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: '10@ms',
    borderRadius: '20@ms',
    zIndex: 1,
  },
  closeText: {
    color: '#fff',
    fontSize: '20@ms',
    fontFamily: 'Poppins-Bold',
  },
});

export default ApplyLeave;
