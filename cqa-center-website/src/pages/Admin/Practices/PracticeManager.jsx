import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAttemptsByTest, getTestById } from "../../../firebase/firebaseQuery";

const PracticeManager = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [testInfo, setTestInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const testData = await getTestById(testId);
        setTestInfo(testData);

        const attemptsData = await getAttemptsByTest(testId);
        // Sort by newest first
        const sortedAttempts = attemptsData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setAttempts(sortedAttempts);
      } catch (error) {
        console.error("Error loading practice data", error);
      } finally {
        setLoading(false);
      }
    };

    if (testId) fetchData();
  }, [testId]);

  if (loading) return <div className="admin-container">Loading data...</div>;
  if (!testInfo) return <div className="admin-container">Test not found.</div>;

  return (
    <div className="admin-container">
      <div className="page-header">
        <div>
          <button onClick={() => navigate("/admin/tests")} className="btn" style={{ marginBottom: "10px" }}>← Back to Tests</button>
          <h2>Practice Management: {testInfo.name}</h2>
          <p style={{ color: "#666" }}>Total Attempts: {attempts.length}</p>
        </div>
      </div>

      {attempts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px", color: "#888" }}>
          No attempts have been recorded for this test yet.
        </div>
      ) : (
        <div className="list-container">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8f9fa", textAlign: "left" }}>
                <th style={{ padding: "10px", borderBottom: "2px solid #ddd" }}>Student Email</th>
                <th style={{ padding: "10px", borderBottom: "2px solid #ddd" }}>Score</th>
                <th style={{ padding: "10px", borderBottom: "2px solid #ddd" }}>Date Taken</th>
                <th style={{ padding: "10px", borderBottom: "2px solid #ddd" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((attempt) => (
                <tr key={attempt.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "10px" }}>{attempt.userEmail || "Unknown User"}</td>
                  <td style={{ padding: "10px", fontWeight: "bold" }}>
                    {attempt.score} / {attempt.maxScore}
                  </td>
                  <td style={{ padding: "10px" }}>
                    {new Date(attempt.timestamp).toLocaleString()}
                  </td>
                  <td style={{ padding: "10px" }}>
                    {attempt.score >= (attempt.maxScore / 2) ? 
                      <span style={{ color: "green", fontWeight: "bold" }}>Passed</span> : 
                      <span style={{ color: "red", fontWeight: "bold" }}>Failed</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PracticeManager;