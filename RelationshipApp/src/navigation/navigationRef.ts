import { createNavigationContainerRef } from '@react-navigation/native';
import type { RelationshipRootParamList } from './RootNavigator';

/**
 * Root navigation container ref. Lets non-screen code (e.g. the sign-out flow)
 * drive the root stack directly, instead of relying on RootNavigator's
 * key/initialRouteName remount — which does not reliably re-render the active
 * screen when auth state flips.
 */
export const navigationRef = createNavigationContainerRef<RelationshipRootParamList>();

/** Reset the whole stack to a single root screen, if the navigator is mounted. */
export function resetRootTo(routeName: keyof RelationshipRootParamList): void {
  if (navigationRef.isReady()) {
    navigationRef.resetRoot({ index: 0, routes: [{ name: routeName }] });
  }
}
