import { getAuth } from '@react-native-firebase/auth';

export function getCurrentFirebaseUser() {
  return getAuth().currentUser;
}

export async function getCurrentFirebaseIdToken(): Promise<string | null> {
  const user = getAuth().currentUser;
  if (!user) {
    return null;
  }

  return user.getIdToken();
}
