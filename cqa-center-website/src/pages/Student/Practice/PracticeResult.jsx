// src/pages/Student/Practice/PracticeResult.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const PracticeResult = ({ questions, userAnswers, score, maxScore }) => {
  const navigate = useNavigate();

  // Helper: Check if answer is correct (reused logic)
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

  // Helper: Get display string for correct answer
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

  // Helper: Get display string for user answer
  const getUserAnswerDisplay = (q) => {
    const uAns = userAnswers[q.id];
    if (!uAns) return <em>(Chưa trả lời)</em>;
    
    if (q.type === "MC_MULTI") return Array.isArray(uAns) ? uAns.join(", ") : uAns;
    if (q.type === "MATCHING") return Object.entries(uAns).map(([k, v]) => `${k} -> ${v}`).join("; ");
    return uAns;
  };

  const scrollToQuestion = (index) => {
    const element = document.getElementById(`question-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f4f4f4", fontFamily: "sans-serif" }}>
      {/* LEFT SIDEBAR */}
      <div style={{ 
        width: "260px", 
        backgroundColor: "#2c3e50", 
        color: "#fff",
        height: "100vh",
        position: "sticky",
        top: 0,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        boxShadow: "2px 0 5px rgba(0,0,0,0.1)"
      }}>
        {/* Score Section */}
        <div style={{ padding: "20px", borderBottom: "1px solid #34495e", textAlign: "center", background: "#1a252f" }}>
          <div style={{ fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px", opacity: 0.7, marginBottom: "5px" }}>Kết quả</div>
          <div style={{ fontSize: "2.5rem", fontWeight: "bold", fontFamily: "monospace", color: "#f1c40f" }}>
            {score} <span style={{ fontSize: "1.2rem", color: "#fff", fontWeight: "normal" }}>/ {maxScore}</span>
          </div>
        </div>

        {/* Question Navigation Grid */}
        <div style={{ padding: "15px", flex: 1 }}>
           <h4 style={{ fontSize: "1rem", color: "#fff", marginBottom: "15px", borderBottom: "1px solid #34495e", paddingBottom: "10px" }}>câu hỏi</h4>
           <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
             {questions.map((q, idx) => {
               const isCorrect = checkAnswer(q);
               // Green for correct, Red for incorrect
               const statusColor = isCorrect ? "#27ae60" : "#c0392b"; 
               
               return (
                 <button 
                  key={q.id}
                  onClick={() => scrollToQuestion(idx)}
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    border: "none",
                    background: statusColor,
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s"
                  }}
                  title={isCorrect ? "Đúng" : "Sai"}
                 >
                   {idx + 1}
                 </button>
               )
             })}
           </div>
        </div>

        {/* Return Button */}
        <div style={{ padding: "20px", borderTop: "1px solid #34495e" }}>
          <button 
            onClick={() => navigate("/student")} 
            style={{ 
              width: "100%", 
              padding: "12px", 
              backgroundColor: "transparent", 
              border: "1px solid #7f8c8d",
              color: "#ecf0f1", 
              fontSize: "1rem", 
              fontWeight: "bold",
              cursor: "pointer",
              textTransform: "uppercase"
            }}>
            Về trang chủ
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, padding: "40px", overflowY: "auto" }}>
        <div style={{ background: "#fff", padding: "20px", border: "1px solid #ccc", marginBottom: "30px", borderLeft: "5px solid #34495e" }}>
          <h1 style={{ margin: "0", fontSize: "1.5rem", color: "#2c3e50" }}>Chi tiết bài làm</h1>
          <p style={{ margin: "5px 0 0 0", color: "#7f8c8d" }}>Xem lại đáp án và lời giải chi tiết bên dưới.</p>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
          {questions.map((q, idx) => {
             const isCorrect = checkAnswer(q);
             return (
              <div key={q.id} id={`question-${idx}`}>
                <QuestionResultItem 
                  q={q} 
                  idx={idx} 
                  userAnswer={userAnswers[q.id]} 
                  isCorrect={isCorrect}
                  correctDisplay={getCorrectAnswerDisplay(q)}
                  userDisplay={getUserAnswerDisplay(q)}
                />
              </div>
             );
          })}
        </div>
      </div>
    </div>
  );
};

// --- Sub-component for individual question result ---
const QuestionResultItem = ({ q, idx, userAnswer, isCorrect, correctDisplay, userDisplay }) => {
  const displayOptions = q.answers || q.options || [];
  const statusColor = isCorrect ? "#27ae60" : "#c0392b"; // Green / Red

  // Styles
  const containerStyle = { 
    padding: "25px", 
    border: "1px solid #ccc", 
    background: "white",
    borderRadius: "0px",
    borderLeft: `6px solid ${statusColor}`
  };

  const headerStyle = {
    marginBottom: "20px",
    paddingBottom: "15px",
    borderBottom: "2px solid #f0f0f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  };

  const badgeStyle = {
    background: statusColor,
    color: "#fff",
    padding: "4px 12px",
    fontSize: "0.8rem",
    fontWeight: "bold",
    textTransform: "uppercase"
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ background: "#333", color: "#fff", padding: "2px 8px", fontSize: "0.9rem", fontWeight: "bold" }}>
            {idx + 1}
          </span>
          <span style={{ fontWeight: "600", color: "#2c3e50", fontSize: "1.1rem" }}>
             {q.type === "MC_SINGLE_HTML" ? "Câu hỏi" : q.name}
          </span>
        </div>
        <span style={badgeStyle}>{isCorrect ? "Đúng" : "Sai"}</span>
      </div>

      {/* Render HTML Content if needed */}
      {q.type === "MC_SINGLE_HTML" ? (
        <>
          <div 
            dangerouslySetInnerHTML={{ __html: q.content }} 
            style={{ fontSize: "1.05rem", lineHeight: "1.6", marginBottom: "25px", color: "#333" }}
          />
          
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {displayOptions.map((opt, aIdx) => {
              const val = opt.id || String.fromCharCode(65 + aIdx);
              const isSelected = userAnswer === val;
              const isKey = opt.isCorrect === true;

              let rowBg = "#fff";
              let rowColor = "#333";
              let rowBorder = "1px solid #e0e0e0";

              if (isKey) {
                rowBg = "#eafaf1"; // Light Green
                rowColor = "#27ae60";
                rowBorder = "1px solid #27ae60";
              } else if (isSelected && !isKey) {
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
                  alignItems: "flex-start" // Align top for long HTML content
                }}>
                  <strong style={{ minWidth: "30px", color: rowColor, paddingTop: "2px" }}>{val}.</strong>
                  <div style={{ flex: 1 }} dangerouslySetInnerHTML={{ __html: opt.content || opt.name || "" }} />
                  {isSelected && <span style={{ fontSize: "0.75rem", textTransform: "uppercase", marginLeft: "10px", fontWeight: "bold", color: "#555", whiteSpace: "nowrap" }}>[Đã chọn]</span>}
                </div>
              )
            })}
          </div>
        </>
      ) : (
        /* Render Normal Content */
        <>
          {q.imageUrl && (
            <div style={{ marginBottom: "20px", border: "1px solid #eee", display: "inline-block" }}>
              <img src={q.imageUrl} alt="Question" style={{ maxWidth: "100%", maxHeight: "300px", display: "block" }} />
            </div>
          )}

          <div style={{ marginTop: "15px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div style={{ padding: "15px", background: "#f9f9f9", border: "1px solid #eee" }}>
              <div style={{ fontSize: "0.8rem", color: "#777", textTransform: "uppercase", marginBottom: "8px", fontWeight: "600" }}>Câu trả lời của bạn</div>
              <div style={{ fontWeight: "bold", color: isCorrect ? "#27ae60" : "#c0392b", fontSize: "1rem" }}>
                {userDisplay}
              </div>
            </div>
            
            {!isCorrect && (
              <div style={{ padding: "15px", background: "#f0f8ff", border: "1px solid #d6eaf8" }}>
                <div style={{ fontSize: "0.8rem", color: "#3498db", textTransform: "uppercase", marginBottom: "8px", fontWeight: "600" }}>Đáp án đúng</div>
                <div style={{ fontWeight: "bold", color: "#2c3e50", fontSize: "1rem" }}>
                  {correctDisplay}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Explanation Box */}
      {q.explanation && (
        <div style={{ marginTop: "25px", padding: "15px", background: "#fdfefe", border: "1px solid #dcdcdc", borderLeft: "4px solid #3498db" }}>
          <strong style={{ color: "#3498db", textTransform: "uppercase", fontSize: "0.8rem", display: "block", marginBottom: "8px" }}>Giải thích chi tiết</strong>
          <div dangerouslySetInnerHTML={{ __html: q.explanation }} style={{ color: "#555", lineHeight: "1.5" }} />
        </div>
      )}
    </div>
  );
};

export default PracticeResult;