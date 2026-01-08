import { useEffect, useState } from "react";
import { db } from "../../../firebase-config";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { Link } from "react-router-dom";

const QuestionList = () => {
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    const fetchQuestions = async () => {
      const querySnapshot = await getDocs(collection(db, "questions"));
      setQuestions(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    };
    fetchQuestions();
  }, []);

  const handleDelete = async (id) => {
    if(confirm("Delete this question?")) {
      await deleteDoc(doc(db, "questions", id));
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  return (
    <div>
      <h2>Pool Management</h2>
      <Link to="/admin/questions/new"><button>+ Add New Question</button></Link>
      <div style={{ marginTop: "20px" }}>
        {questions.map(q => (
          <div key={q.id} style={{ border: "1px solid #ddd", padding: "10px", marginBottom: "10px", background: "white" }}>
            <h4>{q.name} <small>({q.type})</small></h4>
            <p>{q.description}</p>
            <button onClick={() => handleDelete(q.id)} style={{ color: "red" }}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionList;