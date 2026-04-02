import auth from '@react-native-firebase/auth';

export function getCurrentFirebaseUser() {
  return auth().currentUser;
}

export async function getCurrentFirebaseIdToken(): Promise<string | null> {
  const user = auth().currentUser;
  if (!user) {
    return null;
  }

  return user.getIdToken();
}
