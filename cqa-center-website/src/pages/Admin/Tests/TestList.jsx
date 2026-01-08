import { useEffect, useState } from "react";
import { db } from "../../../firebase-config";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { Link } from "react-router-dom";

const TestList = () => {
  const [tests, setTests] = useState([]);

  useEffect(() => {
    const fetchTests = async () => {
      const querySnapshot = await getDocs(collection(db, "tests"));
      setTests(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    };
    fetchTests();
  }, []);

  const handleDelete = async (id) => {
    if(confirm("Delete this test?")) {
      await deleteDoc(doc(db, "tests", id));
      setTests(tests.filter(t => t.id !== id));
    }
  };

  return (
    <div>
      <h2>Test Material Management</h2>
      <Link to="/admin/tests/new"><button>+ Create New Test</button></Link>
      <div style={{ marginTop: "20px" }}>
        {tests.map(t => (
          <div key={t.id} style={{ border: "1px solid #ddd", padding: "10px", marginBottom: "10px", background: "white" }}>
            <h4>{t.name} <small>(Max Score: {t.maxScore})</small></h4>
            <p>{t.description}</p>
            <p><strong>Time Limit:</strong> {t.timeLimit} mins</p>
            <button onClick={() => handleDelete(t.id)} style={{ color: "red" }}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestList;