// src/pages/Student/Practice/PracticeResult.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const PracticeResult = ({ questions, userAnswers, score, maxScore, onRetry }) => {
  const navigate = useNavigate();

  const checkAnswer = (q) => {
    const uAns = userAnswers[q.id];
    let isCorrect = false;
    const displayOptions = q.answers || q.options || [];

    if (q.type === "MC_SINGLE") {
      const correctOpt = displayOptions.find(a => a.isCorrect);
      isCorrect = correctOpt && uAns === correctOpt.name;
    } 
    else if (q.type === "MC_SINGLE_HTML") {
      const correctOptIndex = displayOptions.findIndex(a => a.isCorrect);
      if (correctOptIndex !== -1) {
        const correctOpt = displayOptions[correctOptIndex];
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

  // Styles
  const sharpContainer = {
    background: "#fff", 
    border: "1px solid #ccc", 
    marginBottom: "30px",
    borderRadius: "0"
  };

  const headerStyle = {
    padding: "30px",
    background: "#2c3e50",
    color: "#fff",
    textAlign: "center"
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 20px", fontFamily: "sans-serif" }}>
      
      {/* Score Summary Box */}
      <div style={sharpContainer}>
        <div style={headerStyle}>
          <h2 style={{ margin: 0, fontWeight: "300", textTransform: "uppercase", letterSpacing: "2px" }}>Assessment Result</h2>
          <div style={{ fontSize: "5rem", fontWeight: "bold", margin: "10px 0" }}>
            {score} <span style={{ fontSize: "2rem", fontWeight: "normal", opacity: 0.7 }}>/ {maxScore}</span>
          </div>
          <button 
            onClick={() => navigate("/student")} 
            style={{ 
              marginTop: "10px", 
              padding: "12px 30px", 
              background: "transparent", 
              border: "1px solid #fff", 
              color: "#fff", 
              cursor: "pointer", 
              fontSize: "1rem",
              textTransform: "uppercase" 
            }}>
            Return to Dashboard
          </button>
        </div>
      </div>

      <h3 style={{ borderBottom: "2px solid #333", paddingBottom: "10px", textTransform: "uppercase", fontSize: "1.2rem", letterSpacing: "1px" }}>Detailed Review</h3>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "30px" }}>
        {questions.map((q, idx) => {
          const isCorrect = checkAnswer(q);
          const displayOptions = q.answers || q.options || [];
          
          // Border color based on result
          const statusColor = isCorrect ? "#27ae60" : "#c0392b"; // Green / Red

          return (
            <div key={q.id} style={{ 
              ...sharpContainer, 
              borderLeft: `6px solid ${statusColor}`,
              padding: "25px" 
            }}>
              
              {/* Question Status Header */}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                <span style={{ fontWeight: "bold", fontSize: "1.1rem", color: "#555" }}>
                  Question {idx + 1}
                </span>
                <span style={{ 
                  fontWeight: "bold", 
                  color: statusColor, 
                  textTransform: "uppercase",
                  fontSize: "0.9rem",
                  letterSpacing: "0.5px"
                }}>
                  {isCorrect ? "Correct" : "Incorrect"}
                </span>
              </div>

              {/* Render HTML Content if needed */}
              {q.type === "MC_SINGLE_HTML" ? (
                <>
                  <div 
                    dangerouslySetInnerHTML={{ __html: q.content }} 
                    style={{ fontSize: "1.1rem", lineHeight: "1.6", marginBottom: "20px", color: "#333" }}
                  />
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {displayOptions.map((opt, aIdx) => {
                      const val = opt.id || String.fromCharCode(65 + aIdx);
                      const userSelected = userAnswers[q.id] === val;
                      const isKey = opt.isCorrect === true;

                      let rowBg = "#fff";
                      let rowColor = "#333";
                      let rowBorder = "1px solid #eee";

                      if (isKey) {
                        rowBg = "#eafaf1"; // Light Green
                        rowColor = "#27ae60";
                        rowBorder = "1px solid #27ae60";
                      } else if (userSelected && !isKey) {
                        rowBg = "#fdedec"; // Light Red
                        rowColor = "#c0392b";
                        rowBorder = "1px solid #c0392b";
                      }

                      return (
                        <div key={aIdx} style={{ 
                          padding: "12px", 
                          background: rowBg, 
                          border: rowBorder, 
                          display: "flex",
                          alignItems: "center"
                        }}>
                          <strong style={{ minWidth: "30px", color: rowColor }}>{val}.</strong>
                          <div style={{ flex: 1 }} dangerouslySetInnerHTML={{ __html: opt.content || opt.name || "" }} />
                          {userSelected && <span style={{ fontSize: "0.8rem", textTransform: "uppercase", marginLeft: "10px", fontWeight: "bold", color: "#555" }}>[Your Answer]</span>}
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                /* Render Normal Content */
                <>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "1.1rem" }}>{q.name}</h4>
                  
                  <div style={{ marginTop: "15px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    <div style={{ padding: "15px", background: "#f9f9f9", border: "1px solid #eee" }}>
                      <div style={{ fontSize: "0.8rem", color: "#777", textTransform: "uppercase", marginBottom: "5px" }}>Your Answer</div>
                      <div style={{ fontWeight: "bold", color: isCorrect ? "#27ae60" : "#c0392b" }}>
                        {getUserAnswerDisplay(q)}
                      </div>
                    </div>
                    
                    {!isCorrect && (
                      <div style={{ padding: "15px", background: "#f9f9f9", border: "1px solid #eee" }}>
                        <div style={{ fontSize: "0.8rem", color: "#777", textTransform: "uppercase", marginBottom: "5px" }}>Correct Answer</div>
                        <div style={{ fontWeight: "bold", color: "#2c3e50" }}>
                          {getCorrectAnswerDisplay(q)}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Explanation (Sharp Box) */}
              {q.explanation && (
                <div style={{ marginTop: "20px", padding: "15px", background: "#fdfefe", border: "1px solid #dcdcdc", borderLeft: "4px solid #3498db" }}>
                  <strong style={{ color: "#3498db", textTransform: "uppercase", fontSize: "0.8rem", display: "block", marginBottom: "5px" }}>Explanation</strong>
                  <div dangerouslySetInnerHTML={{ __html: q.explanation }} style={{ color: "#555" }} />
                </div>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PracticeResult;