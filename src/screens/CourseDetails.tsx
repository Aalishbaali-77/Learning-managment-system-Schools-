import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {ScaledSheet} from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';

const CourseDetails = () => {
  const navigation = useNavigation();


  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={()=>navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Course Details</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Announcements')}>
          <Icon name="notifications" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Course Title */}
      <View style={styles.courseTitleSection}>
        <Text style={styles.courseTitle}>Mastering Artificial Intelligence</Text>
        <View style={styles.lessonBadge}>
          <Text style={styles.lessonText}>Lesson 1 of 5</Text>
        </View>
      </View>

      {/* Course Details */}
      <Text style={styles.sectionTitle}>Course Details</Text>
      <Text style={styles.courseDetails}>
        It is a long established fact that a reader will be distracted by the
        readable content of a page when looking at its layout. The point of
        using Lorem Ipsum is that it has a more-or-less normal distribution of
        letters, as opposed to using 'Content here, content here', making it
        look like readable English.
      </Text>

      {/* Placeholder Image */}
      <View style={styles.imagePlaceholder} />

      <Text style={styles.courseDetails}>
        It is a long established fact that a reader will be distracted by the
        readable content of a page when looking at its layout.
      </Text>

      {/* Course Content */}
      <Text style={styles.sectionTitle}>Course's Content</Text>
      {[
        'Introduction to Artificial Intelligence',
        'Machine Learning Basics',
        'Neural Networks Fundamentals',
      ].map((content, index) => (
        <TouchableOpacity key={index} style={styles.contentItem}>
          <View style={styles.contentIcon}>
            <Icon name="play-circle" size={20} color="#3B82F6" />
          </View>
          <View style={styles.contentTextContainer}>
            <Text style={styles.contentTitle}>
              {`0${index + 1}. ${content}`}
            </Text>
            <Text style={styles.contentDescription}>
              {index === 0
                ? 'Introducing the concept of AI and its applications.'
                : index === 1
                ? 'Machine learning concepts for supervised learning.'
                : 'Neural networks basics and how models learn.'}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default CourseDetails;

const styles = ScaledSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F9F9F9',
    padding: '16@ms',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16@vs',
  },
  headerTitle: {
    fontSize: '18@ms',
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },
  courseTitleSection: {
    marginBottom: '16@vs',
  },
  courseTitle: {
    fontSize: '20@ms',
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },
  lessonBadge: {
    backgroundColor: '#FFE4E4',
    alignSelf: 'flex-start',
    borderRadius: '8@s',
    paddingHorizontal: '12@s',
    paddingVertical: '4@vs',
    marginTop: '8@vs',
  },
  lessonText: {
    color: '#FF5757',
    fontSize: '12@ms',
    fontFamily: 'Poppins-Bold',
  },
  sectionTitle: {
    fontSize: '16@ms',
    fontFamily: 'Poppins-Bold',
    color: '#000',
    marginTop: '16@vs',
  },
  courseDetails: {
    fontSize: '14@ms',
    color: '#3b3b3b',
    marginTop: '8@vs',
    lineHeight: '20@s',
  },
  imagePlaceholder: {
    height: '150@vs',
    backgroundColor: '#E0E0E0',
    borderRadius: '8@s',
    marginVertical: '16@vs',
  },
  contentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: '8@s',
    padding: '12@ms',
    marginTop: '12@vs',
   
  },
  contentIcon: {
    marginRight: '12@s',
  },
  contentTextContainer: {
    flex: 1,
  },
  contentTitle: {
    fontSize: '14@ms',
    fontFamily: 'Poppins-Bold',
    color: '#000',
  },
  contentDescription: {
    fontSize: '12@ms',
    color: '#3b3b3b',
    marginTop: '4@vs',
  },
});
