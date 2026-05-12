import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, Linking, Modal } from 'react-native';
import { ScaledSheet, scale } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import api from '../api';
import { ASSET_URL } from '../constants';

type ticketIdProps =  NativeStackScreenProps<any,any>;

const SupportDetail: React.FC<ticketIdProps> = (props) => {
  const navigation = useNavigation();
  const ticketId = props.route.params?.ticketId
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchTicketDetails();
  }, []);

  const fetchTicketDetails = async () => {
    try {
      const response = await api.protected.get(`customer-support/ticket/${ticketId}`);
      if (response.data.success) {
        setTicket(response.data.data.ticket);
        
        
      } else {
        setError('Failed to fetch ticket details');
      }
    } catch (err) {
      setError('Error fetching ticket details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#E74C3C';
      case 'in_progress': return '#F1C40F';
      case 'resolved': return '#27AE60';
      default: return '#BDBDBD';
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#000" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  if (error) {
    return <Text style={{ textAlign: 'center', marginTop: 20, color: 'red' }}>{error}</Text>;
  }

  const statusList = ['pending', 'in_progress', 'resolved'];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={scale(22)} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Support Detail</Text>
      </View>
      
      {/* Status Bar */}
      <View style={styles.statusContainer}>
  {statusList.map((status, index) => {
    const isActive = status === ticket?.status;
    return (
      <View key={index} style={styles.statusWrapper}>
        {/* Line Connector (except last item) */}
        {index !== statusList.length - 1 && (
          <View style={[styles.statusLine, { backgroundColor: ticket?.status === status || statusList.indexOf(ticket?.status) > index ? getStatusColor(status) : '#D3D3D3' }]} />
        )}

        {/* Circle Indicator */}
        <View style={[styles.statusCircle, { backgroundColor: isActive ? getStatusColor(status) : '#D3D3D3' }]}>
          <Text style={[styles.statusText, { color: '#fff' }]}>{index + 1}</Text>
        </View>

        {/* Status Label */}
        <Text style={[styles.statusLabel, { color: isActive ? getStatusColor(status) : '#000' }]}>
          {status.replace('_', ' ').toUpperCase()}
        </Text>
      </View>
    );
  })}
</View>

      {/* Issue Details */}
      
      <View style={styles.detailContainer}>
        <Text style={styles.detailLabel}>Issue Type</Text>
        <Text style={styles.detailText}>{ticket?.issue}</Text>
      </View>
      <View style={styles.detailContainer}>
        <Text style={styles.detailLabel}>Created At</Text>
        <Text style={styles.detailText}>{new Date(ticket?.created_at || '').toLocaleDateString()}</Text>
      </View>
      <View style={styles.detailContainer}>
        <Text style={styles.detailLabel}>Subject</Text>
        <Text style={styles.detailText}>{ticket?.subject}</Text>
      </View>
      <View style={styles.detailContainer}>
        <Text style={styles.detailLabel}>Message</Text>
        <Text style={styles.detailText}>{ticket?.message}</Text>
      </View>

      {/* Attachment */}
      
      <View style={styles.detailContainer}>
  <Text style={styles.detailLabel}>Attachments</Text>

  {ticket.attachments ? (
    JSON.parse(ticket.attachments).map((attachment: { type: string; path: string }, index: number) => {
      const fileUrl = `${ASSET_URL}${attachment.path.replace(/\\/g, "/")}`; 
      //console.log("Attachment URL:", fileUrl);

      if (attachment.type === "image") {
        return (
          <TouchableOpacity key={index} onPress={() => {
            setSelectedImage(fileUrl);
            setModalVisible(true);
          }}>
            <Image source={{ uri: fileUrl }} style={styles.attachment} />
          </TouchableOpacity>
        )
      } else {
        return (
          <TouchableOpacity key={index} onPress={() => Linking.openURL(fileUrl)} style={styles.attachmentWrapper}>
            <Icon name="document-text" size={30} color="gray" />
            <Text style={styles.attachmentText}>View Document</Text>
          </TouchableOpacity>
        )
      }
    })
  ) : (
    <Text style={styles.noAttachmentText}>No attachments</Text>
  )}


  <Modal visible={modalVisible} transparent animationType="fade">
    <View style={styles.modalContainer}>
      <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
        <Icon name="close" size={30} color="#fff" />
      </TouchableOpacity>
      <Image source={{ uri: selectedImage || "" }} style={styles.fullImage} resizeMode="contain" />
    </View>
  </Modal>
</View>

      

      {/* Admin Message */}
      
        <View style={styles.adminMessageContainer}>
          <Text style={styles.adminText}>Admin Message</Text>
          <Text style={styles.adminDetail}>{ticket.admin_reply || 'No reply yet'}</Text>
        </View>
      
    </ScrollView>
  );
};


const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: '15@ms',
    
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '20@vs',
  },
  title: {
    fontSize: '18@ms',
    fontFamily: 'Poppins-SemiBold',
    marginLeft: '70@s',
    color: '#000'
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginVertical: '10@vs',
  },
  statusWrapper: {
    alignItems: 'center',
    position: 'relative',
    left: '10@s',
  },
  statusLine: {
    position: 'absolute',
    width: '106@ms',
    height: '4@vs',
    top: '16@vs',
    left: '20@s',
    zIndex: -1,
  },
  statusCircle: {
    width: '35@ms',
    height: '35@vs',
    borderRadius: '35@ms',
    alignItems: 'center',
    justifyContent: 'center',
    right: '10@s',
  },
  statusText: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-SemiBold',
    color: '#fff',

  },
  statusLabel: {
    fontSize: '10@ms',
    fontFamily: 'Poppins-Regular',
    marginTop: '5@vs',
    right: '8@s',
  },
  detailContainer: {
    marginBottom: '15@vs',
    marginTop: '10@vs',
  },
  detailLabel: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
  },
  detailText: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-Regular',
    color: '#000',
  },
  attachment: {
    width: "100@s",
    height: "100@vs",
    resizeMode: "cover",
    marginVertical: "10@vs",
  },
  attachmentWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: "10@vs",
  },
  attachmentText: {
    fontSize: "14@ms",
    color: "blue",
    marginLeft: "5@s",
  },
  noAttachmentText: {
    fontSize: "13@ms",
    color: "gray",
    fontFamily: 'Poppins-Regular',
    marginTop: '5@vs',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: "90%",
    height: "80%",
  },
  closeButton: {
    position: "absolute",
    top: '40@vs',
    right: '20@s',
    zIndex: 1,
  },
  adminMessageContainer: {
    backgroundColor: '#f0f0f0',
    padding: '10@ms',
    borderRadius: '10@ms',
    marginTop: '10@vs',
  },
  adminText: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
  },
  adminDetail: {
    fontSize: '13@ms',
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
});

export default SupportDetail;