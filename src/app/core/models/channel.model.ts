import { FieldValue, Timestamp } from 'firebase/firestore';

export interface Channel {
  id: string;
  familyId: string;
  familyName: string;
  channelName: string;
  icon: string;
  createdBy: string;
  videoIds: string[];
  createdAt: Timestamp | FieldValue;
}

export interface ChannelSubscription {
  id: string;
  channelId: string;
  userId: string;
  familyId: string;
  createdAt: Timestamp | FieldValue;
}
