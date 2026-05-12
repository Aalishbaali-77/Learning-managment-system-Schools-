import './i18n/i18n';
import {NavigationContainer, TabRouter} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React, {Profiler, useEffect, useState} from 'react';
import 'react-native-gesture-handler';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createDrawerNavigator} from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as Animatable from 'react-native-animatable';
import {
  ActivityIndicator,
  Alert,
  Appearance,
  StyleSheet,
  TouchableOpacity,
  View,
  StatusBar,
  TextInput,
} from 'react-native';

import {
  AnimatedTabBarNavigator,
  DotSize,
  TabElementDisplayOptions,
  IAppearanceOptions,
  TabButtonLayout,
} from 'react-native-animated-nav-tab-bar';
import {BottomTabBarButtonProps} from '@react-navigation/bottom-tabs';
import {ParamListBase} from '@react-navigation/native';
import {TransitionSpecs, CardStyleInterpolators} from '@react-navigation/stack';
import {SafeAreaProvider, SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import Home from './screens/Home';
import ChatbotScreen from './screens/Chatbot';
import AttendanceScreen from './screens/Attendance';
import AnnouncementScreen from './screens/Announcements';
import FeesHistoryScreen from './screens/FeesHistory';
import AcademicCalendarScreen from './screens/AcademicCalendar';
import CourseDetails from './screens/CourseDetails';
import TaskHistoryScreen from './screens/Teachers_lms_screen/TaskHistoryScreen';
import CheckTaskScreen from './screens/Teachers_lms_screen/Checktaskscreen';
import Teacherattendance from './screens/Teachers_lms_screen/TeachersAttendance';
import AttandeneHistory from './screens/Teachers_lms_screen/AttandeneHistory';
import TeachersSubjects from './screens/Teachers_lms_screen/TeachersSubjects';
import TeachersSubjectDetails from './screens/Teachers_lms_screen/TeachersSubjectDetails';
import TeachersHome from './screens/Teachers_lms_screen/TeachersHome';
import TeachersDraftTask from './screens/Teachers_lms_screen/TeachersDraftTask';
import TeachersAttendance from './screens/Teachers_lms_screen/TeachersAttendance';
import PublishEditTaskScreen from './screens/Teachers_lms_screen/PublishEditTaskScreen';
import AddTaskScreen from './screens/Teachers_lms_screen/AddTaskScreen';
import SubjectTasksScreen from './screens/SubjectTasksScreen';
import EditDraftTaskScreen from './screens/Teachers_lms_screen/EditDraftTaskScreen';
import AddTestScreen from './screens/Teachers_lms_screen/AddTestScreen';
import DraftTest from './screens/Teachers_lms_screen/DraftTest';
import EditDraftTest from './screens/Teachers_lms_screen/EditDraftTest';
import PublishEditTest from './screens/Teachers_lms_screen/PublishEditTest';
import TeacherTaskHistoryDetail from './screens/Teachers_lms_screen/TeacherTaskHistoryDetail';
import TeacherTaskHistory from './screens/Teachers_lms_screen/TeacherTaskHistory';
import TeacherCheckTest from './screens/Teachers_lms_screen/TeacherCheckTest';
import TeacherTestHistory from './screens/Teachers_lms_screen/TeacherTestHistory';
import TeacherTestHistoryDetail from './screens/Teachers_lms_screen/TeacherTestHistoryDetail';
import TeacherAnnouncement from './screens/Teachers_lms_screen/TeacherAnnouncement';
import {UserProvider, useUser} from './Context/UserContext';
import TeacherProfile from './screens/Teachers_lms_screen/TeacherProfile';
import StudentProfile from './screens/StudentProfile';
import {SubjectProvider} from './Context/TeacherSubjectContext';
import StartScreen from './screens/StartScreen';
import TeachersAcademicCalendar from './screens/Teachers_lms_screen/TeachersAcademicCalender';
import StudentTaskHistory from './screens/StudentTaskHistory';
import StudentTestHistory from './screens/StudentTestHistory';
import CampusSelection from './screens/Teachers_lms_screen/CampusSelection';
import StudentTimetable from './screens/StudentTimetable';
import Classprogress from './screens/Teachers_lms_screen/Classprogress';
import ClassProgressDetail from './screens/Teachers_lms_screen/ClassProgressDetail';
import ParentsAcademicCalendar from './screens/ParentsScreens/ParentsAcademicCalendar';
import ParentsAnnouncement from './screens/ParentsScreens/ParentsAnnouncements';
import ParentsAttendance from './screens/ParentsScreens/ParentsAttendance';
import ParentsFeesHistory from './screens/ParentsScreens/ParentsFeesHistory';
import ParentsHome from './screens/ParentsScreens/ParentsHome';
import ParentsProfile from './screens/ParentsScreens/ParentsProfile';
import ParentsSubjectTasks from './screens/ParentsScreens/ParentsSubjectTasks';
import ParentsTaskHistory from './screens/ParentsScreens/ParentsTaskHistory';
import ParentsTestHistory from './screens/ParentsScreens/ParentsTestHistory';
import ParentsTimetable from './screens/ParentsScreens/ParentsTimetable';
import LoginSelection from './screens/LoginSelection';
import ParentsLogin from './screens/ParentsScreens/ParentsLogin';
import ParentsStudentSelection from './screens/ParentsScreens/ParentStudentSelection';
import {getUserData} from './utils/storage';
import CustomStudentDrawerContent from './screens/DrawerComponents/StudentHomeDrawer';
import {
  NotificationsService,
  requestUserPermission,
} from './firebase/NotificationListener';
import messaging from '@react-native-firebase/messaging';
import CustomTeacherDrawerContent from './screens/DrawerComponents/TeacherHomeDrawer';
import {
  Provider as PaperProvider,
  MD3LightTheme,
  MD3DarkTheme,
} from 'react-native-paper';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {Text} from 'react-native';
import StudentProgress from './screens/StudentProgressDetails';
import ParentsStudentProgress from './screens/ParentsScreens/ParentsStudentProgress';
import StudentExamSchedule from './screens/StudentExamSchedule';
import ParentsStudentExamSchedule from './screens/ParentsScreens/ParentsStudentExamSchedule';
import CheckExam from './screens/Teachers_lms_screen/CheckExam';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {NotificationHandler} from './firebase/NotificationHandler';
import ResponsiveProvider from 'react-native-responsive-ui';
import {moderateScale, scale, verticalScale} from 'react-native-size-matters';
import AllSubjects from './screens/Teachers_lms_screen/AllSubjects';
import ParentsRequestEmail from './screens/ParentsScreens/ParentsRequestEmail';
import ParentsRequestStudentEmail from './screens/ParentsScreens/ParentsRequestStudentEmail';
import ParentsVerifyOTP from './screens/ParentsScreens/ParentsVerifyOTP';
import ParentsResetPassword from './screens/ParentsScreens/ParentsResetPassword';
import TeachersRequestEmail from './screens/Teachers_lms_screen/TeachersRequestEmail';
import TeachersVerifyOTP from './screens/Teachers_lms_screen/TeachersVerifyOTP';
import TeachersResetPassword from './screens/Teachers_lms_screen/TeachersResetPassword';
import Chats from './screens/Chats';
import ChatRoom from './screens/ChatRoom';
import Quizconceptbuilder from './screens/Teachers_lms_screen/Quizconceptbuilder';
import QuizGenerator from './screens/Teachers_lms_screen/QuizGenerator';
import TopicSuggestion from './screens/Teachers_lms_screen/TopicSuggestion';
import UpdatedClassProgress from './screens/Teachers_lms_screen/UpdatedClassProgress';
import UpdatedClassProgressDetail from './screens/Teachers_lms_screen/UpdatedClassProgressDetail';
import LeaveApproval from './screens/Teachers_lms_screen/LeaveApproval';
import SubjectProgress from './screens/Teachers_lms_screen/SubjectProgress';
import BooksUniformScreen from './screens/ParentsScreens/BooksUniformScreen';
import HallOfExcellence from './screens/HallOfExcellence';
import TicketSupport from './screens/TicketSupport';
import CreateTicket from './screens/CreateTicket';
import SupportDetail from './screens/SupportDetail';
import SizeChart from './screens/ParentsScreens/SizeChart';
import ConfirmOrderScreen from './screens/ParentsScreens/ConfirmOrderScreen';
import UploadHomework from './screens/UploadHomework';
import ViewTask from './screens/Teachers_lms_screen/ViewTask';
import {OrderProvider} from './Context/OrderContext';
import ApplyLeave from './screens/ParentsScreens/ApplyLeave';
import LeaveForm from './screens/ParentsScreens/LeaveForm';
import ViewSubmission from './screens/ViewSubmission';
import TeachersChats from './screens/Teachers_lms_screen/TeacherChats';
import TeachersChatRoom from './screens/Teachers_lms_screen/TeachersChatRoom';
import TeachersHallOfExcellence from './screens/Teachers_lms_screen/TeachersHallOfExcellence';
import ParentsHallOfExcellence from './screens/ParentsScreens/ParentsHallOfExcellence';
import { API_URL } from '@env';



export type RootStackParamList = {
  Home: undefined;
  SubjectTasksScreen: undefined;
  Chatbot: undefined;
  Attendance: undefined;
  Announcements: undefined;
  FeesHistory: undefined;
  AcademicCalendar: undefined;
  CourseDetails: undefined;
  Chats: undefined;
  ChatRoom: undefined;
  TaskHistoryScreen: undefined;
  StudentProgress: undefined;
  StudentExamSchedule: undefined;
  CheckTaskScreen: undefined;
  Teacherattendance: undefined;
  AttandeneHistory: undefined;
  TeachersSubjects: undefined;
  TeachersSubjectDetails: undefined;
  TeachersHome: undefined;
  TeachersDraftTask: undefined;
  TeachersAttendance: undefined;
  PublishEditTaskScreen: undefined;
  AddTaskScreen: undefined;
  StartScreen: undefined;
  EditDraftTaskScreen: undefined;
  AddTestScreen: undefined;
  DraftTest: undefined;
  EditDraftTest: undefined;
  PublishEditTest: undefined;
  TeacherTaskHistoryDetail: undefined;
  TeacherTaskHistory: undefined;
  TeacherCheckTest: undefined;
  TeacherTestHistory: undefined;
  TeacherTestHistoryDetail: undefined;
  TeacherAnnouncement: undefined;
  TeacherProfile: undefined;
  TeachersRequestEmail: undefined;
  TeachersVerifyOTP: undefined;
  TeachersResetPassword: undefined;
  StudentProfile: undefined;
  TeachersAcademicCalendar: undefined;
  StudentTaskHistory: undefined;
  StudentTestHistory: undefined;
  CampusSelection: undefined;
  StudentTimetable: undefined;
  Classprogress: undefined;
  ClassProgressDetail: undefined;
  ParentsLogin: undefined;
  ParentsAcademicCalendar: undefined;
  ParentsAnnouncement: undefined;
  ParentsAttendance: undefined;
  ParentsFeesHistory: undefined;
  ParentsHome: undefined;
  ParentsProfile: undefined;
  ParentsSubjectTasks: undefined;
  ParentsTaskHistory: undefined;
  ParentsTestHistory: undefined;
  ParentsTimetable: undefined;
  LoginSelection: undefined;
  ParentsStudentSelection: undefined;
  ParentsStudentProgress: undefined;
  ParentsRequestEmail: undefined;
  ParentsRequestStudentEmail: undefined;
  ParentsVerifyOTP: undefined;
  ParentsResetPassword: undefined;
  HomeDrawer: undefined;
  ParentsStudentExamSchedule: undefined;
  CheckExam: undefined;
  Quizconceptbuilder: undefined;
  QuizGenerator: undefined;
  TopicSuggestion: undefined;
  UpdatedClassProgress: undefined;
  UpdatedClassProgressDetail: undefined;
  LeaveApproval: undefined;
  ApplyLeave: undefined;
  LeaveForm: undefined;
  SubjectProgress: undefined;
  BooksUniformScreen: undefined;
  HallOfExcellence: undefined;
  TicketSupport: undefined;
  CreateTicket: undefined;
  SupportDetail: undefined;
  SizeChart: undefined;
  ConfirmOrderScreen: undefined;
  UploadHomework: undefined;
  ViewTask: undefined;
  ViewSubmission: undefined;
  TeachersChatRoom: undefined;
  TeachersChats: undefined;
  TeachersHallOfExcellence: undefined;
  ParentsHallOfExcellence: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = AnimatedTabBarNavigator<RootStackParamList>();
const AnimatedIcon = Animatable.createAnimatableComponent(Icon);
const Drawer = createDrawerNavigator();



const HomeDrawer = () => (
  <Drawer.Navigator
    initialRouteName="Home"
    drawerContent={props => <CustomTeacherDrawerContent {...props} />}
    screenOptions={{
      headerShown: false, // Drawer-specific header
      drawerActiveTintColor: '#000', // Active item color
      drawerInactiveTintColor: '#000', // Inactive item color
      drawerLabelStyle: {
        fontSize: moderateScale(14),
        fontFamily: 'Poppins-Medium',
      },
      drawerStyle: {
        backgroundColor: '#fff', // Background color of the drawer
        borderTopRightRadius: moderateScale(70), // Top-right border radius
        overflow: 'hidden', // Ensure content doesn't overflow
      },
    }}>
    <Drawer.Screen
      name="Home"
      component={TeachersHome}
      options={{
        drawerLabel: ({color}) => (
          <Text
            style={{
              color,
              fontFamily: 'Poppins-Regular',
              fontSize: moderateScale(14),
            }}>
            Home
          </Text> // Custom text styling
        ),
        drawerIcon: ({focused}) => (
          <FontAwesome
            name="home"
            size={moderateScale(24)}
            color={focused ? '#555' : '#FAA51A'}
          /> // Custom icon color
        ),
      }}
    />
    {/* <Drawer.Screen
      name="Class Progress"
      component={UpdatedClassProgress}
      options={{
        drawerLabel: ({color}) => (
          <Text
            style={{
              color,
              fontFamily: 'Poppins-Regular',
              fontSize: moderateScale(14),
            }}>
            Class Progress
          </Text> // Custom text styling
        ),
        drawerIcon: ({focused}) => (
          <FontAwesome
            name="bar-chart"
            size={moderateScale(24)}
            color={focused ? '#555' : '#FAA51A'}
          /> // Custom icon color
        ),
      }}
    /> */}
    <Drawer.Screen
      name="Subjects"
      component={AllSubjects}
      options={{
        drawerLabel: ({color}) => (
          <Text
            style={{
              color,
              fontFamily: 'Poppins-Regular',
              fontSize: moderateScale(14),
            }}>
            Subjects
          </Text> // Custom text styling
        ),
        drawerIcon: ({focused}) => (
          <FontAwesome
            name="bar-chart"
            size={moderateScale(24)}
            color={focused ? '#555' : '#FAA51A'}
          /> // Custom icon color
        ),
      }}
    />
    <Drawer.Screen
      name="Attendance"
      component={Teacherattendance}
      options={{
        drawerLabel: ({color}) => (
          <Text
            style={{
              color,
              fontFamily: 'Poppins-Regular',
              fontSize: moderateScale(14),
            }}>
            Attendance
          </Text> // Custom text styling
        ),
        drawerIcon: ({focused}) => (
          <FontAwesome
            name="calendar-check-o"
            size={moderateScale(24)}
            color={focused ? '#555' : '#FAA51A'}
          />
        ),
      }}
    />
    <Drawer.Screen
      name="Announcements"
      component={TeacherAnnouncement}
      options={{
        drawerLabel: ({color}) => (
          <Text
            style={{
              color,
              fontFamily: 'Poppins-Regular',
              fontSize: moderateScale(14),
            }}>
            Announcements
          </Text> // Custom text styling
        ),
        drawerIcon: ({focused}) => (
          <FontAwesome
            name="bullhorn"
            size={moderateScale(24)}
            color={focused ? '#555' : '#FAA51A'}
          />
        ),
      }}
    />
    <Drawer.Screen
      name="Academic Calender"
      component={TeachersAcademicCalendar}
      options={{
        drawerLabel: ({color}) => (
          <Text
            style={{
              color,
              fontFamily: 'Poppins-Regular',
              fontSize: moderateScale(14),
            }}>
            Academic Calender
          </Text> // Custom text styling
        ),
        drawerIcon: ({focused}) => (
          <FontAwesome
            name="calendar"
            size={moderateScale(24)}
            color={focused ? '#555' : '#FAA51A'}
          />
        ),
      }}
    />
    {/* <Drawer.Screen
      name="AI Quiz and Topics"
      component={Quizconceptbuilder}
      options={{
        drawerLabel: ({color}) => (
          <Text
            style={{
              color,
              fontFamily: 'Poppins-Regular',
              fontSize: moderateScale(14),
            }}>
            AI Quiz and Topics
          </Text> // Custom text styling
        ),
        drawerIcon: ({focused}) => (
          <FontAwesome
            name="microchip"
            size={moderateScale(24)}
            color={focused ? '#555' : '#FAA51A'}
          />
        ),
      }}
    /> */}
    <Drawer.Screen
      name="Students Leave"
      component={LeaveApproval}
      options={{
        drawerLabel: ({color}) => (
          <Text
            style={{
              color,
              fontFamily: 'Poppins-Regular',
              fontSize: moderateScale(14),
            }}>
            Students Leave
          </Text> // Custom text styling
        ),
        drawerIcon: ({focused}) => (
          <FontAwesome
            name="wpforms"
            size={moderateScale(24)}
            color={focused ? '#555' : '#FAA51A'}
          />
        ),
      }}
    />
     <Drawer.Screen
      name="Chats"
      component={TeachersChats}
      options={{
        drawerLabel: ({color}) => (
          <Text
            style={{
              color,
              fontFamily: 'Poppins-Regular',
              fontSize: moderateScale(14),
            }}>
            Chats
          </Text> // Custom text styling
        ),
        drawerIcon: ({focused}) => (
          <FontAwesome
            name="comments"
            size={moderateScale(24)}
            color={focused ? '#555' : '#FAA51A'}
          />
        ),
      }}
    />
  </Drawer.Navigator>
);

const StudentHomeDrawer = () => (
  <Drawer.Navigator
    initialRouteName="Home"
    drawerContent={props => <CustomStudentDrawerContent {...props} />}
    screenOptions={{
      headerShown: false, // Drawer-specific header
      drawerActiveTintColor: '#000', // Active item color
      drawerInactiveTintColor: '#000', // Inactive item color
      drawerLabelStyle: {
        fontSize: moderateScale(14),
        fontFamily: 'Poppins-Medium',
      },
      drawerStyle: {
        backgroundColor: '#fff', // Background color of the drawer
        borderTopRightRadius: moderateScale(70), // Top-right border radius
        overflow: 'hidden', // Ensure content doesn't overflow
      },
    }}>
    <Drawer.Screen
      name="Home"
      component={Home}
      options={{
        drawerLabel: ({color}) => (
          <Text
            style={{
              color,
              fontFamily: 'Poppins-Regular',
              fontSize: moderateScale(14),
            }}>
            Home
          </Text> // Custom text styling
        ),
        drawerIcon: ({focused}) => (
          <FontAwesome
            name="home"
            size={moderateScale(24)}
            color={focused ? '#555' : '#FAA51A'}
          />
        ),
      }}
    />
    <Drawer.Screen
      name="Attendance"
      component={AttendanceScreen}
      options={{
        drawerLabel: ({color}) => (
          <Text
            style={{
              color,
              fontFamily: 'Poppins-Regular',
              fontSize: moderateScale(14),
            }}>
            Attendance
          </Text> // Custom text styling
        ),
        drawerIcon: ({focused}) => (
          <FontAwesome
            name="calendar-check-o"
            size={moderateScale(24)}
            color={focused ? '#555' : '#FAA51A'}
          />
        ),
      }}
    />
    <Drawer.Screen
      name="Announcements"
      component={AnnouncementScreen}
      options={{
        drawerLabel: ({color}) => (
          <Text
            style={{
              color,
              fontFamily: 'Poppins-Regular',
              fontSize: moderateScale(14),
            }}>
            Announcements
          </Text> // Custom text styling
        ),
        drawerIcon: ({focused}) => (
          <FontAwesome
            name="bullhorn"
            size={moderateScale(24)}
            color={focused ? '#555' : '#FAA51A'}
          />
        ),
      }}
    />
    <Drawer.Screen
      name="Time Table"
      component={StudentTimetable}
      options={{
        drawerLabel: ({color}) => (
          <Text
            style={{
              color,
              fontFamily: 'Poppins-Regular',
              fontSize: moderateScale(14),
            }}>
            Time Table
          </Text> // Custom text styling
        ),
        drawerIcon: ({focused}) => (
          <FontAwesome
            name="book"
            size={moderateScale(24)}
            color={focused ? '#555' : '#FAA51A'}
          />
        ),
      }}
    />
    <Drawer.Screen
      name="Exam Schedule"
      component={StudentExamSchedule}
      options={{
        drawerLabel: ({color}) => (
          <Text
            style={{
              color,
              fontFamily: 'Poppins-Regular',
              fontSize: moderateScale(14),
            }}>
            Exam Schedule
          </Text> // Custom text styling
        ),
        drawerIcon: ({focused}) => (
          <FontAwesome
            name="clipboard"
            size={moderateScale(24)}
            color={focused ? '#555' : '#FAA51A'}
          />
        ),
      }}
    />
    <Drawer.Screen
      name="Chats"
      component={Chats}
      options={{
        drawerLabel: ({color}) => (
          <Text
            style={{
              color,
              fontFamily: 'Poppins-Regular',
              fontSize: moderateScale(14),
            }}>
            Chats
          </Text> // Custom text styling
        ),
        drawerIcon: ({focused}) => (
          <FontAwesome
            name="comments"
            size={moderateScale(24)}
            color={focused ? '#555' : '#FAA51A'}
          />
        ),
      }}
    />
    <Drawer.Screen
      name="TicketSupport"
      component={TicketSupport}
      options={{
        drawerLabel: ({color}) => (
          <Text
            style={{
              color,
              fontFamily: 'Poppins-Regular',
              fontSize: moderateScale(14),
            }}>
            Support
          </Text> // Custom text styling
        ),
        drawerIcon: ({focused}) => (
          <FontAwesome
            name="phone"
            size={moderateScale(24)}
            color={focused ? '#555' : '#FAA51A'}
          />
        ),
      }}
    />
  </Drawer.Navigator>
);

const ParentHomeDrawer = () => (
  <Drawer.Navigator
    initialRouteName="ParentsHome"
    drawerContent={props => <CustomStudentDrawerContent {...props} />}
    screenOptions={{
      headerShown: false, // Drawer-specific header
      drawerActiveTintColor: '#000', // Active item color
      drawerInactiveTintColor: '#000', // Inactive item color
      drawerLabelStyle: {
        fontSize: moderateScale(14),
        fontFamily: 'Poppins-Medium',
      },
      drawerStyle: {
        backgroundColor: '#fff', // Background color of the drawer
        borderTopRightRadius: moderateScale(70), // Top-right border radius
        overflow: 'hidden', // Ensure content doesn't overflow
      },
    }}>
    <Drawer.Screen
      name="Home"
      component={ParentsHome}
      options={{
        drawerLabel: ({color}) => (
          <Text
            style={{
              color,
              fontFamily: 'Poppins-Regular',
              fontSize: moderateScale(14),
            }}>
            Home
          </Text> // Custom text styling
        ),
        drawerIcon: ({focused}) => (
          <FontAwesome
            name="home"
            size={moderateScale(24)}
            color={focused ? '#555' : '#FAA51A'}
          />
        ),
      }}
    />
    <Drawer.Screen
      name="Attendance"
      component={ParentsAttendance}
      options={{
        drawerLabel: ({color}) => (
          <Text
            style={{
              color,
              fontFamily: 'Poppins-Regular',
              fontSize: moderateScale(14),
            }}>
            Attendance
          </Text> // Custom text styling
        ),
        drawerIcon: ({focused}) => (
          <FontAwesome
            name="calendar-check-o"
            size={moderateScale(24)}
            color={focused ? '#555' : '#FAA51A'}
          />
        ),
      }}
    />
    <Drawer.Screen
      name="ParentsAnnouncement"
      component={ParentsAnnouncement}
      options={{
        drawerLabel: ({color}) => (
          <Text
            style={{
              color,
              fontFamily: 'Poppins-Regular',
              fontSize: moderateScale(14),
            }}>
            Announcements
          </Text> // Custom text styling
        ),
        drawerIcon: ({focused}) => (
          <FontAwesome
            name="bullhorn"
            size={moderateScale(24)}
            color={focused ? '#555' : '#FAA51A'}
          />
        ),
      }}
    />
    <Drawer.Screen
      name="Time Table"
      component={ParentsTimetable}
      options={{
        drawerLabel: ({color}) => (
          <Text
            style={{
              color,
              fontFamily: 'Poppins-Regular',
              fontSize: moderateScale(14),
            }}>
            Time Table
          </Text> // Custom text styling
        ),
        drawerIcon: ({focused}) => (
          <FontAwesome
            name="book"
            size={24}
            color={focused ? '#555' : '#FAA51A'}
          />
        ),
      }}
    />
    <Drawer.Screen
      name="Books & Uniform"
      component={BooksUniformScreen}
      options={{
        drawerLabel: ({color}) => (
          <Text
            style={{
              color,
              fontFamily: 'Poppins-Regular',
              fontSize: moderateScale(14),
            }}>
            Books & Uniform
          </Text> // Custom text styling
        ),
        drawerIcon: ({focused}) => (
          <FontAwesome
            name="shopping-cart"
            size={24}
            color={focused ? '#555' : '#FAA51A'}
          />
        ),
      }}
    />
    <Drawer.Screen
      name="Leave Aprroval"
      component={ApplyLeave}
      options={{
        drawerLabel: ({color}) => (
          <Text
            style={{
              color,
              fontFamily: 'Poppins-Regular',
              fontSize: moderateScale(14),
            }}>
            Apply Leave
          </Text> // Custom text styling
        ),
        drawerIcon: ({focused}) => (
          <FontAwesome
            name="wpforms"
            size={moderateScale(24)}
            color={focused ? '#555' : '#FAA51A'}
          />
        ),
      }}
    />
    <Drawer.Screen
      name="TicketSupport"
      component={TicketSupport}
      options={{
        drawerLabel: ({color}) => (
          <Text
            style={{
              color,
              fontFamily: 'Poppins-Regular',
              fontSize: moderateScale(14),
            }}>
            Support
          </Text> // Custom text styling
        ),
        drawerIcon: ({focused}) => (
          <FontAwesome
            name="phone"
            size={moderateScale(24)}
            color={focused ? '#555' : '#FAA51A'}
          />
        ),
      }}
    />
  </Drawer.Navigator>
);

const AppContent = () => {
  const {user, setUser, loading} = useUser(); // Access user and setUser from context

  if ((Text as any).defaultProps == null) (Text as any).defaultProps = {};
  if ((TextInput as any).defaultProps == null) (TextInput as any).defaultProps = {};

  (Text as any).defaultProps.allowFontScaling = false;
  (TextInput as any).defaultProps.allowFontScaling = false;
  

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const userData = await getUserData(); // Fetch user data from AsyncStorage
        if (userData) {
          setUser(userData); // Set user in context
        }
      } catch (error) {
       // console.error('Error loading user data:', error);
      }
    };

    if (!user && !loading) {
      initializeUser();
    }
  }, [user, loading]); // Make sure to check loading and user state

  // Prevent rendering before the loading is complete
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const getInitialRoute = () => {
   // console.log('acc_Type', user?.acc_type); // Debugging statement

    if (!user) {
      return 'LoginSelection'; // If user is not set, navigate to LoginSelection
    } else if (user?.acc_type === 'parent') {
      return 'ParentsHome'; // Navigate to ParentsHome if acc_type is 'parent'
    } else if (user?.acc_type === 'user') {
      return 'Home'; // Navigate to Home if acc_type is 'user'
    } else if (user?.acc_type === 'superadmin') {
      return 'TeachersHome'; // Navigate to TeachersHome if acc_type is 'superadmin'
    } else {
      return 'LoginSelection'; // Fallback if no match
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={getInitialRoute()}
        screenOptions={{
          animation: 'slide_from_right',
        }}>
        <Stack.Screen
          name="LoginSelection"
          component={LoginSelection}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="TeachersHome"
          component={HomeDrawer}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Home"
          component={StudentHomeDrawer}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="StartScreen"
          component={StartScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen name="Chatbot" component={ChatbotScreen} />
        <Stack.Screen
          name="SubjectTasksScreen"
          component={SubjectTasksScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="StudentTimetable"
          component={StudentTimetable}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="Attendance"
          component={AttendanceScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Announcements"
          component={AnnouncementScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="StudentTaskHistory"
          component={StudentTaskHistory}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="StudentProgress"
          component={StudentProgress}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="StudentTestHistory"
          component={StudentTestHistory}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="FeesHistory"
          component={FeesHistoryScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="AcademicCalendar"
          component={AcademicCalendarScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="CourseDetails"
          component={CourseDetails}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="StudentExamSchedule"
          component={StudentExamSchedule}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Chats"
          component={Chats}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ChatRoom"
          component={ChatRoom}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="TaskHistoryScreen"
          component={TaskHistoryScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="CheckTaskScreen"
          component={CheckTaskScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Teacherattendance"
          component={Teacherattendance}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="AttandeneHistory"
          component={AttandeneHistory}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="TeachersSubjects"
          component={TeachersSubjects}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="TeachersSubjectDetails"
          component={TeachersSubjectDetails}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="TeachersDraftTask"
          component={TeachersDraftTask}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="TeachersAttendance"
          component={TeachersAttendance}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="PublishEditTaskScreen"
          component={PublishEditTaskScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="AddTaskScreen"
          component={AddTaskScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="EditDraftTaskScreen"
          component={EditDraftTaskScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="AddTestScreen"
          component={AddTestScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="DraftTest"
          component={DraftTest}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="EditDraftTest"
          component={EditDraftTest}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="PublishEditTest"
          component={PublishEditTest}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="TeacherTaskHistoryDetail"
          component={TeacherTaskHistoryDetail}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="CampusSelection"
          component={CampusSelection}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="TeacherTaskHistory"
          component={TeacherTaskHistory}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="TeacherCheckTest"
          component={TeacherCheckTest}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="TeacherTestHistory"
          component={TeacherTestHistory}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="TeacherTestHistoryDetail"
          component={TeacherTestHistoryDetail}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="TeacherAnnouncement"
          component={TeacherAnnouncement}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="TeacherProfile"
          component={TeacherProfile}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="TeachersAcademicCalendar"
          component={TeachersAcademicCalendar}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="TeachersRequestEmail"
          component={TeachersRequestEmail}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="TeachersVerifyOTP"
          component={TeachersVerifyOTP}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="TeachersResetPassword"
          component={TeachersResetPassword}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="StudentProfile"
          component={StudentProfile}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Classprogress"
          component={Classprogress}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ClassProgressDetail"
          component={ClassProgressDetail}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ParentsLogin"
          component={ParentsLogin}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ParentsStudentSelection"
          component={ParentsStudentSelection}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ParentsAcademicCalendar"
          component={ParentsAcademicCalendar}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ParentsAnnouncement"
          component={ParentsAnnouncement}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ParentsAttendance"
          component={ParentsAttendance}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ParentsFeesHistory"
          component={ParentsFeesHistory}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ParentsHome"
          component={ParentHomeDrawer}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ParentsProfile"
          component={ParentsProfile}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ParentsSubjectTasks"
          component={ParentsSubjectTasks}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ParentsTaskHistory"
          component={ParentsTaskHistory}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ParentsTestHistory"
          component={ParentsTestHistory}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ParentsTimetable"
          component={ParentsTimetable}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ParentsStudentProgress"
          component={ParentsStudentProgress}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ParentsStudentExamSchedule"
          component={ParentsStudentExamSchedule}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ParentsRequestEmail"
          component={ParentsRequestEmail}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ParentsRequestStudentEmail"
          component={ParentsRequestStudentEmail}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ParentsVerifyOTP"
          component={ParentsVerifyOTP}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ParentsResetPassword"
          component={ParentsResetPassword}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="CheckExam"
          component={CheckExam}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Quizconceptbuilder"
          component={Quizconceptbuilder}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="QuizGenerator"
          component={QuizGenerator}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="TopicSuggestion"
          component={TopicSuggestion}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="UpdatedClassProgress"
          component={UpdatedClassProgress}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="UpdatedClassProgressDetail"
          component={UpdatedClassProgressDetail}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="LeaveApproval"
          component={LeaveApproval}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ApplyLeave"
          component={ApplyLeave}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="LeaveForm"
          component={LeaveForm}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="SubjectProgress"
          component={SubjectProgress}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="BooksUniformScreen"
          component={BooksUniformScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="HallOfExcellence"
          component={HallOfExcellence}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="CreateTicket"
          component={CreateTicket}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="SupportDetail"
          component={SupportDetail}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="SizeChart"
          component={SizeChart}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ConfirmOrderScreen"
          component={ConfirmOrderScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="UploadHomework"
          component={UploadHomework}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ViewTask"
          component={ViewTask}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ViewSubmission"
          component={ViewSubmission}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="TeachersChatRoom"
          component={TeachersChatRoom}
          options={{headerShown: false}}
        />
         <Stack.Screen
          name="TeachersHallOfExcellence"
          component={TeachersHallOfExcellence}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ParentsHallOfExcellence"
          component={ParentsHallOfExcellence}
          options={{headerShown: false}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = () => {
  const [notification, setNotification] = useState(null);
  const colorScheme = Appearance.getColorScheme();

  // Create a custom theme based on the current color scheme
  const theme = colorScheme === 'dark' ? MD3DarkTheme : MD3LightTheme;

  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
    //  console.log('FCM message received:', remoteMessage);
      setNotification(remoteMessage); // Set the notification state
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    requestUserPermission();
    NotificationsService();
  });
  return (
    <SafeAreaProvider>
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#fff' }}>
      
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <StatusBar
            barStyle="dark-content" // Use 'light-content' if your status bar text should be white
            backgroundColor="#fff'"
            translucent={false} // Ensure the status bar is not translucent
          />
        <OrderProvider>
          <PaperProvider theme={theme}>
            <UserProvider>
              <SubjectProvider>
                <AppContent />
                <NotificationHandler />
              </SubjectProvider>
            </UserProvider>
          </PaperProvider>
        </OrderProvider>
      </SafeAreaView>
    </GestureHandlerRootView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: verticalScale(32),
    paddingHorizontal: scale(24),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)', // Optional semi-transparent background
  },
  sectionTitle: {
    fontSize: moderateScale(24),
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: verticalScale(8),
    fontSize: moderateScale(18),
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
