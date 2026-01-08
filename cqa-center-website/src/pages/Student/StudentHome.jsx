import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getAllPractices, logoutUser } from "../../firebase/firebaseQuery";
import BIRDS from "vanta/dist/vanta.birds.min"; // Import Vanta Birds

const StudentHome = () => {
  const [practices, setPractices] = useState([]);
  const navigate = useNavigate();

  // 1. Create a ref for the container
  const vantaRef = useRef(null);
  // 2. State to hold the Vanta effect instance
  const [vantaEffect, setVantaEffect] = useState(null);

  useEffect(() => {
    const fetchPractices = async () => {
      const data = await getAllPractices();
      setPractices(data);
    };
    fetchPractices();
  }, []);

  // 3. Initialize Vanta.js
  useEffect(() => {
    if (!vantaEffect) {
      setVantaEffect(
        BIRDS({
          el: vantaRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          scale: 1.00,
          scaleMobile: 1.00,
          backgroundColor: 0x172b45, // User's requested color
          color1: 0xd66060           // User's requested bird color
        })
      );
    }
    // Cleanup on unmount to prevent memory leaks
    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]);

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
    <div 
      ref={vantaRef} // Attach the ref here
      style={{ 
        padding: '20px', 
        minHeight: '100vh',
        color: 'white' // Changed text to white to be visible on dark background
      }}
    >
      {/* Header with Logout */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ margin: 0, textShadow: "1px 1px 2px rgba(0,0,0,0.5)" }}>Student Portal</h1>
          <p style={{ margin: 0, opacity: 0.9 }}>Select a practice session below to begin.</p>
        </div>
        <button onClick={handleLogout} className="btn btn-danger">Logout</button>
      </div>
      
      <div className="list-container">
        {practices.length === 0 ? <p>No active practices found.</p> : practices.map(p => (
          <div key={p.id} className="item-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="item-header">
              {/* Ensure card text remains readable (usually dark) */}
              <h3 style={{ color: '#333' }}>{p.testName || "Practice Test"}</h3>
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