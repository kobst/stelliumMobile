# Credit Gating Integration Guide

This guide shows how to add credit checks to all actions that cost credits in your app.

---

## Quick Start: `useCreditsGate` Hook

The `useCreditsGate` hook provides automatic credit checking, deduction, and insufficient credits handling.

### Basic Usage

```tsx
import { useCreditsGate } from '../hooks/useCreditsGate';

const MyComponent = () => {
  const { checkAndProceed, isChecking } = useCreditsGate();

  const handleAction = async () => {
    const allowed = await checkAndProceed({
      action: 'fullNatalReport',  // From CREDIT_COSTS config
      source: 'birth_chart_screen',
      onProceed: async () => {
        // Your API call here
        const report = await api.generateNatalReport(chartId);
        // Handle success
        navigation.navigate('ReportScreen', { report });
      },
    });

    // allowed = true if credits were sufficient and action completed
    // allowed = false if insufficient credits (paywall was shown)
  };

  return (
    <Button
      onPress={handleAction}
      disabled={isChecking}
      title={isChecking ? 'Checking...' : 'Generate Report (15 credits)'}
    />
  );
};
```

---

## Integration Examples

### 1. Birth Chart - "Complete Full Analysis"

**File**: `src/screens/chart/ChartScreen.tsx` (or wherever the button is)

```tsx
import { useCreditsGate } from '../../hooks/useCreditsGate';
import { api } from '../../api';

const ChartScreen = ({ route }) => {
  const { chartId } = route.params;
  const { checkAndProceed, isChecking, getCostMessage } = useCreditsGate();
  const [analysisData, setAnalysisData] = useState(null);

  const handleCompleteAnalysis = async () => {
    const allowed = await checkAndProceed({
      action: 'fullNatalReport',
      source: 'chart_patterns_tab',
      onProceed: async () => {
        // Call your API to generate the full analysis
        const response = await api.charts.getFullAnalysis(chartId);
        setAnalysisData(response.analysis);

        // Navigate to results or show inline
        // navigation.navigate('FullAnalysis', { data: response.analysis });
      },
    });

    if (!allowed) {
      console.log('User did not have enough credits or cancelled paywall');
    }
  };

  return (
    <View>
      {/* Your existing chart UI */}

      <TouchableOpacity
        style={styles.analysisButton}
        onPress={handleCompleteAnalysis}
        disabled={isChecking}
      >
        <Text style={styles.analysisButtonText}>
          {isChecking ? 'Processing...' : 'Complete Full Analysis'}
        </Text>
        <Text style={styles.costText}>
          15 credits
        </Text>
      </TouchableOpacity>

      {/* Show cost warning if insufficient */}
      <CreditCostBadge action="fullNatalReport" />
    </View>
  );
};
```

---

### 2. Relationship Report

```tsx
const RelationshipScreen = ({ person1Id, person2Id }) => {
  const { checkAndProceed, isChecking } = useCreditsGate();

  const handleGenerateReport = async (reportType: 'quick' | 'full') => {
    const action = reportType === 'quick'
      ? 'relationshipOverview'
      : 'fullRelationshipReport';

    const allowed = await checkAndProceed({
      action,
      source: 'relationship_screen',
      onProceed: async () => {
        const report = await api.relationships.generateReport({
          person1Id,
          person2Id,
          type: reportType,
        });
        navigation.navigate('RelationshipReport', { report });
      },
    });
  };

  return (
    <View>
      <Button
        onPress={() => handleGenerateReport('quick')}
        disabled={isChecking}
        title="Quick Overview (5 credits)"
      />
      <Button
        onPress={() => handleGenerateReport('full')}
        disabled={isChecking}
        title="Full Report (15 credits)"
      />
    </View>
  );
};
```

---

### 3. Ask Stellium Chat

```tsx
const ChatScreen = () => {
  const { checkAndProceed, isChecking, canAfford } = useCreditsGate();
  const [message, setMessage] = useState('');

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const allowed = await checkAndProceed({
      action: 'askStelliumQuestion',
      source: 'ask_stellium_chat',
      onProceed: async () => {
        const response = await api.chat.sendMessage({
          message: message.trim(),
          chartId: currentChartId,
        });

        // Add to chat history
        addMessageToChat(message, response.answer);
        setMessage('');
      },
    });
  };

  return (
    <View>
      <TextInput
        value={message}
        onChangeText={setMessage}
        placeholder="Ask Stellium anything..."
      />
      <Button
        onPress={handleSendMessage}
        disabled={isChecking || !message.trim() || !canAfford('askStelliumQuestion')}
        title={canAfford('askStelliumQuestion') ? 'Send (1 credit)' : 'Not enough credits'}
      />
    </View>
  );
};
```

---

### 4. Chart Overview (Quick Chart)

```tsx
const ChartListScreen = () => {
  const { checkAndProceed, isChecking } = useCreditsGate();

  const handleGenerateQuickChart = async (personId: string) => {
    const allowed = await checkAndProceed({
      action: 'quickChartOverview',
      source: 'chart_list',
      onProceed: async () => {
        const overview = await api.charts.generateQuickOverview(personId);
        navigation.navigate('ChartOverview', { overview });
      },
    });
  };

  return (
    <FlatList
      data={people}
      renderItem={({ item }) => (
        <PersonCard
          person={item}
          onGenerateChart={() => handleGenerateQuickChart(item.id)}
        />
      )}
    />
  );
};
```

---

## Advanced: Pre-flight Credit Checks

For showing warnings or disabling buttons before the user tries:

```tsx
const MyComponent = () => {
  const { canAfford, getCostMessage } = useCreditsGate();

  const canGenerateReport = canAfford('fullNatalReport');
  const costMessage = getCostMessage('fullNatalReport');

  return (
    <View>
      <Button
        onPress={handleGenerate}
        disabled={!canGenerateReport}
        title="Generate Report"
      />

      {!canGenerateReport && (
        <Text style={styles.warning}>
          {costMessage}
        </Text>
      )}
    </View>
  );
};
```

---

## Reusable Credit Cost Badge Component

Create a badge component to show credit costs and warnings:

```tsx
// src/components/CreditCostBadge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useCreditsGate } from '../hooks/useCreditsGate';
import { CreditAction } from '../config/subscriptionConfig';

interface CreditCostBadgeProps {
  action: CreditAction;
  variant?: 'inline' | 'warning';
}

export const CreditCostBadge: React.FC<CreditCostBadgeProps> = ({
  action,
  variant = 'inline',
}) => {
  const { getCostMessage, canAfford } = useCreditsGate();
  const sufficient = canAfford(action);

  if (variant === 'inline') {
    return (
      <Text style={[styles.inline, !sufficient && styles.insufficient]}>
        {getCostMessage(action)}
      </Text>
    );
  }

  if (!sufficient) {
    return (
      <View style={styles.warningBanner}>
        <Text style={styles.warningText}>
          ⚠️ {getCostMessage(action)}
        </Text>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  inline: {
    fontSize: 12,
    color: '#666',
  },
  insufficient: {
    color: '#EF4444',
    fontWeight: '600',
  },
  warningBanner: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  warningText: {
    color: '#92400E',
    fontSize: 13,
  },
});
```

**Usage:**
```tsx
<View>
  <Button onPress={handleAction} title="Generate Report" />
  <CreditCostBadge action="fullNatalReport" variant="warning" />
</View>
```

---

## Backend API Integration

When your backend returns a 402 error for insufficient credits, the hook automatically handles it:

```tsx
// Backend returns:
HTTP 402 Payment Required
{
  "error": "INSUFFICIENT_CREDITS",
  "required": 15,
  "available": 10,
  "action": "fullNatalReport"
}

// The hook will:
// 1. Catch the error
// 2. Refresh balance from server
// 3. Show appropriate paywall via CreditFlowManager
```

Make sure your API client throws errors with these properties:

```tsx
// src/api/client.ts (example)
if (response.status === 402) {
  const error = new Error('Insufficient credits');
  error.status = 402;
  error.code = 'INSUFFICIENT_CREDITS';
  error.required = data.required;
  error.available = data.available;
  throw error;
}
```

---

## Complete Action List

Here are all actions that need credit gating:

| Action | Cost | Where Used |
|--------|------|------------|
| `quickChartOverview` | 5 | Chart list, Quick view button |
| `fullNatalReport` | 15 | Chart detail, "Complete Full Analysis" |
| `relationshipOverview` | 5 | Relationship tab, Quick compatibility |
| `fullRelationshipReport` | 15 | Relationship detail, Full synastry |
| `askStelliumQuestion` | 1 | Chat screen, Ask tab |

---

## Testing Checklist

### Sufficient Credits Flow
- [ ] User has enough credits
- [ ] Click action button
- [ ] Credits deducted optimistically (UI updates)
- [ ] API call executes
- [ ] Backend confirms deduction
- [ ] Balance refreshed from server

### Insufficient Credits Flow (Free User)
- [ ] User has insufficient credits
- [ ] Click action button
- [ ] Superwall paywall appears
- [ ] User can purchase subscription
- [ ] After purchase, credits granted
- [ ] User can retry action

### Insufficient Credits Flow (Premium User, Small Shortfall)
- [ ] Premium user needs 5 more credits
- [ ] Click action button
- [ ] Navigate to CreditPurchase screen
- [ ] Small pack is recommended
- [ ] User can purchase pack
- [ ] Credits added, action proceeds

### Insufficient Credits Flow (Premium User, Large Shortfall)
- [ ] Premium user needs 100 more credits
- [ ] Click action button
- [ ] Alert shows: "Buy credits or upgrade to Pro"
- [ ] User can choose option
- [ ] Purchase flow completes
- [ ] Action proceeds

### Backend 402 Error Handling
- [ ] Backend returns 402 insufficient credits
- [ ] Hook catches error
- [ ] Balance refreshed from server
- [ ] Paywall shown with correct shortfall
- [ ] User flow completes

---

## Migration Plan

To add credit gating to all existing actions:

### Step 1: Import the hook
```tsx
import { useCreditsGate } from '../hooks/useCreditsGate';
```

### Step 2: Use the hook
```tsx
const { checkAndProceed, isChecking } = useCreditsGate();
```

### Step 3: Wrap your action
```tsx
// Before:
const handleAction = async () => {
  const result = await api.doSomething();
  // handle result
};

// After:
const handleAction = async () => {
  const allowed = await checkAndProceed({
    action: 'fullNatalReport',
    source: 'my_screen',
    onProceed: async () => {
      const result = await api.doSomething();
      // handle result
    },
  });
};
```

### Step 4: Update button UI
```tsx
<Button
  onPress={handleAction}
  disabled={isChecking}
  title={isChecking ? 'Processing...' : 'Do Action (15 credits)'}
/>
```

---

## Next Steps

1. ✅ Credit gating hook created (`useCreditsGate.ts`)
2. ⏳ Add to "Complete Full Analysis" button
3. ⏳ Add to relationship reports
4. ⏳ Add to Ask Stellium chat
5. ⏳ Add to quick chart generation
6. ⏳ Create reusable CreditCostBadge component
7. ⏳ Test all flows end-to-end

---

**Ready to implement!** Start with the highest-value action (probably "Complete Full Analysis") and work your way through the list.
