import React, { useEffect, useRef, useState, version } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { moderateScale, scale, ScaledSheet, verticalScale } from 'react-native-size-matters';
import { useNavigation } from '@react-navigation/native';
import api from '../../api';
import { useUser } from '../../Context/UserContext';

const TeachersAcademicCalendar: React.FC = () => {
  const [markedDates, setMarkedDates] = useState({});
  const [eventsDate, setEventsDate] = useState([]);
  const [eventNames, setEventNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventsList, setEventsList] = useState([]);
  const { user } = useUser();
  const [events, setEvents] = useState([]);
  const lastFetchedMonth = useRef<string | null>(null);
  const navigation = useNavigation();
  const lastFetchedYear = useRef<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(
    new Date().toISOString().split('T')[0],

  ); // Default to today's date
  const [expandedCardIndex, setExpandedCardIndex] = useState(null);
  const [cardHeights, setCardHeights] = useState<number[]>([]);
  const [eventColors, setEventColors] = useState<Record<string, string>>({});

  

 useEffect(() => {
       if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
         UIManager.setLayoutAnimationEnabledExperimental(true);
       }
     }, []);
 
     const handleCardPress = index => {
       LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
       setExpandedCardIndex(expandedCardIndex === index ? null : index);
     };

  const handleLayout = (index: number, event: any) => {
    const { height } = event.nativeEvent.layout;
    setCardHeights(prevHeights => {
      const updatedHeights = [...prevHeights];
      updatedHeights[index] = height; // Update the height of the specific card
      return updatedHeights;
    });
  };


  const predefinedColors = [
    '#4D96FF', // Blue
    '#F7347A', // Pink
    '#FFD700', // Yellow
    '#1ABC9C', // Teal
    '#9B59B6', // Purple
    '#E67E22', // Orange
    '#2ECC71', // Green
  ];
  
  const generateEventColors = (eventData: any[]) => {
    const colors: Record<string, string> = {};
    let colorIndex = 0;
  
    eventData.forEach((event) => {
      if (!colors[event.name]) {
        colors[event.name] = predefinedColors[colorIndex % predefinedColors.length];
        colorIndex++;
      }
    });
  
    return colors;
  };
  

  

  useEffect(() => {
    // console.log('Marked dates updated:', markedDates);
  }, [markedDates]);

  //   useEffect(() => {
  //     if (!loading) {
  //       setMarkedDates({
  //         '2023-12-20': { marked: true, dotColor: '#F7347A' },
  //         '2023-12-22': { marked: true, dotColor: '#FFD700' },
  //         '2023-11-15': { marked: true, dotColor: '#4D96FF' },
  //       });
  //     }
  //   }, [loading]);

  useEffect(() => {
    const fetchAcademicData = async () => {
      const school_id = user?.company_id;
      const school_campus_id = user?.school_campus_id;
  
      if (!school_campus_id) {
        setLoading(false);
        return;
      }
  
      setLoading(true);
  
      try {
        // Step 1: Fetch event names and generate colors
        const eventNamesResponse = await api.protected.post(
          'teacher/academic-detail/academic-status',
          { school_campus_id }
        );
  
        let generatedEventColors: Record<string, string> = {};
        if (eventNamesResponse.data.success) {
          const eventData = eventNamesResponse.data.data;
          setEventNames(eventData);
          generatedEventColors = generateEventColors(eventData);
          setEventColors(generatedEventColors);
        }
  
        // Step 2: Fetch calendar data (all months)
        const calendarResponse = await api.protected.post('teacher/academic-detail', {
          school_id,
          school_campus_id,
        });
  
        const { success: calendarSuccess, data: monthsData } = calendarResponse.data;
  
        const allMarkedDates: Record<string, any> = {};
        const allEventsList: any[] = [];
  
        if (calendarSuccess) {
          Object.keys(monthsData).forEach(month => {
            monthsData[month].forEach((item: any) => {
              const dateKey = `2023-${getMonthNumber(month)}-${item.start_date.padStart(2, '0')}`;
              const color = generatedEventColors[item.academic_status] || '#000';
  
              allMarkedDates[dateKey] = {
                customStyles: {
                  container: {
                    backgroundColor: color,
                    borderRadius: 15,
                    width: 30,
                    height: 30,
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                  text: {
                    color: '#ffffff',
                    fontWeight: 'bold',
                  },
                },
              };
  
              allEventsList.push({
                date: item.start_date,
                title: item.title,
                dateFull: `${item.start_date} ${month} 2023`,
                color,
              });
            });
          });
  
          setMarkedDates(JSON.parse(JSON.stringify(allMarkedDates)));
          setEventsList(allEventsList);
        }
  
        // Step 3: Fetch current month's events
        const currentDate = new Date();
        const currentMonthName = currentDate.toLocaleString('en-US', { month: 'long' });
        const currentYear = currentDate.getFullYear().toString();
  
        const currentMonthResponse = await api.protected.post(
          'teacher/academic-detail/listAcademicDetailsByMonth',
          {
            school_campus_id,
            month: currentMonthName,
            year: currentYear,
          }
        );
  
        if (currentMonthResponse.data.success) {
          const monthEvents = currentMonthResponse.data.data || [];
          setEvents(monthEvents);
  
          const newMonthMarkedDates: Record<string, any> = {};
          monthEvents.forEach((event: any) => {
            newMonthMarkedDates[event.start_date] = {
              marked: true,
              dotColor: generatedEventColors[event.status] || '#000',
            };
          });
  
          // Merge monthly dots into full marked dates
          setMarkedDates(prev => ({
            ...prev,
            ...newMonthMarkedDates,
          }));
        }
  
        setCurrentMonth(currentDate.toISOString().split('T')[0]);
      } catch (error) {
        console.error('Error fetching academic data:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchAcademicData();
  }, [user]);
  

  // const handleMonthChange = async (monthData: { year: number; month: number }) => {
  //     const { year, month } = monthData;

  //     // Convert numeric month to full month name
  //     const fullMonthName = new Date(year, month - 1).toLocaleString('en-US', { month: 'long' });

  //     // Fetch events for the new month and year
  //     await fetchAcademicEvents(fullMonthName, year.toString());
  // };

  const handleVisibleMonthChange = (months: any[]) => {
    if (months && months.length > 0) {
      const visibleMonth = months[0];
      const { year, month } = visibleMonth;

      // Convert numeric month to full month name
      const fullMonthName = new Date(year, month - 1).toLocaleString('en-US', {
        month: 'long',
      });

      // Avoid redundant API calls for the same month
      if (
        lastFetchedMonth.current === fullMonthName &&
        lastFetchedYear.current === year.toString()
      ) {
        return;
      }

      lastFetchedMonth.current = fullMonthName;
      lastFetchedYear.current = year.toString();

      // Update the state for the calendar's current month
      setCurrentMonth(`${year}-${month.toString().padStart(2, '0')}-01`);

      // Fetch events for the new month and year
      fetchAcademicEvents(fullMonthName, year.toString());
    }
  };



  // Helper function to convert month names to numbers
  const getMonthNumber = (month: any) => {
    const months = {
      January: 'January',
      February: 'February',
      March: 'March',
      April: 'April',
      May: 'May',
      June: 'June',
      July: 'July',
      August: 'August',
      September: 'September',
      October: 'October',
      November: 'November',
      December: 'December',
    };
    return months[month];
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }


  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={moderateScale(24)} style={styles.icon} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Academic Calendar</Text>
        <TouchableOpacity onPress={() => navigation.navigate('TeacherAnnouncement')}>
          <Icon name="notifications" size={moderateScale(24)} style={styles.icon} />
        </TouchableOpacity>
      </View>

      {/* Calendar */}
      {loading ? (
        <ActivityIndicator size="large" color="#000" style={styles.loader} />
      ) : (
        <Calendar
          current={currentMonth}
          markingType="custom"
          markedDates={markedDates}
          monthFormat="MMMM yyyy"
          onVisibleMonthsChange={handleVisibleMonthChange}
          theme={{
            selectedDayBackgroundColor: '#4D96FF',
            todayTextColor: '#F7347A',
            arrowColor: '#000',
            dayTextColor: '#000',

            textMonthFontSize: moderateScale(18), // Font size for the month in the header
            textDayHeaderFontSize: moderateScale(14), // Font size for the weekday headers (e.g., Sun, Mon)
          }}
          style={styles.calendar}
        />
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItemsContainer}>
          <Text style={styles.statusText}>Status:</Text>

          {eventNames.map((event, index) => (
            <View
              key={index}
              style={styles.legendItem}
            >
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: eventColors[event.name] || '#000' },
                ]}
              >
                <Text style={styles.legendText}>{event.name}</Text>
              </View>
            </View>

          ))}
        </View>
      </View>
      {/* Event List */}
      <View style={styles.eventsList}>
        {events.map((event, index) => (
          <TouchableOpacity key={index} style={styles.eventCard}
            onPress={() => handleCardPress(index)}
            onLayout={event => handleLayout(index, event)}
            touchSoundDisabled={true}
            activeOpacity={1} // Disables touch effect
          >
            <View
              style={[
                styles.dateCircle,
                { backgroundColor: eventColors[event.status] || '#CCCCCC' }, // Default color if status is not in eventColors
              ]}>
              <Text key={event.id} style={styles.dateText}>{index}</Text>
            </View>
            <View style={styles.eventDetails}>
              <Text style={styles.eventTitle}>{event?.title}</Text>
              <Text style={styles.eventDate}>{event?.start_date}</Text>
              {expandedCardIndex === index && (
                <Text style={styles.eventDescription}>
                  {event?.description}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = ScaledSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#f9f9f9',
    paddingBottom: '16@vs',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)', // Optional semi-transparent background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16@ms',
    backgroundColor: '#fff',

  },
  headerText: {
    fontSize: '15@ms',
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },
  icon: {
    color: '#000',
  },
  loader: {
    marginTop: '50@vs',
  },
  calendar: {
    borderRadius: '8@s',
    marginHorizontal: '16@s',
    marginTop: '8@vs',
    backgroundColor: '#fff',
    padding: '8@ms',
  },
  statusText: {
    fontSize: moderateScale(14),
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
    marginTop: verticalScale(8),
    marginRight: moderateScale(8), // Add controlled spacing instead
    marginLeft: scale(10),
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    marginVertical: verticalScale(16),
  },

  legendItemsContainer: {
    flexDirection: 'row',
  flexWrap: 'wrap',
  alignItems: 'center',
  paddingLeft: scale(20), // ✅ Adds left spacing for all lines
  
  width: '100%',
  },

  legendItem: {
    marginBottom: verticalScale(8),
    marginRight: moderateScale(8), // spacing between dots
  },

  legendDot: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(20),
    backgroundColor: '#000',
    minHeight: verticalScale(40),
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: moderateScale(120), // Optional: cap the width to avoid oversized dots
  },

  legendText: {
    fontSize: moderateScale(10),
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
    flexShrink: 1, // Allow text to shrink if needed
  },
  eventsList: {
    paddingHorizontal: '16@s',
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: '8@s',
    padding: '12@ms',
    marginBottom: '8@vs',
    elevation: 2,
  },
  dateCircle: {
    width: '40@ms',
    height: '40@vs',
    borderRadius: '40@s',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '16@s',
  },
  dateText: {
    fontSize: '16@ms',
    fontFamily: 'Poppins-Bold',
    color: '#fff',
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },
  eventDate: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Regular',
    color: '#3b3b3b',
    marginTop: '4@vs',
  },
  eventDescription: {
    fontSize: '12@ms',
    fontFamily: 'Poppins-Regular',
    color: '#000',
    marginTop: '4@vs',
  },
});



export default TeachersAcademicCalendar;
