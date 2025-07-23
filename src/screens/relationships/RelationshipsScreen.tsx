import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../../store';
import UserRelationships from '../../components/UserRelationships';
import { useTheme } from '../../theme';
import AddFooterButton from '../../components/AddFooterButton';
import UpgradeBanner from '../../components/UpgradeBanner';

const RelationshipsScreen: React.FC = () => {
  const { userData } = useStore();
  const navigation = useNavigation();
  const { colors } = useTheme();

  if (!userData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>Please sign in to view relationships</Text>
      </View>
    );
  }


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Relationships List */}
        <UserRelationships
          onRelationshipPress={(relationship) => {
            console.log('Navigate to relationship analysis:', relationship);
            (navigation as any).navigate('RelationshipAnalysis', { relationship });
          }}
        />
      </ScrollView>

      {/* Footer Add Button */}
      <AddFooterButton
        title="+ Add New Relationship"
        onPress={() => (navigation as any).navigate('CreateRelationship')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    padding: 32,
  },
});

export default RelationshipsScreen;
