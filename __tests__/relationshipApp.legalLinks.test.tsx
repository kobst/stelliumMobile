import React from 'react';
import { Linking } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { WelcomeScreen } from '../RelationshipApp/src/screens/WelcomeScreen';
import { TERMS_URL, PRIVACY_POLICY_URL } from '../RelationshipApp/src/config/legal';

const navigation = { navigate: jest.fn() } as any;
const route = { key: 'Welcome', name: 'Welcome' } as any;

describe('WelcomeScreen legal links', () => {
  let openURLSpy: jest.SpyInstance;

  beforeEach(() => {
    openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as any);
  });

  afterEach(() => {
    openURLSpy.mockRestore();
  });

  async function renderScreen(): Promise<ReactTestRenderer.ReactTestRenderer> {
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(<WelcomeScreen navigation={navigation} route={route} />);
    });
    return tree;
  }

  test('legal URLs point at irislove.app', () => {
    expect(TERMS_URL).toMatch(/^https:\/\/irislove\.app\//);
    expect(PRIVACY_POLICY_URL).toMatch(/^https:\/\/irislove\.app\//);
  });

  test('Terms link opens the terms URL', async () => {
    const tree = await renderScreen();
    const link = tree.root
      .findAllByProps({ accessibilityRole: 'link' })
      .find((node) => node.props.children === 'Terms' && node.props.onPress);
    expect(link).toBeTruthy();
    await ReactTestRenderer.act(async () => {
      await link!.props.onPress();
    });
    expect(openURLSpy).toHaveBeenCalledWith(TERMS_URL);
  });

  test('Privacy Policy link opens the privacy URL', async () => {
    const tree = await renderScreen();
    const link = tree.root
      .findAllByProps({ accessibilityRole: 'link' })
      .find((node) => node.props.children === 'Privacy Policy' && node.props.onPress);
    expect(link).toBeTruthy();
    await ReactTestRenderer.act(async () => {
      await link!.props.onPress();
    });
    expect(openURLSpy).toHaveBeenCalledWith(PRIVACY_POLICY_URL);
  });
});
