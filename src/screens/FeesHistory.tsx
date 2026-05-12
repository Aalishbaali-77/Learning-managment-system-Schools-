import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { moderateScale, ScaledSheet } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../api'; // Replace with your API utility file
import { useUser } from '../Context/UserContext';
import { studentFees } from '../types';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';



const FeesHistoryScreen: React.FC = () => {
  const [feesData, setFeesData] = useState<studentFees[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const {user} = useUser();
  const navigation = useNavigation();
  const { t } = useTranslation()

  useEffect(() => {
    const fetchFeeVouchers = async () => {
      try {
        const payload = {
          student_id: user?.student_id, // Replace with actual student ID
          school_id: user?.company_id, // Replace with actual school ID
          school_campus_id: user?.school_campus_id, // Replace with actual campus ID
        };

        const response = await api.protected.post(
          'teacher/fees/student-wise-generated-fee-voucher-list',
          payload,
        );

        if (response?.data?.status === 'success') {
          setFeesData(response.data.data);
        } else {
          Alert.alert(
            'Error',
            response?.data?.message || 'Failed to fetch fee vouchers.',
          );
        }
      } catch (error) {
       // console.error('Error fetching fee vouchers:', error);
        Alert.alert('Error', 'Unable to fetch fee vouchers. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeeVouchers();
  }, []);

  const renderFeeItem = ({ item }: { item: studentFees }) => {
    const getMonthName = (dateString: string) => {
      const date = new Date(dateString); // Convert to a Date object
      return date.toLocaleString('default', { month: 'long' }); // Get the full month name
    };
  
    return (
      <View style={styles.row}>
        <Text style={[styles.cell, styles.month]}>{getMonthName(item.month_year)}</Text>
        <Text style={styles.cell}>{parseFloat(item.amount)}</Text>
        <Text style={styles.cell}>{item.due_date}</Text>
        <View style={styles.cell}>
          <View
            style={[
              styles.statusBadge,
              item.fee_voucher_status === 1 ? styles.pendingBadge : styles.paidBadge,
            ]}
          >
            <Text style={styles.statusText}>
              {item.fee_voucher_status === 1 ?  'Pending': 'Paid' }
            </Text>
          </View>
        </View>
      </View>
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
      <View style={styles.header}>
        <TouchableOpacity onPress={()=>navigation.goBack()}>
          <Icon name="arrow-back" size={moderateScale(24)} style={styles.icon} />
        </TouchableOpacity>
        <Text style={styles.headerText}>{t('fees_history')}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Announcements')}>
          <Icon name="notifications" size={moderateScale(24)} style={styles.icon} />
        </TouchableOpacity>
      </View>
      <View style={styles.tableHeader}>
        <Text style={styles.headerCell}>{t('month')}</Text>
        <Text style={styles.headerCell}>{t('amount')}</Text>
        <Text style={styles.headerCell}>{t('due_date')}</Text>
        <Text style={styles.headerCell}>{t('status')}</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={feesData}
          renderItem={renderFeeItem}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No data available.</Text>}
        />
      )}
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: '16@ms', // Corrected to `ms` for proportional scaling
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
    marginBottom: '25@vs', // Vertical margin
    marginTop: '7@vs', // Vertical margin
  },
  headerText: {
    fontSize: '15@ms', // Font size scaling proportionally
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },
  icon: {
    color: '#000', // No scaling required for color
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: '8@s', // Corner radius
    padding: '10@ms', // Corrected to `ms` for proportional scaling
    marginBottom: '8@vs', // Vertical margin
  },
  headerCell: {
    flex: 1,
    fontSize: '13@ms', // Font size scaling proportionally
    fontFamily: 'Poppins-Medium',
    color: '#000',
    textAlign: 'center',
    marginHorizontal: '5@s', // Horizontal margin
  },
  month: {
    flex: 1,
    textAlign: 'left',
    fontFamily: 'Poppins-Regular',
    fontSize: '11@ms', // Added font size for scaling
    color: '#000',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: '8@s', // Corner radius
    padding: '10@ms', // Corrected to `ms` for proportional scaling
    marginBottom: '8@vs', // Vertical margin
  },
  cell: {
    flex: 1,
    fontSize: '11@ms', // Font size scaling proportionally
    fontFamily: 'Poppins-Regular',
    color: '#000',
    textAlign: 'center',
  },
  statusBadge: {
    borderRadius: '8@s', // Corner radius
    paddingHorizontal: '6@s', // Horizontal padding
    paddingVertical: '2@vs', // Vertical padding
    alignItems: 'center',
    justifyContent: 'center', // Centering content
    bottom: '2@vs'
  },
  paidBadge: {
    backgroundColor: '#4caf50', // Color remains unchanged
  },
  pendingBadge: {
    backgroundColor: '#ff6f61', // Color remains unchanged
  },
  statusText: {
    fontSize: '11@ms', // Font size scaling proportionally
    fontFamily: 'Poppins-Regular',
    color: '#fff', // Text color for badges
  },
});


export default FeesHistoryScreen;
