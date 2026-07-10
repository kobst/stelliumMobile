import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { ErrorBoundary } from '../RelationshipApp/src/components/ErrorBoundary';

let shouldThrow = false;

const Bomb: React.FC = () => {
  if (shouldThrow) {
    throw new Error('boom');
  }
  return <Text>content</Text>;
};

describe('ErrorBoundary', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test('renders children when nothing throws', async () => {
    shouldThrow = false;
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(
        <ErrorBoundary>
          <Bomb />
        </ErrorBoundary>,
      );
    });
    expect(tree.root.findByProps({ children: 'content' })).toBeTruthy();
  });

  test('shows fallback on error, restart remounts children', async () => {
    shouldThrow = true;
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(
        <ErrorBoundary>
          <Bomb />
        </ErrorBoundary>,
      );
    });

    expect(tree.root.findByProps({ children: 'Something went wrong' })).toBeTruthy();

    shouldThrow = false;
    const restartButton = tree.root.findByProps({ accessibilityRole: 'button' });
    await ReactTestRenderer.act(() => {
      restartButton.props.onPress();
    });

    expect(tree.root.findByProps({ children: 'content' })).toBeTruthy();
  });
});
