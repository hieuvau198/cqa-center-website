import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAllQuestions, getQuestionsByPool, deleteQuestion, getAllPools } from "../../../firebase/firebaseQuery";

const TYPE_LABELS = {
  "MC_SINGLE": "Single Choice",
  "MC_MULTI": "Multiple Choice",
  "MATCHING": "Matching",
  "WRITING": "Writing"
};

const QuestionList = () => {
  const { poolId } = useParams(); // Get poolId from URL if exists
  const [questions, setQuestions] = useState([]);
  const [poolName, setPoolName] = useState("All Questions");

  useEffect(() => {
    const fetchData = async () => {
      if (poolId) {
        // Fetch specific pool questions
        const qData = await getQuestionsByPool(poolId);
        setQuestions(qData);
        
        // Fetch pool name for title
        const pools = await getAllPools();
        const currentPool = pools.find(p => p.id === poolId);
        if (currentPool) setPoolName(currentPool.name);
      } else {
        // Fetch ALL
        const data = await getAllQuestions();
        setQuestions(data);
      }
    };
    fetchData();
  }, [poolId]);

  const handleDelete = async (id) => {
    if(confirm("Are you sure you want to delete this question?")) {
      await deleteQuestion(id);
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  return (
    <div className="admin-container">
      <div className="page-header">
        <div>
          <small style={{ color: "#888", textTransform: "uppercase" }}>Pool / Folder</small>
          <h2>{poolName}</h2>
        </div>
        <Link to="/admin/questions/new">
          <button className="btn btn-primary">+ Add New Question</button>
        </Link>
      </div>

      <div className="list-container">
        {questions.length === 0 ? <p>No questions found in this pool.</p> : questions.map(q => (
          <div key={q.id} className="item-card">
            <div className="item-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h4 style={{ margin: 0 }}>{q.name}</h4>
                <span style={{ 
                  fontSize: '12px', 
                  backgroundColor: '#e0e0e0', 
                  padding: '2px 8px', 
                  borderRadius: '12px' 
                }}>
                  {TYPE_LABELS[q.type] || q.type}
                </span>
              </div>
              <div>
                {/* --- EDIT BUTTON --- */}
                <Link to={`/admin/questions/edit/${q.id}`}>
                  <button className="btn-text" style={{ marginRight: "10px", color: "#2980b9" }}>Edit</button>
                </Link>
                <button onClick={() => handleDelete(q.id)} className="btn-text-delete">Delete</button>
              </div>
            </div>
            {q.description && <p style={{ color: '#666', fontSize: '0.9em' }}>{q.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionList;