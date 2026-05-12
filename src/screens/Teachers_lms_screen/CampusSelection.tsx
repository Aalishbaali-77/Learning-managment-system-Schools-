import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { ScaledSheet, moderateScale } from 'react-native-size-matters';
import axios from 'axios';
import api from '../../api';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../../Context/UserContext';
import { setUserData } from '../../utils/storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type EmpIdProps = NativeStackScreenProps<any, any>;

const CampusSelection: React.FC<EmpIdProps> = (props) => {
    const [campuses, setCampuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();
    const { updateUser} = useUser()

    const empId = props.route.params?.empId
    const user = props.route.params?.user

    
    
    useEffect(() => {
    // console.log('User data in CampusSelection:', user);
}, [user]);

   

    useEffect(() => {
        // Fetch campuses data
        const fetchCampuses = async () => {
            try {
                // console.log('Fetching campus data...');
                const response = await api.protected.get('campus/detail'); // Replace with the actual API endpoint
                if (response.data.status === 'success') {
                    // console.log('Campus data fetched successfully:', response.data.data);
                    setCampuses(response.data.data);
                } else {
                    // console.error('Failed to fetch campus data:', response.data.message);
                    Alert.alert('Error', response.data.message);
                }
            } catch (error) {
                // console.error('Error while fetching campus data:', error);
                Alert.alert('Error', 'Failed to fetch campus information. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchCampuses();
    }, []);

    const handleCardPress = async (id: number) => {
        // console.log(`Campus ID: ${id}`);
        try {
            const userData = {
                id: user?.id,
                emp_type_multiple_campus: user?.emp_type_multiple_campus,
                emp_id: user?.emp_id == 0 ? null : user?.emp_id,
                student_id: user?.student_id === 0 ? null : user?.student_id,
                emp_ids_array: user?.emp_ids_array,
                acc_type: user?.acc_type,
                company_id: user?.company_id,
                school_campus_ids_array: user?.school_campus_ids_array,
                username: user?.username,
                mobile_no: user?.mobile_no,
                cnic_no: user?.cnic_no,
                sgpe: user?.sgpe,
                name: user?.name,
                email: user?.email,
                school_campus_id: id,
                profile_pic: user.profile_pic,
            };
    
            // Update context first
          //  console.log('userdataselection',userData);
          //  console.log('Campus id log',userData.school_campus_id);
           
            await updateUser(userData)
    
            // Navigate after context update is done
            // console.log('Campus ID saved in context:', id);
            navigation.navigate('TeachersHome', { schoolCampusId: id, empId });
        } catch (error) {
            // console.error('Error updating user data:', error);
            Alert.alert('Error', 'Failed to save campus information. Please try again.');
        }
    };
    
    return (
        <View style={styles.container}>
            {/* User Info Section */}
            <View style={styles.userInfoContainer}>
                <Image
                    source={require('../../assets/Images/profile_image.png')} // Placeholder for the profile image
                    style={styles.profileImage}
                />
                <View>
                    <Text style={styles.userName}>{user?.name}</Text>
                    <Text style={styles.userEmail}>{user?.email}</Text>
                </View>
            </View>

            {/* Header */}
            <Text style={styles.header}>Select Your Campus</Text>

            {/* Campus Cards */}
            <View style={styles.cardContainer}>
                {campuses.length > 0 ? (
                    campuses.map((campus: any) => (
                        <TouchableOpacity
                            key={campus.id}
                            style={styles.card}
                            onPress={() => handleCardPress(campus.id)}
                        >
                            <Image
                                source={require('../../assets/Images/GleeGatherlogo.png')} // Placeholder for the campus image
                                style={styles.cardImage}
                            />
                            <View style={styles.cardContent}>
                                <Text style={styles.cardTitle}>Name: {campus.name}</Text>
                                <Text style={styles.cardText}>Campus Code: {campus.campus_code}</Text>
                                <Text style={styles.cardText}>Address: {campus.address}</Text>
                            </View>
                            <TouchableOpacity style={styles.viewDetailButton} onPress={() => handleCardPress(campus.id)}>
                                <Text style={styles.viewDetailText}>Open</Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ))
                ) : (
                    <Text style={styles.noCampusText}>No campuses available.</Text>
                )}
            </View>
        </View>
    );
};

const styles = ScaledSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
      padding: '16@ms',
    },
    loaderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#fff',
    },
    loaderText: {
      marginTop: '8@vs',
      fontSize: '16@ms',
      color: '#555',
      fontFamily: 'Poppins-Regular',
    },
    userInfoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: '20@ms',
    },
    profileImage: {
      width: '50@ms',
      height: '50@ms',
      borderRadius: '25@ms',
      marginRight: '12@ms',
    },
    userName: {
      fontSize: '16@ms',
      color: '#000',
      fontFamily: 'Poppins-Bold',
    },
    userEmail: {
      fontSize: '14@ms',
      color: '#777',
      fontFamily: 'Poppins-Regular',
    },
    header: {
      fontSize: '18@ms',
      textAlign: 'center',
      marginBottom: '16@ms',
      color: '#000',
      fontFamily: 'Poppins-Bold',
    },
    cardContainer: {
      flex: 1,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F9F9F9',
      borderRadius: '8@ms',
      padding: '12@ms',
      marginBottom: '12@ms',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: '4@ms',
    },
    cardImage: {
      width: '60@ms',
      height: '60@ms',
      borderRadius: '30@ms',
      marginRight: '12@s',
      resizeMode:'contain',
    },
    cardContent: {
      flex: 1,
    },
    cardTitle: {
      fontSize: '14@ms',
      color: '#000',
      fontFamily: 'Poppins-Bold',
    },
    cardText: {
      fontSize: '12@ms',
      color: '#555',
      marginTop: '4@ms',
      fontFamily: 'Poppins-Regular',
    },
    viewDetailButton: {
      backgroundColor: '#FF0000',
      paddingVertical: '6@ms',
      paddingHorizontal: '12@ms',
      borderRadius: '4@ms',
    },
    viewDetailText: {
      fontSize: '12@ms',
      color: '#FFF',
      fontFamily: 'Poppins-Bold',
    },
    noCampusText: {
      textAlign: 'center',
      fontSize: '14@ms',
      color: '#555',
      marginTop: '16@ms',
      fontFamily: 'Poppins-Regular',
    },
  });
  



export default CampusSelection;
