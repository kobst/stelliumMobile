import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ChatThreadsListScreen from '../screens/chat/ChatThreadsListScreen';
import ChatConversationScreen from '../screens/chat/ChatConversationScreen';

const Stack = createStackNavigator();

const ChatStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="ChatThreadsList"
        component={ChatThreadsListScreen}
        options={{ title: 'Chat' }}
      />
      <Stack.Screen
        name="ChatConversation"
        component={ChatConversationScreen}
        options={{ title: 'Conversation' }}
      />
    </Stack.Navigator>
  );
};

export default ChatStack;
