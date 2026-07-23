import { FieldValue, Timestamp } from 'firebase/firestore';

export interface Video {
  id: string;
  youtubeId: string;
  title: string;
  familyId: string;
  familyName: string;
  registeredBy: string;
  createdAt: Timestamp | FieldValue;

  isPrivate: boolean;
  allowedFamilyIds: string[];
}

export interface VideoComment {
  id: string;
  familyId: string;
  familyName: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Timestamp | FieldValue;
}
