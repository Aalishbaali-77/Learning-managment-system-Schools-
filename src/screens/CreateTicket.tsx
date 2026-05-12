import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Platform, PermissionsAndroid, Alert } from 'react-native';
import { ScaledSheet, verticalScale, scale, moderateScale } from 'react-native-size-matters';
import { Dropdown } from 'react-native-element-dropdown';
import { CommonActions, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import { useUser } from '../Context/UserContext';
import api from '../api';
import { getAccessToken } from '../utils/storage';


const CreateTicket = () => {
  const navigation = useNavigation();
  const [issue, setIssue] = useState<string | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedAttachment, setSelectedAttachment] = useState<any>(null);
  const {user} = useUser();

  const issueTypes = [
    { label: 'Bug', value: 'bug' },
    { label: 'Feature Request', value: 'feature' },
    { label: 'Other', value: 'other' },
  ];

 const resolveFilePath = async (fileUri: string) => {
     if (Platform.OS === "android" && fileUri.startsWith("content://")) {
       const destPath = `${RNFS.TemporaryDirectoryPath}/upload-file.jpg`;
       await RNFS.copyFile(fileUri, destPath);
       return `file://${destPath}`;
     }
     return fileUri;
   };

  const createTicket = async () => {
    if (!issue || !subject || !message) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
  
    const formData = new FormData();
    formData.append("issue", issue);
    formData.append("subject", subject);
    formData.append("message", message);
  
   if (selectedAttachment) {
    try {
      // ✅ Resolve file path correctly (same as chatroom)
      const resolvedUri = await resolveFilePath(selectedAttachment.uri);
      const attachmentName = selectedAttachment.name || `file_${Date.now()}`;
      const fileType = selectedAttachment.type || "application/octet-stream";

      // ✅ Ensure correct file URI format
      const fileUri = resolvedUri.startsWith("file://") ? resolvedUri : `file://${resolvedUri}`;

      formData.append("attachment[]", {
        uri: fileUri,
        name: attachmentName,
        type: fileType,
      });

      //console.log("✅ Final Attachment Ready:", { uri: fileUri, name: attachmentName, type: fileType });

    } catch (error) {
        //console.error("❌ Error processing attachment:", error);
        Alert.alert("Error", "Failed to process attachment.");
        return;
      }
    }
  
    try {
      const access_token = await getAccessToken(); 
  
     // console.log("📤 Sending Ticket with FormData:", formData);
  
      const response = await api.protected.post("customer-support/ticket/store", formData, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "multipart/form-data",
        },
      });
  
      if (response.data?.success) {
        //console.log("✅ Ticket Created Successfully:", response.data);
        Alert.alert("Success", "Ticket created successfully!", [
          { 
            text: "OK", 
            onPress: () => navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: "Home" }],
              })
            )
          }
        ]);
        
        return;
      } else {
        //console.error("❌ API Response Error:", response.data);
        Alert.alert("Error", response.data?.message || "Failed to create ticket.");
      }
      
    } catch (error) {
      //console.error("❌ API Error:", error);
      Alert.alert("Error", "Failed to create ticket. Please try again.");
    }
  };
  

  

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
          Alert.alert("Permission Denied", "Storage permission is required to pick files.");
          return;
        }
      }

      // Open document picker
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles], // Allow all file types
        allowMultiSelection: false, // Single file selection
      });

      if (result.length === 0) return;

      let selectedFile = result[0];

     // console.log("📁 Selected File:", selectedFile);

      // ✅ Convert content:// URI to file:// path for Android
      let fileUri = selectedFile.uri;
      if (Platform.OS === "android" && fileUri.startsWith("content://")) {
        const destPath = `${RNFS.TemporaryDirectoryPath}/${selectedFile.name}`;
        await RNFS.copyFile(fileUri, destPath);
        fileUri = `file://${destPath}`;
      }

      // ✅ Store the processed file & Open Modal
      setSelectedAttachment({
        uri: fileUri,
        type: selectedFile.type,
        name: selectedFile.name,
      });
      

     // console.log("✅ Final Attachment:", { uri: fileUri, type: selectedFile.type, name: selectedFile.name });

    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
      //  console.log("❌ User cancelled document picker");
      } else {
      //  console.error("❌ Document Picker Error:", err);
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* 🔙 Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={22} color={"#000"} style={styles.icon} />
        </TouchableOpacity>
        <Text style={styles.title}>Create Issue</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Announcements')}>
          <Icon name="notifications" size={22} color={"#000"} style={styles.bellIcon} />
        </TouchableOpacity>
      </View>
  
      {/* 📌 Issue Type Dropdown */}
      <Text style={styles.label}>Issue Type</Text>
      <Dropdown
        style={styles.dropdown}
        data={issueTypes}
        labelField="label"
        valueField="value"
        placeholder="Select"
        value={issue}
        onChange={(item) => setIssue(item.value)}
      />
  
      {/* 📝 Subject Input */}
      <Text style={styles.label}>Subject</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter subject"
        value={subject} // ✅ Linked to State
        onChangeText={(text) => setSubject(text)} // ✅ Updates State
      />
  
      {/* 📝 Message Input */}
      <Text style={styles.label}>Message</Text>
      <TextInput
        style={styles.messageInput}
        placeholder="Enter message"
        multiline
        value={message} // ✅ Linked to State
        onChangeText={(text) => setMessage(text)} // ✅ Updates State
      />
  
      {/* 📂 Upload Attachment */}
      <Text style={styles.label}>Upload Image</Text>
      <TouchableOpacity style={styles.uploadBox} onPress={handleAttachment}>
        <Icon name="file-upload" size={40} color={"#000"} style={styles.uploadIcon} />
        {selectedAttachment && (
          <Text style={styles.attachmentText}>{selectedAttachment.name}</Text> // ✅ Shows selected file name
        )}
      </TouchableOpacity>
  
      {/* ✅ Done & Cancel Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.doneButton} onPress={createTicket}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
};

export default CreateTicket;

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: '20@s',
    paddingTop: '10@vs',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20@vs',
  },
  title: {
    fontSize: '17@ms',
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },
  icon: {
    width: '20@ms',
    height: '20@vs',
    resizeMode: 'contain',
  },
  bellIcon: {
    width: '22@ms',
    height: '22@vs',
    resizeMode: 'contain',
  },
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '8@ms',
    height: '8@vs',
    backgroundColor: 'red',
    borderRadius: 50,
  },
  label: {
    fontSize: '14@ms',
    color: '#000',
    fontFamily: 'Poppins-SemiBold',
    marginBottom: '5@vs',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: '8@s',
    paddingHorizontal: '12@s',
    height: '40@vs',
    justifyContent: 'center',
    marginBottom: '15@vs',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: '8@s',
    paddingHorizontal: '12@s',
    height: '40@vs',
    marginBottom: '15@vs',
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: '8@s',
    paddingHorizontal: '12@s',
    paddingVertical: '10@vs',
    height: '100@vs',
    textAlignVertical: 'top',
    marginBottom: '15@vs',
  },
  uploadBox: {
    height: '100@vs',
    width: '180@ms',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: '8@s',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '20@vs',
    left: '75@s',
  },
  uploadIcon: {
    width: '40@ms',
    height: '40@vs',
    resizeMode: 'contain',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  doneButton: {
    backgroundColor: 'red',
    paddingVertical: '10@vs',
    width: '45%',
    borderRadius: '8@s',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: '10@vs',
    width: '45%',
    borderRadius: '8@s',
    alignItems: 'center',
  },
  doneText: {
    color: '#fff',
    fontSize: '14@ms',
    fontFamily: 'Poppins-Bold',
  },
  cancelText: {
    color: '#000',
    fontSize: '14@ms',
    fontFamily: 'Poppins-Bold',
  },
});
