import {useNavigation} from '@react-navigation/native';
import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useOrder} from '../../Context/OrderContext';
import {useUser} from '../../Context/UserContext';
import api from '../../api';

const ConfirmOrderScreen = () => {
  const navigation = useNavigation();
  const {state: orderState, dispatch: orderDispatch} = useOrder();
  const {user} = useUser();

  // Local state for form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Define orderItems for rendering the order summary
  const orderItems = [
    ...orderState.notebooks.filter(item => item.checked),
    ...orderState.books.filter(item => item.checked),
    ...orderState.uniforms.filter(item => item.checked),
  ].map(item => ({
    ...item, // Spread all properties of the item
    order_item_type:
      item.type === 'notebook' ? 2 : item.type === 'book' ? 1 : 3,
    order_item_id: item.id,
    order_item_variant_id:
      item.type === 'uniform' ? item.selectedSize?.id : null,
    price_per_piece: item.price,
    total_price: item.price * item.quantity,
  }));

  const handleConfirmOrder = async () => {
    try {
      // Validate required fields
      if (!firstName || !lastName || !phone || !email) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }

      // Use the orderItems array directly from the context
      const orderItems = orderState.orderItems;

      // Prepare payload
      const payload = {
        school_id: user?.company_id,
        school_campus_id: user?.school_campus_id,
        user_id: user?.id,
        user_type: 3,
        first_name: firstName,
        last_name: lastName,
        phone_no: phone,
        email: email,
        grand_total: orderState.grandTotal,
        order_items: orderItems,
      };

      // Log the payload for debugging
     // console.log('Confirm Order Payload:', payload);

      // Make API call
      const response = await api.protected.post('e-com/place-order', payload);

      if (response.data.status === 'success') {
        // Reset order context
        orderDispatch({type: 'RESET_ORDER'});

        Alert.alert('Order Successful');
       // console.log('Order placed successfully:', response.data.message);
        navigation.goBack();
      } else {
        Alert.alert('Error', response.data.message || 'Failed to place order');
       // console.log('Order placement error:', response.data.message);
      }
    } catch (error) {
      //console.error('Order placement error:', error);
      Alert.alert(
        'Error', 'Failed to place order. Please try again.',
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Books & Uniform</Text>
        <TouchableOpacity>
          <Icon name="notifications" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* User Input Fields */}
      <View style={styles.inputRow}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      {/* Order Summary */}
      {/* Order Summary */}
      <View style={styles.summaryContainer}>
        {/* Heading */}
        <Text style={styles.summaryTitle}>Order Summary</Text>

        {/* Border after Heading */}
        <View
          style={{
            borderBottomWidth: 1,
            borderBottomColor: '#ddd',
            marginBottom: '10@ms',
          }}
        />

        {/* Subheadings */}
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>Item</Text>
          <Text style={styles.tableHeaderLeft}>Quantity</Text>
          <Text style={styles.tableHeaderLeft}>Amount</Text>
        </View>

        {/* Order Items */}
        {orderItems.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <View style={styles.itemDetails}>
              <Text style={styles.itemTitle}>{item.name}</Text>
              {item.type === 'book' && (
                <Text style={styles.itemSubText}>
                  {item.author} - {item.publisher}
                </Text>
              )}
              {item.type === 'uniform' && (
                <Text style={styles.itemSubText}>{item.description}</Text>
              )}
            </View>
            <Text style={styles.tableText}>{item.quantity}</Text>
            <Text style={styles.tableText}>
              Rs. {item.price * item.quantity}
            </Text>
          </View>
        ))}

        {/* Border after Items (before Payment Method) */}
        <View
          style={{
            borderBottomWidth: 1,
            borderBottomColor: '#ddd',
            marginVertical: '10@ms',
          }}
        />

        {/* Payment Details */}
        <View style={styles.paymentRow}>
          <Text style={styles.paymentLabel}>Payment Method</Text>
          <Text style={styles.paymentValue}>Cash on Delivery</Text>
        </View>

        {/* Grand Total */}
        <View style={styles.GrandTotalContainer}>
          <Text style={styles.grandTotalText}>Grand Total</Text>
          <Text style={styles.grandTotalText}>Rs. {orderState.grandTotal}</Text>
        </View>
      </View>

      {/* Confirm Button */}
      <TouchableOpacity
        style={styles.confirmButton}
        onPress={handleConfirmOrder}>
        <Text style={styles.confirmButtonText}>Order Confirm</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    padding: '15@ms',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20@ms',
  },
  headerTitle: {
    fontSize: '18@ms',
    fontFamily: 'Poppins-bold',
    color: '#000',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainer: {
    flex: 1,
    marginBottom: '10@ms',
    marginRight: '10@ms',
  },
  label: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-Medium',
    marginBottom: '5@ms',
    color: '#000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: '8@ms',
    paddingHorizontal: '10@ms',
    height: '40@ms',
    backgroundColor: '#fff',
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: '10@ms',
    padding: '15@ms',
    marginTop: '20@ms',
  },
  summaryTitle: {
    fontSize: '16@ms',
    fontFamily: 'Poppins-Medium',
    marginBottom: '10@ms',
    color: '#000',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: '10@ms',
    borderRadius: '5@ms',
  },
  tableHeaderText: {
    color: '#000',
    fontFamily: 'Poppins-Medium',
    flex: 1,
  },
  tableHeaderLeft: {
    color: '#000',
    fontFamily: 'Poppins-Medium',
    textAlign: 'right',
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: '10@ms',
  },
  GrandTotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: '10@ms',
    backgroundColor: '#000',
    top: '12@ms',
    marginHorizontal: '-15@ms',
    borderBottomEndRadius:'10@ms',
    borderBottomStartRadius:'10@ms',
    paddingHorizontal: '15@ms',
  },
  grandTotalText: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-Medium',
    color: '#fff',
  },
  itemDetails: {
    flex: 2,
  },
  itemTitle: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Regular',
    color: '#000',
  },
  itemSubText: {
    fontSize: '12@ms',
    color: '#000',
    fontFamily: 'Poppins-Regular',
  },
  tableText: {
    flex: 1,
    textAlign: 'center',
    fontSize: '12@ms',
    fontFamily: 'Poppins-Regular',
    color: '#000',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: '10@ms',
  },
  paymentLabel: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Medium',
    color: '#000',
  },
  paymentValue: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Regular',
    color: '#000',
  },
  orderTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#000',
    padding: '10@ms',
    borderRadius: '5@ms',
    marginTop: '10@ms',
  },
  totalText: {
    color: '#fff',
    fontFamily: 'Poppins-Medium',
    flex: 1,
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: 'red',
    paddingVertical: '12@ms',
    width: '50%',
    alignSelf:'center',
    borderRadius: '50@ms',
    marginTop: '20@ms',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: '16@ms',
    fontFamily: 'Poppins-Medium',
  },
});

export default ConfirmOrderScreen;
