import { db } from "../core/firebase";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import type { Member } from "../../types/member";
import { logger } from "../../utils/logger";

const membersCol = collection(db, "members");

export async function addMember(member: Omit<Member, "id">) {
  logger.info('Adding new member', {
    service: 'memberService',
    action: 'addMember',
    email: member.email
  });

  try {
    logger.logFirebaseOperation('create', 'members', { email: member.email });
    const docRef = await addDoc(membersCol, member);
    
    logger.info('Member added successfully', {
      service: 'memberService',
      memberId: docRef.id,
      email: member.email
    });
    
    return docRef.id;
  } catch (error) {
    logger.error('Failed to add member', error, {
      service: 'memberService',
      action: 'addMember',
      email: member.email
    });
    throw error;
  }
}

export async function getMembers() {
  logger.debug('Fetching all members', {
    service: 'memberService',
    action: 'getMembers'
  });

  try {
    logger.logFirebaseOperation('query', 'members');
    const snapshot = await getDocs(membersCol);
    const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Member[];
    
    logger.info('Members fetched successfully', {
      service: 'memberService',
      count: members.length
    });
    
    return members;
  } catch (error) {
    logger.error('Failed to fetch members', error, {
      service: 'memberService',
      action: 'getMembers'
    });
    throw error;
  }
}

export async function getMemberById(id: string): Promise<Member | null> {
  logger.debug('Fetching member by ID', {
    service: 'memberService',
    action: 'getMemberById',
    memberId: id
  });

  try {
    logger.logFirebaseOperation('read', 'members', { memberId: id });
    const docRef = doc(db, "members", id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const member = { id: docSnap.id, ...docSnap.data() } as Member;
      logger.info('Member found', {
        service: 'memberService',
        memberId: id,
        email: member.email
      });
      return member;
    }
    
    logger.warn('Member not found', {
      service: 'memberService',
      memberId: id
    });
    return null;
  } catch (error) {
    logger.error('Failed to fetch member', error, {
      service: 'memberService',
      action: 'getMemberById',
      memberId: id
    });
    return null;
  }
}

export async function updateMember(id: string, updates: Partial<Member>) {
  logger.info('Updating member', {
    service: 'memberService',
    action: 'updateMember',
    memberId: id,
    fields: Object.keys(updates)
  });

  try {
    logger.logFirebaseOperation('update', 'members', {
      memberId: id,
      fields: Object.keys(updates)
    });
    
    const docRef = doc(db, "members", id);
    await updateDoc(docRef, updates);
    
    logger.info('Member updated successfully', {
      service: 'memberService',
      memberId: id
    });
  } catch (error) {
    logger.error('Failed to update member', error, {
      service: 'memberService',
      action: 'updateMember',
      memberId: id
    });
    throw error;
  }
}

export async function deleteMember(id: string) {
  logger.info('Deleting member', {
    service: 'memberService',
    action: 'deleteMember',
    memberId: id
  });

  try {
    logger.logFirebaseOperation('delete', 'members', { memberId: id });
    await deleteDoc(doc(db, "members", id));
    
    logger.info('Member deleted successfully', {
      service: 'memberService',
      memberId: id
    });
  } catch (error) {
    logger.error('Failed to delete member', error, {
      service: 'memberService',
      action: 'deleteMember',
      memberId: id
    });
    throw error;
  }
}
