import AsyncStorage from '@react-native-async-storage/async-storage';


type AccessToken = string | null;
export type User = {
  id: number;
  emp_type_multiple_campus: number;
  emp_id: number;
  student_id: number;
  emp_ids_array: string;
  acc_type: string;
  company_id: string;
  school_campus_id: number;
  school_campus_ids_array: string;
  username: string;
  mobile_no: string;
  cnic_no: string;
  sgpe: string;
  name: string;
  email: string;
  profile_pic: string;
} | null;

const TOKEN_KEY = 'access_token';
const USER_KEY = 'user_data';

const setAccessToken = async (token: AccessToken) => {
  try {
    if (token !== null) {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      // console.log('Access token stored successfully');
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY);
      // console.warn('Attempted to store a null token');
    }
  } catch (e) {
    // console.error('Error storing access token:', e);
  }
};

const getAccessToken = async (): Promise<AccessToken> => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return token;
  } catch (e) {
    // console.error('Error retrieving access token:', e);
    return null;
  }
};

const setUserData = async (user: User) => {
  try {
    if (user !== null) {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      // console.log('User data stored successfully');
    } else {
      await AsyncStorage.removeItem(USER_KEY);
      // console.warn('Attempted to store null user data');
    }
  } catch (e) {
    // console.error('Error storing user data:', e);
  }
};

const getUserData = async (): Promise<User | null> => {
  try {
    const userData = await AsyncStorage.getItem(USER_KEY);
    if (userData) {
      const parsedUser: User = JSON.parse(userData);

      // Validate or process the data if needed
      // console.log('Retrieved user data:', parsedUser);
      return parsedUser;
    } else {
      // console.log('No user data found in storage.');
      return null;
    }
  } catch (error) {
    // console.error('Error retrieving user data:', error);
    return null;
  }
};



const removeAccessToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    // console.log('Access token removed successfully');
  } catch (e) {
    // console.error('Error removing access token:', e);
  }
};

const removeUserData = async () => {
  try {
    await AsyncStorage.removeItem(USER_KEY);
    // console.log('User data removed successfully');
  } catch (e) {
    // console.error('Error removing user data:', e);
  }
};

export {
  setAccessToken,
  getAccessToken,
  setUserData,
  getUserData,
  removeAccessToken,
  removeUserData,
};