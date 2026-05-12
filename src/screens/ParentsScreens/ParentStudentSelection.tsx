import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { ScaledSheet, moderateScale } from "react-native-size-matters";
import { useUser } from "../../Context/UserContext";
import api from "../../api";
import { StudentList } from "../../types";

const ParentsStudentSelection = () => {
    const navigation = useNavigation();
    const { user, updateUser } = useUser();
    const [studentList, setStudentList] = useState<StudentList[]>([])
  const childrenData = [
    { id: 1, name: "Ayesha Ahmed", school: "ABC Academy", grade: "6th Grade" },
    { id: 2, name: "Ayesha Ahmed", school: "ABC Academy", grade: "6th Grade" },
    { id: 3, name: "Ayesha Ahmed", school: "ABC Academy", grade: "6th Grade" },
  ];

  useEffect(() => {
    fetchStudentList();
}, []);

  const fetchStudentList = async () => {
    const school_id = user?.company_id; // Retrieve the school_id from user context or state

    if (!school_id) {
        Alert.alert('Error', 'School ID is missing.');
        return;
    }

    try {
        // API call to fetch the student list
        const response = await api.protected.post('parent/studentList', { school_id });

        // console.log('Response:', response.data);

        if (response.data.status === 'success') {
            // Update the student list state with the response data
            const students = response.data.data.map((student: any) => ({
                id: student.id,
                name: student.name,
                roll_no: student.roll_no,
                section_name: student.section_name,
            }));

            setStudentList(students);
            // console.log('Student List:', students);
        } else {
            Alert.alert('Error', response.data.message || 'Failed to retrieve student list.');
        }
    } catch (error) {
        // console.error('Error fetching student list:', error);
        // console.log('Error Status:', error.response?.status); // Logs error status if available
        // console.log('Error Data:', error.response?.data); // Logs error response data

        Alert.alert('Error', 'An error occurred while fetching the student list. Please try again later.');
    }
};

const handleStudentSelection = async (id: number) => {
    try {
        // Save the selected student ID to context
        const updatedUser = { ...user, student_id: id };
        await updateUser(updatedUser);

        // console.log('Updated User with Student ID:', updatedUser);

        // Navigate to the next screen or perform any further actions
        navigation.navigate('ParentsHome'); // Replace with the actual screen name
    } catch (error) {
        // console.error('Error updating student ID:', error);
        Alert.alert('Error', 'An error occurred while selecting the student. Please try again.');
    }
};



  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.profileImage} />
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.cnic_no}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Select Student</Text>

      {studentList.map((child) => (
        <TouchableOpacity key={child.id} style={styles.card}
        onPress={() =>  handleStudentSelection(child.id)}>
          <View style={styles.cardImage} />
          <View style={styles.cardDetails}>
            <Text style={styles.childName}>Name: {child.name}</Text>
            <Text style={styles.childSchool}>Roll No: {child.roll_no}</Text>
            <Text style={styles.childGrade}>Class: {child.section_name}</Text>
          </View>
          <TouchableOpacity style={styles.viewDetailButton}
          onPress={() =>  handleStudentSelection(child.id)}>
            <Text style={styles.viewDetailText}>View Detail</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: "16@ms",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: "20@vs",
  },
  profileImage: {
    width: "60@ms",
    height: "60@vs",
    borderRadius: "30@ms",
    backgroundColor: "#ccc",
    marginRight: "16@s",
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: "18@ms",
    fontFamily: 'Poppins-Bold',
    color: "#333",
  },
  email: {
    fontSize: "14@ms",
    fontFamily: 'Poppins-Regular',
    color: "#666",
  },
  sectionTitle: {
    fontSize: "18@ms",
    fontFamily: 'Poppins-Bold',
    marginBottom: "20@vs",
    color: "#333",
   
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: "10@ms",
    padding: "10@ms",
    marginBottom: "10@vs",
    elevation: 2,
  },
  cardImage: {
    width: "40@ms",
    height: "40@vs",
    borderRadius: "20@ms",
    backgroundColor: "#ccc",
    marginRight: "10@s",
  },
  cardDetails: {
    flex: 1,
  },
  childName: {
    fontSize: "14@ms",
    fontFamily: 'Poppins-Regular',
    color: "#333",
  },
  childSchool: {
    fontSize: "12@ms",
    fontFamily: 'Poppins-Regular',
    color: "#666",
  },
  childGrade: {
    fontSize: "12@ms",
    fontFamily: 'Poppins-Regular',
    color: "#666",
  },
  viewDetailButton: {
    backgroundColor: "#d9534f",
    paddingVertical: "5@vs",
    paddingHorizontal: "10@s",
    borderRadius: "5@ms",
  },
  viewDetailText: {
    color: "#fff",
    fontSize: "12@ms",
    fontFamily: 'Poppins-Regular',
  },
});

export default ParentsStudentSelection;
