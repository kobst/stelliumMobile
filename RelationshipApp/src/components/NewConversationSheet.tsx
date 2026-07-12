import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from './Avatar';
import { useTheme } from '../theme';
import { SERIF_FONT } from '../theme/typography';
import type { UserCompositeChart } from '../../../shared/api/relationships';
import type { OwnedGuestSubject } from '../../../shared/api/relationshipUsers';

interface NewConversationSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Targets you don't already have a conversation with (already-active ones live in the inbox). */
  relationships: UserCompositeChart[];
  subjects: OwnedGuestSubject[];
  selfProfileId: string | null;
  /** Show "Yourself" only when there's no self thread yet. */
  includeSelf: boolean;
  onSelectSelf: () => void;
  onSelectRelationship: (chart: UserCompositeChart) => void;
  onSelectSubject: (subject: OwnedGuestSubject) => void;
  onAddConnection: () => void;
  onExplore: () => void;
}

function initialOf(name: string | null | undefined, fallback: string): string {
  return name?.trim().charAt(0).toUpperCase() || fallback;
}

function partnerOf(
  chart: UserCompositeChart,
  selfProfileId: string | null
): { name: string; photo: string | null } {
  const selfIsA = Boolean(selfProfileId) && chart.userA_id === selfProfileId;
  const name = (selfIsA ? chart.userB_name : chart.userA_name) || 'Partner';
  const photo = selfIsA
    ? chart.userB_profilePhotoUrl ?? chart.userB_photoUrl
    : chart.userA_profilePhotoUrl ?? chart.userA_photoUrl;
  return { name, photo: photo ?? null };
}

export function NewConversationSheet({
  visible,
  onClose,
  relationships,
  subjects,
  selfProfileId,
  includeSelf,
  onSelectSelf,
  onSelectRelationship,
  onSelectSubject,
  onAddConnection,
  onExplore,
}: NewConversationSheetProps) {
  const { colors } = useTheme();

  const pick = (action: () => void) => () => {
    action();
    onClose();
  };

  const nothingNew = !includeSelf && relationships.length === 0 && subjects.length === 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.ghostBorder }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.grabber, { backgroundColor: colors.surfaceHighest }]} />
          <Text style={[styles.title, { color: colors.text }]}>New conversation</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Who should Iris read?</Text>

          {nothingNew ? (
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                You&apos;ve started conversations with everyone you&apos;ve added. Add a connection or
                explore someone new to begin another.
              </Text>
              <Pressable
                onPress={pick(onAddConnection)}
                style={({ pressed }) => [
                  styles.emptyButton,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Text style={[styles.emptyButtonText, { color: colors.onPrimary }]}>
                  Add a connection
                </Text>
              </Pressable>
              <Pressable
                onPress={pick(onExplore)}
                style={({ pressed }) => [
                  styles.emptyOutlineButton,
                  { borderColor: colors.ghostBorder, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text style={[styles.emptyOutlineText, { color: colors.text }]}>Explore people</Text>
              </Pressable>
            </View>
          ) : (
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {includeSelf ? (
              <>
                <Text style={[styles.groupLabel, { color: colors.textSubtle }]}>Yourself</Text>
                <Pressable
                  onPress={pick(onSelectSelf)}
                  style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
                >
                  <Avatar size={36} fallbackInitial="Y" gradient="lavender" ringColor={colors.surface} />
                  <Text style={[styles.rowLabel, { color: colors.text }]}>Your chart</Text>
                  <Text style={[styles.chevron, { color: colors.textSubtle }]}>›</Text>
                </Pressable>
              </>
            ) : null}

            {relationships.length > 0 ? (
              <>
                <Text style={[styles.groupLabel, { color: colors.textSubtle }]}>Your connections</Text>
                {relationships.map((chart) => {
                  const partner = partnerOf(chart, selfProfileId);
                  return (
                    <Pressable
                      key={chart._id}
                      onPress={pick(() => onSelectRelationship(chart))}
                      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
                    >
                      <Avatar
                        size={36}
                        photoUri={partner.photo}
                        fallbackInitial={initialOf(partner.name, 'P')}
                        gradient="green"
                        ringColor={colors.surface}
                      />
                      <Text style={[styles.rowLabel, { color: colors.text }]} numberOfLines={1}>
                        You &amp; {partner.name}
                      </Text>
                      <Text style={[styles.chevron, { color: colors.textSubtle }]}>›</Text>
                    </Pressable>
                  );
                })}
              </>
            ) : null}

            {subjects.length > 0 ? (
              <>
                <Text style={[styles.groupLabel, { color: colors.textSubtle }]}>People you've saved</Text>
                {subjects.map((subject) => {
                  const name = [subject.firstName, subject.lastName].filter(Boolean).join(' ').trim();
                  return (
                    <Pressable
                      key={subject._id}
                      onPress={pick(() => onSelectSubject(subject))}
                      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
                    >
                      <Avatar
                        size={36}
                        photoUri={subject.profilePhotoUrl ?? null}
                        fallbackInitial={initialOf(name, '?')}
                        gradient="gold"
                        ringColor={colors.surface}
                      />
                      <Text style={[styles.rowLabel, { color: colors.text }]} numberOfLines={1}>
                        {name || 'Saved person'}
                      </Text>
                      <Text style={[styles.chevron, { color: colors.textSubtle }]}>›</Text>
                    </Pressable>
                  );
                })}
              </>
            ) : null}
          </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
    maxHeight: '72%',
  },
  grabber: {
    width: 38,
    height: 4,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 14,
  },
  title: {
    fontFamily: SERIF_FONT,
    fontSize: 22,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    marginBottom: 6,
  },
  scroll: {
    flexGrow: 0,
  },
  groupLabel: {
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 6,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 9,
    paddingHorizontal: 4,
  },
  rowLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: '500',
  },
  chevron: {
    fontSize: 18,
    flexShrink: 0,
  },
  emptyWrap: {
    paddingTop: 10,
    paddingBottom: 6,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 4,
  },
  emptyButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyOutlineButton: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  emptyOutlineText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
