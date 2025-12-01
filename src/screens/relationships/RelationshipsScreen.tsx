import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../../store';
import UserRelationships from '../../components/UserRelationships';
import { HeaderWithProfile } from '../../components/navigation';
import { useTheme } from '../../theme';
import AddFooterButton from '../../components/AddFooterButton';
import UpgradeBanner from '../../components/UpgradeBanner';

const RelationshipsScreen: React.FC = () => {
  const { userData } = useStore();
  const navigation = useNavigation();
  const { colors } = useTheme();

  if (!userData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <HeaderWithProfile title="Relationships" showSafeArea={false} />
        <View style={styles.content}>
          <Text style={[styles.errorText, { color: colors.error }]}>Please sign in to view relationships</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <HeaderWithProfile title="Relationships" showSafeArea={false} />
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
        title="Add Relationship"
        onPress={() => (navigation as any).navigate('CreateRelationship')}
      />
    </SafeAreaView>
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
