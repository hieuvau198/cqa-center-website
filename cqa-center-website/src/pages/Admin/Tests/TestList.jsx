import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAllTests, deleteTest } from "../../../firebase/firebaseQuery";

const TestList = () => {
  const [tests, setTests] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTests = async () => {
      const data = await getAllTests();
      setTests(data);
    };
    fetchTests();
  }, []);

  const handleDelete = async (id) => {
    if(confirm("Delete this test?")) {
      await deleteTest(id);
      setTests(tests.filter(t => t.id !== id));
    }
  };

  return (
    <div className="admin-container">
      <div className="page-header">
        <h2>Test Material Management</h2>
        <Link to="/admin/tests/new"><button className="btn btn-primary">+ Create New Test</button></Link>
      </div>
      
      <div className="list-container">
        {tests.map(t => (
          <div key={t.id} className="item-card">
            <div className="item-header">
              <h4>{t.name} <small>(Max Score: {t.maxScore})</small></h4>
              <div style={{ display: 'flex', gap: '10px' }}>
                 {/* Link to Practice Management */}
                <button 
                  onClick={() => navigate(`/admin/practices/${t.id}`)} 
                  className="btn btn-blue" 
                  style={{ padding: "5px 10px", fontSize: "12px" }}
                >
                  View Attempts
                </button>
                <button onClick={() => handleDelete(t.id)} className="btn-text-delete">Delete</button>
              </div>
            </div>
            <p>{t.description}</p>
            <p><strong>Time Limit:</strong> {t.timeLimit} mins</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestList;