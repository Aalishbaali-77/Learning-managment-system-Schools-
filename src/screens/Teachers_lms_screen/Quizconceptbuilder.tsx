import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ScaledSheet } from 'react-native-size-matters';
import { useNavigation } from '@react-navigation/native';

const Quizconceptbuilder = ({ navigation }: { navigation: any }) => {
  const quizzes = [
    { id: '1', title: 'IT is a long Established fact that a reader', type: 'Question / Answer' },
    { id: '2', title: 'IT is a long Established fact that a reader', type: 'Fill in the blanks' },
  ];

  const topics = [
    { id: '1', text: 'It is a long established fact that a reader will be distracted by the readable content' },
    { id: '2', text: 'It is a long established fact that a reader will be distracted by the readable content' },
    { id: '3', text: 'It is a long established fact that a reader will be distracted by the readable content' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Quiz & Concept Builder</Text>
        <TouchableOpacity>
          <Icon name="notifications" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <Text style={styles.classText}>Class : 10 A</Text>

      {/* Recently Quiz Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recently Quiz</Text>
        <TouchableOpacity onPress={() => navigation.navigate('QuizGenerator')}>
          <Text style={styles.createQuizText}>Create Quiz</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quizContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {quizzes.map((quiz) => (
          <View key={quiz.id} style={styles.quizCard}>
            <Text style={styles.quizTitle}>{quiz.title}</Text>
            <Text style={styles.quizType}>{quiz.type}</Text>
            <TouchableOpacity style={styles.quizButton}>
              <Text style={styles.quizButtonText}>View this Quiz</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      </View>

      {/* Recently Topics Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recently Topic</Text>
        <TouchableOpacity>
          <Text style={styles.createQuizText}>See All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={topics}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.topicCard}>
            <Icon name="chat-bubble-outline" size={18} color="#000" />
            <Text style={styles.topicText}>{item.text}</Text>
          </View>
        )}
      />

      {/* Topic Suggestion Button */}
      <TouchableOpacity style={styles.suggestionButton} onPress={() => navigation.navigate('TopicSuggestion')}>
        <Text style={styles.suggestionButtonText}>Topic Suggestion</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: '15@s',
    paddingTop: '10@vs',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10@vs',
  },
  title: {
    fontSize: '18@ms',
    fontWeight: 'bold',
  },
  classText: {
    fontSize: '14@ms',
    color: '#666',
    marginBottom: '10@vs',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '15@vs',
    marginBottom: '10@vs',
  },
  sectionTitle: {
    fontSize: '16@ms',
    fontWeight: 'bold',
  },
  createQuizText: {
    fontSize: '14@ms',
    color: '#DC3545',
  },
  quizContainer: {
    flexDirection: 'row',
    marginBottom: '10@vs',
  },
  quizCard: {
    width: '200@s',  // Adjust the width for better horizontal scrolling
    marginRight: '10@s',  // Adds spacing between cards
    padding: '10@vs',
    backgroundColor: '#fff',
    borderRadius: '10@ms',
    borderWidth: 1,
    borderColor: '#000',
    alignItems: 'center',
  },
  inactiveQuiz: {
    borderColor: '#ccc',
    opacity: 0.5,
  },
  quizTitle: {
    fontSize: '14@ms',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  quizType: {
    fontSize: '12@ms',
    color: '#666',
    marginTop: '5@vs',
  },
  quizButton: {
    marginTop: '10@vs',
    backgroundColor: '#DC3545',
    paddingVertical: '8@vs',
    paddingHorizontal: '15@s',
    borderRadius: '20@ms',
  },
  inactiveQuizButton: {
    backgroundColor: '#ccc',
  },
  quizButtonText: {
    color: '#fff',
    fontSize: '12@ms',
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: '10@vs',
    borderRadius: '20@ms',
    marginBottom: '8@vs',
  },
  topicText: {
    fontSize: '12@ms',
    marginLeft: '10@s',
    flex: 1,
  },
  suggestionButton: {
    backgroundColor: '#000',
    paddingVertical: '12@vs',
    alignItems: 'center',
    borderRadius: '20@ms',
    marginTop: '15@vs',
  },
  suggestionButtonText: {
    color: '#fff',
    fontSize: '14@ms',
  },
});

export default Quizconceptbuilder;
