// src/pages/Student/Practice/PracticeAttempt.jsx
import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPracticeById, getTestById, getQuestionsByIds, saveAttempt, auth } from "../../../firebase/firebaseQuery";
import PracticeResult from "./PracticeResult";

const PracticeAttempt = () => {
  const { practiceId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  
  const [practice, setPractice] = useState(null);
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});

  // Timer state (in seconds)
  const [timeLeft, setTimeLeft] = useState(null);

  // Helper to shuffle array
  const shuffleArray = (array) => {
    return array
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        const practiceData = await getPracticeById(practiceId);
        if (!practiceData) {
          alert("Practice not found");
          navigate("/student");
          return;
        }
        setPractice(practiceData);

        const testData = await getTestById(practiceData.testId);
        setTest(testData);

        // Initialize Timer if duration exists (assuming duration is in minutes)
        if (testData.duration && testData.duration > 0) {
          setTimeLeft(testData.duration * 60);
        }

        if (testData.questionIds && testData.questionIds.length > 0) {
          const questionsData = await getQuestionsByIds(testData.questionIds);
          // SHUFFLE QUESTIONS HERE
          setQuestions(shuffleArray(questionsData));
        }
        
        setLoading(false);
      } catch (error) {
        console.error(error);
        alert("Error loading attempt data");
      }
    };
    initialize();
  }, [practiceId, navigate]);

  // Timer Countdown Effect
  useEffect(() => {
    if (timeLeft === null || isSubmitted) return;

    if (timeLeft <= 0) {
      handleSubmit(true); // Auto submit
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, isSubmitted]);

  // Format time helper
  const formatTime = (seconds) => {
    if (seconds === null) return "--:--";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (qId, val, type, subKey = null) => {
    if (type === "MC_MULTI") {
      const current = userAnswers[qId] || [];
      if (current.includes(val)) {
        setUserAnswers({ ...userAnswers, [qId]: current.filter(v => v !== val) });
      } else {
        setUserAnswers({ ...userAnswers, [qId]: [...current, val] });
      }
    } else if (type === "MATCHING") {
      const currentMap = userAnswers[qId] || {};
      setUserAnswers({
        ...userAnswers,
        [qId]: { ...currentMap, [subKey]: val }
      });
    } else {
      setUserAnswers({ ...userAnswers, [qId]: val });
    }
  };

  const isQuestionAnswered = (qId) => {
    const ans = userAnswers[qId];
    if (!ans) return false;
    if (Array.isArray(ans)) return ans.length > 0;
    if (typeof ans === 'object') return Object.keys(ans).length > 0;
    return true;
  };

  const scrollToQuestion = (index) => {
    const element = document.getElementById(`question-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSubmit = async (isAuto = false) => {
    if (!isAuto && !confirm("Are you sure you want to submit?")) return;

    let earnedScore = 0;
    const totalQuestions = questions.length;
    
    questions.forEach(q => {
      const uAns = userAnswers[q.id];
      const displayOptions = q.answers || q.options || [];

      if (q.type === "MC_SINGLE") {
        const correctOpt = q.answers.find(a => a.isCorrect);
        if (correctOpt && uAns === correctOpt.name) earnedScore += 1;

      } 
      else if (q.type === "MC_SINGLE_HTML") {
        const correctOptIndex = displayOptions.findIndex(a => a.isCorrect);
        if (correctOptIndex !== -1) {
          const correctOpt = displayOptions[correctOptIndex];
          const correctVal = correctOpt.id || String.fromCharCode(65 + correctOptIndex);
          if (uAns === correctVal) {
            earnedScore += 1;
          }
        }
      }
      else if (q.type === "MC_MULTI") {
        const correctNames = q.answers.filter(a => a.isCorrect).map(a => a.name);
        const userSelection = uAns || [];
        const isCorrect = correctNames.length === userSelection.length && 
                          correctNames.every(name => userSelection.includes(name));
        if (isCorrect) earnedScore += 1;

      } else if (q.type === "WRITING") {
        const correctText = q.answers[0]?.name || "";
        const userText = uAns || "";
        if (userText.trim().toLowerCase() === correctText.trim().toLowerCase()) earnedScore += 1;

      } else if (q.type === "MATCHING") {
        const userMap = uAns || {};
        let allPairsCorrect = true;
        for (const pair of q.answers) {
          if (userMap[pair.name] !== pair.description) {
            allPairsCorrect = false;
            break;
          }
        }
        if (allPairsCorrect) earnedScore += 1;
      }
    });

    const calculatedScore = totalQuestions > 0 ? Math.round((earnedScore / totalQuestions) * test.maxScore) : 0;
    setFinalScore(calculatedScore);

    await saveAttempt({
      practiceId,
      testId: practice.testId,
      userId: auth.currentUser ? auth.currentUser.uid : "anonymous",
      userEmail: auth.currentUser ? auth.currentUser.email : "anonymous",
      score: calculatedScore,
      maxScore: test.maxScore,
      details: userAnswers
    });

    setIsSubmitted(true);
    window.scrollTo(0, 0);
  };

  if (loading) return <div style={{padding: 20}}>Loading assessment...</div>;

  if (isSubmitted) {
    return (
      <PracticeResult 
        questions={questions}
        userAnswers={userAnswers}
        score={finalScore}
        maxScore={test.maxScore}
      />
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f4f4f4" }}>
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
        {/* Timer Section */}
        <div style={{ padding: "20px", borderBottom: "1px solid #34495e", textAlign: "center", background: "#1a252f" }}>
          <div style={{ fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px", opacity: 0.7, marginBottom: "5px" }}>Thời gian còn lại</div>
          <div style={{ fontSize: "2rem", fontWeight: "bold", fontFamily: "monospace" }}>
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Question Navigation Grid */}
        <div style={{ padding: "15px", flex: 1 }}>
           <h4 style={{ fontSize: "1rem", color: "#fff", marginBottom: "15px", borderBottom: "1px solid #34495e", paddingBottom: "10px" }}>Câu hỏi</h4>
           <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
             {questions.map((q, idx) => {
               const answered = isQuestionAnswered(q.id);
               return (
                 <button 
                  key={q.id}
                  onClick={() => scrollToQuestion(idx)}
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    border: "1px solid #7f8c8d",
                    background: answered ? "#3498db" : "transparent",
                    color: answered ? "#fff" : "#bdc3c7",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s"
                  }}
                 >
                   {idx + 1}
                 </button>
               )
             })}
           </div>
        </div>

        {/* Submit Button in Sidebar */}
        <div style={{ padding: "20px", borderTop: "1px solid #34495e" }}>
          <button 
            onClick={() => handleSubmit(false)} 
            style={{ 
              width: "100%", 
              padding: "12px", 
              backgroundColor: "#45daf0", 
              color: "#2c3e50", 
              border: "none", 
              fontSize: "1rem", 
              fontWeight: "bold",
              cursor: "pointer",
              textTransform: "uppercase"
            }}>
            Nộp bài
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, padding: "40px", overflowY: "auto" }}>
        <div style={{ background: "#fff", padding: "30px", border: "1px solid #ccc", marginBottom: "30px" }}>
          <h1 style={{ margin: "0 0 10px 0", fontSize: "1.8rem" }}>{test.name}</h1>
          <p style={{ color: "#666" }}>{test.description}</p>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
          {questions.map((q, idx) => (
            <div key={q.id} id={`question-${idx}`}>
              <QuestionItem 
                q={q} 
                idx={idx} 
                userAnswer={userAnswers[q.id]} 
                onAnswerChange={handleAnswerChange} 
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Sharp Style QuestionItem ---
const QuestionItem = ({ q, idx, userAnswer, onAnswerChange }) => {
  const displayOptions = q.answers || q.options || [];

  const matchingOptions = useMemo(() => {
    if (q.type !== "MATCHING") return [];
    const opts = displayOptions.map(a => a.description);
    return opts.sort(() => Math.random() - 0.5);
  }, [q, displayOptions]);

  // Styling constants
  const containerStyle = { 
    padding: "25px", 
    border: "1px solid #ccc", 
    background: "white",
    borderRadius: "0px" // Sharp corners
  };

  const headerStyle = {
    marginBottom: "20px",
    paddingBottom: "15px",
    borderBottom: "2px solid #f0f0f0",
    display: "flex",
    alignItems: "baseline",
    gap: "10px"
  };

  const questionNumStyle = {
    background: "#333",
    color: "#fff",
    padding: "2px 8px",
    fontSize: "0.9rem",
    fontWeight: "bold"
  };

  // HTML Question Render
  if (q.type === "MC_SINGLE_HTML") {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <span style={questionNumStyle}>{idx + 1}</span>
          <span style={{ fontWeight: "600", color: "#2c3e50" }}>{q.name || "Question"}</span>
        </div>

        <div 
          className="question-html-body"
          dangerouslySetInnerHTML={{ __html: q.content }} 
          style={{ fontSize: "1.05rem", lineHeight: "1.6", marginBottom: "25px", color: "#333" }}
        />

        <div>
          {displayOptions.map((opt, aIdx) => {
            const val = opt.id || String.fromCharCode(65 + aIdx);
            const isSelected = userAnswer === val;
            
            return (
              <div key={aIdx} style={{ margin: "10px 0" }}>
                <label style={{ 
                  cursor: "pointer", 
                  display: "flex", 
                  alignItems: "flex-start",
                  padding: "10px",
                  border: isSelected ? "2px solid #3498db" : "1px solid #e0e0e0",
                  background: isSelected ? "#f0f8ff" : "#fff",
                  transition: "all 0.1s"
                }}>
                  <div style={{ paddingTop: "2px" }}>
                    <input 
                      type="radio" 
                      name={`q-${q.id}`} 
                      value={val} 
                      checked={isSelected} 
                      onChange={() => onAnswerChange(q.id, val, "MC_SINGLE_HTML")} 
                      style={{ transform: "scale(1.2)", cursor: "pointer" }}
                    />
                  </div>
                  <div style={{ marginLeft: "15px", flex: 1 }}>
                    <div style={{ fontWeight: "bold", marginBottom: "5px", color: "#555" }}>{val}.</div>
                    <div dangerouslySetInnerHTML={{ __html: opt.content || opt.name || "" }} />
                  </div>
                </label>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Normal Question Render
  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span style={questionNumStyle}>{idx + 1}</span>
        <span style={{ fontWeight: "600", fontSize: "1.1rem" }}>{q.name}</span>
      </div>
      
      {q.description && <p style={{ color: "#666", marginBottom: "15px", lineHeight: "1.5" }}>{q.description}</p>}
      
      {q.imageUrl && (
        <div style={{ marginBottom: "20px", border: "1px solid #eee", display: "inline-block" }}>
          <img src={q.imageUrl} alt="Question" style={{ maxWidth: "100%", maxHeight: "300px", display: "block" }} />
        </div>
      )}

      <div style={{ marginTop: "15px" }}>
        {q.type === "MC_SINGLE" && displayOptions.map((ans, aIdx) => (
          <div key={aIdx} style={{ margin: "10px 0" }}>
            <label style={{ 
              cursor: "pointer", 
              display: "flex", 
              alignItems: "center", 
              padding: "10px", 
              border: userAnswer === ans.name ? "2px solid #333" : "1px solid #ddd", 
              background: userAnswer === ans.name ? "#fafafa" : "#fff" 
            }}>
              <input type="radio" name={`q-${q.id}`} value={ans.name} checked={userAnswer === ans.name} onChange={() => onAnswerChange(q.id, ans.name, "MC_SINGLE")} style={{ marginRight: "10px" }} />
              <span>{ans.name}</span>
            </label>
          </div>
        ))}

        {q.type === "MC_MULTI" && displayOptions.map((ans, aIdx) => (
          <div key={aIdx} style={{ margin: "10px 0" }}>
            <label style={{ 
              cursor: "pointer", 
              display: "flex", 
              alignItems: "center", 
              padding: "10px", 
              border: (userAnswer?.includes(ans.name)) ? "2px solid #333" : "1px solid #ddd" 
            }}>
              <input type="checkbox" name={`q-${q.id}`} value={ans.name} checked={userAnswer?.includes(ans.name) || false} onChange={() => onAnswerChange(q.id, ans.name, "MC_MULTI")} style={{ marginRight: "10px" }} />
              <span>{ans.name}</span>
            </label>
          </div>
        ))}
        
        {q.type === "WRITING" && (
          <textarea 
            style={{ width: "100%", padding: "15px", border: "1px solid #999", borderRadius: "0", minHeight: "100px", fontSize: "1rem" }} 
            placeholder="Type your answer here..." 
            value={userAnswer || ""} 
            onChange={(e) => onAnswerChange(q.id, e.target.value, "WRITING")} 
          />
        )}

        {q.type === "MATCHING" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {displayOptions.map((pair, pIdx) => (
              <div key={pIdx} style={{ display: "flex", alignItems: "center", border: "1px solid #ddd", borderBottom: pIdx === displayOptions.length -1 ? "1px solid #ddd" : "none", padding: "15px", background: "#fcfcfc" }}>
                <span style={{ fontWeight: "600", flex: 1 }}>{pair.name}</span>
                <span style={{ padding: "0 20px", color: "#999" }}>⟶</span>
                <select 
                  style={{ flex: 1, padding: "8px", border: "1px solid #999", borderRadius: "0", background: "#fff" }} 
                  value={(userAnswer && userAnswer[pair.name]) || ""} 
                  onChange={(e) => onAnswerChange(q.id, e.target.value, "MATCHING", pair.name)}
                >
                  <option value="">-- Select --</option>
                  {matchingOptions.map((opt, oIdx) => <option key={oIdx} value={opt}>{opt}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticeAttempt;