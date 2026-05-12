import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    FlatList,
    TextInput,
    StyleSheet,
    Modal,
    Alert,
    PermissionsAndroid,
    Platform,
    ActivityIndicator
} from "react-native";
import { scale, moderateScale, verticalScale } from "react-native-size-matters";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Dropdown } from "react-native-element-dropdown";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CommonActions, useNavigation } from "@react-navigation/native";
import RNFS, { DownloadDirectoryPath } from 'react-native-fs';
import RNFetchBlob from 'react-native-blob-util';
import FileViewer from 'react-native-file-viewer';
import api from "../api";
import { ASSET_URL } from "../constants";
import { useUser } from "../Context/UserContext";
import { getAccessToken } from "../utils/storage";


type StudentDataProps = NativeStackScreenProps<any, any>
const ViewSubmission: React.FC<StudentDataProps> = (props) => {
    const [images] = useState<string[]>([
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSWwfp8w7BiHOpOxZZWY4t9iI3TDrUZXYj9hQ&s",
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSWwfp8w7BiHOpOxZZWY4t9iI3TDrUZXYj9hQ&s",
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSWwfp8w7BiHOpOxZZWY4t9iI3TDrUZXYj9hQ&s",
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSWwfp8w7BiHOpOxZZWY4t9iI3TDrUZXYj9hQ&s",
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSWwfp8w7BiHOpOxZZWY4t9iI3TDrUZXYj9hQ&s",
    ]);

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedImage, setSelectedImage] = useState("");
    const navigation = useNavigation();
    const { user } = useUser();
    const taskId = props.route.params?.taskId
    const [submissions, setSubmissions] = useState<any>(null);
    const [loading, setLoading] = useState(false)


    useEffect(() => {
        const fetchData = async () => {
            try {
              setLoading(true);
              const accessToken = await getAccessToken(); 
              if (user && accessToken) {
                await fetchSubmissions();
              }
            } catch (error) {

            } finally {
              setLoading(false);
            }
          };
          fetchData();
    }, [])


    const fetchSubmissions = async () => {

        const payload = {
            task_id: taskId,
            student_id: user?.student_id,
        };

        try {
            const response = await api.protected.post(
                "teacher/assign-tasks/studentTaskData",
                payload
            );

           // console.log("API Response:", response);

            if (response?.data?.status === 'success') {
                setSubmissions(response.data.data)
                
            } else {
                Alert.alert("Error", response?.data?.message || "Failed to update status.");
            }
        } catch (error) {
            //console.error("Error updating status:", error?.response || error?.message);
            // Alert.alert("Error", "Something went wrong. Please try again.");
        }
    };


    const openImageModal = (imageUri: string) => {
        setSelectedImage(imageUri);
        setModalVisible(true);
    };

    const requestStoragePermission = async () => {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true; // No permission required on iOS
    };

    // Function to get the correct MIME type based on file extension
    const getMimeType = (fileName: string) => {
        const extension = fileName.split('.').pop()?.toLowerCase();

        const mimeTypes: { [key: string]: string } = {
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
        };

        return mimeTypes[extension || ''] || 'application/octet-stream'; // Default MIME type
    };

    const downloadDocument = async (fileUrl: string) => {
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) {
            Alert.alert('Permission Denied', 'Storage permission is required to download the file.');
            return;
        }

        const fileName = fileUrl.split('/').pop() || 'document.pdf';
        const downloadDest = `${RNFetchBlob.fs.dirs.DownloadDir}/${fileName}`;
        const mimeType = getMimeType(fileName);
        const completeFileUrl = `${ASSET_URL}${fileUrl}`; // ✅ Prepending ASSET_URL

        try {
            Alert.alert('Downloading...', 'Your file is being downloaded in the background.');

            RNFetchBlob.config({
                fileCache: true,
                addAndroidDownloads: {
                    useDownloadManager: true, // ✅ Shows progress in the notification bar
                    notification: true, // ✅ Shows download completion in the notification bar
                    path: downloadDest,
                    description: 'Downloading file...',
                    mime: mimeType, // ✅ Automatically detects and sets the correct MIME type
                },
            })
                .fetch('GET', completeFileUrl) // ✅ Using ASSET_URL + fileUrl
                .progress((received, total) => {
                   // console.log(`Download Progress: ${Math.floor((received / total) * 100)}%`);
                })
                .then((res) => {
                    Alert.alert('Download Complete', `File saved to Downloads folder.`);
                })
                .catch((error) => {
                   // console.error('Download Error:', error);
                    Alert.alert('Download Failed', 'Something went wrong while downloading.');
                });
        } catch (error) {
           // console.error('Download Error:', error);
            Alert.alert('Error', 'Something went wrong while downloading.');
        }
    };


    const renderMediaItem = ({ item }: { item: any }) => {
        const isImage = item.media_type === 'image';
        const isDocument = item.media_type === 'document';
        const truncateFileName = (fileName: string, maxLength: number = 15) => {
            return fileName.length > maxLength ? fileName.slice(0, maxLength) + '...' : fileName;
        };

        return (
            <TouchableOpacity
                style={styles.imageWrapper}
                onPress={() => (isImage ? openImageModal(item.media_path) : downloadDocument(item.media_path))}
            >
                {isImage ? (
                    <Image source={{ uri: `${ASSET_URL}${item.media_path}` }} style={styles.image} />
                ) : isDocument ? (
                    <View style={styles.documentContainer}>
                        <Icon name="insert-drive-file" size={34} color="red" />
                        <Text style={styles.documentText}>
                            {truncateFileName(item.media_path.split('/').pop() || 'Document')}
                        </Text>
                    </View>
                ) : null}
            </TouchableOpacity>
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
                    <Icon name="arrow-back" size={moderateScale(22)} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Submissions</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Announcements')}>
                    <Icon name="notifications" size={moderateScale(22)} color="#000" />
                </TouchableOpacity>
            </View>

            {/* Task Details */}
            <View style={styles.taskHeader}>
                <View>
                    <Text style={styles.userName}>{submissions?.title}</Text>
                    <Text style={styles.taskText}>Due Date: {submissions?.end_date }</Text>
                    <Text style={styles.taskText}>Submission Date: {submissions?.student_assign_task_status?.[0]?.submission_date || "Not submitted yet"} </Text>
                </View>


            </View>

            {/* Image Grid */}
            <FlatList
                data={submissions?.assign_tasks_media || []}
                numColumns={3}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderMediaItem}
            />


            <Modal visible={modalVisible} transparent={true} animationType="fade">
                <View style={styles.modalContainer}>
                    <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                        <Icon name="close" size={moderateScale(30)} color="white" />
                    </TouchableOpacity>
                    <Image source={{ uri: `${ASSET_URL}${selectedImage}` }} style={styles.fullImage} />
                </View>
            </Modal>
            {/* Remarks and Comments */}
            <View style={styles.remarksContainer}>
                <Text style={styles.remarksTitle}>Teacher Remarks</Text>
                <Text style={styles.remarksText}>{submissions?.student_assign_task_status?.[0]?.remarks || "No remarks given yet"}</Text>
            </View>
        </View>
    );
};

export default ViewSubmission;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
        padding: moderateScale(15),
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
      },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: verticalScale(20),
    },
    headerTitle: {
        fontSize: moderateScale(17),
        fontFamily: 'Poppins-Bold',
        color: '#000',
    },
    taskDetails: {
        marginBottom: verticalScale(10),
    },
    userName: {
        fontSize: moderateScale(14),
        fontFamily: 'Poppins-SemiBold',
        color: "#000",

    },
    taskText: {
        fontSize: moderateScale(12),
        fontFamily: 'Poppins-Regular',
        color: "#000",
        marginTop: verticalScale(2),
    },
    taskHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    statusBadge: {
        backgroundColor: "red",
        borderRadius: moderateScale(12),
        paddingHorizontal: scale(8),
        paddingVertical: verticalScale(5),
        minWidth: moderateScale(40),
        alignItems: "center",
        justifyContent: "center",
        marginBottom: verticalScale(20),
    },

    dropdown: {
        backgroundColor: "transparent",
        borderWidth: 0,
        width: moderateScale(100),
        height: verticalScale(30),
    },

    dropdownText: {
        color: "white",
        fontSize: moderateScale(12),
        fontFamily: "Poppins-Regular",
        textAlign: "center",
    },

    dropdownArrow: {
        color: "white",
        fontSize: moderateScale(10),
        marginLeft: scale(5),
        marginBottom: verticalScale(2),
    },

    dropdownContainer: {
        borderRadius: moderateScale(10),
        width: moderateScale(100),
    },


    dropdownItemText: {
        fontSize: moderateScale(10),
        fontFamily: "Poppins-Regular",
        color: "#000",
    },
    imageWrapper: {
        width: "30%",
        aspectRatio: 1,
        margin: moderateScale(5),
        borderRadius: moderateScale(10),
        overflow: "hidden",
    },
    image: {
        width: "100%",
        height: "100%",
        borderRadius: moderateScale(10),
    },
    documentContainer: {
        alignItems: "center",
        justifyContent: "center",
        padding: moderateScale(22),

    },
    documentText: {
        fontSize: moderateScale(11),
        color: "#333",
        textAlign: "center",
        marginTop: verticalScale(5),
    },
    modalContainer: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.9)", // Dark overlay
        justifyContent: "center",
        alignItems: "center",
    },
    fullImage: {
        width: "90%",
        height: "70%",
        resizeMode: "contain",
    },
    closeButton: {
        position: "absolute",
        top: verticalScale(40),
        right: scale(20),
    },
    remarksTitle: {
        fontSize: moderateScale(14),
        fontFamily: 'Poppins-SemiBold',
        marginTop: verticalScale(15),
        marginBottom: verticalScale(5),
        color: '#000',
    },
    remarksText: {
        fontSize: moderateScale(12),
        fontFamily: 'Poppins-Regular',
        marginTop: verticalScale(15),
        marginBottom: verticalScale(5),
        color: '#000',
    },
    remarksContainer: {
        flex: 1,
    },
    input: {
        borderWidth: 1,
        borderColor: "gray",
        borderRadius: moderateScale(10),
        padding: moderateScale(10),
        minHeight: verticalScale(80),
        textAlignVertical: "top",
    },
    saveButton: {
        backgroundColor: "red",
        padding: moderateScale(12),
        borderRadius: moderateScale(10),
        alignItems: "center",
        marginTop: verticalScale(20),
    },
    saveText: {
        color: "white",
        fontSize: moderateScale(14),
        fontFamily: 'Poppins-SemiBold'
    },
});
