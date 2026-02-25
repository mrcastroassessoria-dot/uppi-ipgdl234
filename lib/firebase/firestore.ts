'use client'

import { getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, WhereFilterOp, OrderByDirection, Timestamp, CollectionReference, DocumentData, Query, onSnapshot, Unsubscribe } from 'firebase/firestore'
import { app } from './config'

const db = getFirestore(app)

// Type-safe collection reference
export function getCollection<T = DocumentData>(collectionName: string): CollectionReference<T> {
  return collection(db, collectionName) as CollectionReference<T>
}

// Get single document
export async function getDocument<T = any>(collectionName: string, id: string): Promise<T | null> {
  const docRef = doc(db, collectionName, id)
  const docSnap = await getDoc(docRef)
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as T
  }
  return null
}

// Get multiple documents with query
export async function getDocuments<T = any>(
  collectionName: string,
  filters?: Array<{ field: string; operator: WhereFilterOp; value: any }>,
  orderByField?: string,
  orderDirection?: OrderByDirection,
  limitCount?: number
): Promise<T[]> {
  let q: Query = collection(db, collectionName)

  if (filters) {
    filters.forEach(filter => {
      q = query(q, where(filter.field, filter.operator, filter.value))
    })
  }

  if (orderByField) {
    q = query(q, orderBy(orderByField, orderDirection || 'asc'))
  }

  if (limitCount) {
    q = query(q, limit(limitCount))
  }

  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T))
}

// Add document
export async function addDocument<T = any>(collectionName: string, data: Partial<T>): Promise<string> {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    created_at: Timestamp.now(),
    updated_at: Timestamp.now()
  })
  return docRef.id
}

// Alias for compatibility
export const createDocument = addDocument

// Update document
export async function updateDocument(collectionName: string, id: string, data: any): Promise<void> {
  const docRef = doc(db, collectionName, id)
  await updateDoc(docRef, {
    ...data,
    updated_at: Timestamp.now()
  })
}

// Delete document
export async function deleteDocument(collectionName: string, id: string): Promise<void> {
  const docRef = doc(db, collectionName, id)
  await deleteDoc(docRef)
}

// Real-time subscription
export function subscribeToCollection<T = any>(
  collectionName: string,
  callback: (data: T[]) => void,
  filters?: Array<{ field: string; operator: WhereFilterOp; value: any }>
): Unsubscribe {
  let q: Query = collection(db, collectionName)

  if (filters) {
    filters.forEach(filter => {
      q = query(q, where(filter.field, filter.operator, filter.value))
    })
  }

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T))
    callback(data)
  })
}

// Real-time document subscription
export function subscribeToDocument<T = any>(
  collectionName: string,
  id: string,
  callback: (data: T | null) => void
): Unsubscribe {
  const docRef = doc(db, collectionName, id)
  
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() } as T)
    } else {
      callback(null)
    }
  })
}

export { db, Timestamp }
