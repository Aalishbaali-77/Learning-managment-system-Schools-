import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  PermissionsAndroid,
  Platform,
  Modal,
  Linking,
  UIManager,
  LayoutAnimation,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  ScaledSheet,
  moderateScale,
  scale,
  verticalScale,
} from 'react-native-size-matters';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { useSubjects } from '../Context/TeacherSubjectContext';
import { useUser } from '../Context/UserContext';
import api from '../api';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { studentSubjects } from '../types';
import { Dropdown } from 'react-native-element-dropdown';
import RNFS from 'react-native-fs';
import { ASSET_URL } from '../constants';
import RNFetchBlob from "react-native-blob-util";
import { useTranslation } from 'react-i18next';


type SubjectIdProps = NativeStackScreenProps<any, any>;

const SubjectTasksScreen: React.FC<SubjectIdProps> = props => {
  const [selectedTab, setSelectedTab] = useState('diary'); // State for the dropdown selection
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true); // Loading state
  const [tasks, setTasks] = useState([]); // State for fetched tasks
  const [tests, setTests] = useState([]); // State for fetched tests
  const { sectionId } = useSubjects();
  const { user } = useUser();
  const subjectId = props.route.params?.subjectId;

  const subject = props.route.params?.subject;
  // console.log('SUBJECT ID:', subject.subject_id);
  const [expandedCardIndex, setExpandedCardIndex] = useState(null);
  const [studentSubjectList, setStudentSubjectList] = useState([]);
  const [cardHeights, setCardHeights] = useState<number[]>([]);
  const [dropdownVisible, setDropdownVisible] = useState(false); // Control dropdown visibility
  const [selectedSubject, setSelectedSubject] = useState(subject); // Store selected subject
  const [summary, setSummary] = useState({});
  const [searchQuery, setSearchQuery] = useState(''); // State for search query
  const [filteredTasks, setFilteredTasks] = useState([]); // Filtered tasks
  const [filteredTests, setFilteredTests] = useState([]); // Filtered tests
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [images, setImages] = useState<string[]>([]);
  const [documents, setDocuments] = useState<{ name: string; uri: string }[]>([]);
  const { t } = useTranslation()

    useEffect(() => {
      if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
      }
    }, []);

    const handleCardPress = index => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpandedCardIndex(expandedCardIndex === index ? null : index);
    };
  // const handleSubjectPress = () => {
  //   // Toggle dropdown visibility and fetch the subject list
  //   setDropdownVisible(!dropdownVisible);
  //   fetchSubjectList();
  // };

  const handleLayout = (index: number, event: any) => {
    const { height } = event.nativeEvent.layout;
    setCardHeights(prevHeights => {
      const updatedHeights = [...prevHeights];
      updatedHeights[index] = height; // Update the height of the specific card
      return updatedHeights;
    });
  };

  useEffect(() => {
    if (studentSubjectList.length > 0 && subject?.subject_id) {
      const selectedSubject = studentSubjectList.find(
        item => item?.subject_id === subject.subject_id,
      );
      setSelectedSubject(selectedSubject);
      if (selectedSubject) {
        // console.log("Selected Subject Name for announcement nav:", selectedSubject.subject_name);
      }
    }
  }, [subject, studentSubjectList]);

  const fetchSubjectList = async () => {
    try {
      const payload = {
        section_id: sectionId,
        school_id: user?.company_id,
        school_campus_id: user?.school_campus_id,
        student_id: user?.student_id,
      };

      const response = await api.protected.post(`student/subjectList`, payload);

      if (response?.data?.status === 'success') {
        const data = response.data.data;
        if (Array.isArray(data) && data.length > 0) {
          setStudentSubjectList(
            data.map(subject => ({
              subject_id: subject.subject_id,
              subject_name: subject.subject_name,
              teacher_name: subject.teacher_name,
              start_time: subject.time_slots[0]?.start_time || 'N/A',
              end_time: subject.time_slots[0]?.end_time || 'N/A',
            })),
          );
        } else {
          Alert.alert('Error', 'No subject list found.');
        }
      } else {
        Alert.alert(
          'Error',
          response?.data?.message || 'Failed to fetch subject list',
        );
      }
    } catch (error) {
      // console.error('Error fetching subject list:', error);
    }
  };

  useEffect(() => {
    // Filter tasks or tests whenever the search query or selected tab changes
    if (selectedTab === 'diary') {
      const filtered = tasks.filter(task =>
        task.task_title.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredTasks(filtered);
    } else {
      const filtered = tests.filter(test =>
        test.test_name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredTests(filtered);
    }
  }, [searchQuery, selectedTab, tasks, tests]);

  // useEffect(() => {
  //   console.log(
  //     'Rendering with selectedTab:',
  //     selectedTab,
  //     'Summary:',
  //     summary,
  //   );
  // }, [summary]);

  // Function to Download a File
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

      // console.log(`📥 Downloading: ${url} -> ${downloadPath}`);

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

      //  console.log(`✅ Successfully downloaded: ${res.path()}`);

      // ✅ Force MediaStore to recognize the file (VERY IMPORTANT!)
      await RNFetchBlob.fs.scanFile([{ path: res.path(), mime: mimeType }]);

      return res.path();
    } catch (error) {
      // console.error(`❌ Error downloading ${fileName}:`, error);
      Alert.alert("Download Failed", `Could not download ${fileName}.`);
    }
  };

  // ✅ Download All Images & Documents
  const handleDownloadMedia = async (images: string[], documents: { name: string; uri: string }[]) => {
    try {
      //console.log("🔍 Checking storage permissions...");
      const permissionGranted = await requestStoragePermission();
      if (!permissionGranted) return;

      //console.log("📂 Downloading images and documents...");
      let downloadPromises: Promise<string | undefined>[] = [];

      // Download Images
      images.forEach((imageUrl, index) => {
        const fileName = `image_${index + 1}.jpg`; // Assuming JPG format
        downloadPromises.push(downloadFile(imageUrl, fileName));
      });

      // Download Documents
      documents.forEach((doc, index) => {
        const fileExtension = doc.uri.split(".").pop() || "pdf"; // Default to PDF if unknown
        const fileName = `${doc.name || "document"}_${index + 1}.${fileExtension}`;
        downloadPromises.push(downloadFile(doc.uri, fileName));
      });

      await Promise.all(downloadPromises);

      Alert.alert("Download Complete", "All images and documents have been saved to your Downloads folder.");
    } catch (error) {
      //console.error("❌ Download Error:", error);
      Alert.alert("Error", "Something went wrong while downloading files.");
    }
  };






  const fetchTasks = async () => {
    setLoading(true);
    try {
      const payload = {
        student_id: user?.student_id,
        section_id: sectionId,
        subject_id: subject.subject_id,
        school_id: user?.company_id,
        school_campus_id: user?.school_campus_id,
        ...(selectedTab === "diary" ? { task_filter: 1 } : { test_filter: 1 }),
      };
      // console.log('log of tasks list payload', payload);
      

      const endpoint = selectedTab === "diary" ? "student/taskList" : "student/testList";

      const response = await api.protected.post(endpoint, payload);

      if (response.data.success) {
        const { data, total_task_count, completed_count, uncompleted_count, counts } = response.data;

        if (selectedTab === "diary" && Array.isArray(data)) {
          // ✅ Process each task to include images & documents separately
          const updatedTasks = data.map((task) => {
            const images = [];
            const documents = [];

            task.assign_tasks_media_by_teacher.forEach((media) => {
              const fileUri = `${ASSET_URL}${media.media_path}`;

              if (media.media_type === "image") {
                images.push(fileUri);
              } else if (media.media_type === "document") {
                documents.push({ name: media.title || "Document", uri: fileUri });
              }
            });

            return { ...task, images, documents };
          });

          setTasks(updatedTasks);

          setSummary({
            completed: completed_count,
            pending: uncompleted_count,
            total: total_task_count,
          });
        } else if (selectedTab === "test" && Array.isArray(data)) {
          setTests(data);
          setSummary({
            completed_tests: counts?.completed_tests || 0,
            pending_tests: counts?.pending_tests || 0,
            total_tests: counts?.total_tests || 0,
          });
        }
      } else {
        //  console.error("Error fetching data:", response.data.message);
      }
    } catch (error) {
      if (error.response) {
        // console.error("API Error Details:", error.response.data);
      } else {
        // console.error("Request Error:", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // Set loading to true before starting fetch

      try {
        await fetchTasks(); // Fetch attendance data
        if (sectionId) {
          await fetchSubjectList();
        }
        // Fetch subject list
      } catch (error) {
        //console.error('Error fetching student details:', error);
      } finally {
        setLoading(false); // Set loading to false after all fetch operations complete
      }
    };

    fetchData(); // Call the async function
  }, [selectedTab]); // Re-fetch tasks when the tab changes

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.taskContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={moderateScale(24)} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {selectedTab === 'diary' ? t('my_tasks') : t('my_tests')}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Announcements')}>
            <Icon name="notifications" size={moderateScale(24)} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <TextInput
            placeholder="Search Task"
            placeholderTextColor="#aaa"
            style={styles.searchInput}
            value={searchQuery} // Bind the search query
            onChangeText={text => setSearchQuery(text)} // Update search query
          />
          <Icon
            name="search"
            size={moderateScale(18)}
            color="#aaa"
            style={styles.searchIcon}
          />
        </View>

        {/* Tabs */}
        <View style={styles.pickerContainer}>
          <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.placeholderStyle}
            itemTextStyle={{
              fontSize: moderateScale(12),
              fontFamily: 'Poppins-Regular',
              color: '#000',
            }}
            iconStyle={{ tintColor: '#000' }}
            selectedTextStyle={styles.selectedTextStyle}
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
        <View style={styles.tabsContainer}>
          {/* <TouchableOpacity style={styles.subjectDropdown}
    onPress={() => handleSubjectPress()}> */}
          <Text
            style={styles.subjectText}
            numberOfLines={1}
            ellipsizeMode="tail">
            {selectedSubject?.subject_name || 'No Subject Name'}
          </Text>
          {/* </TouchableOpacity> */}
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => {
              if (selectedTab === 'diary') {
                navigation.navigate('StudentTaskHistory', {
                  subjectId,
                  subject,
                  selectedTab: 'diary',
                });
              } else {
                navigation.navigate('StudentTaskHistory', {
                  subjectId,
                  subject,
                  selectedTab: 'test',
                });
              }
            }}>
            <Text style={styles.historyButtonText}>{t('view_history')}</Text>
          </TouchableOpacity>
        </View>

        {/* Teacher Info */}
        <View style={styles.teacherInfo}>
          <Text style={styles.teacherName}>{selectedSubject?.teacher_name || 'No Subject Name'}</Text>
          <Text style={styles.timeText}>
            {selectedSubject.start_time}-{selectedSubject.end_time}
          </Text>
        </View>

        {/* Task Completion */}
        <Text style={styles.completionText}>
          {selectedTab === 'diary'
            ? `Completed Tasks: ${summary?.completed || 0}/${summary?.total || 0
            }`
            : `Completed Tests: ${summary?.completed_tests || 0}/${summary?.total_tests || 0
            }`}
        </Text>
        {/* </View> */}

        {/* Task List */}
        <View style={styles.testandtaskContainer}>
          {loading ? (
            <Text>Loading...</Text>
          ) : selectedTab === 'diary' ? (
            (searchQuery ? filteredTasks : tasks).map((task, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.taskCard,
                  {
                    borderColor:
                      task?.assign_task_status === 1 || task?.assign_task_status == null
                        ? "#28A745"
                        : "#DC3545",
                  },
                ]}
                onPress={() => handleCardPress(index)}
                onLayout={(event) => handleLayout(index, event)}
              >
                <View style={styles.taskDateContainer}>
                  <Text style={styles.taskDateDay}>
                    {new Date(task.start_date).toLocaleDateString("en-US", {
                      weekday: "short",
                      day: "2-digit",
                    })}
                  </Text>
                  <Text style={styles.taskDateMonth}>
                    {new Date(task.start_date).toLocaleDateString("en-US", {
                      month: "short",
                    })}
                  </Text>

                  {/* Show "+" Upload Icon only if expanded */}
                  {expandedCardIndex === index && (
                    <TouchableOpacity
                      style={[
                        styles.uploadIcon,
                        {
                          top: "auto",
                          bottom: verticalScale(10), // ✅ Moves the icon below the date container
                          alignSelf: "center", // ✅ Ensures it is centered
                        },
                      ]}
                      onPress={() => navigation.navigate("UploadHomework", { taskId: task.assign_tasks_media_by_teacher[0]?.assign_task_id })}
                    >
                      <Icon name="add" size={24} color="#000" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.taskDetails}>
                  <Text style={styles.taskTitle}>{task.task_title}</Text>
                  <Text style={styles.taskDueDate}>{t('due_date')}: {task.end_date}</Text>

                  {expandedCardIndex === index && (
                    <>
                      <Text style={styles.taskDescription}>{task.task_description}</Text>

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
                            <TouchableOpacity key={docIndex} style={styles.documentItem}>
                              <Icon name="insert-drive-file" size={40} color="#000" />
                              <Text numberOfLines={1} style={styles.documentName}>
                                {doc.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      <View style={styles.horizontalLine} />

                      {/* Download Icon */}
                      <TouchableOpacity style={styles.downloadIcon} onPress={() => handleDownloadMedia(task.images, task.documents)}>
                        <Icon name="file-download" size={28} color="#000" />
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.viewSubmission}
                        onPress={() => navigation.navigate("ViewSubmission", { taskId: task.assign_tasks_media_by_teacher[0]?.assign_task_id, })}>
                        <Text style={styles.viewSubmissionText}>{t('view_submission')}</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {/* Dropdown Icon */}
                  <TouchableOpacity
                    style={[
                      styles.dropdownIconContainer,
                      {
                        top: cardHeights[index] ? cardHeights[index] - 20 : 60, // Adjust position based on card height
                      },
                    ]}
                    onPress={() => handleCardPress(index)}
                  >
                    <Text style={styles.toggleText}>
                      {expandedCardIndex === index ? "" : "View Detail→"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View
                  style={[
                    styles.statusButton,
                    {
                      backgroundColor:
                        task?.assign_task_status === 1 || task?.assign_task_status == null
                          ? "#DC3545"
                          : "#28A745",
                    },
                  ]}
                >
                  <Text style={styles.statusButtonText}>
                    {task?.assign_task_status === 1 || task?.assign_task_status == null
                      ? "Pending"
                      : "Done"}
                  </Text>
                </View>
              </TouchableOpacity>
            ))

          ) : (
            (searchQuery ? filteredTests : tests).map((test, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.taskCard,
                  {
                    borderColor: test.test_status === 1 ? '#28A745' : '#DC3545',
                  },
                ]}
                onPress={() => handleCardPress(index)}
                onLayout={event => handleLayout(index, event)}>
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
                  <Text style={styles.taskTitle}>{test.test_name}</Text>
                  <Text style={styles.taskDueDate}>
                    {t('due_date')}: {test.end_date}
                  </Text>

                  {expandedCardIndex === index && (
                    <Text style={styles.taskDescription}>
                      {test.test_description}
                    </Text>
                  )}

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
                      {expandedCardIndex === index ? '' : 'View Detail→'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View
                  style={[
                    styles.statusButton,
                    {
                      backgroundColor:
                        test.student_test_status === 1 ? '#DC3545' : '#28A745',
                    },
                  ]}
                // onPress={() => {
                //   const testId = test.id;
                //   console.log('Navigating with testId:', testId);
                //   const studentTestStatus = test.student_assign_test_status.map(
                //     student => student.assign_test_id,
                //   ); // Get the task ID from the current task object

                //   console.log('Student Test Status:', studentTestStatus); // Log the taskId being sent

                //   navigation.navigate('TeacherCheckTest', {
                //     testId,
                //     student_test_status: studentTestStatus,
                //   });
                // }}
                >
                  <Text style={styles.statusButtonText}>
                    {test.student_test_status === 1 ? 'Pending' : 'Done'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: '10@s',
    paddingTop: '15@vs',
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
    marginBottom: verticalScale(20),
  },
  headerTitle: {
    fontSize: moderateScale(15),
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },
  notificationBadge: {
    width: moderateScale(8),
    height: verticalScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: 'red',
    position: 'absolute',
    top: '0@vs',
    right: '0@s',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: moderateScale(10),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(5),
    marginBottom: verticalScale(20),
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(16),
    fontFamily: 'Poppins-Regular',
    color: '#000',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(10),
    left: '70@s',
    margin: '65@ms',
    bottom: '90@vs',
  },
  tab: {
    backgroundColor: '#f5f5f5',
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(5),
    paddingHorizontal: scale(10),
  },
  tabText: {
    fontSize: moderateScale(11),
    fontFamily: 'Poppins-Regular',
    color: '#000',
  },
  pickerContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: '8@ms',
    marginLeft: '220@s',
    right: '220@s',
    top: '2@vs',
  },
  dropdown: {
    height: '40@vs',
    borderColor: '#ccc',
    borderRadius: '8@ms',
    paddingHorizontal: '8@s',
   
  },
  placeholderStyle: {
    fontSize: '14@ms',
    color: '#aaa', // Placeholder text color
    fontFamily: 'Poppins-Regular', // Placeholder font family
  },
  selectedTextStyle: {
    fontSize: '12@ms',
    color: '#000', // Selected text color
    fontFamily: 'Poppins-Regular', // Selected text font family
  },
  picker: {
    height: '30@vs',
    width: '110%',
    bottom: '6@vs',
  },
  pickerLabel: {
    fontSize: '10@ms',
    fontFamily: 'Poppins-Regular',
  },
  subjectDropdown: {
    backgroundColor: '#6f42c1',
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(5),
    paddingHorizontal: scale(10),
    left: '30@s',
    position: 'relative',
  },
  subjectText: {
    fontSize: moderateScale(11),
    fontFamily: 'Poppins-Regular',
    color: '#fff',
    backgroundColor: '#6f42c1',
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(5),
    paddingHorizontal: scale(10),
    flexShrink: 1, // Prevent it from overflowing
    marginRight: scale(10), // Add space between subjectText and button
  },
  historyButton: {
    backgroundColor: '#dc3545',
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(5),
    paddingHorizontal: scale(10),
    right: '10@s',
  },
  historyButtonText: {
    fontSize: moderateScale(11),
    fontFamily: 'Poppins-Regular',
    color: '#fff',
  },
  teacherInfo: {
    marginBottom: verticalScale(10),
    alignItems: 'center',
    bottom: '60@vs',
  },
  teacherName: {
    fontSize: moderateScale(17),
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },
  timeText: {
    fontSize: moderateScale(12),
    fontFamily: 'Poppins-Regular',
    color: '#000',
  },
  completionText: {
    fontSize: moderateScale(14),
    fontFamily: 'Poppins-Regular',
    color: '#000',
    marginTop: verticalScale(10),
    left: '90@s',
    bottom: '60@vs',
  },
  testandtaskContainer: {
    bottom: '30@vs',
  },
  taskContainer: {
    flex: 1,
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
    position: 'relative',
    right: '10@s',
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
    padding: '12@ms',
  },
  taskTitle: {
    fontSize: '16@ms',
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
    bottom: '8@vs',
  },
  taskDueDate: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Regular',
    color: '#3b3b3b',
    bottom: '8@vs',
  },
  taskDescription: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Regular',
    color: '#000',
    marginTop: '4@vs',
  },
  statusButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: '12@ms',
    paddingVertical: '4@vs',
    borderRadius: '8@ms',

    position: 'relative',
  },
  statusButtonText: {
    fontSize: '12@ms',
    color: '#FFF',
    textAlign: 'center',
  },
  statusPending: {
    backgroundColor: '#DC3545',
  },
  statusDone: {
    backgroundColor: '#28A745',
  },
  // searchBar: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   backgroundColor: '#f5f5f5',
  //   borderRadius: '10@ms',
  //   padding: '10@ms',
  //   marginBottom: '20@vs',
  // },
  searchIcon: {
    marginRight: '10@s',
  },
  // searchInput: {
  //   flex: 1,
  //   fontSize: '16@ms',
  //   fontFamily: 'Poppins-Regular',
  //   color: '#000',
  // },
  subjectInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10@vs',
  },
  subjectTitle: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },
  // teacherName: {
  //   fontSize: '14@ms',
  //   fontFamily: 'Poppins-Regular',
  //   color: '#666',
  // },
  // timeText: {
  //   fontSize: '12@ms',
  //   fontFamily: 'Poppins-Regular',
  //   color: '#aaa',
  // },
  dropdownButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: '10@ms',
    paddingHorizontal: '15@s',
    paddingVertical: '5@vs',
  },
  dropdownText: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-Regular',
    color: '#000',
    backgroundColor: '#f5f5f5',
    borderRadius: '10@ms',
    paddingHorizontal: '15@s',
    paddingVertical: '5@vs',
  },
  // completionText: {
  //   fontSize: '14@ms',
  //   fontFamily: 'Poppins-Regular',
  //   color: '#000',
  //   marginBottom: '20@vs',
  // },
  taskList: {
    flex: 1,
  },
  taskCard: {
    flexDirection: 'row',
    borderRadius: '10@ms',
    marginBottom: '15@vs',
    padding: '10@ms',
    backgroundColor: '#fff',
  },
  dateContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4b0082',
    borderRadius: '10@ms',
    padding: '10@ms',
    width: '60@ms',
    position: 'absolute',
  },
  dateText: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-Regular',
    color: '#fff',
  },
  dateNumber: {
    fontSize: '16@ms',
    fontFamily: 'Poppins-Bold',
    color: '#fff',
  },
  // taskDetails: {
  //   flex: 1,
  //   marginLeft: '10@s',
  // },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '5@vs',
  },
  // taskTitle: {
  //   fontSize: '16@ms',
  //   fontFamily: 'Poppins-Bold',
  //   color: '#000',
  // },
  status: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Regular',
    color: '#fff',
    borderRadius: '5@ms',
    paddingHorizontal: '10@s',
    paddingVertical: '3@vs',
  },
  dueDate: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Regular',
    color: '#aaa',
    marginBottom: '5@vs',
  },
  dropdownIconContainer: {
    position: 'absolute',
    marginTop: '-5@vs',
    top: '75@vs', // Adjust based on your card height
    alignSelf: 'center',
    borderRadius: '12@ms',
    left: '70@ms',
    padding: '4@ms',
    zIndex: 1, // Ensure it's above other elements
  },
  toggleText: {
    fontSize: '12@ms',
    color: '#000', // Make it appear clickable
    fontFamily: 'Poppins-Medium',
    right: '60@s',
    bottom: '15@vs', // Optional: underline to indicate interactivity
  },
  uploadIcon: {
    position: 'absolute', // Keeps it inside the container
    backgroundColor: '#fff',
    borderRadius: '50@ms',
    padding: '5@ms',
    alignSelf: 'center',
  },

  imageRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: "10@vs",
    alignItems: "center",
    gap: "5@s",
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
  viewSubmission: {
    backgroundColor: '#dc3545',
    borderRadius: moderateScale(20),
    padding: moderateScale(5),
    width: '120@ms',
    height: '35@vs',
    marginTop: '20@vs'

  },
  viewSubmissionText: {
    fontSize: moderateScale(9),
    fontFamily: 'Poppins-Regular',
    color: '#fff',
    marginLeft: '7@s',
    marginTop: '6@vs',
  },
  horizontalLine: {
    color: '#666',
    borderBottomWidth: 0.5,
    width: '250@ms',
    marginTop: '10@vs',
  },
});

export default SubjectTasksScreen;
