import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../theme';
import type { AskAspectKind, AskAspectRef } from '../store';

interface FilterOption {
  key: 'All' | AskAspectKind;
  label: string;
}

interface AspectPickerSheetProps {
  visible: boolean;
  aspects: AskAspectRef[];
  selected: AskAspectRef[];
  maxSelection?: number;
  filters: readonly FilterOption[];
  onToggle: (aspect: AskAspectRef) => void;
  onClose: () => void;
}

export function AspectPickerSheet({
  visible,
  aspects,
  selected,
  maxSelection = 3,
  filters,
  onToggle,
  onClose,
}: AspectPickerSheetProps) {
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterOption['key']>('All');

  const countsByFilter = useMemo(() => {
    const map: Record<string, number> = {};
    for (const entry of aspects) {
      map[entry.type] = (map[entry.type] ?? 0) + 1;
    }
    return map;
  }, [aspects]);

  const filtered = useMemo(() => {
    const lowerSearch = search.trim().toLowerCase();
    return aspects.filter((aspect) => {
      const matchesFilter = activeFilter === 'All' || aspect.type === activeFilter;
      const matchesSearch =
        !lowerSearch ||
        aspect.name.toLowerCase().includes(lowerSearch) ||
        aspect.shortName.toLowerCase().includes(lowerSearch);
      return matchesFilter && matchesSearch;
    });
  }, [aspects, activeFilter, search]);

  const selectedIds = useMemo(() => new Set(selected.map((s) => s.id)), [selected]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View
        style={[
          styles.sheet,
          { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
        ]}
      >
        <View style={styles.handleWrap}>
          <View style={styles.handle} />
        </View>

        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.text }]}>Add context</Text>
            <Text style={[styles.subtitle, { color: colors.textSubtle }]}>
              Select up to {maxSelection} aspects to focus your question
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7} hitSlop={10}>
            <Text style={[styles.doneLink, { color: colors.primary }]}>Done</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          {filters.map((filter) => {
            const count = filter.key === 'All' ? aspects.length : countsByFilter[filter.key] ?? 0;
            const active = filter.key === activeFilter;
            return (
              <TouchableOpacity
                key={filter.key}
                activeOpacity={0.7}
                onPress={() => setActiveFilter(filter.key)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? 'rgba(202, 190, 255, 0.12)' : colors.surfaceHigh,
                    borderColor: active ? 'rgba(202, 190, 255, 0.25)' : colors.ghostBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: active ? colors.primary : colors.textMuted },
                  ]}
                >
                  {filter.label}
                  {filter.key !== 'All' ? ` (${count})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.searchWrap, { backgroundColor: colors.surfaceHigh, borderColor: colors.ghostBorder }]}>
          <Text style={[styles.searchIcon, { color: colors.textSubtle }]}>⌕</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search aspects…"
            placeholderTextColor={colors.textSubtle}
            style={[styles.searchInput, { color: colors.text }]}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isSelected = selectedIds.has(item.id);
            const isDisabled = !isSelected && selected.length >= maxSelection;
            const badgeBg = getBadgeBg(item.type);
            const badgeFg = getBadgeFg(item.type, colors);
            return (
              <TouchableOpacity
                activeOpacity={isDisabled ? 1 : 0.7}
                disabled={isDisabled}
                onPress={() => onToggle(item)}
                style={[
                  styles.row,
                  {
                    borderBottomColor: 'rgba(255,255,255,0.04)',
                    opacity: isDisabled ? 0.35 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: isSelected ? colors.primary : 'transparent',
                      borderColor: isSelected ? colors.primary : 'rgba(255,255,255,0.15)',
                    },
                  ]}
                >
                  {isSelected ? (
                    <Text style={[styles.check, { color: colors.onPrimary }]}>✓</Text>
                  ) : null}
                </View>
                <View style={styles.rowBody}>
                  <Text
                    style={[styles.rowName, { color: colors.text }]}
                    numberOfLines={2}
                  >
                    {item.name}
                  </Text>
                </View>
                <View style={[styles.typeBadge, { backgroundColor: badgeBg }]}>
                  <Text style={[styles.typeBadgeText, { color: badgeFg }]}>
                    {shortTypeLabel(item.type)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.textSubtle }]}>
              No aspects match.
            </Text>
          }
        />
      </View>
    </Modal>
  );
}

function getBadgeBg(type: AskAspectKind): string {
  if (type === 'Synastry') return 'rgba(233, 195, 73, 0.14)';
  if (type === 'Composite') return 'rgba(130, 200, 180, 0.14)';
  if (type === 'Aspect') return 'rgba(233, 195, 73, 0.14)';
  return 'rgba(130, 200, 180, 0.14)';
}

function getBadgeFg(
  type: AskAspectKind,
  colors: ReturnType<typeof useTheme>['colors']
): string {
  if (type === 'Synastry' || type === 'Aspect') return colors.accent;
  return '#82c8b4';
}

function shortTypeLabel(type: AskAspectKind): string {
  if (type === 'Synastry') return 'SYN';
  if (type === 'Composite') return 'COM';
  if (type === 'Aspect') return 'ASP';
  return 'PLC';
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '80%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    paddingBottom: 18,
  },
  handleWrap: {
    paddingTop: 10,
    alignItems: 'center',
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
  },
  doneLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  searchWrap: {
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 6,
  },
  searchIcon: {
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    paddingVertical: 0,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    fontSize: 12,
    fontWeight: '700',
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowName: {
    fontSize: 13.5,
    fontWeight: '500',
  },
  typeBadge: {
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 24,
  },
});
