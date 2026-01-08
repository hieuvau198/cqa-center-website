import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllPractices, logoutUser } from "../../firebase/firebaseQuery"; // Import logoutUser

const StudentHome = () => {
  const [practices, setPractices] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPractices = async () => {
      const data = await getAllPractices();
      setPractices(data);
    };
    fetchPractices();
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login");
  };

  const handleAttempt = (practice) => {
    if (practice.entryCode) {
      const userCode = prompt("Please enter the practice code to begin:");
      if (!userCode) return;
      
      if (userCode.trim() !== practice.entryCode) {
        alert("Incorrect code. Please try again.");
        return;
      }
    }
    navigate(`/student/attempt/${practice.id}`);
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#e3f2fd', minHeight: '100vh' }}>
      {/* Header with Logout */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ margin: 0 }}>Student Portal</h1>
          <p style={{ margin: 0 }}>Select a practice session below to begin.</p>
        </div>
        <button onClick={handleLogout} className="btn btn-danger">Logout</button>
      </div>
      
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