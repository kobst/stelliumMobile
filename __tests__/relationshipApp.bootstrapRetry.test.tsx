import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { BootstrapStatusScreen } from '../RelationshipApp/src/screens/BootstrapStatusScreen';
import { useRelationshipAppStore } from '../RelationshipApp/src/store';
import {
  CELEB_POLL_TIMEOUT_MESSAGE,
  MAX_CELEB_POLL_ATTEMPTS,
  resolveTimedOutCelebStatuses,
} from '../RelationshipApp/src/utils/celebPolling';
import type { AsyncStatus } from '../shared/api/onboarding';

describe('BootstrapStatusScreen retry action', () => {
  test('renders no button without an action', async () => {
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(
        <BootstrapStatusScreen title="Setting things up." body="Loading." showSpinner />,
      );
    });
    expect(tree.root.findAllByProps({ accessibilityRole: 'button' })).toHaveLength(0);
  });

  test('renders Retry button and fires onAction', async () => {
    const onAction = jest.fn();
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(
        <BootstrapStatusScreen
          title="We couldn't load your account."
          body="Network request failed"
          actionLabel="Retry"
          onAction={onAction}
        />,
      );
    });

    const button = tree.root.findByProps({ accessibilityRole: 'button' });
    await ReactTestRenderer.act(() => {
      button.props.onPress();
    });
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});

describe('store retryBootstrap', () => {
  test('bumps the nonce and returns to loading with no error', () => {
    useRelationshipAppStore.getState().setBootstrapState({
      bootstrapStatus: 'error',
      bootstrapError: 'Network request failed',
    });

    useRelationshipAppStore.getState().retryBootstrap();

    const state = useRelationshipAppStore.getState();
    expect(state.bootstrapRetryNonce).toBe(1);
    expect(state.bootstrapStatus).toBe('loading');
    expect(state.bootstrapError).toBeNull();
  });
});

describe('celeb poll timeout', () => {
  test('poll attempt cap is bounded', () => {
    expect(MAX_CELEB_POLL_ATTEMPTS).toBeGreaterThan(0);
    expect(MAX_CELEB_POLL_ATTEMPTS).toBeLessThanOrEqual(120);
  });

  test('marks non-completed statuses failed, keeps completed ones', () => {
    const completed: AsyncStatus = { status: 'completed', completedAt: '2026-07-10' };
    const running: AsyncStatus = { status: 'running' };

    const result = resolveTimedOutCelebStatuses(completed, running);
    expect(result.celebMatchesStatus).toBe(completed);
    expect(result.celebAnnotationsStatus.status).toBe('failed');
    expect(result.celebAnnotationsStatus.error).toBe(CELEB_POLL_TIMEOUT_MESSAGE);
    // Input is not mutated.
    expect(running.status).toBe('running');
  });

  test('handles null statuses', () => {
    const result = resolveTimedOutCelebStatuses(null, null);
    expect(result.celebMatchesStatus.status).toBe('failed');
    expect(result.celebAnnotationsStatus.status).toBe('failed');
  });
});
