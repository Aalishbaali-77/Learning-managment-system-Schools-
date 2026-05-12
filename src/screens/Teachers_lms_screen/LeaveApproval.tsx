import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  ScrollView,
  Modal,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Dropdown} from 'react-native-element-dropdown';
import {useNavigation} from '@react-navigation/native';
import api from '../../api';
import {useUser} from '../../Context/UserContext';
import {useSubjects} from '../../Context/TeacherSubjectContext';
import {Calendar} from 'react-native-calendars';
import {useRef} from 'react';
import {ASSET_URL, ASSET_URL_HOE} from '../../constants';
import RNFetchBlob from 'react-native-blob-util';

const LeaveApproval = () => {
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
  const isMounted = useRef(false);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Runs on component mount

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // Start loading
      await fetchLeaveList();
      setLoading(false); // Stop loading
    };

    fetchData();
  }, [selectedDate]); // Runs when selectedDate changes

  const fetchLeaveList = async () => {
    try {
      const payload: any = {
        school_id: user?.company_id,
        school_campus_id: user?.school_campus_id,
        section_id: sectionId,
      };

      // Conditionally add 'date' only if selectedDate is not empty
      if (selectedDate) {
        payload.date = selectedDate;
      }

      //console.log('🔵 Fetching Leave List:', payload);

      const response = await api.protected.post('leave/list', payload);
      if (response.data.status === 'success') {
        setLeaveList(response.data.data);
      } else {
      //  console.error('❌ Failed to fetch leave list:', response.data.message);
      }
    } catch (err) {
      //console.error('⚠️ Error fetching leave list:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (item: any) => {
    try {
      // Convert status to an integer (1 = Approved, 2 = Rejected)
      const statusMap: Record<string, number> = {
        Approved: 2,
        Rejected: 3,
      };

      const leaveStatusInt = statusMap[statuses[item.id]] || 0; // Default to 0 if status is unknown

      const payload = {
        school_id: user?.company_id,
        school_campus_id: user?.school_campus_id,
        leave_id: item.id,
        leave_status: leaveStatusInt, // Must be an integer
        approved_by: user?.name,
        rejected_reason:
          leaveStatusInt === 3 ? rejectionReasons[item.id] || '' : '',
      };

      // console.log('🔵 Sending Leave Status Update Request:');
      // console.log('➡️ API Endpoint: leave/approve-or-reject');
      // console.log('📦 Payload:', JSON.stringify(payload, null, 2));

      const response = await api.protected.post(
        'leave/approve-or-reject',
        payload,
      );

      //console.log('✅ Leave Status Updated Successfully:', response.data);

      return response.data;
    } catch (err: any) {
      //console.error('❌ Error updating leave status:', err);

      if (err.response) {
        // console.error('⚠️ Response Data:', err.response.data);
        // console.error('⚠️ Response Status:', err.response.status);
        // console.error('⚠️ Response Headers:', err.response.headers);
      } else if (err.request) {
       // console.error('⚠️ No Response Received:', err.request);
      } else {
        //console.error('⚠️ Error Message:', err.message);
      }
    }
  };

  const handleStatusChange = (id: number, value: string) => {
    setStatuses(prev => ({...prev, [id]: value}));
  };

  const handleRejectionReasonChange = (id: number, text: string) => {
    setRejectionReasons(prev => ({...prev, [id]: text}));
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

  // Function to Download a File
  const requestStoragePermission = async () => {
    if (Platform.OS === 'android' && Platform.Version < 29) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission Required',
          message: 'This app needs access to your storage to download files.',
          buttonPositive: 'OK',
        },
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert(
          'Permission Denied',
          'You need to give storage permission to download files.',
        );
        return false;
      }
    }
    return true;
  };

  // ✅ Get MIME Type Based on File Extension
  const getMimeType = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();

    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      txt: 'text/plain',
      csv: 'text/csv',
      zip: 'application/zip',
      rar: 'application/x-rar-compressed',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      mp4: 'video/mp4',
      mp3: 'audio/mpeg',
    };

    return mimeTypes[extension || ''] || 'application/octet-stream'; // Default MIME type
  };

  // ✅ Download a File (Image or Document)
  const downloadFile = async (url: string, fileName: string) => {
    try {
      const fileExtension = url.split('.').pop()?.toLowerCase() || 'file'; // Extract file extension
      const mimeType = getMimeType(fileExtension); // Get MIME type based on extension
      const downloadPath = `${RNFetchBlob.fs.dirs.DownloadDir}/${fileName}`;

    //  console.log(`📥 Downloading: ${url} -> ${downloadPath}`);

      const res = await RNFetchBlob.config({
        fileCache: false,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          title: fileName,
          description: 'Downloading file...',
          mime: mimeType,
          path: downloadPath,
          mediaScannable: true,
        },
      }).fetch('GET', url);

      //console.log(`✅ Successfully downloaded: ${res.path()}`);

      // ✅ Ensure file is recognized in File Manager
      await RNFetchBlob.fs.scanFile([{path: res.path(), mime: mimeType}]);

      return res.path();
    } catch (error) {
     // console.error(`❌ Error downloading ${fileName}:`, error);
      Alert.alert('Download Failed', `Could not download ${fileName}.`);
    }
  };

  // ✅ Download All Images & Documents
  // ✅ Download Attachments from API Response
  const handleDownloadAttachments = async (attachments: string[]) => {
    try {
      //console.log('🔍 Checking storage permissions...');
      const permissionGranted = await requestStoragePermission();
      if (!permissionGranted) return;

     // console.log('📂 Downloading attachments...');
      let downloadPromises: Promise<string | undefined>[] = [];

      attachments.forEach((attachment, index) => {
        const fileExtension = attachment.split('.').pop() || 'file'; // Get extension
        const fileName = `attachment_${index + 1}.${fileExtension}`;
        const fileUrl = `${ASSET_URL}${attachment}`; // Ensure full URL
        downloadPromises.push(downloadFile(fileUrl, fileName));
      });

      await Promise.all(downloadPromises);

      Alert.alert(
        'Download Complete',
        'All attachments have been saved to your Downloads folder.',
      );
    } catch (error) {
     // console.error('❌ Download Error:', error);
      Alert.alert('Error', 'Something went wrong while downloading files.');
    }
  };

  const renderLeaveCard = ({item}: {item: any}) => {
    const status = statuses[item.id] || 'Pending';

    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.profileContainer}>
            <View style={styles.profilePlaceholder}>
              <Image
                source={{uri: `${ASSET_URL_HOE}${item.passport_size_photo}`}}
                style={styles.profilePlaceholder}
              />
            </View>
            <View>
              <Text style={styles.userName}>{item.student_name}</Text>
              <Text style={styles.rollNumber}>
                Roll No: {item.registration_no}
              </Text>
            </View>
          </View>

          {/* Status Dropdown */}
          <Dropdown
            data={statusOptions}
            labelField="label"
            valueField="value"
            value={status}
            onChange={selectedItem =>
              handleStatusChange(item.id, selectedItem.value)
            }
            style={[
              styles.dropdown,
              {backgroundColor: getStatusColor(status), borderRadius: 10},
            ]}
            containerStyle={styles.dropdownContainer}
            selectedTextStyle={styles.dropdownSelectedText}
            iconStyle={{tintColor: '#fff'}}
            renderItem={(option, selected) => (
              <View
                style={[
                  styles.dropdownItem,
                  {
                    backgroundColor: getStatusColor(option.value),
                    borderRadius: 10,
                  },
                ]}>
                <Text
                  style={{
                    color: '#fff',
                    fontSize: 10,
                    fontFamily: 'Poppins-Regular',
                  }}>
                  {option.label}
                </Text>
              </View>
            )}
          />
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

        <Text style={styles.label}>Leave Date</Text>
        <Text style={styles.value}>
          {item.from_date} - {item.to_date}
        </Text>
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

        {status === 'Rejected' && (
          <View style={styles.rejectionContainer}>
            <Text style={styles.label}>Rejected Reason</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter rejection reason"
              value={rejectionReasons[item.id] || ''}
              onChangeText={text => handleRejectionReasonChange(item.id, text)}
            />
          </View>
        )}
        {/* Save Button for Each Card */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => handleSave(item)}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>

        {/* Download Icon */}
        {item.attachments && item.attachments.length > 0 && (
          <TouchableOpacity
            style={styles.downloadIcon}
            onPress={() => handleDownloadAttachments(item.attachments)}>
            <Icon name="file-download" size={28} color="#000" />
          </TouchableOpacity>
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
        <TouchableOpacity>
          <Icon name="notifications" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Calendar Filter */}
      <View style={styles.calendarContainer}>
        <TouchableOpacity
          style={styles.dateSelector}
          onPress={() => setCalendarVisible(!calendarVisible)}>
          <Icon name="calendar-today" size={18} color="#000" />
          <Text style={styles.dateText}>{selectedDate || 'Select Date'}</Text>
        </TouchableOpacity>

        {calendarVisible && (
          <View style={styles.calendarDropdown}>
            <Calendar
              onDayPress={day => {
                setSelectedDate(day.dateString);
                setCalendarVisible(false);
              }}
              markedDates={{
                [selectedDate]: {selected: true, selectedColor: 'red'},
              }}
            />
          </View>
        )}
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
  calendarContainer: {
    alignSelf: 'flex-end', // Aligns the container to the right
    marginRight: '10@ms',
    marginBottom: '10@ms',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    paddingVertical: '5@ms',
    paddingHorizontal: '10@ms',
    borderRadius: '8@ms',
  },
  dateText: {
    marginLeft: '5@ms',
    fontSize: '12@ms',
    fontFamily: 'Poppins-Regular',
    color: '#000',
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
    padding: '10@s',
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
    width: '40@s',
    height: '40@s',
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
    width: '90@s',
    backgroundColor: '#EFEFEF',
    borderWidth: 0,
  },
  dropdownContainer: {
    width: '90@s',
  },
  dropdownSelectedText: {
    color: '#fff',
    fontFamily: 'Poppins-Regular',
    fontSize: '12@ms',
    left: '10@s',
  },
  dropdownItem: {
    paddingVertical: '11@vs',
    paddingHorizontal: '10@s',
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
    width: '100@s',
    height: '100@s',
    borderRadius: '5@s',
    marginVertical: '10@vs',
  },
  rejectionContainer: {
    marginTop: '10@vs',
    padding: '10@s',
    backgroundColor: '#F0F0F0',
    borderRadius: '5@s',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: '5@s',
    padding: '8@s',
    marginTop: '5@vs',
  },
  saveButton: {
    backgroundColor: 'red',
    paddingHorizontal: '10@ms',
    width: '50@s',
    borderRadius: '20@s',
    alignItems: 'center',
    marginVertical: '10@vs',
    alignSelf: 'flex-end',
  },
  saveText: {
    color: '#fff',
    fontSize: '12@ms',
    fontFamily: 'Poppins-Regular',
  },
  downloadIcon: {
    position: 'absolute',
    bottom: '10@vs',
    left: '225@s',
  },
  attachmentsContainer: {
    marginTop: '10@ms',
  },
  attachmentImage: {
    width: '80@ms',
    height: '80@ms',
    borderRadius: '8@ms',
    marginRight: '8@ms',
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
    top: '30@ms',
    right: '20@ms',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: '10@ms',
    borderRadius: '20@ms',
    zIndex: 1,
  },
  closeText: {
    color: '#fff',
    fontSize: '20@ms',
    fontFamily: 'Poppins-Medium',
  },
});

export default LeaveApproval;
