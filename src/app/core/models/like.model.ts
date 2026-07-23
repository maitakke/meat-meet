import { FieldValue, Timestamp } from 'firebase/firestore';

export interface Like {
  id: string;
  videoId: string;
  userId: string;
  familyId: string;
  createdAt: Timestamp | FieldValue;
}
