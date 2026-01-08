// src/pages/Student/StudentHome.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllPractices } from "../../firebase/firebaseQuery";

const StudentHome = () => {
  const [practices, setPractices] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPractices = async () => {
      const data = await getAllPractices();
      // Filter for active practices if necessary (assuming all fetched are candidates)
      // You can add logic here to check start/end times vs current time
      setPractices(data);
    };
    fetchPractices();
  }, []);

  const handleAttempt = (practice) => {
    // If a practice code is required, prompt the user
    if (practice.entryCode) {
      const userCode = prompt("Please enter the practice code to begin:");
      if (!userCode) return;
      
      if (userCode.trim() !== practice.entryCode) {
        alert("Incorrect code. Please try again.");
        return;
      }
    }
    
    // If code matches or no code required
    navigate(`/student/attempt/${practice.id}`);
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#e3f2fd', minHeight: '100vh' }}>
      <h1>Student Portal</h1>
      <p>Select a practice session below to begin.</p>
      
      <div className="list-container">
        {practices.length === 0 ? <p>No active practices found.</p> : practices.map(p => (
          <div key={p.id} className="item-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="item-header">
              <h3>{p.testName || "Practice Test"}</h3>
              <button onClick={() => handleAttempt(p)} className="btn btn-primary">
                Attempt Practice
              </button>
            </div>
            <div style={{ fontSize: '14px', color: '#555' }}>
              <p><strong>Available:</strong> {new Date(p.startTime).toLocaleString()} - {new Date(p.endTime).toLocaleString()}</p>
              <p><strong>Code Required:</strong> {p.entryCode ? "Yes" : "No"}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentHome;