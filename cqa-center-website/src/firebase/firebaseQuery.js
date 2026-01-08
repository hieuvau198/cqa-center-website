// src/firebase/firebaseQuery.js
import { db, auth, googleProvider } from "./firebase-config";
import { collection, getDocs, addDoc, deleteDoc, doc, setDoc, getDoc, query, where } from "firebase/firestore";
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";

// --- FIX: Export these so components can import them from this file ---
export { db, auth, googleProvider }; 

//#region Path References
const questionsRef = collection(db, "questions");
const testsRef = collection(db, "tests");
const tagsRef = collection(db, "tags");
const usersRef = collection(db, "users");
const attemptsRef = collection(db, "attempts");
const practicesRef = collection(db, "practices");
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

// --- NEW: Required for PracticeAttempt ---
export const getQuestionsByIds = async (ids) => {
  try {
    if (!ids || ids.length === 0) return [];
    const questionPromises = ids.map(id => getDoc(doc(db, "questions", id)));
    const questionSnapshots = await Promise.all(questionPromises);
    return questionSnapshots
      .filter(snap => snap.exists())
      .map(snap => ({ ...snap.data(), id: snap.id }));
  } catch (error) {
    console.error("Error fetching questions by IDs:", error);
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

export const getTestById = async (id) => {
  try {
    const docRef = doc(db, "tests", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...docSnap.data(), id: docSnap.id };
    } else {
      console.error("No such test document!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching test by id:", error);
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

//#region PRACTICES
export const createPractice = async (practiceData) => {
  try {
    return await addDoc(practicesRef, {
      ...practiceData,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error creating practice:", error);
    throw error;
  }
};

export const getAllPractices = async () => {
  try {
    const snapshot = await getDocs(practicesRef);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  } catch (error) {
    console.error("Error fetching all practices:", error);
    throw error;
  }
};

export const getPracticesByTest = async (testId) => {
  try {
    const q = query(practicesRef, where("testId", "==", testId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  } catch (error) {
    console.error("Error fetching practices:", error);
    throw error;
  }
};

export const getPracticeByCode = async (entryCode) => {
  try {
    const q = query(practicesRef, where("entryCode", "==", entryCode));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return { ...snapshot.docs[0].data(), id: snapshot.docs[0].id };
    }
    return null;
  } catch (error) {
    console.error("Error finding practice by code:", error);
    throw error;
  }
};

// --- NEW: Required for PracticeAttempt ---
export const getPracticeById = async (id) => {
  try {
    const docSnap = await getDoc(doc(db, "practices", id));
    if (docSnap.exists()) return { ...docSnap.data(), id: docSnap.id };
    return null;
  } catch (error) {
    console.error("Error fetching practice:", error);
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
    return await addDoc(attemptsRef, {
      ...attemptData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error saving attempt:", error);
    throw error;
  }
};

export const getAttemptsByPractice = async (practiceId) => {
  try {
    const q = query(attemptsRef, where("practiceId", "==", practiceId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  } catch (error) {
    console.error("Error fetching attempts by practice:", error);
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