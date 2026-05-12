import React, { useEffect, useState, useRef, useCallback } from 'react';

import { View, Text, TextInput, FlatList, Image, TouchableOpacity, Alert, Platform, PermissionsAndroid, Linking, Modal, TouchableWithoutFeedback, ActivityIndicator } from 'react-native';
import { ScaledSheet, moderateScale, scale } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useUser } from '../Context/UserContext';
import api from '../api';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Pusher, PusherEvent } from '@pusher/pusher-websocket-react-native';
import DocumentPicker from 'react-native-document-picker';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { ASSET_URL } from '../constants';
import Pdf from 'react-native-pdf';
import { WebView } from 'react-native-webview';
import ReactNativeBlobUtil from 'react-native-blob-util';
import RNFS from 'react-native-fs';
import FileViewer from "react-native-file-viewer";
import Share from "react-native-share";

interface Message {
  id: number;
  text: string;
  time: string;
  sender: 'me' | 'other';
  type?: 'text' | 'image' | 'file';
  attachment?: string;
}

interface Message {
  id: number;
  text: string;
  time: string;
  sender: 'me' | 'other';
  type?: 'text' | 'image' | 'file';
  attachment?: string | null;
}

interface ChatIdProps {
  route: {
    params: {
      chatId: number;
    };
  };
}

const ChatRoom: React.FC<ChatIdProps> = (props) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const chat_room_id = props.route.params?.chatId;
  const chatId = props.route.params?.chatId
  const navigation = useNavigation();
  const [pusher, setPusher] = useState<Pusher | null>(null);
  const [selectedAttachment, setSelectedAttachment] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [docModalVisible, setDocModalVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
  const [page, setPage] = useState(1);
  const [loadedPages, setLoadedPages] = useState<number[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const [lastVisibleIndex, setLastVisibleIndex] = useState(0);
  const [downloadedFiles, setDownloadedFiles] = React.useState<{ [key: string]: string }>({});
  const [unreadCount, setUnreadCount] = useState<number[]>([]);
  const [isFirstLoad, setIsFirstLoad] = useState(true); 


  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ animated: false, offset: 0 });
      }, 100); // Slight delay to ensure FlatList renders first
    }
  }, [messages]);


  // Fetch Messages from API on Mount
  // useEffect(() => {
  //   const fetchData = async () => {
  //     setLoading(true);
  //     try {
  //       if (!page) return; // ✅ Prevents fetching if page is not set

  //       await fetchMessages(page); // ✅ Fetch messages dynamically based on the `page`
  //     } catch (error) {
  //       console.error('Error fetching messages:', error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchData();
  // }, [page]); // ✅ Runs when `page` changes


  // const fetchMessages = async () => {
  //   try {
  //     const payload = {
  //       chat_room_id: chat_room_id,
  //       user_id: user?.id,
  //       school_id: user?.company_id,
  //       school_campus_id: user?.school_campus_id,
  //     };

  //     const response = await api.protected.post('chat-room/get-message', payload);

  //     if (response.data.status === 'success') {
  //       const apiMessages = response.data.data;
  //       const formattedMessages: Message[] = [];

  //       Object.entries(apiMessages).forEach(([date, messages]) => {
  //         formattedMessages.push({
  //           id: `date-${date}`,
  //           text: date,
  //           time: '',
  //           sender: 'system',
  //           type: 'date',
  //         });

  //         messages.forEach((msg: any) => {
  //           const images = msg.attachments?.filter((att: string) => att.match(/\.(jpg|jpeg|png|gif)$/i)) || [];
  //           const documents = msg.attachments?.filter((att: string) => att.match(/\.(pdf|docx|xlsx|txt|csv)$/i)) || [];

  //           formattedMessages.push({
  //             id: `msg-${msg.chat_id}-${msg.time}`,
  //             text: msg.message,
  //             time: msg.time,
  //             sender: msg.sender_name === 'You' ? 'me' : 'other',
  //             sender_name: msg.sender_name,
  //             type: 'combined',
  //             images,
  //             documents,
  //             status: 'sent',
  //           });
  //         });
  //       });

  //       setMessages(formattedMessages.reverse()); // ✅ Store messages as-is (backend sends in correct order)
  //     } else {
  //       Alert.alert('Error', 'Failed to fetch messages.');
  //     }
  //   } catch (error) {
  //     console.error('Error fetching messages:', error);
  //     Alert.alert('Error', 'Something went wrong while fetching messages.');
  //   }
  // };

  useEffect(() => {
    if (!cursor && messages.length === 0) {
        fetchMessages(); // ✅ Show loader only on first API call
    }
}, []); // Runs only on mount

useEffect(() => {
    if (cursor && !loading) {
        fetchMessages(); // ❌ No loader for pagination
    }
}, [cursor]); // Runs whenever cursor changes


  const groupMessagesByDate = (messages, existingDates = new Set()) => {
    const groupedMessages = [];
    const dateMap = new Map(); // ✅ Map to store messages by date

    messages.forEach((msg) => {
      const { date, chat_id, message, time, sender_name, attachments = [] } = msg;

      // ✅ Separate attachments
      const images = attachments.filter((att) => att.match(/\.(jpg|jpeg|png|gif)$/i)) || [];
      const documents = attachments.filter((att) => att.match(/\.(pdf|docx|xlsx|txt|csv)$/i)) || [];

      const messageObj = {
        id: `msg-${chat_id}`,
        text: message,
        time,
        sender: sender_name === "You" ? "me" : "other",
        sender_name,
        type: "message",
        images,
        documents,
      };

      // ✅ Store messages under their corresponding date
      if (!dateMap.has(date)) {
        dateMap.set(date, []);
      }
      dateMap.get(date).push(messageObj);
    });

    // ✅ Push messages first, then date separator for inverted FlatList
    dateMap.forEach((messages, date) => {
      groupedMessages.push(...messages); // ✅ Messages go first

      if (!existingDates.has(date)) {
        groupedMessages.push({
          id: `date-${date}`,
          text: date,
          type: "date",
        });
        existingDates.add(date); // ✅ Track this date to prevent duplicates
      }
    });

    return groupedMessages;
  };


  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setLastVisibleIndex(viewableItems[0].index); // ✅ Get actual first visible index
    }
  }, []);

  const viewabilityConfig = { viewAreaCoveragePercentThreshold: 50 };

  const fetchMessages = async () => {
    if (loading || !hasMore) return;
    if (isFirstLoad) setLoading(true); // ✅ Show loader only on first load

    try {
        let payload = {
            chat_room_id: chat_room_id,
            user_id: user?.id,
            school_id: user?.company_id,
            school_campus_id: user?.school_campus_id,
            per_page: 50,
        };

        if (cursor !== null) {
            payload.cursor = Number(cursor);
        }

       // console.log("📤 Sending Request with Payload:", payload);

        const response = await api.protected.post('chat-room/get-message', payload);
        //console.log("✅ Response Data:", response.data);

        if (response.data.status === 'success') {
            const apiMessages = response.data.data;
            const nextCursor = response.data.pagination?.next_cursor;
            const hasMoreMessages = response.data.pagination?.has_more;

            if (!apiMessages || apiMessages.length === 0) {
                setHasMore(false);
                return;
            }

            // ✅ Get today's and yesterday's date
            const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
            const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]; // Yesterday's date

            // ✅ Format messages with correct "Today" & "Yesterday" logic
            const formattedMessages = apiMessages.map((msg) => {
                let displayDate = msg.date;
                if (displayDate === today) {
                    displayDate = "Today";
                } else if (displayDate === yesterday) {
                    displayDate = "Yesterday";
                }

                return {
                    ...msg,
                    date: displayDate, // Update date formatting
                };
            });

            // ✅ Extract existing date separators
            const existingDates = new Set(messages.filter((m) => m.type === "date").map((d) => d.text));

            const groupedMessages = groupMessagesByDate(formattedMessages, existingDates);

            setMessages((prevMessages) => [...prevMessages, ...groupedMessages]);
            setCursor(nextCursor);
            setHasMore(hasMoreMessages);

            setTimeout(() => {
                if (flatListRef.current && lastVisibleIndex > 0) {
                    flatListRef.current.scrollToIndex({
                        index: lastVisibleIndex,
                        animated: false,
                    });
                }
            }, 50); // Reduced delay for smoother performance
        } else {
            //console.error("❌ API Error:", response.data);
            Alert.alert('Error', 'Failed to fetch messages.');
        }
    } catch (error) {
       // console.error("❌ Error fetching messages:", error);
        Alert.alert('Error', 'Something went wrong while fetching messages.');
    } finally {
        if (isFirstLoad) {
            setLoading(false); // ✅ Hide loader after first fetch
            setIsFirstLoad(false); // ✅ Mark first load as complete
        }
    }
};


  // ✅ Triggered when scrolling up
  const loadMoreMessages = useCallback(() => {
    if (hasMore) {
      setPage((prevPage) => {
        const newPage = prevPage + 1;
        fetchMessages(newPage); // Increment page before fetching
        return newPage;
      });
    }
  },
    // Adjust debounce time (300ms is a typical delay for scroll-related debouncing)
    [fetchMessages, hasMore]
  );

  const getFormattedDateTime = () => {
    const now = new Date();
    const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]; // "YYYY-MM-DD" for yesterday
  
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0"); // Ensure two digits
    const date = String(now.getDate()).padStart(2, "0"); // Ensure two digits
    const hours = String(now.getHours()).padStart(2, "0"); // Ensure two digits
    const minutes = String(now.getMinutes()).padStart(2, "0"); // Ensure two digits
    const seconds = String(now.getSeconds()).padStart(2, "0"); // Ensure two digits
  
    const formattedDate = `${year}-${month}-${date}`;
  
    return {
      created_date: formattedDate, // ✅ Use this for API (YYYY-MM-DD)
      display_date: formattedDate === today ? "Today" : formattedDate === yesterday ? "Yesterday" : formattedDate, // ✅ Use this for UI
      created_time: `${hours}:${minutes}:${seconds}`,
    };
  };
  
  
  const resolveFilePath = async (fileUri: string) => {
    if (Platform.OS === "android" && fileUri.startsWith("content://")) {
      const destPath = `${RNFS.TemporaryDirectoryPath}/upload-file.jpg`;
      await RNFS.copyFile(fileUri, destPath);
      return `file://${destPath}`;
    }
    return fileUri;
  };


  useEffect(() => {
    const chatId = props.route.params?.chatId;
    const pusher = Pusher.getInstance();
  
    const setupPusher = async () => {
      await pusher.init({
        apiKey: "439496afd9604ef3c24e",
        cluster: "ap2",
      });
  
      await pusher.connect();
      //console.log("🚀 Pusher Connected!");
  
      await pusher.subscribe({
        channelName: `chat-room.${chatId}`,
        onEvent: (event) => {
          try {
            const eventData = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
           // console.log("🔍 Pusher Event Data:", eventData);
  
            if (!eventData || (!eventData.message && (!eventData.attachments || eventData.attachments.length === 0))) {
             // console.warn("🚨 Invalid event data (no text or attachment):", eventData);
              return;
            }
  
            setMessages((prevMessages) => {
              const attachments = Array.isArray(eventData.attachments) ? [...new Set(eventData.attachments)] : [];
              const images = attachments.filter((att) => att.match(/\.(jpg|jpeg|png|gif)$/i));
              const documents = attachments.filter((att) => att.match(/\.(pdf|docx|xlsx|txt|csv|zip|rar|doc|ppt|pptx)$/i));
  
              // ✅ Construct new message object (WITHOUT date logic)
              const newMessage = {
                id: eventData.chat_id ? eventData.chat_id.toString() : `${Date.now()}`,
                text: eventData.message ? eventData.message.toString().trim() : "",
                time: eventData.created_time,
                sender_name: eventData.sender_id === user?.id ? "You" : eventData.sender_name,
                images,
                documents,
                status: "sent",
              };
  
              // ✅ Simply prepend new message (no date separator logic)
              return [newMessage, ...prevMessages];
            });
  
            // ✅ Scroll to bottom after adding a new message
            setTimeout(() => {
              flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
            }, 100);
          } catch (error) {
           // console.error("❌ Error parsing event data:", error);
          }
        },
      });
    };
  
    setupPusher();
  
    return () => {
      pusher.unsubscribe({ channelName: `chat-room.${chatId}` });
      pusher.disconnect();
    };
  }, [props.route.params?.chatId]);
  


  // Function to send a message
  const sendMessage = async () => {
    if (!newMessage.trim() && !selectedAttachment) return;
  
    setLoading(true);
    const tempMessage = newMessage;
    const tempAttachment = selectedAttachment;
  
    setNewMessage("");
    setSelectedAttachment(null);
  
    // ✅ Get both formatted and display date
    const { created_date, display_date, created_time } = getFormattedDateTime();
  
    const formData = new FormData();
    formData.append("message", tempMessage);
    formData.append("sender_id", user?.id);
    formData.append("school_id", Number(user?.company_id));
    formData.append("school_campus_id", user?.school_campus_id);
    formData.append("chat_room_id", chat_room_id);
    formData.append("created_date", created_date); 
    formData.append("created_time", created_time);
  
    let attachmentUrl = null;
  
    if (tempAttachment) {
      try {
        const resolvedUri = await resolveFilePath(tempAttachment.uri);
        const attachmentName = tempAttachment.name || `file_${Date.now()}`;
        const fileType = tempAttachment.type || "application/octet-stream";
    
        // ✅ Convert local file URI to correct format
        const fileUri = resolvedUri.startsWith("file://") ? resolvedUri : `file://${resolvedUri}`;
    
        formData.append("attachments[]", {
          uri: fileUri,
          name: attachmentName,
          type: fileType,
        });
    
      } catch (err) {
       // console.error("❌ Error resolving file path:", err);
        Alert.alert("Error", "Failed to resolve file path.");
        setLoading(false);
        return;
      }
    }
    
  
    try {
     // console.log("📤 Sending Message with FormData:", formData);
  
      const response = await api.protected.post("chat-room/send-message", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
  
      if (response.data.status !== "success") {
        throw new Error("Failed to send message");
      }
  
     // console.log("✅ Message Sent:", response.data);
  
    } catch (error) {
     // console.error("❌ API Error:", error);
      Alert.alert("Error", "Failed to send message.");
    } finally {
      setLoading(false);
    }
  };
  
  

  useEffect(() => {
    const chatId = props.route.params?.chatId;
    const payload = {
      chat_room_id: chatId,
      user_id: user?.id
    }
    const fetchUnreadCount = async () => {
      setLoading(true);
      try {
        const response = await api.protected.post("chat-room/mark-read", payload);

        if (response.data.status !== "success") {
          setUnreadCount(response.data.data)
        }

      } catch (error) {
      //  console.error("❌ API Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUnreadCount();
  }, [props.route.params?.chatId]);


  // Function to handle attachment selection
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
      setAttachmentModalVisible(true); // Open the modal for preview

     // console.log("✅ Final Attachment:", { uri: fileUri, type: selectedFile.type, name: selectedFile.name });

    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
       // console.log("❌ User cancelled document picker");
      } else {
       // console.error("❌ Document Picker Error:", err);
      }
    }
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

    const downloadDocument = async (docUri: string) => {
      const fileName = decodeURIComponent(docUri.split("/").pop() || "Attachment");
      const fileUrl = `${ASSET_URL}${docUri}`;
      const filePath = `${ReactNativeBlobUtil.fs.dirs.DownloadDir}/${fileName}`;
      const mimeType = getMimeType(fileName);
    
      // ✅ Check if file is already downloaded
      if (downloadedFiles[docUri]) {
        Alert.alert(
          "File Already Downloaded",
          "Do you want to download it again?",
          [
            { text: "Download Again", onPress: () => startDownload() },
            { text: "Cancel", style: "cancel" },
          ]
        );
        return;
      }
    
      startDownload();
    
      function startDownload() {
        requestStoragePermission().then((hasPermission) => {
          if (!hasPermission) {
            Alert.alert("Permission Denied", "Storage permission is required to download the file.");
            return;
          }
    
          Alert.alert("Downloading...", "Your file is being downloaded in the background.");
    
          ReactNativeBlobUtil.config({
            fileCache: false,
            path: filePath,
            addAndroidDownloads: {
              useDownloadManager: true, // ✅ Show progress in notification bar
              notification: true, // ✅ Notify when download completes
              title: fileName,
              description: "Downloading file...",
              mime: mimeType, // ✅ Dynamically detect MIME type
              mediaScannable: true,
              path: filePath,
            },
          })
            .fetch("GET", fileUrl)
            .progress((received, total) => {
              //console.log(`Download Progress: ${Math.floor((received / total) * 100)}%`);
            })
            .then((res) => {
              Alert.alert("Download Complete", `File saved to ${res.path()}`);
              downloadedFiles[docUri] = filePath; // ✅ Store file path
            })
            .catch((error) => {
              //console.error("Download Error:", error);
              Alert.alert("Download Failed", "Something went wrong while downloading.");
            });
        });
      }
    };
    
    

  // ✅ Open Document in a Supported App
  const openDocument = async (filePath: string) => {
    try {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert("Permission Denied", "Storage permission is required to open files.");
          return;
        }
      }

      // ✅ Open with supported apps
      await FileViewer.open(filePath);
    } catch (error) {
    //  console.error("Error opening document:", error);
      Alert.alert("Error", "Unable to open document.");
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.type === "date") {
      return (
        <View style={styles.dateSeparator}>
          <Text style={styles.dateText}>{item.text}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.messageContainer, item.sender_name === "You" ? styles.myMessage : styles.otherMessage]}>
        {/* Show sender name only once */}
        <Text style={styles.senderName}>{item.sender_name}</Text>

       

        {/* Render Images */}
        {item.images?.length > 0 && (
          <View style={styles.imageGrid}>
            {item.images.map((imgUri, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  setSelectedImage(`${ASSET_URL}${imgUri}`);
                  setModalVisible(true);
                }}
              >
                <Image source={{ uri: `${ASSET_URL}${imgUri}` }} style={styles.imagePreview} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Render Documents */}
        {item.documents?.length > 0 && (
          <View style={styles.fileContainer}>
            {item.documents.map((docUri, index) => (
              <TouchableOpacity key={index} onPress={() => downloadDocument(docUri)} style={styles.pdfMessageContainer}>
                <View style={styles.pdfHeader}>
                  <Icon name="insert-drive-file" size={22} color="red" style={styles.pdfIcon} />
                  <Text style={styles.pdfTitle}>
                    {decodeURIComponent(docUri.split("/").pop() || "Attachment")}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

         {/* Render Text Message */}
         {item.text && <Text style={styles.messageText}>{item.text}</Text>}

        {/* Render Time & Status Indicator */}
        <View style={styles.messageFooter}>
          <Text style={styles.messageTime}>{item.time}</Text>

          {/* ✅ Status Indicator */}
          {item.status === "pending" && <View style={styles.pendingIndicator} />}
          {item.status === "sent" && <Icon name="check" size={12} color="gray" />}
          {item.status === "failed" && <Icon name="close" size={12} color="red" />}
        </View>
      </View>
    );
  };

  const ITEM_HEIGHT = 300;

  if (isFirstLoad && loading) {
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
        <Text style={styles.headerTitle}>Mathematics Chat Room</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Announcements')}>
          <Icon name="notifications" size={scale(24)} color="black" />
        </TouchableOpacity>
      </View>

      {/* Chat Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
        contentContainerStyle={styles.chatContainer}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={200}
        updateCellsBatchingPeriod={30}
        removeClippedSubviews={false}
        getItemLayout={(data, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        onEndReached={fetchMessages} // Load more messages when scrolling up
        onEndReachedThreshold={0.5}
        keyboardShouldPersistTaps="handled"
        inverted={true} // Newest messages at bottom
        viewabilityConfig={viewabilityConfig} // ✅ Track visible items
        onViewableItemsChanged={onViewableItemsChanged}
      />

      {/* Chat Input */}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachmentButton} onPress={() => handleAttachment()} >
          <Icon name="attach-file" size={scale(24)} color="black" />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Type message"
          placeholderTextColor="#aaa"
          value={newMessage}
          onChangeText={setNewMessage}
        />

        {selectedAttachment && (
          <View style={styles.attachmentPreviewCard}>

            {/* Image Preview */}
            {selectedAttachment.type.includes("image") ? (
              <Image source={{ uri: selectedAttachment.uri }} style={styles.fullImagePreview} />
            ) : (
              // Document Preview
              <View style={styles.documentPreview}>
                <Icon name="insert-drive-file" size={48} color="red" />
                <Text style={styles.documentName}>{selectedAttachment.name}</Text>
              </View>
            )}

            {/* Close Button */}
            <TouchableOpacity
              style={styles.closePreviewButton}
              onPress={() => setSelectedAttachment(null)}
            >
              <Icon name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Icon name="send" size={scale(18)} color="white" />
        </TouchableOpacity>
      </View>
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          {selectedImage && <Image source={{ uri: selectedImage }} style={styles.fullSizeImage} />}
        </View>
      </Modal>
      <Modal visible={docModalVisible} transparent={false} animationType="slide">
        <View style={styles.docModalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setDocModalVisible(false)}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          {selectedDocument?.endsWith('.pdf') ? (
            <Pdf
              source={{ uri: selectedDocument, cache: true }}
              style={styles.pdfViewer}
              
            />
          ) : (
            <WebView source={{ uri: selectedDocument }} style={styles.webView} />
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    paddingHorizontal: '15@s',
    paddingVertical: '12@vs',
    borderBottomWidth: '1@ms',
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: '18@ms',
    fontFamily: 'Poppins-Bold',
    color: 'black',
  },
  senderName: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Bold',
    color: '#555',
    marginBottom: '2@vs',

  },
  attachmentButton: {
    paddingHorizontal: '10@s',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateSeparator: {
    alignSelf: 'center',

    paddingHorizontal: '12@s',
    paddingVertical: '4@vs',
    borderRadius: '8@ms',
    marginVertical: '8@vs',
  },
  dateText: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Bold',
    color: '#555',
  },
  notificationDot: {
    position: 'absolute',
    top: '4@vs',
    right: '4@s',
    width: '8@ms',
    height: '8@vs',
    borderRadius: '4@ms',
    backgroundColor: 'red',
  },
  chatContainer: {
    padding: '15@ms',
  },
  messageContainer: {
    maxWidth: '80%',
    padding: '10@ms',
    borderRadius: '10@ms',
    marginBottom: '10@vs',
    alignSelf: 'flex-start',
  },
  myMessage: {
    backgroundColor: '#FFA500',
    alignSelf: 'flex-end',
    borderTopRightRadius: 0,
  },
  otherMessage: {
    backgroundColor: '#f0f0f0',
    borderTopLeftRadius: 0,
  },
  messageText: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-Regular',
    color: '#333',
  },
  senderName: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Bold',
    color: '#666',
    marginBottom: '5@vs',
  },
  imageMessage: {
    width: '150@ms',
    height: '150@vs',
    borderRadius: '10@ms',
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: '10@ms',
    borderRadius: '10@ms',
  },
  fileText: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-Regular',
    marginLeft: '10@s',
    color: 'black',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: '10@s',
    height: '50@vs',
    marginHorizontal: '15@s',
    marginBottom: '10@vs',
    borderRadius: '25@ms',
  },
  input: {
    flex: 1,
    fontSize: '14@ms',
    fontFamily: 'Poppins-Regular',
    color: '#333',
  },
  sendButton: {
    backgroundColor: '#FFA500',
    width: '40@ms',
    height: '40@vs',
    borderRadius: '20@ms',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: '8@s',
    maxWidth: '80%',
    alignSelf: 'flex-start',
    marginVertical: '5@vs',
  },
  imagePreview: {
    width: '140@ms',
    height: '140@vs',
    borderRadius: '12@ms',
    backgroundColor: '#eee',
  },
  fileContainer: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    borderRadius: '10@ms',
    padding: '10@ms',
    shadowColor: '#000',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.1,
    // shadowRadius: 2,
    // elevation: 3,
  },
  pdfMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: '10@ms',
    borderRadius: '10@ms',
    backgroundColor: '#fff',
    marginBottom: '5@vs',
    flexWrap: 'wrap', // Allow wrapping inside the box
    maxWidth: '100%', // Prevent overflow issues
  },

  pdfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap', // Allow text to wrap within container
    maxWidth: '90%', // Prevent text from overflowing outside
  },

  pdfIcon: {
    width: '22@ms',
    height: '22@vs',
    marginRight: '8@s',
  },
  pdfTitle: {
    fontSize: '11@ms',
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
    flexShrink: 1, // Allow shrinking to prevent overflow
    flexWrap: 'wrap', // Ensure text wraps
    maxWidth: '80%', // Prevent it from stretching too much
    lineHeight: '14@ms', // Improve text spacing
  },

  messageTime: {
    fontSize: '10@ms',
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginTop: '5@vs',
    alignSelf: 'flex-end',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullSizeImage: {
    width: '90%',
    height: '70%',
    resizeMode: 'contain',
  },
  closeButton: {
    position: 'absolute',
    top: '40@vs',
    right: '20@s',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: '20@ms',
    padding: '10@ms',
    zIndex: '10@s',
  },
  closeText: {
    fontSize: '20@ms',
    fontFamily: 'Poppins-Bold',
    color: 'black',
  },
  docModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  pdfViewer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  webView: {
    flex: 1,
  },
  attachmentPreviewCard: {
    position: "absolute",
    bottom: '80@vs', // Adjust based on input position
    left: "5%",
    width: "90%",
    backgroundColor: "white",
    borderRadius: '12@ms',
    padding: '16@ms',
    alignItems: "center",
    shadowColor: "#000",
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.2,
    // shadowRadius: 4,
    // elevation: 5,
  },

  // 🖼 Image Preview (Big, Centered)
  fullImagePreview: {
    width: "100%",
    height: '250@vs',
    borderRadius: '10@ms',
    resizeMode: "contain",
  },

  // 📄 Document Preview
  documentPreview: {
    alignItems: "center",
    justifyContent: "center",
    padding: '20@ms',
  },

  documentName: {
    marginTop: '10@vs',
    fontSize: '16@ms',
    fontWeight: "500",
    textAlign: "center",
  },

  // ❌ Close Button
  closePreviewButton: {
    position: "absolute",
    top: '10@vs',
    right: '10@s',
    backgroundColor: "red",
    borderRadius: '15@ms',
    width: '30@ms',
    height: '30@vs',
    justifyContent: "center",
    alignItems: "center",
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: '4@vs',
  },

  pendingIndicator: {
    width: '10@ms',
    height: '10@vs',
    backgroundColor: "#ccc", // 🟦 Small gray square
    borderRadius: '2@ms',
    marginLeft: '5@s',
  },

});

export default ChatRoom;
