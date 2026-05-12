import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { ScaledSheet, scale } from "react-native-size-matters";
import Icon from "react-native-vector-icons/MaterialIcons";
import api from "../api";
import { getAccessToken } from "../utils/storage";
import { useNavigation } from "@react-navigation/native";
import { useUser } from "../Context/UserContext";

const TicketSupport = () => {
  const data = [
    { id: "1", supportId: "12345678", subject: "Help for Some...", createdAt: "04 Dec 2024" },
    { id: "2", supportId: "12345678", subject: "Help for Some...", createdAt: "04 Dec 2024" },
    { id: "3", supportId: "12345678", subject: "Help for Some...", createdAt: "04 Dec 2024" },
    { id: "4", supportId: "12345678", subject: "Help for Some...", createdAt: "04 Dec 2024" },
    { id: "5", supportId: "12345678", subject: "Help for Some...", createdAt: "04 Dec 2024" },
  ];
  const [tickets, setTickets] = useState([]);
  const navigation = useNavigation()
  const [loading, setLoading] = useState(false)
  const {user} = useUser()

   useEffect(() => {
          const fetchData = async () => {
              try {
                setLoading(true);
                const accessToken = await getAccessToken(); 
                if (user && accessToken) {
                  await fetchTickets();
                }
              } catch (error) {
  
              } finally {
                setLoading(false);
              }
            };
            fetchData();
      }, [])

  const fetchTickets = async () => {
    try {
      const access_token = await getAccessToken(); 
  
      const response = await api.protected.get('customer-support/tickets', {
        headers: {
          Authorization: `Bearer ${access_token}`, 
        },
      });
      if (response.data.success === true) {
        setTickets(response.data.data.tickets);
      } else {
      //  console.log(response.data, 'An error occured')
      }
  
     // console.log("✅ Tickets Response:", response.data);
    } catch (error) {
      // console.error("❌ Error fetching tickets:", error);
    }
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
          <Icon name="arrow-back" size={scale(22)} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Support</Text>
        <TouchableOpacity style={styles.notificationIcon} onPress={() => navigation.navigate('Announcements')}>
          <Icon name="notifications" size={scale(22)} color="black" />
          
        </TouchableOpacity>
      </View>

      {/* Issue Form Button */}
      <TouchableOpacity style={styles.issueButton} onPress={() => navigation.navigate('CreateTicket')}>
        <Text style={styles.issueButtonText}>Issue Form</Text>
      </TouchableOpacity>

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.headerText, styles.supportId]}>Support Id</Text>
        <Text style={[styles.headerText, styles.subject]}>Subject</Text>
        <Text style={[styles.headerText, styles.createdAt]}>Created At</Text>
        <Text style={[styles.headerText, styles.action]}>Action</Text>
      </View>

      {/* Table Data */}
      <FlatList
        data={tickets}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={[styles.cell, styles.supportIdRender]}>{item.ticket_no}</Text>
            <Text style={[styles.cell, styles.subject]}>{item.subject}</Text>
            <Text style={[styles.cell, styles.createdAtRender]}>
            {new Date(item.created_at).toLocaleDateString()}
            </Text>
            <TouchableOpacity style={styles.viewButton} onPress={() => navigation.navigate('SupportDetail', {ticketId: item.id})}>
              <Text style={styles.viewButtonText}>View</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: "15@ms",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "15@vs",
  },
  title: {
    fontSize: "18@ms",
    fontFamily: 'Poppins-Bold',
    color: "black",
  },
  notificationIcon: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: "0@s",
    right: "0@s",
    width: "8@ms",
    height: "8@vs",
    backgroundColor: "red",
    borderRadius: "4@ms",
  },
  issueButton: {
    alignSelf: "flex-end",
    backgroundColor: "red",
    paddingHorizontal: "15@s",
    paddingVertical: "8@vs",
    borderRadius: "8@ms",
    marginBottom: "10@vs",
  },
  issueButtonText: {
    color: "white",
    fontSize: "12@ms",
    fontFamily: 'Poppins-Bold',
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f5f5f5",
    paddingVertical: "10@vs",
    borderRadius: "8@ms",
    paddingHorizontal: "10@s",
  },
  headerText: {
    fontSize: "11@ms",
    fontFamily: 'Poppins-SemiBold',
    color: "black",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: "12@vs",
  },
  cell: {
    fontSize: "10@ms",
    color: "black",
  },
  supportId: { flex: 1 },
  supportIdRender: { flex: 1, left: '10@s' },
  subject: { flex: 1},
  createdAt: { flex: 1 },
  createdAtRender: { flex: 1, right: '10@s' },
  action: { flex: 1, textAlign: "center" },
  viewButton: {
    backgroundColor: "black",
    paddingHorizontal: "12@s",
    paddingVertical: "4@vs",
    borderRadius: "12@ms",
    right: '15@s',
    bottom: '5@vs',
  },
  viewButtonText: {
    color: "white",
    fontSize: "10@ms",
    fontFamily: 'Poppins-Bold',
  },
});

export default TicketSupport;
