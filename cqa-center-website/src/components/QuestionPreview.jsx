// src/components/QuestionPreview.jsx
import React from 'react';

const QuestionPreview = ({ data, index = 0 }) => {
  const { name, content, explanation, options, answers, correctAnswer } = data;

  // Normalize options: support both 'answers' (from Form) and 'options' (from Import)
  const displayOptions = options || answers || [];

  return (
    <div className="preview-box" style={{ 
      border: "1px solid #ddd", 
      borderRadius: "8px", 
      padding: "20px", 
      background: "white",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      marginBottom: "20px"
    }}>
      {/* 1. Header */}
      <div style={{ borderBottom: "1px solid #eee", paddingBottom: "10px", marginBottom: "15px", color: "#555", fontWeight: "bold", display: "flex", justifyContent: "space-between" }}>
        <span>{name || `Câu hỏi ${index + 1}`}</span>
        {data.type && <span className="badge" style={{background: "#eee", color: "#333", padding: "2px 8px", borderRadius: "4px", fontSize: "0.8rem"}}>{data.type}</span>}
      </div>

      {/* 2. Content (HTML) */}
      {content ? (
        <div 
          className="question-content-html"
          dangerouslySetInnerHTML={{ __html: content }} 
          style={{ fontSize: "1.1rem", lineHeight: "1.6", marginBottom: "20px" }}
        />
      ) : (
        <p style={{ fontStyle: "italic", color: "#ccc" }}>Chưa có nội dung...</p>
      )}

      {/* 3. Options */}
      <div style={{ marginTop: "10px" }}>
        {displayOptions.map((opt, idx) => {
          const label = opt.id || String.fromCharCode(65 + idx); // A, B, C...
          // Determine correctness:
          // 1. Check opt.isCorrect (QuestionForm)
          // 2. Check if correctAnswer string matches label (Import)
          const isCorrect = opt.isCorrect || (correctAnswer && correctAnswer === label);

          return (
            <div key={idx} style={{ 
              display: "flex", 
              padding: "12px", 
              margin: "8px 0", 
              background: isCorrect ? "#e8f5e9" : "#f8f9fa",
              border: isCorrect ? "1px solid #4caf50" : "1px solid #ddd",
              borderRadius: "6px",
              alignItems: "center"
            }}>
              <span style={{ fontWeight: "bold", marginRight: "12px", minWidth: "25px", color: isCorrect ? "#2e7d32" : "#555" }}>
                {label}.
              </span>
              <div 
                style={{ flex: 1 }}
                dangerouslySetInnerHTML={{ __html: opt.content || opt.name || "" }}
              />
              {isCorrect && <span style={{ marginLeft: "10px", color: "#2e7d32", fontSize: "1.2rem" }}>✓</span>}
            </div>
          );
        })}
      </div>

      {/* 4. Explanation */}
      {explanation && (
        <div style={{ marginTop: "20px", paddingTop: "15px", borderTop: "1px dashed #ccc", background: "#fffbe6", padding: "15px", borderRadius: "5px" }}>
          <strong style={{ color: "#d35400", display: "block", marginBottom: "5px" }}>Giải thích / Lời giải:</strong>
          <div dangerouslySetInnerHTML={{ __html: explanation }} style={{ fontSize: "0.95rem" }} />
        </div>
      )}
    </div>
  );
};

export default QuestionPreview;