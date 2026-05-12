import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  PermissionsAndroid,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  LayoutAnimation, 
  UIManager,
} from 'react-native';
import { moderateScale, ScaledSheet } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../api';
import { useSubjects } from '../../Context/TeacherSubjectContext';
import { useUser } from '../../Context/UserContext';
import { Dropdown } from 'react-native-element-dropdown';
import { getAccessToken } from '../../utils/storage';
import { ASSET_URL } from '../../constants';
import RNFetchBlob from "react-native-blob-util";

type SubjectProps = NativeStackScreenProps<any, any>;

const TeachersSubjectDetails: React.FC<SubjectProps> = props => {
  const route = useRoute();
  const [selectedTab, setSelectedTab] = useState('diary'); // State for the dropdown selection
  const [tasks, setTasks] = useState([]); // State for fetched tasks
  const [tests, setTests] = useState([]); // State for fetched tests
  const [loading, setLoading] = useState(false); // Loading state
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useUser();
  const { subjects } = useSubjects();
  const subjectId = props.route.params?.subjectId;
  const subjectName = props.route.params?.subjectName;
  const [cardHeights, setCardHeights] = useState<number[]>([]);
  const [filteredTasks, setFilteredTasks] = useState(tasks);
  const [filteredTests, setFilteredTests] = useState(tests);
  const [expandedCardIndex, setExpandedCardIndex] = useState(null); // Loading state
  const sectionId = props.route.params?.sectionId
  const [selectedImage, setSelectedImage] = useState<string | null>(null);


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

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const payload = {
        type: '1',
        employee_id: user?.emp_id,
        section_id: sectionId,
        subject_id: subjectId,
        school_id: user?.company_id,
        school_campus_id: user?.school_campus_id,
      };

      const endpoint =
        selectedTab === 'diary'
          ? 'teacher/assign-tasks'
          : 'teacher/assign-tests';

      const response = await api.protected.post(endpoint, payload);

      if (response.data.status === 'success') {
        const tasks = response.data.data;

        if (selectedTab === 'diary' && Array.isArray(tasks)) {
          // ✅ Process each task to filter images & documents
          const updatedTasks = tasks.map((task) => {
            const images = [];
            const documents = [];

            if (Array.isArray(task.assign_tasks_media)) {
              task.assign_tasks_media.forEach((media) => {
                // ✅ Only include media where `uploaded_by === 1`
                if (media.uploaded_by === 1) {
                  const fileUri = `${ASSET_URL}${media.media_path}`;

                  if (media.media_type === 'image') {
                    images.push(fileUri);
                  } else if (media.media_type === 'document') {
                    documents.push({ name: media.title || 'Document', uri: fileUri });
                  }
                }
              });
            }

            return { ...task, images, documents };
          });

          setTasks(updatedTasks);
        } else if (selectedTab === 'test' && Array.isArray(tasks)) {
          setTests(tasks);
        }
      } else {
        //console.error('Error fetching data:', response.data.message);
      }
    } catch (error) {
      if (error.response) {
       // console.error('API Error Details:', error.response.data);
      } else {
        //console.error('Request Error:', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

   const requestStoragePermission = async () => {
      if (Platform.OS === "android" && Platform.Version < 29) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: "Storage Permission Required",
            message: "This app needs access to your storage to download files.",
            buttonPositive: "OK",
          }
        );
    
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert("Permission Denied", "You need to give storage permission to download files.");
          return false;
        }
      }
      return true;
    };
    
    // ✅ Get MIME Type Based on File Extension
    const getMimeType = (fileName: string) => {
      const extension = fileName.split(".").pop()?.toLowerCase();
    
      const mimeTypes: Record<string, string> = {
        pdf: "application/pdf",
        doc: "application/msword",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        xls: "application/vnd.ms-excel",
        xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ppt: "application/vnd.ms-powerpoint",
        pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        txt: "text/plain",
        csv: "text/csv",
        zip: "application/zip",
        rar: "application/x-rar-compressed",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        mp4: "video/mp4",
        mp3: "audio/mpeg",
      };
    
      return mimeTypes[extension || ""] || "application/octet-stream"; // Default MIME type
    };
    
    // ✅ Download a File (Image or Document)
    const downloadFile = async (url: string, fileName: string) => {
      try {
        const mimeType = getMimeType(fileName);
        const downloadPath = `${RNFetchBlob.fs.dirs.DownloadDir}/${fileName}`;
    
        //console.log(`📥 Downloading: ${url} -> ${downloadPath}`);
    
        const res = await RNFetchBlob.config({
          fileCache: false,
          addAndroidDownloads: {
            useDownloadManager: true, // ✅ Uses Download Manager
            notification: true, // ✅ Shows progress in notification bar
            title: fileName, // ✅ Proper filename in notifications
            description: "Downloading file...",
            mime: mimeType, // ✅ Correct MIME type
            path: downloadPath, // ✅ Ensure public Downloads folder
            mediaScannable: true, // ✅ Make file visible in File Manager
          },
        }).fetch("GET", url);
    
        //console.log(`✅ Successfully downloaded: ${res.path()}`);
    
        // ✅ Force MediaStore to recognize the file (VERY IMPORTANT!)
        await RNFetchBlob.fs.scanFile([{ path: res.path(), mime: mimeType }]);
    
        return res.path();
      } catch (error) {
        //console.error(`❌ Error downloading ${fileName}:`, error);
        Alert.alert("Download Failed", `Could not download ${fileName}.`);
      }
    };

    const handleDownloadMedia = async (document: { name: string; uri: string }) => {
      try {
       // console.log("🔍 Checking storage permissions...");
        const permissionGranted = await requestStoragePermission();
        if (!permissionGranted) return;
    
        //console.log(`📂 Downloading document: ${document.name}`);
        
        const fileExtension = document.uri.split(".").pop() || "pdf"; // Default to PDF if unknown
        const fileName = `${document.name}.${fileExtension}`;
        
        await downloadFile(document.uri, fileName);
    
        Alert.alert("Download Complete", `${document.name} has been saved to your Downloads folder.`);
      } catch (error) {
        //console.error("❌ Download Error:", error);
        Alert.alert("Error", "Something went wrong while downloading the file.");
      }
    };
    

  const handleSearch = query => {
    setSearchQuery(query);

    if (selectedTab === 'diary') {
      const filtered = tasks.filter(
        task =>
          task.title.toLowerCase().includes(query.toLowerCase()) ||
          task.description.toLowerCase().includes(query.toLowerCase()),
      );
      setFilteredTasks(filtered);
    } else {
      const filtered = tests.filter(
        test =>
          test.title.toLowerCase().includes(query.toLowerCase()) ||
          test.description.toLowerCase().includes(query.toLowerCase()),
      );
      setFilteredTests(filtered);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const accessToken = await getAccessToken();
        if (user && accessToken) {
          // Always fetch if selectedTab changes
          await fetchTasks();
  
          // ✅ If coming back with onUpdated = true, refetch
          if (route.params?.onUpdated) {
            await fetchTasks();
            // Optionally reset the param so it doesn't refetch again on every focus
            route.params.onUpdated = false;
          }
        }
      } catch (error) {
        // handle error
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [selectedTab, route.params?.onUpdated]); // Include `onUpdated` in deps

  // Effect to handle tab change
  useEffect(() => {
    if (selectedTab === 'diary') {
      setFilteredTasks(tasks);
    } else {
      setFilteredTests(tests);
    }
  }, [selectedTab, tasks, tests]);

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
          <Icon name="arrow-back" size={moderateScale(24)} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>{subjectName}</Text>
        <TouchableOpacity>
          <View />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Task"
          placeholderTextColor={'#000'}
          value={searchQuery}
          onChangeText={handleSearch} // Update search query
        />
        <TouchableOpacity>
          <Text style={styles.searchButton}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs with Dropdown */}
      <View style={styles.tabs}>
        <View style={styles.pickerContainer}>
          <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            itemTextStyle={{
              fontSize: moderateScale(12),
              fontFamily: 'Poppins-Regular',
              color: '#000',
            }}
            iconStyle={{ tintColor: '#000' }}
            data={[
              { label: 'Diary', value: 'diary' },
              { label: 'Tests', value: 'test' },
            ]}
            labelField="label"
            valueField="value"
            placeholder="Select a tab"
            value={selectedTab}
            onChange={item => {
              setSelectedTab(item.value); // Update the selected tab state
            }}
          />
        </View>
        <TouchableOpacity
          style={styles.viewHistoryButton}
          onPress={() => {
            // console.log('Subject Name:', subjectName);
            if (selectedTab === 'diary') {
              navigation.navigate('TeacherTaskHistory', {
                subjectId,
                subjectName,
              });
            } else {
              navigation.navigate('TeacherTestHistory', {
                subjectId,
                subjectName,
              });
            }
          }}>
          <Text style={styles.viewHistoryText}>View History</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.DrafttaskButton}
          onPress={() => {
            // console.log('Subject Name:', subjectName);
            if (selectedTab === 'diary') {
              navigation.navigate('TeachersDraftTask', {
                subjectId,
                subjectName,
                sectionId,
              });
            } else {
              navigation.navigate('DraftTest', { subjectId, subjectName, sectionId });
            }
          }}>
          <Text style={styles.DrafttaskText}>
            {selectedTab === 'diary' ? 'Draft Task' : 'Draft Test'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Task List */}
      <ScrollView>
        {loading ? (
          <Text>Loading...</Text>
        ) : selectedTab === 'diary' ? (
          filteredTasks.map((task, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.taskCard,
                { borderColor: task.task_status === 1 ? '#28A745' : '#DC3545' },
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
                <Text style={styles.taskDueDate}>
                  Due Date: {task.end_date}
                </Text>
                {expandedCardIndex === index && (
                  <>
                    <Text style={styles.taskDescription}>{task.description}</Text>

                    {/* Image Row */}
                    <View>
                      <View style={styles.imageRow}>
                        {task.images.map((image, imgIndex) => (
                          <TouchableOpacity key={imgIndex} onPress={() => setSelectedImage(image)}>
                            <Image source={{ uri: image }} style={styles.taskImage} />
                          </TouchableOpacity>
                        ))}
                      </View>

                      {/* Fullscreen Image Modal */}
                      <Modal visible={!!selectedImage} transparent animationType="fade">
                        <View style={styles.modalContainer}>
                          <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedImage(null)}>
                            <Icon name="close" size={30} color="#fff" />
                          </TouchableOpacity>
                          <Image source={{ uri: selectedImage || "" }} style={styles.fullImage} resizeMode="contain" />
                        </View>
                      </Modal>

                      {/* Document List */}
                      <View style={styles.documentList}>
                        {task.documents.map((doc, docIndex) => (
                          <TouchableOpacity key={docIndex} style={styles.documentItem} onPress={() => handleDownloadMedia(doc)}>
                            <Icon name="insert-drive-file" size={40} color="#000" />
                            <Text numberOfLines={1} style={styles.documentName}>
                              {doc.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Download Icon */}
                    {/* <TouchableOpacity style={styles.downloadIcon} onPress={() => handleDownloadMedia(task.images, task.documents)}>
                      <Icon name="file-download" size={28} color="#000" />
                    </TouchableOpacity> */}
                  </>
                )}

                {/* Dropdown Icon */}
                <TouchableOpacity
                  style={[
                    styles.dropdownIconContainer,
                    {
                      top: cardHeights[index] ? cardHeights[index] - 20 : 60, // Fallback for initial render
                    },
                  ]}
                  onPress={() => handleCardPress(index)}>
                  <Text style={styles.toggleText}>
                    {expandedCardIndex === index ? '' : 'View Detail→'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.statusButton,
                  {
                    backgroundColor: task.student_assign_task_status.every(
                      student => student.assign_task_status === 2,
                    )
                      ? '#28A745'
                      : '#DC3545',
                  },
                ]}
                onPress={() => {
                  const taskId = task.id;
                  const studentTaskStatus = task.student_assign_task_status.map(
                    student => student.assign_task_id,
                  );
                  navigation.navigate('CheckTaskScreen', {
                    task_id: taskId,
                    student_task_status: studentTaskStatus,
                    subjectName,
                  });
                }}>
                <Text style={styles.statusButtonText}>
                  {task.student_assign_task_status.every(
                    student => student.assign_task_status === 2,
                  )
                    ? 'Done'
                    : 'Pending'}
                </Text>
              </TouchableOpacity>

              {expandedCardIndex === index && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() =>
                    navigation.navigate('PublishEditTaskScreen', {
                      task,
                      subjectId,
                      subjectName,
                    })
                  }>
                  <Icon name="edit" size={moderateScale(20)} color="#000" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))
        ) : (
          filteredTests.map((test, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.taskCard,
                {
                  borderColor:
                    test.assign_test_status === 1 ? '#28A745' : '#DC3545',
                },
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
                <Text style={styles.taskDateMonth}>
                  {new Date(test.start_date).toLocaleDateString('en-US', {
                    month: 'short',
                  })}
                </Text>
              </View>
              <View style={styles.taskDetails}>
                <Text style={styles.taskTitle}>{test.title}</Text>
                <Text style={styles.taskDueDate}>
                  Due Date: {test.end_date}
                </Text>
                {expandedCardIndex === index && (
                  <Text style={styles.taskDescription}>{test.description}</Text>
                )}

                {/* Dropdown Icon */}
                <TouchableOpacity
                  style={[
                    styles.dropdownIconContainer,
                    {
                      top: cardHeights[index] ? cardHeights[index] - 20 : 60, // Fallback for initial render
                    },
                  ]}
                  onPress={() => handleCardPress(index)}>
                  <Text style={styles.toggleText}>
                    {expandedCardIndex === index ? '' : 'View Detail→'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.statusButton,
                  {
                    backgroundColor: test.student_assign_test_status.every(
                      student => student.assign_test_status === 2,
                    )
                      ? '#28A745'
                      : '#DC3545',
                  },
                ]}
                onPress={() => {
                  const testId = test.id;
                  const studentTestStatus = test.student_assign_test_status.map(
                    student => student.assign_test_id,
                  );
                  navigation.navigate('TeacherCheckTest', {
                    tests,
                    testId,
                    student_test_status: studentTestStatus,
                    subjectName,
                  });
                }}>
                <Text style={styles.statusButtonText}>
                  {test.student_assign_test_status.every(
                    student => student.assign_test_status === 2,
                  )
                    ? 'Done'
                    : 'Pending'}
                </Text>
              </TouchableOpacity>

              {expandedCardIndex === index && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() =>
                    navigation.navigate('PublishEditTest', {
                      test: test,
                      subjectId,
                      subjectName,
                    })
                  }>
                  <Icon name="edit" size={moderateScale(20)} color="#000" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
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
  notificationBell: {
    width: '24@ms',
    height: '24@vs',
    borderRadius: '12@s',
    backgroundColor: '#000',
  },
  dropdown: {
    height: '50@vs',
    borderColor: '#ccc',
    borderRadius: '8@s',
    paddingHorizontal: '8@s',
  },
  placeholderStyle: {
    fontSize: '14@ms',
    color: '#aaa',
    fontFamily: 'Poppins-Regular',
  },
  selectedTextStyle: {
    fontSize: '14@ms',
    color: '#000',
    fontFamily: 'Poppins-Regular',
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
    paddingHorizontal: '10@s',
    marginHorizontal: '5@s',
    borderRadius: '8@s',
    width: '85@ms',
    height: '40@vs',
  },
  DrafttaskButton: {
    backgroundColor: '#000',
    paddingVertical: '10@vs',
    paddingHorizontal: '10@s',
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
    fontSize: '10@ms',
    color: '#FFF',
    fontFamily: 'Poppins-Regular',
    top: '2@vs'
  },
  DrafttaskText: {
    fontSize: '10@ms',
    color: '#FFF',
    fontFamily: 'Poppins-Regular',
    left: '5@s',
    top: '2@vs'
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
    padding: '12@s',
  },
  taskDateContainer: {
    alignItems: 'center',
    width: '70@s',
    justifyContent: 'center',
    backgroundColor: '#6F42C1',
    padding: '12@s',
    borderRadius: '12@s',
  },
  taskDateDay: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  taskDateMonth: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
  taskDetails: {
    flex: 1,
    padding: '12@s',
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
    alignSelf: 'flex-start',
    paddingHorizontal: '12@s',
    paddingVertical: '4@vs',
    borderRadius: '8@s',
  },
  statusButtonText: {
    fontSize: '11@ms',
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
    width: '120@s',
    bottom: '6@vs',
  },
  editButton: {
    position: 'absolute',
    right: '10@s',
    bottom: '10@s',
  },
  editButtonText: {
    fontSize: '12@ms',
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  dropdownIconContainer: {
    position: 'absolute',
    marginTop: '-5@vs',
    top: '75@vs',
    alignSelf: 'center',
    borderRadius: '12@s',
    left: '70@s',
    padding: '4@s',
    zIndex: 1,
  },
  toggleText: {
    fontSize: '12@ms',
    color: '#000',
    fontFamily: 'Poppins-Medium',
    right: '60@s',
    bottom: '15@vs',
  },
  imageRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: "10@vs",
    alignItems: "center",
    justifyContent: "space-between", 
    width: "104%", 
    gap: '5@s',
  },
  
  taskImage: {
    width: "70@ms",
    height: "70@vs",
    borderRadius: "8@ms",
  },
  documentList: {
    marginTop: "10@vs",
  },
  documentItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: "10@s",
    paddingVertical: "5@vs",
  },
  documentName: {
    fontSize: "14@ms",
    color: "#000",
    flexShrink: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '90%',
    height: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: '30@vs',
    right: '20@s',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: '10@ms',
    borderRadius: '20@ms',
  },
  moreImages: {
    width: '70@ms',
    height: '70@vs',
    borderRadius: '8@ms',
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },

  moreImagesText: {
    fontSize: '16@ms',
    fontFamily: 'Poppins-SemiBold',
    color: '#fff',
  },

  downloadIcon: {
    position: 'absolute',
    bottom: '10@vs',
    left: '225@s',
  },
});

export default TeachersSubjectDetails;
