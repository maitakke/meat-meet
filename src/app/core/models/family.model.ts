import { FieldValue, Timestamp } from 'firebase/firestore';

export interface Family {
  id: string;
  familyName: string;
  createdAt: Timestamp | FieldValue;
}

export type FamilyUserRole = 'parent' | 'child';

export interface FamilyUser {
  id: string;
  name: string;
  role: FamilyUserRole;
  avatarUrl: string;
}
