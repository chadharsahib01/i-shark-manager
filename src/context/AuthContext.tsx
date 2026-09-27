import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  deleteUser
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth as getSecondaryAuth, signOut as secondarySignOut } from 'firebase/auth';
import { auth, db, firebaseConfig } from '../config/firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  createStudentAccount: (
    email: string,
    pass: string,
    fullName: string,
    rollNumber?: string,
    batch?: string,
    phone?: string
  ) => Promise<UserProfile>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (user: FirebaseUser): Promise<UserProfile | null> => {
    const userDocRef = doc(db, 'users', user.uid);
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data();
        const userActive = data.active !== undefined
          ? Boolean(data.active)
          : (data.isActive !== undefined ? Boolean(data.isActive) : true);

        // If a logged-in user has active: false, sign them out and show a friendly message
        if (!userActive) {
          await signOut(auth);
          setError('Your account has been deactivated. Please contact your institute administrator.');
          return null;
        }

        const userName = (data.name || data.fullName || user.displayName || 'Institute Member') as string;
        const userRole: UserRole = data.role as UserRole;

        const profile: UserProfile = {
          id: user.uid,
          name: userName,
          fullName: userName,
          email: data.email || user.email || '',
          role: userRole,
          active: true,
          isActive: true,
          phone: data.phone || '',
          rollNumber: data.rollNumber || '',
          batch: data.batch || '',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString()
        };
        return profile;
      } else {
        // If a logged-in user has no users/{uid} document, sign them out and show a friendly message
        await signOut(auth);
        setError('No institute record found for this account. Accounts must be registered by the institute administrator.');
        return null;
      }
    } catch (err: any) {
      console.error('Error fetching user profile:', err);
      const isConnectionIssue =
        err?.code === 'unavailable' ||
        (err?.message &&
          (err.message.includes('offline') || err.message.includes('Could not reach')));

      if (isConnectionIssue) {
        // Attempt one retry after network initializes
        try {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          const retrySnap = await getDoc(userDocRef);
          if (retrySnap.exists()) {
            const data = retrySnap.data();
            const userActive =
              data.active !== undefined
                ? Boolean(data.active)
                : data.isActive !== undefined
                ? Boolean(data.isActive)
                : true;

            if (!userActive) {
              await signOut(auth);
              setError('Your account has been deactivated. Please contact your institute administrator.');
              return null;
            }

            const userName = (data.name || data.fullName || user.displayName || 'Institute Member') as string;
            return {
              id: user.uid,
              name: userName,
              fullName: userName,
              email: data.email || user.email || '',
              role: data.role as UserRole,
              active: true,
              isActive: true,
              phone: data.phone || '',
              rollNumber: data.rollNumber || '',
              batch: data.batch || '',
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt || new Date().toISOString()
            };
          }
        } catch (retryErr) {
          console.warn('Retry profile fetch failed:', retryErr);
        }
      }

      await signOut(auth);
      setError(
        isConnectionIssue
          ? 'Network connection interrupted. Please verify your connection and sign in again.'
          : 'Unable to verify institute credentials. Please contact your administrator.'
      );
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        const profile = await fetchProfile(user);
        if (profile) {
          setCurrentUser(user);
          setUserProfile(profile);
        } else {
          setCurrentUser(null);
          setUserProfile(null);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (auth.currentUser) {
      const profile = await fetchProfile(auth.currentUser);
      setUserProfile(profile);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: any) {
      const code = err.code || '';
      let msg = 'Failed to send password reset email. Please verify the email address.';
      if (code === 'auth/user-not-found') {
        msg = 'No institute account registered with this email address.';
      } else if (code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else if (err.message) {
        msg = err.message.replace(/^Firebase:\s*Error\s*\((.*?)\)\.?/i, '$1');
      }
      setError(msg);
      throw new Error(msg);
    }
  };

  const signIn = async (email: string, pass: string) => {
    setError(null);
    // Do NOT call setLoading(true) around sign-in; onAuthStateChanged handles loading and profile
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } catch (err: any) {
      const code = err.code || '';
      let msg = 'Failed to sign in. Please check your credentials.';
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found' ||
        code === 'auth/invalid-email'
      ) {
        msg = 'Invalid email or password.';
      } else if (code === 'auth/too-many-requests') {
        msg = 'Too many attempts, try again later.';
      } else if (code === 'auth/network-request-failed') {
        msg = 'Network problem, check your internet.';
      } else if (err.message) {
        msg = err.message.replace(/^Firebase:\s*Error\s*\((.*?)\)\.?/i, '$1');
      }
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Creates student account without signing out the current admin
  const createStudentAccount = async (
    email: string,
    pass: string,
    fullName: string,
    rollNumber?: string,
    batch?: string,
    phone?: string
  ): Promise<UserProfile> => {
    if (!pass || pass.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    const tempAppName = `student_create_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getSecondaryAuth(tempApp);
    let createdUser: any = null;

    try {
      const cred = await createUserWithEmailAndPassword(tempAuth, email.trim(), pass);
      createdUser = cred.user;
      const newUid = cred.user.uid;

      const userName = fullName.trim();
      const now = new Date().toISOString();

      const studentProfile: UserProfile = {
        id: newUid,
        name: userName,
        fullName: userName,
        email: email.trim(),
        role: 'student',
        active: true,
        isActive: true,
        rollNumber: rollNumber?.trim() || '',
        batch: batch?.trim() || '',
        phone: phone?.trim() || '',
        createdAt: now,
        updatedAt: now
      };

      try {
        // Write to Firestore users collection using active admin session
        await setDoc(doc(db, 'users', newUid), {
          name: studentProfile.name,
          email: studentProfile.email,
          role: studentProfile.role,
          active: true,
          rollNumber: studentProfile.rollNumber,
          batch: studentProfile.batch,
          phone: studentProfile.phone,
          createdAt: studentProfile.createdAt,
          updatedAt: studentProfile.updatedAt
        });
      } catch (firestoreErr: any) {
        // If Firestore write fails, clean up the Auth user and throw clear error
        if (createdUser) {
          try {
            await deleteUser(createdUser);
          } catch (delErr) {
            console.error('Failed to rollback auth user after Firestore failure:', delErr);
          }
        }
        throw new Error(`Failed to create student database record: ${firestoreErr.message || 'Firestore write rejected'}`);
      }

      return studentProfile;
    } catch (err: any) {
      console.error('Error creating student account:', err);
      throw new Error(err.message || 'Failed to create student account');
    } finally {
      // Always signOut the secondary auth and delete the temporary app
      try {
        await secondarySignOut(tempAuth);
      } catch (e) {
        // ignore cleanup error
      }
      try {
        await deleteApp(tempApp);
      } catch (e) {
        // ignore cleanup error
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        error,
        signIn,
        resetPassword,
        logout,
        createStudentAccount,
        refreshProfile,
        clearError: () => setError(null)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
