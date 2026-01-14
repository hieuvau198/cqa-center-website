// src/firebase/firebaseQuery.js
import { db, auth, googleProvider, storage, firebaseConfig } from "./firebase-config";
import { initializeApp } from "firebase/app";
import { collection, getDocs, addDoc, deleteDoc, doc, setDoc, updateDoc, getDoc, query, where } from "firebase/firestore";
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, getAuth } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

export { db, auth, googleProvider }; 

const SYSTEM_DOMAIN = "@cqa.center";

let secondaryAuth = null;
try {
  const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
  secondaryAuth = getAuth(secondaryApp);
} catch (e) {
  console.log("Secondary app likely already initialized");
}

//#region STORAGE
export const uploadFile = async (file, path = "uploads") => {
  try {
    const uniqueName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `${path}/${uniqueName}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

export const deleteFile = async (fileUrl) => {
  if (!fileUrl) return;
  try {
    const fileRef = ref(storage, fileUrl);
    await deleteObject(fileRef);
    console.log("Deleted file:", fileUrl);
  } catch (error) {
    console.warn("Error deleting file (might not exist):", fileUrl, error);
  }
};
//#endregion

//#region Path References
const questionsRef = collection(db, "questions");
const poolsRef = collection(db, "pools");
const testsRef = collection(db, "tests");
const tagsRef = collection(db, "tags");
const usersRef = collection(db, "users");
const attemptsRef = collection(db, "attempts");
const practicesRef = collection(db, "practices");
//#endregion

//#region POOLS
export const getAllPools = async () => {
  try {
    const snapshot = await getDocs(poolsRef);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  } catch (error) {
    console.error("Error fetching pools:", error);
    throw error;
  }
};

export const addPool = async (name) => {
  try {
    return await addDoc(poolsRef, { name, createdAt: new Date().toISOString() });
  } catch (error) {
    console.error("Error adding pool:", error);
    throw error;
  }
};

export const updatePool = async (id, name) => {
  try {
    const docRef = doc(db, "pools", id);
    await updateDoc(docRef, { name });
  } catch (error) {
    console.error("Error updating pool:", error);
    throw error;
  }
};
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

export const getQuestionsByPool = async (poolId) => {
  try {
    const q = query(questionsRef, where("poolId", "==", poolId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  } catch (error) {
    console.error("Error fetching questions by pool:", error);
    throw error;
  }
};

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

export const updateQuestion = async (id, data) => {
  try {
    const docRef = doc(db, "questions", id);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error("Error updating question:", error);
    throw error;
  }
};

export const deleteQuestion = async (id) => {
  try {
    // 1. Delete the question document from 'questions' collection
    await deleteDoc(doc(db, "questions", id));

    // 2. Remove the question from all tests that use it
    // Fetch all tests
    const testsSnapshot = await getDocs(collection(db, "tests"));
    
    const updatePromises = [];

    testsSnapshot.forEach((testDoc) => {
      const testData = testDoc.data();
      let isModified = false;
      
      // Handle tests with a 'sections' structure (common in this app)
      let newSections = testData.sections;
      if (testData.sections && Array.isArray(testData.sections)) {
        newSections = testData.sections.map((section) => {
          if (section.questions && Array.isArray(section.questions)) {
            // Filter out the question. Handle both ID strings and Objects with an ID.
            const originalLength = section.questions.length;
            const newQuestions = section.questions.filter((q) => {
              const qId = typeof q === 'object' ? q.id : q;
              return qId !== id;
            });

            if (newQuestions.length !== originalLength) {
              isModified = true;
              return { ...section, questions: newQuestions };
            }
          }
          return section;
        });
      }

      // Handle tests with a simple 'questions' array (if any)
      let newQuestions = testData.questions;
      if (testData.questions && Array.isArray(testData.questions)) {
        const originalLength = testData.questions.length;
        newQuestions = testData.questions.filter((q) => {
           const qId = typeof q === 'object' ? q.id : q;
           return qId !== id;
        });
        if (newQuestions.length !== originalLength) {
          isModified = true;
        }
      }

      // If the test was modified, queue an update
      if (isModified) {
        updatePromises.push(updateDoc(doc(db, "tests", testDoc.id), {
          sections: newSections || [],
          questions: newQuestions || []
        }));
      }
    });

    // Execute all test updates
    await Promise.all(updatePromises);
    return true;

  } catch (error) {
    console.error("Error deleting question:", error);
    throw error;
  }
};

export const getQuestionById = async (id) => {
  try {
    const docRef = doc(db, "questions", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return { ...docSnap.data(), id: docSnap.id };
    return null;
  } catch (error) {
    console.error("Error fetching question:", error);
    throw error;
  }
};

const extractImageUrls = (htmlContent) => {
  if (!htmlContent) return [];
  const regex = /src=["']([^"']+)["']/g;
  const urls = [];
  let match;
  while ((match = regex.exec(htmlContent)) !== null) {
    urls.push(match[1]);
  }
  return urls;
};

/**
 * NEW: Delete a test AND all its associated questions and images.
 * This is a "Deep Delete" operation.
 */
export const deleteTestWithQuestions = async (testId) => {
  try {
    // 1. Get the test to find the list of Question IDs
    const test = await getTestById(testId);
    if (!test) throw new Error("Test not found");

    // Retrieve IDs from 'questionIds' (standard) or legacy 'questions' field
    let idsToDelete = [];
    if (test.questionIds && Array.isArray(test.questionIds)) {
      idsToDelete = [...test.questionIds];
    } else if (test.questions && Array.isArray(test.questions)) {
      idsToDelete = test.questions.map(q => (typeof q === 'object' ? q.id : q));
    }
    
    // Remove duplicates
    idsToDelete = [...new Set(idsToDelete)];

    // 2. Iterate through each question to delete Images + Document
    // We use Promise.all to process them (or use a for...of loop if sequential is safer for rate limits)
    const deletePromises = idsToDelete.map(async (qId) => {
       const question = await getQuestionById(qId);
       if (!question) return;

       const imagesToDelete = new Set();
       
       // A. Collect Main Image
       if (question.imageUrl) imagesToDelete.add(question.imageUrl);
       
       // B. Collect Images from Content & Explanation HTML
       extractImageUrls(question.content).forEach(url => imagesToDelete.add(url));
       extractImageUrls(question.explanation).forEach(url => imagesToDelete.add(url));
       
       // C. Collect Images from Answers
       if (question.answers && Array.isArray(question.answers)) {
          question.answers.forEach(ans => {
             if (ans.imageUrl) imagesToDelete.add(ans.imageUrl);
             extractImageUrls(ans.content).forEach(url => imagesToDelete.add(url));
          });
       }

       // D. Execute Image Deletion (Only delete files hosted in our Firebase Storage)
       const imageDeletePromises = Array.from(imagesToDelete).map(url => {
          if (url && url.includes("firebasestorage")) {
             return deleteFile(url);
          }
          return Promise.resolve();
       });
       await Promise.all(imageDeletePromises);

       // E. Delete the Question Document
       await deleteQuestion(qId);
    });

    await Promise.all(deletePromises);

    // 3. Finally, call the standard deleteTest to remove the Test doc, Practices, and Attempts
    await deleteTest(testId);

    console.log(`Deep delete completed for test ${testId}`);

  } catch (error) {
    console.error("Error in deleteTestWithQuestions:", error);
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

export const updateTest = async (id, data) => {
  try {
    const docRef = doc(db, "tests", id);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error("Error updating test:", error);
    throw error;
  }
};

export const deleteTest = async (id) => {
  try {
    const q = query(practicesRef, where("testId", "==", id));
    const practiceSnapshot = await getDocs(q);

    for (const practiceDoc of practiceSnapshot.docs) {
        const attemptsQ = query(attemptsRef, where("practiceId", "==", practiceDoc.id));
        const attemptsSnap = await getDocs(attemptsQ);
        await Promise.all(attemptsSnap.docs.map(a => deleteDoc(a.ref)));
        await deleteDoc(practiceDoc.ref);
    }
    await deleteDoc(doc(db, "tests", id));
  } catch (error) {
    console.error("Error deleting test and its practices:", error);
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

export const updatePractice = async (id, practiceData) => {
  try {
    const docRef = doc(db, "practices", id);
    await updateDoc(docRef, practiceData);
  } catch (error) {
    console.error("Error updating practice:", error);
    throw error;
  }
};

export const deletePractice = async (id) => {
  try {
    const q = query(attemptsRef, where("practiceId", "==", id));
    const attemptSnapshot = await getDocs(q);
    const deletePromises = attemptSnapshot.docs.map(attemptDoc => 
      deleteDoc(attemptDoc.ref)
    );
    await Promise.all(deletePromises);
    await deleteDoc(doc(db, "practices", id));
  } catch (error) {
    console.error("Error deleting practice and its attempts:", error);
    throw error;
  }
};
//#endregion

//#region TAGs (UPDATED for Hierarchy)
export const getAllTags = async () => {
  try {
    const snapshot = await getDocs(tagsRef);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  } catch (error) {
    console.error("Error fetching tags:", error);
    throw error;
  }
};

// Updated: Accepts optional parentId
export const addTag = async (tagName, parentId = null) => {
  try {
    return await addDoc(tagsRef, { 
      name: tagName, 
      parentId: parentId || null 
    });
  } catch (error) {
    console.error("Error adding tag:", error);
    throw error;
  }
};

export const updateTag = async (id, name) => {
  try {
    const docRef = doc(db, "tags", id);
    await updateDoc(docRef, { name });
  } catch (error) {
    console.error("Error updating tag:", error);
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

//#region USER MANAGEMENT
export const getAllUsers = async () => {
  try {
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const getUserById = async (id) => {
  try {
    const docRef = doc(db, "users", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return { ...docSnap.data(), id: docSnap.id };
    return null;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
};

export const createSystemUser = async (userData) => {
  const { username, password, role, name } = userData;
  const email = username.includes("@") ? username : `${username}${SYSTEM_DOMAIN}`;

  try {
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: email,
      username: username,
      displayName: name,
      role: role,
      password: password,
      createdAt: new Date().toISOString()
    });

    await signOut(secondaryAuth);
    return user;
  } catch (error) {
    console.error("Error creating system user:", error);
    throw error;
  }
};

export const updateUser = async (id, data) => {
  try {
    const docRef = doc(db, "users", id);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

export const deleteUser = async (id) => {
  try {
    await deleteDoc(doc(db, "users", id));
  } catch (error) {
    console.error("Error deleting user:", error);
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

export const loginWithEmail = async (identifier, password) => {
  try {
    let email = identifier;
    if (!identifier.includes("@")) {
      email = `${identifier}${SYSTEM_DOMAIN}`;
    }
    
    const result = await signInWithEmailAndPassword(auth, email, password);
    
    const userDoc = await getDoc(doc(db, "users", result.user.uid));
    if (!userDoc.exists()) {
       await signOut(auth);
       throw new Error("Tài khoản này đã bị vô hiệu hóa hoặc không tồn tại.");
    }

    return result;
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

export const updateUserProfile = async (uid, data) => {
  try {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, data, { merge: true }); 
  } catch (error) {
    console.error("Error updating profile:", error);
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

