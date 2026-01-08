import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllQuestions, deleteQuestion } from "../../../firebase/firebaseQuery";

const QuestionList = () => {
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getAllQuestions();
      setQuestions(data);
    };
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if(confirm("Delete this question?")) {
      await deleteQuestion(id);
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  return (
    <div className="admin-container">
      <div className="page-header">
        <h2>Pool Management</h2>
        <Link to="/admin/questions/new">
          <button className="btn btn-primary">+ Add New Question</button>
        </Link>
      </div>

      <div className="list-container">
        {questions.map(q => (
          <div key={q.id} className="item-card">
            <div className="item-header">
              <h4>{q.name} <small>({q.type})</small></h4>
              <button onClick={() => handleDelete(q.id)} className="btn-text-delete">Delete</button>
            </div>
            <p>{q.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionList;