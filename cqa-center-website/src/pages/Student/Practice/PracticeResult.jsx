import React from "react";
import { useNavigate } from "react-router-dom";

const PracticeResult = ({ questions, userAnswers, score, maxScore, onRetry }) => {
  const navigate = useNavigate();

  // Helper to check correctness (Replicates grading logic for UI)
  const checkAnswer = (q) => {
    const uAns = userAnswers[q.id];
    let isCorrect = false;

    if (q.type === "MC_SINGLE") {
      const correctOpt = q.answers.find(a => a.isCorrect);
      isCorrect = correctOpt && uAns === correctOpt.name;
    } else if (q.type === "MC_MULTI") {
      const correctNames = q.answers.filter(a => a.isCorrect).map(a => a.name);
      const userSelection = uAns || [];
      isCorrect = correctNames.length === userSelection.length && 
                  correctNames.every(name => userSelection.includes(name));
    } else if (q.type === "WRITING") {
      const correctText = q.answers[0]?.name || "";
      const userText = uAns || "";
      isCorrect = userText.trim().toLowerCase() === correctText.trim().toLowerCase();
    } else if (q.type === "MATCHING") {
      const userMap = uAns || {};
      isCorrect = true;
      for (const pair of q.answers) {
        if (userMap[pair.name] !== pair.description) {
          isCorrect = false;
          break;
        }
      }
    }
    return isCorrect;
  };

  const getCorrectAnswerDisplay = (q) => {
    if (q.type === "MC_SINGLE") return q.answers.find(a => a.isCorrect)?.name;
    if (q.type === "MC_MULTI") return q.answers.filter(a => a.isCorrect).map(a => a.name).join(", ");
    if (q.type === "WRITING") return q.answers[0]?.name;
    if (q.type === "MATCHING") return q.answers.map(a => `${a.name} -> ${a.description}`).join("; ");
    return "";
  };

  const getUserAnswerDisplay = (q) => {
    const uAns = userAnswers[q.id];
    if (!uAns) return <em>(No Answer)</em>;
    
    if (q.type === "MC_MULTI") return Array.isArray(uAns) ? uAns.join(", ") : uAns;
    if (q.type === "MATCHING") return Object.entries(uAns).map(([k, v]) => `${k} -> ${v}`).join("; ");
    return uAns;
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <div style={{ textAlign: "center", marginBottom: "30px", padding: "20px", background: "#fff", borderRadius: "8px", border: "1px solid #ddd" }}>
        <h2>Result</h2>
        <h1 style={{ color: "#2c3e50", fontSize: "3rem", margin: "10px 0" }}>{score} / {maxScore}</h1>
        <p>You have completed the practice.</p>
        <button onClick={() => navigate("/student")} className="btn btn-primary">Back to Home</button>
      </div>

      <h3>Detailed Review</h3>
      {questions.map((q, idx) => {
        const isCorrect = checkAnswer(q);
        return (
          <div key={q.id} style={{ 
            marginBottom: "20px", 
            padding: "15px", 
            border: "1px solid", 
            borderColor: isCorrect ? "#c3e6cb" : "#f5c6cb", 
            borderRadius: "8px", 
            background: isCorrect ? "#d4edda" : "#f8d7da" 
          }}>
            <h4>Q{idx + 1}: {q.name} {isCorrect ? "✅" : "❌"}</h4>
            
            <div style={{ margin: "10px 0", background: "rgba(255,255,255,0.6)", padding: "10px", borderRadius: "5px" }}>
              <p><strong>Your Answer:</strong> {getUserAnswerDisplay(q)}</p>
              {!isCorrect && (
                <p style={{ color: "#721c24" }}><strong>Correct Answer:</strong> {getCorrectAnswerDisplay(q)}</p>
              )}
            </div>

            {q.explanation && (
              <div style={{ marginTop: "10px", fontSize: "0.95em", fontStyle: "italic", color: "#444" }}>
                <strong>Explanation:</strong> {q.explanation}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PracticeResult;