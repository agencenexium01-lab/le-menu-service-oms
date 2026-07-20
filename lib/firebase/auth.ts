import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  Timestamp,
  collection,
  query,
  where,
  getDocs,
  updateDoc
} from 'firebase/firestore';
import { auth, db } from './config';
import { User as AppUser } from '../../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Translates Firebase Auth error codes into helpful, friendly French messages.
 */
export function translateAuthError(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Cette adresse email est déjà associée à un compte existant.';
    case 'auth/invalid-email':
      return 'L\'adresse email saisie n\'est pas correcte.';
    case 'auth/operation-not-allowed':
      return 'La connexion par email et mot de passe n\'est pas activée.';
    case 'auth/weak-password':
      return 'Le mot de passe est trop faible. Veuillez choisir un mot de passe d\'au moins 8 caractères.';
    case 'auth/user-disabled':
      return 'Ce compte utilisateur a été désactivé.';
    case 'auth/user-not-found':
      return 'Aucun compte trouvé avec cette adresse email.';
    case 'auth/wrong-password':
      return 'Le mot de passe saisi est incorrect.';
    case 'auth/invalid-credential':
      return 'Adresse email ou mot de passe incorrect.';
    case 'auth/too-many-requests':
      return 'Trop de tentatives infructueuses d\'affilée. Veuillez patienter avant de réessayer.';
    case 'auth/network-request-failed':
      return 'Erreur de réseau. Veuillez vérifier votre connexion internet.';
    default:
      return 'Une erreur d\'authentification est survenue. Veuillez réessayer.';
  }
}

/**
 * Registers a new client and creates their profile document in Firestore.
 */
export async function registerClientUser(
  email: string, 
  password: string, 
  displayName: string, 
  phone: string, 
  companyName?: string
): Promise<AppUser> {
  let userCredential;
  try {
    userCredential = await createUserWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    throw new Error(translateAuthError(error.code || error.message));
  }

  const firebaseUser = userCredential.user;

  try {
    await updateProfile(firebaseUser, { displayName });
  } catch (error) {
    console.warn('Failed to update displayName in user profile:', error);
  }

  const finalCompanyName = (typeof companyName === 'string') ? companyName : "";

  const appUser: AppUser = {
    uid: firebaseUser.uid,
    email: email || "",
    displayName: displayName || "",
    role: 'client',
    phone: phone || "",
    companyName: finalCompanyName, // 👈 Garanti d'être au moins une chaîne vide ""
    branchId: null,
    active: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };

  const userPath = `users/${firebaseUser.uid}`;
  try {
    console.log("Tentative d'écriture Firestore pour l'utilisateur :", appUser);
    await setDoc(doc(db, 'users', firebaseUser.uid), appUser);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }

  return appUser;
}

/**
 * Logs in a user.
 */
export async function loginUser(email: string, password: string): Promise<FirebaseUser> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    throw new Error(translateAuthError(error.code || error.message));
  }
}

/**
 * Logs out the current user.
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(error.message || 'Erreur lors de la déconnexion.');
  }
}

/**
 * Fetches the user profile document from Firestore.
 */
export async function getUserProfile(uid: string): Promise<AppUser | null> {
  const userPath = `users/${uid}`;
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as AppUser;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userPath);
  }
}

/**
 * Registers a new staff user (chef_point, admin, or super_admin)
 */
export async function registerStaffUser(
  email: string,
  password: string,
  displayName: string,
  phone: string,
  role: 'chef_point' | 'admin' | 'super_admin',
  branchId?: string
): Promise<AppUser> {
  // Validate role-specific requirements
  if (role === 'chef_point' && !branchId) {
    throw new Error('Un chef de point doit être assigné à une annexe (branchId).');
  }

  let userCredential;
  try {
    userCredential = await createUserWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    throw new Error(translateAuthError(error.code || error.message));
  }

  const firebaseUser = userCredential.user;

  try {
    await updateProfile(firebaseUser, { displayName });
  } catch (error) {
    console.warn('Failed to update displayName:', error);
  }

  const appUser: AppUser = {
    uid: firebaseUser.uid,
    email,
    displayName,
    role,
    phone,
    branchId: branchId || null,
    active: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };

  const userPath = `users/${firebaseUser.uid}`;
  try {
    await setDoc(doc(db, 'users', firebaseUser.uid), appUser);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }

  return appUser;
}

/**
 * Updates user profile information
 */
export async function updateUserProfile(uid: string, updates: Partial<AppUser>): Promise<void> {
  const userPath = `users/${uid}`;
  try {
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now()
    };
    await setDoc(doc(db, 'users', uid), updateData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}

/**
 * Soft delete a user (set active to false)
 */
export async function deactivateUser(uid: string): Promise<void> {
  const userPath = `users/${uid}`;
  try {
    await setDoc(doc(db, 'users', uid), 
      { 
        active: false,
        updatedAt: Timestamp.now()
      }, 
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}

/**
 * Get all staff members for a specific branch
 */
export async function getBranchStaff(branchId: string): Promise<AppUser[]> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('branchId', '==', branchId),
      where('active', '==', true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as AppUser);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
  }
}

/**
 * Check if an email already exists in the system
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking email:', error);
    return false;
  }
}
