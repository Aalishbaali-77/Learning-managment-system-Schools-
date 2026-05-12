import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getAccessToken, getUserData, setAccessToken, removeUserData, removeAccessToken, User, setUserData } from '../utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';



type UserContextType = {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  updateUser: (updatedUser: User) => void; 
  logout: () => void;
  loading: boolean; // Add loading state here
};

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await getAccessToken();
        // console.log('Retrieved token:', token);

        if (token) {
          const userData = await getUserData();
          
          setUser(userData)
        } else {
         
          setUser(null)
        }
      } catch (error) {
       // console.error('Error loading user data:', error);
       
        setUser(null)
      } finally {
        setLoading(false); // Mark loading as complete
      }
    };

    loadUser();
  }, []);


  const updateUser = async (updatedUser: User) => {
    if(!updatedUser){
      // console.log('User is empty');
      
      return;
      

    }
    setUser(updatedUser);
    // Optionally, save the updated user to AsyncStorage
    // setUserData(updatedUser); 
    await setUserData(updatedUser)
    
  };

  const logout = async () => {
    
    setUser(null)
    
    await removeAccessToken(); // Remove access token from AsyncStorage
    await removeUserData(); // Remove user data from AsyncStorage
  };

  if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      );
    }

  return (
    <UserContext.Provider value={{ user, setUser, updateUser, logout, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
 
 
  
  return context;
};

const styles = ScaledSheet.create({
 
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)', // Optional semi-transparent background
  },
})
