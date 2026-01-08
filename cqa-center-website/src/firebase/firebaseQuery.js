// src/firebase/firebaseQuery.js
import { db, auth, googleProvider } from "./firebase-config";
import { collection, getDocs, addDoc, deleteDoc, doc, setDoc, getDoc, query, where } from "firebase/firestore";
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";

//#region Path References
const questionsRef = collection(db, "questions");
const testsRef = collection(db, "tests");
const tagsRef = collection(db, "tags");
const usersRef = collection(db, "users");
const attemptsRef = collection(db, "attempts");
//#endregion

//#region QUESTIONs
export const getAllQuestions = async () => {
  try {
    const snapshot = await getDocs(questionsRef);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  } catch (error) {
    console.error("Error fetching questions:", error);
    throw error;
  }
};

export const addQuestion = async (questionData) => {
  try {
    return await addDoc(questionsRef, questionData);
  } catch (error) {
    console.error("Error adding question:", error);
    throw error;
  }
};

export const deleteQuestion = async (id) => {
  try {
    await deleteDoc(doc(db, "questions", id));
  } catch (error) {
    console.error("Error deleting question:", error);
    throw error;
  }
};
//#endregion

//#region TESTs
export const getAllTests = async () => {
  try {
    const snapshot = await getDocs(testsRef);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  } catch (error) {
    console.error("Error fetching tests:", error);
    throw error;
  }
};

export const addTest = async (testData) => {
  try {
    return await addDoc(testsRef, testData);
  } catch (error) {
    console.error("Error adding test:", error);
    throw error;
  }
};

export const deleteTest = async (id) => {
  try {
    await deleteDoc(doc(db, "tests", id));
  } catch (error) {
    console.error("Error deleting test:", error);
    throw error;
  }
};
//#endregion

//#region TAGs
export const getAllTags = async () => {
  try {
    const snapshot = await getDocs(tagsRef);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  } catch (error) {
    console.error("Error fetching tags:", error);
    throw error;
  }
};

export const addTag = async (tagName) => {
  try {
    return await addDoc(tagsRef, { name: tagName });
  } catch (error) {
    console.error("Error adding tag:", error);
    throw error;
  }
};

export const deleteTag = async (id) => {
  try {
    await deleteDoc(doc(db, "tags", id));
  } catch (error) {
    console.error("Error deleting tag:", error);
    throw error;
  }
};
//#endregion

//#region AUTHENTICATION

export const registerWithEmail = async (email, password, role = "STUDENT") => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create User Document in Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      role: role,
      createdAt: new Date().toISOString()
    });
    
    return user;
  } catch (error) {
    console.error("Error registering:", error);
    throw error;
  }
};

export const loginWithEmail = async (email, password) => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if user doc exists, if not create one (Default: STUDENT)
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        role: "STUDENT",
        createdAt: new Date().toISOString()
      });
    }
    return user;
  } catch (error) {
    console.error("Google login error:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  await signOut(auth);
};

export const getUserProfile = async (uid) => {
  try {
    const docSnap = await getDoc(doc(db, "users", uid));
    if (docSnap.exists()) return docSnap.data();
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};
//#endregion

//#region ATTEMPTs
export const saveAttempt = async (attemptData) => {
  try {
    // attemptData expected: { testId, testName, userId, userEmail, score, maxScore, answers, timestamp }
    return await addDoc(attemptsRef, {
      ...attemptData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error saving attempt:", error);
    throw error;
  }
};

export const getAttemptsByTest = async (testId) => {
  try {
    const q = query(attemptsRef, where("testId", "==", testId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  } catch (error) {
    console.error("Error fetching attempts:", error);
    throw error;
  }
};

export const getAttemptsByUser = async (userId) => {
  try {
    const q = query(attemptsRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  } catch (error) {
    console.error("Error fetching user attempts:", error);
    throw error;
  }
};
//#endregion