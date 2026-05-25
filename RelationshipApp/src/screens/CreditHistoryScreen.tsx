import React, { useEffect, useMemo } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { useRelationshipAppStore } from '../store';
import { getCreditHistory, getEntitlements } from '../api/credits';
import { SettingsNavBar } from '../components/SettingsNavBar';
import type { CreditTransaction, CreditTransactionKind } from '../store';

const ICON_MAP: Record<CreditTransactionKind, string> = {
  analysis_full: '◇',
  analysis_overview: '◇',
  ask_iris: '✦',
  purchase: '◆',
  renewal: '◆',
  bonus: '🎁',
};

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatDayHeader(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

export function CreditHistoryScreen() {
  const { colors } = useTheme();
  const credits = useRelationshipAppStore((state) => state.credits);
  const transactions = useRelationshipAppStore((state) => state.creditTransactions);
  const setCreditTransactions = useRelationshipAppStore((state) => state.setCreditTransactions);
  const setCredits = useRelationshipAppStore((state) => state.setCredits);
  const setSubscription = useRelationshipAppStore((state) => state.setSubscription);
  const profile = useRelationshipAppStore((state) => state.profile);
  const profileId = profile?.id ?? null;

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [history, entitlements] = await Promise.all([
          getCreditHistory(),
          profileId ? getEntitlements(profileId) : Promise.resolve(null),
        ]);
        if (!active) return;
        setCreditTransactions(history);
        if (entitlements) {
          setCredits(entitlements.credits);
          setSubscription(entitlements.subscription);
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('[CreditHistoryScreen] failed to load history', error);
        }
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [profileId, setCreditTransactions, setCredits, setSubscription]);

  const sections = useMemo(() => buildSections(transactions), [transactions]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surfaceLow }]}>
      <SettingsNavBar title="Credit History" backLabel="Profile" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.balanceCard,
            { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
          ]}
        >
          <View>
            <Text style={[styles.balanceEyebrow, { color: colors.textMuted }]}>Purchased Credits</Text>
            <Text style={[styles.balanceValue, { color: colors.text }]}>
              {credits ? credits.balance.toLocaleString() : '—'}
              <Text style={[styles.balanceUnit, { color: colors.textMuted }]}>  credits</Text>
            </Text>
          </View>
          <View style={styles.breakdownCol}>
            <Text style={[styles.breakdownText, { color: colors.textMuted }]}>
              {credits?.fullAnalysesRemaining ?? 0} full analyses left
            </Text>
            <Text style={[styles.breakdownText, { color: colors.textMuted }]}>
              {credits?.purchased ?? 0} purchased
            </Text>
          </View>
        </View>

        {sections.length === 0 ? (
          <View
            style={[
              styles.empty,
              { backgroundColor: colors.surface, borderColor: colors.ghostBorder },
            ]}
          >
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No transactions yet.
            </Text>
          </View>
        ) : (
          sections.map((section, sectionIndex) => (
            <View key={section.dayKey}>
              <Text
                style={[
                  styles.dayHeader,
                  {
                    color: colors.textSubtle,
                    borderTopColor: sectionIndex === 0 ? 'transparent' : colors.ghostBorder,
                  },
                ]}
              >
                {section.label}
              </Text>
              {section.transactions.map((tx) => (
                <TransactionRow key={tx.id} transaction={tx} />
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface Section {
  dayKey: string;
  label: string;
  transactions: CreditTransaction[];
}

function buildSections(transactions: readonly CreditTransaction[]): Section[] {
  const map = new Map<string, Section>();
  for (const tx of transactions) {
    const dayKey = tx.occurredAt.slice(0, 10);
    const existing = map.get(dayKey);
    if (existing) {
      existing.transactions.push(tx);
    } else {
      map.set(dayKey, {
        dayKey,
        label: formatDayHeader(tx.occurredAt),
        transactions: [tx],
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => (a.dayKey > b.dayKey ? -1 : 1));
}

interface TransactionRowProps {
  transaction: CreditTransaction;
}

function TransactionRow({ transaction }: TransactionRowProps) {
  const { colors } = useTheme();
  const isCredit = transaction.delta > 0;
  return (
    <View style={styles.txRow}>
      <View
        style={[
          styles.txIcon,
          {
            backgroundColor: isCredit
              ? 'rgba(76, 175, 125, 0.14)'
              : colors.surfaceHigh,
          },
        ]}
      >
        <Text
          style={[
            styles.txIconGlyph,
            { color: isCredit ? colors.success : colors.textMuted },
          ]}
        >
          {ICON_MAP[transaction.kind]}
        </Text>
      </View>
      <Text
        style={[styles.txDesc, { color: colors.text }]}
        numberOfLines={1}
      >
        {transaction.description}
      </Text>
      <Text
        style={[
          styles.txAmount,
          { color: isCredit ? colors.success : colors.textMuted },
        ]}
      >
        {isCredit ? '+' : ''}
        {transaction.delta}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    gap: 4,
  },
  balanceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
  },
  balanceEyebrow: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  balanceUnit: {
    fontSize: 14,
    fontWeight: '500',
  },
  breakdownCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  breakdownText: {
    fontSize: 12,
  },
  dayHeader: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    paddingTop: 16,
    paddingBottom: 6,
    borderTopWidth: 1,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  txIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txIconGlyph: {
    fontSize: 14,
  },
  txDesc: {
    flex: 1,
    fontSize: 13.5,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  empty: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
});
