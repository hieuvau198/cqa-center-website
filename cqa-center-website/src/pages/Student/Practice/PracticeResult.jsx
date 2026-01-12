import React from "react";
import { useNavigate } from "react-router-dom";

const PracticeResult = ({ questions, userAnswers, score, maxScore, onRetry }) => {
  const navigate = useNavigate();

  // Helper to check correctness (Replicates grading logic for UI)
  const checkAnswer = (q) => {
    const uAns = userAnswers[q.id];
    let isCorrect = false;
    
    // Normalize options for both standard and HTML types
    const displayOptions = q.answers || q.options || [];

    if (q.type === "MC_SINGLE") {
      const correctOpt = displayOptions.find(a => a.isCorrect);
      isCorrect = correctOpt && uAns === correctOpt.name;
    } 
    else if (q.type === "MC_SINGLE_HTML") {
      // Logic for HTML questions: 
      // 1. Find the option marked isCorrect: true
      // 2. Determine its "value" (id or Label A/B/C) same as Attempt page
      // 3. Compare with user answer
      const correctOptIndex = displayOptions.findIndex(a => a.isCorrect);
      
      if (correctOptIndex !== -1) {
        const correctOpt = displayOptions[correctOptIndex];
        // Must match the value generation logic in PracticeAttempt.jsx
        const correctVal = correctOpt.id || String.fromCharCode(65 + correctOptIndex);
        isCorrect = uAns === correctVal;
      }
    }
    else if (q.type === "MC_MULTI") {
      const correctNames = displayOptions.filter(a => a.isCorrect).map(a => a.name);
      const userSelection = uAns || [];
      isCorrect = correctNames.length === userSelection.length && 
                  correctNames.every(name => userSelection.includes(name));
    } 
    else if (q.type === "WRITING") {
      const correctText = displayOptions[0]?.name || "";
      const userText = uAns || "";
      isCorrect = userText.trim().toLowerCase() === correctText.trim().toLowerCase();
    } 
    else if (q.type === "MATCHING") {
      const userMap = uAns || {};
      isCorrect = true;
      for (const pair of displayOptions) {
        if (userMap[pair.name] !== pair.description) {
          isCorrect = false;
          break;
        }
      }
    }
    return isCorrect;
  };

  const getCorrectAnswerDisplay = (q) => {
    const displayOptions = q.answers || q.options || [];

    if (q.type === "MC_SINGLE") return displayOptions.find(a => a.isCorrect)?.name;
    
    if (q.type === "MC_SINGLE_HTML") {
      // Return the label (A, B...) or content of the correct option
      const idx = displayOptions.findIndex(a => a.isCorrect);
      if (idx !== -1) return displayOptions[idx].id || String.fromCharCode(65 + idx);
      return "";
    }
    
    if (q.type === "MC_MULTI") return displayOptions.filter(a => a.isCorrect).map(a => a.name).join(", ");
    if (q.type === "WRITING") return displayOptions[0]?.name;
    if (q.type === "MATCHING") return displayOptions.map(a => `${a.name} -> ${a.description}`).join("; ");
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
        const displayOptions = q.answers || q.options || [];
        
        // --- RENDER FOR HTML QUESTIONS ---
        if (q.type === "MC_SINGLE_HTML") {
          return (
            <div key={q.id} style={{ 
              marginBottom: "20px", 
              padding: "20px", 
              border: "1px solid", 
              borderColor: isCorrect ? "#c3e6cb" : "#f5c6cb", 
              borderRadius: "8px", 
              background: "#fff",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
            }}>
              {/* Header */}
              <div style={{ borderBottom: "1px solid #eee", paddingBottom: "10px", marginBottom: "15px", color: isCorrect ? "#155724" : "#721c24", fontWeight: "bold" }}>
                {q.name || `Câu ${idx + 1}`} {isCorrect ? "✅" : "❌"}
              </div>

              {/* Content Body */}
              <div 
                dangerouslySetInnerHTML={{ __html: q.content }} 
                style={{ fontSize: "1.1rem", lineHeight: "1.6", marginBottom: "20px" }}
              />

              {/* Options */}
              <div style={{ marginTop: "10px" }}>
                {displayOptions.map((opt, aIdx) => {
                  const val = opt.id || String.fromCharCode(65 + aIdx); // A, B, C...
                  const userSelected = userAnswers[q.id] === val;
                  const isKey = opt.isCorrect === true; // Use the boolean field from option

                  // Determine Styling
                  let bg = "#fff";
                  let border = "1px solid #eee";
                  
                  // Highlight Logic:
                  if (userSelected) {
                    if (isKey) {
                        bg = "#d4edda"; 
                        border = "1px solid #c3e6cb";
                    } else {
                        bg = "#f8d7da";
                        border = "1px solid #f5c6cb";
                    }
                  } else if (isKey) {
                    border = "2px solid #28a745"; // Show correct answer if not selected
                  }

                  return (
                    <div key={aIdx} style={{ 
                      display: "flex", 
                      padding: "10px", 
                      margin: "8px 0",
                      background: bg,
                      border: border,
                      borderRadius: "6px",
                      alignItems: "center"
                    }}>
                      <span style={{ fontWeight: "bold", marginRight: "12px", minWidth: "25px", color: "#555" }}>
                        {val}.
                      </span>
                      <div 
                        style={{ flex: 1 }}
                        dangerouslySetInnerHTML={{ __html: opt.content || opt.name || "" }}
                      />
                      {userSelected && <span style={{ marginLeft: "10px", fontWeight: "bold" }}> (You)</span>}
                      {isKey && !userSelected && <span style={{ marginLeft: "10px", color: "#28a745" }}>✓</span>}
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              {q.explanation && (
                <div style={{ marginTop: "20px", paddingTop: "15px", borderTop: "1px dashed #ccc", background: "#fffbe6", padding: "15px", borderRadius: "5px" }}>
                  <strong style={{ color: "#d35400", display: "block", marginBottom: "5px" }}>Explanation:</strong>
                  <div dangerouslySetInnerHTML={{ __html: q.explanation }} style={{ fontSize: "0.95rem" }} />
                </div>
              )}
            </div>
          );
        }

        // --- RENDER FOR NORMAL QUESTIONS ---
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