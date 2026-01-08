// src/pages/Admin/Practices/PracticeManager.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  getTestById, 
  createPractice, 
  getPracticesByTest, 
  getAttemptsByPractice 
} from "../../../firebase/firebaseQuery";

const PracticeManager = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  
  // Data State
  const [testInfo, setTestInfo] = useState(null);
  const [practices, setPractices] = useState([]);
  const [selectedPractice, setSelectedPractice] = useState(null); // The practice currently being viewed
  const [attempts, setAttempts] = useState([]); // Attempts for the selected practice

  // UI State
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form State
  const [newPractice, setNewPractice] = useState({
    entryCode: "",
    startTime: "",
    endTime: ""
  });

  // 1. Initial Load: Fetch Test Info & Existing Practices
  useEffect(() => {
    const fetchData = async () => {
      try {
        const testData = await getTestById(testId);
        setTestInfo(testData);

        const practiceData = await getPracticesByTest(testId);
        setPractices(practiceData);
      } catch (error) {
        console.error("Error loading data", error);
      } finally {
        setLoading(false);
      }
    };
    if (testId) fetchData();
  }, [testId]);

  // 2. Load Attempts when a specific Practice is selected
  useEffect(() => {
    const fetchAttempts = async () => {
      if (selectedPractice) {
        const data = await getAttemptsByPractice(selectedPractice.id);
        setAttempts(data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
      }
    };
    fetchAttempts();
  }, [selectedPractice]);

  // Handle Create Practice
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newPractice.entryCode || !newPractice.startTime || !newPractice.endTime) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const practicePayload = {
        testId,
        testName: testInfo.name, // useful for display later
        entryCode: newPractice.entryCode,
        startTime: newPractice.startTime,
        endTime: newPractice.endTime,
        isActive: true
      };

      await createPractice(practicePayload);
      
      // Refresh list
      const updatedPractices = await getPracticesByTest(testId);
      setPractices(updatedPractices);
      setShowCreateForm(false);
      setNewPractice({ entryCode: "", startTime: "", endTime: "" });
      alert("Practice Session Created!");
    } catch (error) {
      alert("Error creating practice");
    }
  };

  if (loading) return <div className="admin-container">Loading...</div>;
  if (!testInfo) return <div className="admin-container">Test not found.</div>;

  return (
    <div className="admin-container">
      <div className="page-header">
        <div>
          <button onClick={() => navigate("/admin/tests")} className="btn" style={{ marginBottom: "10px" }}>← Back to Tests</button>
          <h2>Manage Practices for: <span style={{color: '#007bff'}}>{testInfo.name}</span></h2>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? "Cancel" : "+ Create New Practice"}
        </button>
      </div>

      {/* CREATE PRACTICE FORM */}
      {showCreateForm && (
        <div style={{ background: "#f0f4f8", padding: "20px", borderRadius: "8px", marginBottom: "20px" }}>
          <h4>Create New Practice Session</h4>
          <form onSubmit={handleCreate} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "10px", alignItems: "end" }}>
            <div>
              <label style={{display: "block", marginBottom: "5px", fontSize: "12px"}}>Entry Code</label>
              <input 
                className="form-input" 
                placeholder="e.g. MATH-101-A" 
                value={newPractice.entryCode}
                onChange={e => setNewPractice({...newPractice, entryCode: e.target.value})}
              />
            </div>
            <div>
              <label style={{display: "block", marginBottom: "5px", fontSize: "12px"}}>Start Time</label>
              <input 
                className="form-input" 
                type="datetime-local"
                value={newPractice.startTime}
                onChange={e => setNewPractice({...newPractice, startTime: e.target.value})}
              />
            </div>
            <div>
              <label style={{display: "block", marginBottom: "5px", fontSize: "12px"}}>End Time</label>
              <input 
                className="form-input" 
                type="datetime-local"
                value={newPractice.endTime}
                onChange={e => setNewPractice({...newPractice, endTime: e.target.value})}
              />
            </div>
            <button type="submit" className="btn btn-blue" style={{ height: "40px" }}>Save</button>
          </form>
        </div>
      )}

      {/* PRACTICE LIST */}
      <div className="list-container">
        <h3>Existing Practice Sessions</h3>
        {practices.length === 0 ? <p>No practices created yet.</p> : (
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "30px" }}>
            {practices.map(p => (
              <div 
                key={p.id} 
                onClick={() => setSelectedPractice(p)}
                style={{
                  border: selectedPractice?.id === p.id ? "2px solid #007bff" : "1px solid #ddd",
                  padding: "15px", borderRadius: "8px", cursor: "pointer", background: "white", width: "250px"
                }}
              >
                <h4 style={{ margin: "0 0 10px 0" }}>Code: {p.entryCode}</h4>
                <p style={{ fontSize: "12px", margin: "5px 0" }}><strong>Start:</strong> {new Date(p.startTime).toLocaleString()}</p>
                <p style={{ fontSize: "12px", margin: "5px 0" }}><strong>End:</strong> {new Date(p.endTime).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SELECTED PRACTICE ATTEMPTS */}
      {selectedPractice && (
        <div className="section-box" style={{ marginTop: "20px", borderTop: "2px solid #eee", paddingTop: "20px" }}>
          <h3>Results for Code: {selectedPractice.entryCode}</h3>
          <p>Attempts: {attempts.length}</p>

          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
            <thead>
              <tr style={{ background: "#f8f9fa", textAlign: "left" }}>
                <th style={{ padding: "10px" }}>Student Email</th>
                <th style={{ padding: "10px" }}>Score</th>
                <th style={{ padding: "10px" }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {attempts.length === 0 ? (
                <tr><td colSpan="3" style={{ padding: "20px", textAlign: "center" }}>No students have taken this practice yet.</td></tr>
              ) : (
                attempts.map(att => (
                  <tr key={att.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "10px" }}>{att.userEmail || "Unknown"}</td>
                    <td style={{ padding: "10px" }}><b>{att.score}</b> / {att.maxScore}</td>
                    <td style={{ padding: "10px" }}>{new Date(att.timestamp).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PracticeManager;