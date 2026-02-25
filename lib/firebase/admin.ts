import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getFirestore, Firestore, Timestamp, FieldValue } from 'firebase-admin/firestore'
import { getAuth, Auth } from 'firebase-admin/auth'

let adminApp: App | undefined
let adminDb: Firestore | undefined
let adminAuth: Auth | undefined

export function getAdminApp(): App {
  if (!adminApp) {
    const apps = getApps()
    
    if (apps.length > 0) {
      adminApp = apps[0]
    } else {
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      
      if (!serviceAccount) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required')
      }

      adminApp = initializeApp({
        credential: cert(JSON.parse(serviceAccount)),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      })
    }
  }

  return adminApp
}

export function getAdminDb(): Firestore {
  if (!adminDb) {
    adminDb = getFirestore(getAdminApp())
  }
  return adminDb
}

export function getAdminAuth(): Auth {
  if (!adminAuth) {
    adminAuth = getAuth(getAdminApp())
  }
  return adminAuth
}

// Server-side CRUD operations
export async function getDocumentServer<T = any>(collectionName: string, id: string): Promise<T | null> {
  const db = getAdminDb()
  const docRef = db.collection(collectionName).doc(id)
  const docSnap = await docRef.get()
  
  if (docSnap.exists) {
    return { id: docSnap.id, ...docSnap.data() } as T
  }
  return null
}

export async function getDocumentsServer<T = any>(
  collectionName: string,
  filters?: Array<{ field: string; operator: FirebaseFirestore.WhereFilterOp; value: any }>,
  orderByField?: string,
  limitCount?: number
): Promise<T[]> {
  const db = getAdminDb()
  let query: FirebaseFirestore.Query = db.collection(collectionName)

  if (filters) {
    filters.forEach(filter => {
      query = query.where(filter.field, filter.operator, filter.value)
    })
  }

  if (orderByField) {
    query = query.orderBy(orderByField)
  }

  if (limitCount) {
    query = query.limit(limitCount)
  }

  const snapshot = await query.get()
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T))
}

export async function addDocumentServer<T = any>(collectionName: string, data: Partial<T>): Promise<string> {
  const db = getAdminDb()
  const docRef = await db.collection(collectionName).add({
    ...data,
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp()
  })
  return docRef.id
}

export async function updateDocumentServer(collectionName: string, id: string, data: any): Promise<void> {
  const db = getAdminDb()
  await db.collection(collectionName).doc(id).update({
    ...data,
    updated_at: FieldValue.serverTimestamp()
  })
}

export async function deleteDocumentServer(collectionName: string, id: string): Promise<void> {
  const db = getAdminDb()
  await db.collection(collectionName).doc(id).delete()
}

// Auth helpers
export async function verifyIdToken(token: string) {
  const auth = getAdminAuth()
  return await auth.verifyIdToken(token)
}

export async function getUserByEmail(email: string) {
  const auth = getAdminAuth()
  return await auth.getUserByEmail(email)
}

export async function createUser(email: string, password: string, displayName?: string) {
  const auth = getAdminAuth()
  return await auth.createUser({
    email,
    password,
    displayName
  })
}

// Aliases for compatibility
export const getFirestoreAdmin = getAdminDb
export const verifyAuthToken = async (request: Request) => {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '') || request.headers.get('firebase-auth-token')
  
  if (!token) return null
  
  try {
    const decodedToken = await verifyIdToken(token)
    return decodedToken
  } catch (error) {
    console.error('[v0] Token verification failed:', error)
    return null
  }
}

export { Timestamp, FieldValue }
