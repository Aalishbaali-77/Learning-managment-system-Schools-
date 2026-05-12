import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  Alert,
  Platform,
  PermissionsAndroid,
} from "react-native";
import { scale, moderateScale, verticalScale } from "react-native-size-matters";
import Icon from "react-native-vector-icons/MaterialIcons";
import RNFS from 'react-native-fs';
import DocumentPicker from "react-native-document-picker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StackActions, useNavigation } from "@react-navigation/native";
import RNBlobUtil from "react-native-blob-util";
import { useUser } from "../Context/UserContext";
import api from "../api";


type TaskIdProps = NativeStackScreenProps<any,any>;

const UploadHomework: React.FC<TaskIdProps> = (props) => {
  const [images, setImages] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<{ uri: string; type: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const taskId = props.route.params?.taskId;
 
  
  
  const {user} = useUser();
  const student_id = user?.student_id;

  const handleAttachment = async () => {
    try {
      // Request permission (Android)
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: "Storage Permission",
            message: "This app needs access to your storage to select files.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert("Permission Denied", "Storage permission is required.");
          return;
        }
      }

      // Open document picker
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles], // Allows all file types
        allowMultiSelection: true, // Allows multiple files
      });

      if (!result.length) return;

      let selectedFiles = await Promise.all(result.map(async (file) => {
        let fileUri = file.uri;

        // Convert content:// URI to file:// path for Android
        if (Platform.OS === "android" && fileUri.startsWith("content://")) {
          const destPath = `${RNFS.TemporaryDirectoryPath}/${file.name}`;
          await RNFS.copyFile(fileUri, destPath);
          fileUri = `file://${destPath}`;
        }

        return {
          uri: fileUri,
          type: file.type || "application/octet-stream",
          name: file.name || `file_${Date.now()}`,
        };
      }));

      // ✅ Store selected files (max limit 6)
      if (attachments.length + selectedFiles.length > 6) {
        Alert.alert("Limit Reached", "You can only select up to 6 files.");
      } else {
        setAttachments([...attachments, ...selectedFiles]);
      }

    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        //console.log("❌ User cancelled picker");
      } else {
       // console.error("❌ Picker Error:", err);
      }
    }
  };

  // ✅ Handle file upload
  const uploadTaskAttachments = async () => {
    if (!attachments.length) {
      Alert.alert("No Files", "Please select at least one file.");
      return;
    }
  
    setLoading(true);
    const todayDate = new Date().toISOString().split("T")[0];
    const formData = new FormData();
  
    formData.append("task_id", taskId);
    formData.append("student_id", student_id);
    formData.append("submission_date", todayDate); 
  
    try {
      await Promise.all(attachments.map(async (file) => {
        const resolvedUri = file.uri.startsWith("file://") ? file.uri : `file://${file.uri}`;
  
        formData.append("attachment[]", {
          uri: resolvedUri,
          name: file.name,
          type: file.type,  
        });
      }));
  
     // console.log("📤 Uploading FormData:", formData);
  
      const response = await api.protected.post("student/studentUploadTaskFiles", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
  
      //console.log("✅ Upload Response:", response.data);
  
      // ✅ Check correct API response field
      if (response.data.success) {
        Alert.alert("Success", "Files uploaded successfully!", [
          { text: "OK", onPress: () => navigation.goBack() }
        ]);
  
        setAttachments([]); // Reset after successful upload
      } else {
       // console.log("❌ API Upload Error Details:", response.data);
        throw new Error("Upload failed");
      }
  
    } catch (error) {
     // console.error("❌ API Error:", error);
      Alert.alert("Upload Failed", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };
  
  

  // ✅ Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={moderateScale(22)} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Homework</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Announcements')}>
          <Icon name="notifications" size={moderateScale(22)} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Attachment Grid */}
      <FlatList
        data={[...attachments, "add"]}
        numColumns={3}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.imageWrapper}>
  {item === "add" ? (
    <TouchableOpacity style={styles.addButton} onPress={handleAttachment}>
      <Icon name="add" size={scale(40)} color="gray" />
    </TouchableOpacity>
  ) : (
    <>
      {item.type.startsWith("image/") ? (
        <Image source={{ uri: item.uri }} style={styles.image} />
      ) : (
        <View style={styles.documentContainer}>
          <Icon name="insert-drive-file" size={scale(30)} color="red" />
          <Text numberOfLines={1} style={styles.fileText}>{item.name}</Text>
        </View>
      )}
      <TouchableOpacity style={styles.closeIcon} onPress={() => removeAttachment(index)}>
        <Icon name="close" size={moderateScale(16)} color="white" />
      </TouchableOpacity>
    </>
  )}
</View>

        )}
      />

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitButton} onPress={uploadTaskAttachments} disabled={loading}>
        <Text style={styles.submitText}>{loading ? "Uploading..." : "Submit"}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default UploadHomework;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: moderateScale(15),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(20),
  },
  headerTitle: {
    fontSize: moderateScale(17),
    color: '#000',
    fontFamily: 'Poppins-Bold',
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
  closeIcon: {
    position: "absolute",
    top: verticalScale(5),
    right: scale(5),
    backgroundColor: "red",
    borderRadius: scale(10),
    padding: moderateScale(3),
  },
  documentContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: moderateScale(10),
    padding: moderateScale(10),
  },
  fileText: {
    fontSize: moderateScale(10),
    fontFamily: 'Poppins-Regular',
    color: "black",
    marginTop: verticalScale(5),
    textAlign: "center",
    width: "100%",
  },
  addButton: {
    width: "100%",
    height: "100%",
    borderRadius: moderateScale(10),
    borderWidth: scale(1),
    borderColor: "gray",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  submitButton: {
    backgroundColor: "red",
    padding: moderateScale(12),
    borderRadius: moderateScale(10),
    alignItems: "center",
    marginTop: verticalScale(20),
  },
  submitText: {
    color: "white",
    fontSize: moderateScale(14),
    fontFamily: 'Poppins-SemiBold',
  },
});
