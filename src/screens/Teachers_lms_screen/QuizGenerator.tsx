import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { ScaledSheet } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  time: string;
}

const QuizGenerator = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'It is a long established fact...', isUser: false, time: '9:00 AM' },
    { id: '2', text: 'It is a long established fact...', isUser: true, time: '9:00 AM' },
  ]);
  const [inputText, setInputText] = useState('');

  const sendMessage = () => {
    if (inputText.trim()) {
      const newMessage: Message = {
        id: String(messages.length + 1),
        text: inputText,
        isUser: true,
        time: '9:00 AM',
      };
      setMessages([...messages, newMessage]);
      setInputText('');
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageContainer, item.isUser ? styles.userMessage : styles.botMessage]}>
      <Text style={styles.messageText}>{item.text}</Text>
      <Text style={styles.timeText}>{item.time}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Quiz Generator</Text>
      <FlatList data={messages} renderItem={renderMessage} keyExtractor={(item) => item.id} />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type message"
          placeholderTextColor="#999"
          value={inputText}
          onChangeText={setInputText}
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Icon name="send" size={20} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: '10@ms',
  },
  header: {
    fontSize: '18@ms',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '10@vs',
  },
  messageContainer: {
    maxWidth: '80%',
    padding: '10@ms',
    borderRadius: '10@ms',
    marginVertical: '5@vs',
    alignSelf: 'flex-start',
  },
  userMessage: {
    backgroundColor: '#f5a623',
    alignSelf: 'flex-end',
  },
  botMessage: {
    backgroundColor: '#f2f2f2',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: '14@ms',
    color: '#000',
  },
  timeText: {
    fontSize: '10@ms',
    color: '#666',
    alignSelf: 'flex-end',
    marginTop: '5@vs',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '10@ms',
    paddingVertical: '5@vs',
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  input: {
    flex: 1,
    fontSize: '14@ms',
    padding: '10@ms',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: '20@ms',
    marginRight: '10@ms',
  },
  sendButton: {
    padding: '10@ms',
    borderRadius: '20@ms',
    backgroundColor: '#eee',
  },
});

export default QuizGenerator;
