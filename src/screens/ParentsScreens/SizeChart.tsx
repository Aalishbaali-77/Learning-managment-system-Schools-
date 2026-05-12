import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, FlatList, ActivityIndicator } from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../api';
import { useUser } from '../../Context/UserContext';
import { ASSET_URL_UNIFORM } from '../../constants';


const SizeChart = () => {
  const navigation = useNavigation();
  const [images, setImages] = useState<{ image: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const {user} = useUser();

  useEffect(() => {
    fetchSizeChartImages();
  }, []);

  const fetchSizeChartImages = async () => {
    try {
      const payload = {
        school_id: user?.company_id,
        school_campus_id: user?.school_campus_id,
      };

      const response = await api.protected.post('e-com/uniform-list', payload);

      if (response?.data?.status === 'success') {
        const imageList = response.data.data.map(item => ({
          image: `${ASSET_URL_UNIFORM}${item.size_chart}`,
        })); // Adjust key as per API response
        console.log('imageList:', imageList);
        
        setImages(imageList);
      } else {
      //  console.error('Failed to fetch size chart images:', response?.data?.message);
      }
    } catch (error) {
      //console.error('Error fetching size chart images:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: { image: string } }) => (
    <View style={styles.chartContainer}>
      <Image 
        source={{ uri: item.image }} 
        style={styles.chartImage} 
        resizeMode="contain"
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Size Chart</Text>
        <TouchableOpacity>
          <Icon name="notifications" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Loader */}
      {loading ? (
        <ActivityIndicator size="large" color="black" style={styles.loader} />
      ) : (
        <FlatList
          data={images}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '15@ms',
    backgroundColor: '#F8F8F8',
  },
  headerTitle: {
    fontSize: '18@ms',
    fontFamily: 'Poppins-Bold',
  },
  listContainer: {
    paddingBottom: '20@ms',
  },
  chartContainer: {
    backgroundColor: '#F8F8F8',
    margin: '10@ms',
    borderRadius: '10@ms',
    height: '400@ms',
    padding: '5@ms',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartImage: {
    width: '100%',
    height: '100%',
    borderRadius: '10@ms',
  },
  loader: {
    marginTop: '50@ms',
  },
});

export default SizeChart;
