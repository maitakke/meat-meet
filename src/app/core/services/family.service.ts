import { Injectable, inject } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { FIRESTORE } from '../firebase.providers';
import { Family, FamilyUser } from '../models';

@Injectable({ providedIn: 'root' })
export class FamilyService {
  private readonly firestore = inject(FIRESTORE);

  async createFamily(familyId: string, familyName: string): Promise<void> {
    await setDoc(doc(this.firestore, 'families', familyId), {
      id: familyId,
      familyName,
      createdAt: serverTimestamp(),
    });
  }

  async getFamily(familyId: string): Promise<Family | null> {
    const snapshot = await getDoc(doc(this.firestore, 'families', familyId));
    return snapshot.exists() ? (snapshot.data() as Family) : null;
  }

  async listAllFamilies(): Promise<Family[]> {
    const snapshot = await getDocs(collection(this.firestore, 'families'));
    return snapshot.docs.map((d) => d.data() as Family);
  }

  async listFamilyUsers(familyId: string): Promise<FamilyUser[]> {
    const snapshot = await getDocs(
      collection(this.firestore, 'families', familyId, 'users')
    );
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as FamilyUser);
  }

  async addFamilyUser(
    familyId: string,
    user: Omit<FamilyUser, 'id'>
  ): Promise<string> {
    const ref = await addDoc(
      collection(this.firestore, 'families', familyId, 'users'),
      user
    );
    return ref.id;
  }

  async updateFamilyUser(
    familyId: string,
    userId: string,
    patch: Partial<Omit<FamilyUser, 'id'>>
  ): Promise<void> {
    await updateDoc(
      doc(this.firestore, 'families', familyId, 'users', userId),
      patch
    );
  }

  async deleteFamilyUser(familyId: string, userId: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'families', familyId, 'users', userId));
  }

  async deleteFamily(familyId: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'families', familyId));
  }
}
