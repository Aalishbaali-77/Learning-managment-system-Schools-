import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../api';
import { useSubjects } from '../../Context/TeacherSubjectContext';
import { useUser } from '../../Context/UserContext';
import { getAccessToken } from '../../utils/storage';


const ParentsHallOfExcellence = () => {
  const navigation = useNavigation();
  const [search, setSearch] = useState('');
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const {sectionId} = useSubjects();
  const {user} = useUser();

  useEffect(() => {
    const fetchData = async () => {
        try {
          setLoading(true);
          const accessToken = await getAccessToken(); 
          if (user && accessToken) {
            await fetchRankings();
          }
        } catch (error) {

        } finally {
          setLoading(false);
        }
      };
      fetchData();
}, [])


  const fetchRankings = async () => {
    const payload = {
        section_id: sectionId,
        school_campus_id: user?.school_campus_id,
        school_id: user?.company_id,
    }
    try {
      const response = await api.protected.post('teacher/progress/hall-of-excellence', payload );
      if (response.data.status === 'success') {
        setRankings(response.data.data)
      } else {
        setError('Failed to load rankings');
      }
    } catch (err) {
      setError('Network error, please try again');
    } finally {
      setLoading(false);
    }
  };

  const getRankSymbol = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return rank.toString();
    }
  };

  const filteredData = rankings.filter(item =>
    item.student_name.toLowerCase().includes(search.toLowerCase())
  );

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
          <Icon name="arrow-back" size={22} color="#000" style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Hall of Excellence</Text>
        <TouchableOpacity onPress={() => navigation.navigate('TeacherAnnouncement')}>
          <Icon name="notifications" size={22} color="#000" style={styles.notificationIcon} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Name"
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
        />
        <Icon name="search" size={22} color="#000" style={styles.searchIcon} />
      </View>

      {/* Error / Loading State
      {loading ? <ActivityIndicator size="large" color="#000" style={styles.loader} /> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null} */}

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={styles.headerCell}>Name</Text>
        <Text style={styles.headerCell}>Rank</Text>
      </View>

      {/* List */}
      <FlatList
        data={filteredData}
        keyExtractor={(item) => `${item.student_id}-${item.rank}`}
        renderItem={({ item, index }) => (
                          <View style={[styles.row, index % 2 === 0 ? styles.rowWhite : styles.rowGrey]}>
                            <Text style={styles.cell}>{item.student_name}</Text>
                            <Text style={styles.cell}>{getRankSymbol(item.rank)}</Text>
                          </View>
                        )}
      />
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
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
    paddingVertical: '10@vs',
    backgroundColor: '#FFF',
    
  },
  backIcon: {
    width: '24@ms',
    height: '24@vs',
  },
  notificationIcon: {
    width: '24@ms',
    height: '24@vs',
  },
  headerText: {
    fontSize: '17@ms',
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: '15@s',
    marginVertical: '10@vs',
    paddingHorizontal: '10@s',
    borderRadius: '10@s',
  
  },
  searchInput: {
    flex: 1,
    fontSize: '14@ms',
    paddingVertical: '8@vs',
    color: '#000',
  },
  searchIcon: {
    width: '20@ms',
    height: '20@vs',
    tintColor: '#999',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: '20@s',
    paddingVertical: '10@vs',
    backgroundColor: '#fff',
  },
  headerCell: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-SemiBold',
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    paddingVertical: '10@vs',
    paddingHorizontal: '20@s',
  },
  rowWhite: {
    backgroundColor: '#FFFFFF',
  },
  rowGrey: {
    backgroundColor: '#F2F2F2',
  },
  cell: {
    fontSize: '13@ms',
    fontFamily: 'Poppins-Regular',
    color: '#000',
  },
});

export default ParentsHallOfExcellence;
