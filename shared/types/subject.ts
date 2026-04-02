export interface SubjectDocument {
  _id: string;
  createdAt: string;
  updatedAt: string;
  kind: 'accountSelf' | 'celebrity' | 'guest';
  ownerUserId: string | null;
  isCelebrity: boolean;
  isReadOnly: boolean;
  firstName: string;
  lastName: string;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth: string;
  placeOfBirth: string;
  email?: string;
  time?: string;
  birthTimeUnknown?: boolean;
  totalOffsetHours: number;
  birthChart?: unknown;
  analysisStatus?: unknown;
  profilePhotoUrl?: string;
  profilePhotoKey?: string;
  profilePhotoUpdatedAt?: string | Date;
  appDomain?: string | null;
  firebaseUid?: string | null;
}
