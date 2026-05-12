import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import {Checkbox} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';
import {Dropdown} from 'react-native-element-dropdown';
import api from '../../api';
import {useUser} from '../../Context/UserContext';
import {useSubjects} from '../../Context/TeacherSubjectContext';
import {ASSET_URL, ASSET_URL_UNIFORM} from '../../constants';
import {Alert} from 'react-native';
import {useOrder} from '../../Context/OrderContext';

const BooksUniformScreen = () => {
  // State management
  const [notebookList, setNotebooksList] = useState([]); // Empty initial array
  const [booksList, setBooksList] = useState([]); // Empty initial array
  const [uniformList, setUniformList] = useState([]); // Empty initial array
  const navigation = useNavigation();
  const {user} = useUser();
  const [loading, setLoading] = useState(false);
  const sectionId = useSubjects();
  const [placingOrder, setPlacingOrder] = useState(false);
  const {state, dispatch} = useOrder();

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true); // Show loading when starting
        await Promise.all([
          fetchNotebookList(),
          fetchBooksList(),
          fetchUniformList(),
        ]);
      } catch (error) {
       // console.error('Error fetching data:', error);
      } finally {
        setLoading(false); // Hide loading when done (success or error)
      }
    };

    fetchAllData();
  }, []);

  const fetchNotebookList = async () => {
    try {
      const payload = {
        school_id: user?.company_id,
        school_campus_id: user?.school_campus_id,
        section_id: sectionId,
      };

      const response = await api.protected.post('e-com/notebook-list', payload);

      if (response?.data?.status === 'success') {
        const processedData = response.data.data.map(item => ({
          ...item,
          quantity: 0, // Initialize quantity to 0
          checked: false, // Initialize checked to false
          price: parseFloat(item.price),
          name: item.subject_name, // Convert price string to number
        }));
        setNotebooksList(processedData);
      } else {
        // console.error(
        //   'Failed to fetch notebook list:',
        //   response?.data?.message,
        // );
      }
    } catch (error) {
    //  console.error('Error fetching notebook list:', error);
    }
  };

  const fetchBooksList = async () => {
    try {
      const payload = {
        school_id: user?.company_id,
        school_campus_id: user?.school_campus_id,
        section_id: sectionId,
      };

      const response = await api.protected.post('e-com/textbook-list', payload);

      if (response?.data?.status === 'success') {
        const processedData = response.data.data.map(item => ({
          ...item,
          quantity: 0,
          checked: false,
          price: parseFloat(item.price),
          name: item.title,
          // Add any additional necessary transformations
        }));
        setBooksList(processedData);
      } else {
        //console.error('Failed to fetch books list:', response?.data?.message);
      }
    } catch (error) {
      //console.error('Error fetching books list:', error);
    }
  };

  const fetchUniformList = async () => {
    try {
      const payload = {
        school_id: user?.company_id,
        school_campus_id: user?.school_campus_id,
      };

      const response = await api.protected.post('e-com/uniform-list', payload);

      if (response?.data?.status === 'success') {
        const processedData = response.data.data.map(item => ({
          id: item.id,
          name: item.uniform_item_name,
          image: `${ASSET_URL_UNIFORM}${item.uniform_image}`,
          sizeChart: item.size_chart,
          selectedSize: item.details[0] || null, // Initialize with first size
          price: parseFloat(item.details[0]?.price) || 0, // Initialize with first price
          quantity: 0,
          checked: false,
          details: item.details, // Keep original details array
        }));

        setUniformList(processedData);
      }
    } catch (error) {
     // console.error('Error fetching uniform list:', error);
    }
  };

  const handlePlaceOrder = async () => {
    try {
      // Check if any items are selected
      const hasItems = [...notebookList, ...booksList, ...uniformList].some(
        item => item.checked && item.quantity > 0,
      );

      if (!hasItems) {
        Alert.alert(
          'Error',
          'Please select at least one item with quantity greater than 0',
        );
        return;
      }

      setPlacingOrder(true);

      // Prepare order items
      const orderItems = [];

      // Add notebooks
      notebookList
        .filter(item => item.checked && item.quantity > 0)
        .forEach(item => {
          orderItems.push({
            order_item_type: 2, // Note Book
            order_item_id: item.id,
            order_item_variant_id: null,
            price_per_piece: item.price,
            quantity: item.quantity,
            total_price: item.price * item.quantity, // Include the name property
            name: item.name, // Include subject_name for notebooks
          });
        });

      // Add textbooks
      booksList
        .filter(item => item.checked && item.quantity > 0)
        .forEach(item => {
          orderItems.push({
            order_item_type: 1, // Text Book
            order_item_id: item.id,
            order_item_variant_id: null,
            price_per_piece: item.price,
            quantity: item.quantity,
            total_price: item.price * item.quantity,
            author: item.author, // Include author for books
            publisher: item.publisher,
            name: item.name, // Include publisher for books
          });
        });

      // Add uniforms with size validation
      uniformList
        .filter(item => item.checked && item.quantity > 0 && item.selectedSize)
        .forEach(item => {
          orderItems.push({
            order_item_type: 3, // Uniform
            order_item_id: item.id,
            order_item_variant_id: item.selectedSize.id,
            price_per_piece: item.price,
            quantity: item.quantity,
            total_price: item.price * item.quantity,
            name: item.name, // Include the name property
            description: item.description, // Include description for uniforms
          });
          //console.log('Uniform Item:', item);
          //console.log('Uniform Item - Variant ID:', item.selectedSize.id);
          // console.log('Constructed Uniform Order Item:', uniformItem);
        });

      // Calculate grand total
      const grandTotal = orderItems.reduce(
        (sum, item) => sum + item.total_price,
        0,
      );

      // Save to context
      dispatch({
        type: 'SET_ORDER',
        payload: {
          notebooks: notebookList,
          books: booksList,
          uniforms: uniformList,
          orderItems,
          grandTotal,
        },
      });

      // Log the payload being saved to context
      // console.log('Payload saved to context:', {
      //   notebooks: notebookList,
      //   books: booksList,
      //   uniforms: uniformList,
      //   orderItems,
      //   grandTotal,
      // });

      // Navigate to confirmation screen
      navigation.navigate('ConfirmOrderScreen');
    } catch (error) {
      //console.error('Order preparation error:', error);
      Alert.alert('Error', 'Failed to prepare order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleQuantity = (stateArray, setStateFn, itemId, operation) => {
    const updated = stateArray.map(item => {
      if (item.id === itemId) {
        // Handle checked state and quantity together
        let newQuantity = item.quantity;
        let newChecked = item.checked;

        switch (operation) {
          case 'toggle':
            // Toggle checked state and set quantity to 1 if checking
            newChecked = !item.checked;
            newQuantity = newChecked ? 1 : 0;
            break;

          case 'inc':
            newQuantity = item.quantity + 1;
            newChecked = true; // Auto-check when increasing quantity
            break;

          case 'dec':
            newQuantity = Math.max(0, item.quantity - 1);
            // Auto-uncheck if quantity reaches 0
            newChecked = newQuantity > 0 ? item.checked : false;
            break;

          default:
            break;
        }

        // Force uncheck if quantity is 0 (safety check)
        if (newQuantity === 0) {
          newChecked = false;
        }

        return {
          ...item,
          quantity: newQuantity,
          checked: newChecked,
        };
      }
      return item;
    });
    setStateFn(updated);
  };

  // Calculate total price
  const calculateTotal = items =>
    items.reduce((sum, item) => sum + item.quantity * item.price, 0);

  // Modified size handler to include price changes
  const handleSizeSelect = (itemId, selectedSizeValue) => {
    setUniformList(prev =>
      prev.map(uniformItem => {
        if (uniformItem.id === itemId) {
          // Find the full size object by size value
          const sizeDetail = uniformItem.details.find(
            d => d.size === selectedSizeValue,
          );

          return {
            ...uniformItem,
            selectedSize: sizeDetail || null,
            price: sizeDetail ? parseFloat(sizeDetail.price) : 0,
          };
        }
        return uniformItem;
      }),
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
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Books & Uniform</Text>
        <TouchableOpacity onPress={()=>navigation.navigate('ParentsAnnouncement')}>
          <Icon name="notifications" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* 1. Note Books Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Note Books</Text>
        {notebookList.map(item => (
          <View key={item.id} style={styles.itemRow}>
            <Checkbox
              status={item.checked ? 'checked' : 'unchecked'}
              onPress={() =>
                handleQuantity(
                  notebookList,
                  setNotebooksList,
                  item.id,
                  'toggle',
                )
              }
            />
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                onPress={() =>
                  handleQuantity(notebookList, setNotebooksList, item.id, 'dec')
                }>
                <Icon name="remove" size={16} color="gray" />
              </TouchableOpacity>
              <Text style={styles.quantity}>{item.quantity}</Text>
              <TouchableOpacity
                onPress={() =>
                  handleQuantity(notebookList, setNotebooksList, item.id, 'inc')
                }>
                <Icon name="add" size={16} color="gray" />
              </TouchableOpacity>
            </View>
            <Text style={styles.price}>Rs. {item.price}</Text>
          </View>
        ))}
        <View style={styles.totalContainer}>
          <Text style={styles.totalText}>
            Total Price: Rs. {calculateTotal(notebookList)}
          </Text>
        </View>
      </View>

      {/* 2. Books & Authors Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Books & Authors</Text>
        {booksList.map(item => (
          <View key={item.id} style={styles.itemRow}>
            <Checkbox
              status={item.checked ? 'checked' : 'unchecked'}
              onPress={() =>
                handleQuantity(booksList, setBooksList, item.id, 'toggle')
              }
            />
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.extraText}>
                {item.author} - {item.publisher}
              </Text>
            </View>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                onPress={() =>
                  handleQuantity(booksList, setBooksList, item.id, 'dec')
                }>
                <Icon name="remove" size={16} color="gray" />
              </TouchableOpacity>
              <Text style={styles.quantity}>{item.quantity}</Text>
              <TouchableOpacity
                onPress={() =>
                  handleQuantity(booksList, setBooksList, item.id, 'inc')
                }>
                <Icon name="add" size={16} color="gray" />
              </TouchableOpacity>
            </View>
            <Text style={styles.price}>Rs. {item.price}</Text>
          </View>
        ))}
        <View style={styles.totalContainer}>
          <Text style={styles.totalText}>
            Total Price: Rs. {calculateTotal(booksList)}
          </Text>
        </View>
      </View>

      {/* 3. School Uniform Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          {/* Left Side - Title and Size Chart */}
          <View style={styles.headerLeft}>
            <Text style={styles.sectionTitle}>School Uniform</Text>
            <TouchableOpacity
              style={styles.sizeChartButton}
              onPress={() => navigation.navigate('SizeChart')}>
              <Icon name="info-outline" size={16} color="black" />
              <Text style={styles.sizeChartText}>Size Chart</Text>
            </TouchableOpacity>
          </View>

          {/* Right Side - Image Box */}
          <Image
            source={{uri: uniformList[0]?.image}}
            // onError={error =>
            //   console.log('Image load error:', error.nativeEvent.error)
            // }
            style={styles.uniformImage}
            resizeMode="contain"
          />
        </View>

        {/* Uniform Items */}
        {uniformList.map(item => (
          <View key={item.id} style={styles.itemRow}>
            <Checkbox
              status={item.checked ? 'checked' : 'unchecked'}
              onPress={() =>
                handleQuantity(uniformList, setUniformList, item.id, 'toggle')
              }
            />
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.extraText}>{item.description}</Text>
            </View>

            <View style={styles.rightSection}>
              <Text style={styles.price}>
                Rs.{' '}
                {item.selectedSize?.price
                  ? Number(item.selectedSize.price).toFixed(0)
                  : '0.00'}
              </Text>

              <View style={styles.quantityControls}>
                <TouchableOpacity
                  onPress={() =>
                    handleQuantity(uniformList, setUniformList, item.id, 'dec')
                  }>
                  <Icon name="remove" size={16} color="gray" />
                </TouchableOpacity>
                <Text style={styles.quantity}>{item.quantity}</Text>
                <TouchableOpacity
                  onPress={() =>
                    handleQuantity(uniformList, setUniformList, item.id, 'inc')
                  }>
                  <Icon name="add" size={16} color="gray" />
                </TouchableOpacity>
              </View>
              <Dropdown
                style={styles.dropdown}
                data={item.details}
                labelField="size"
                valueField="size" // Still use size as value
                placeholder="Select Size"
                value={item.selectedSize?.size}
                onChange={selectedSize => {
                  // Pass the size value to handler
                  handleSizeSelect(item.id, selectedSize.size);
                }}
                renderItem={size => (
                  <View style={styles.sizeItem}>
                    <Text style={styles.sizeText}>{size.size}</Text>
                  </View>
                )}
              />
            </View>
          </View>
        ))}
        <View style={styles.totalContainer}>
          <Text style={styles.totalText}>
            Total Price: Rs. {calculateTotal(uniformList)}
          </Text>
        </View>
      </View>

      {/* Buy Button */}
      <TouchableOpacity
        style={[styles.buyButton, placingOrder && styles.disabledButton]}
        onPress={handlePlaceOrder}
        disabled={placingOrder}>
        <Text style={styles.buyText}>
          {placingOrder ? 'Processing...' : 'Proceed to Payment'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)', // Optional semi-transparent background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '15@ms',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: '18@ms',
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    padding: '15@ms',
    margin: '10@ms',
    borderRadius: '10@ms',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: '16@ms',
    fontFamily: 'Poppins-Medium',
    color: '#333',
    marginBottom: '10@ms',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: '10@ms',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '10@ms',
    flexShrink: 1, // Prevent overflow
  },
  itemDetails: {
    flex: 1,
    minWidth: '80@ms', // Prevent content squishing
  },
  price: {
    fontSize: '11@ms',
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
    color: '#333',
    width: '40@ms', // Fixed width for price
    textAlign: 'right',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: '20@ms',
    minWidth: '60@ms', // Fixed width for quantity controls
    justifyContent: 'space-between',
  },
  dropdown: {
    width: '70@ms', // Reduced width
    height: '35@ms',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: '8@ms',
    paddingHorizontal: '8@ms',
  },
  itemName: {
    fontSize: '11@ms',
    fontFamily: 'Poppins-Regular',
    color: '#333',
    flex: 1,
    marginLeft: '10@ms',
  },
  extraText: {
    fontSize: '10@ms',
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginTop: '4@ms',
  },

  quantity: {
    fontSize: '11@ms',
    marginHorizontal: '10@ms',
    fontFamily: 'Poppins-Regular',
    color: '#333',
    minWidth: '20@ms',
    textAlign: 'center',
  },

  placeholderStyle: {
    fontSize: '9@ms', // Smaller font size
    color: '#999', // Placeholder color
    fontFamily: 'Poppins-Regular', // Add custom font if needed
  },
  sizeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  sizeText: {
    fontSize: 14,
    color: '#333',
  },
  priceText: {
    fontSize: 14,
    color: '#666',
  },
  dropdownItemText: {
    fontSize: '10@ms',
    fontFamily: 'Poppins-Regular',
    color: '#333',
  },
  selectedDropdownText: {
    fontSize: '10@ms',
    fontFamily: 'Poppins-Regular',
    color: '#2196F3',
  },

  totalContainer: {
    marginTop: '15@ms',
    paddingVertical: '10@ms',
    backgroundColor: 'black',
    top: '15@ms',
    borderBottomEndRadius: '10@ms',
    borderBottomStartRadius: '10@ms',
    marginHorizontal: '-15@ms', // Offset parent's horizontal padding
    
  },
  totalText: {
    color: '#fff',
    textAlign: 'center',
    fontFamily: 'Poppins-Medium',
  },
  buyButton: {
    backgroundColor: '#E01616',
    padding: '15@ms',
    width: '50%',
    margin: '15@ms',
    borderRadius: '50@ms',
    alignItems: 'center',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buyText: {
    color: 'white',
    fontSize: '14@ms',
    fontFamily: 'Poppins-Medium',
  },
  sizeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: '10@ms',
  },
  sizeButton: {
    borderWidth: 1,
    borderColor: '#DDD',
    padding: '8@ms',
    borderRadius: '5@ms',
    width: '40@ms',
    alignItems: 'center',
  },
  selectedSize: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  sizeText: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
  selectedSizeText: {
    color: 'white',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10@ms',
  },
  headerLeft: {
    flex: 1,
    marginRight: '10@ms',
  },
  uniformImage: {
    width: '80@ms',
    height: '80@ms',
    borderRadius: '8@ms',
  },
  sizeChartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: '8@ms',
    backgroundColor: '#F0F0F0',
    padding: '8@ms',
    borderRadius: '5@ms',
    alignSelf: 'flex-start',
  },
  sizeChartText: {
    marginLeft: '5@ms',
    fontSize: '12@ms',
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
});

export default BooksUniformScreen;
