// src/pages/Student/Practice/PracticeAttempt.jsx
import { useEffect, useState, useMemo } from "react";
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

  const handleSubmit = async () => {
    if (!confirm("Are you sure you want to submit?")) return;

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
        // UPDATED LOGIC: Check isCorrect from options instead of q.correctAnswer string
        const correctOptIndex = displayOptions.findIndex(a => a.isCorrect);
        
        if (correctOptIndex !== -1) {
          // Determine the expected value (ID or A, B, C...)
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

    // Instead of navigating away, show results
    setIsSubmitted(true);
    window.scrollTo(0, 0);
  };

  if (loading) return <div style={{padding: 20}}>Loading assessment...</div>;

  // IF SUBMITTED, SHOW RESULT COMPONENT
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
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <h2>{test.name}</h2>
      <p>{test.description}</p>
      <hr />
      
      {questions.map((q, idx) => (
        <QuestionItem 
          key={q.id} 
          q={q} 
          idx={idx} 
          userAnswer={userAnswers[q.id]} 
          onAnswerChange={handleAnswerChange} 
        />
      ))}

      <button onClick={handleSubmit} className="btn btn-primary" style={{ width: "100%", fontSize: "16px", marginTop: "20px" }}>
        Submit Attempt
      </button>
    </div>
  );
};

// --- Updated QuestionItem to handle MC_SINGLE_HTML ---
const QuestionItem = ({ q, idx, userAnswer, onAnswerChange }) => {
  // Normalize options: Import uses 'options', Manual uses 'answers'
  const displayOptions = q.answers || q.options || [];

  const matchingOptions = useMemo(() => {
    if (q.type !== "MATCHING") return [];
    const opts = displayOptions.map(a => a.description);
    return opts.sort(() => Math.random() - 0.5);
  }, [q, displayOptions]);

  // 1. Render for HTML Questions (Like Preview)
  if (q.type === "MC_SINGLE_HTML") {
    return (
      <div style={{ marginBottom: "20px", padding: "20px", border: "1px solid #ddd", borderRadius: "8px", background: "white", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
        {/* Header */}
        <div style={{ borderBottom: "1px solid #eee", paddingBottom: "10px", marginBottom: "15px", color: "#555", fontWeight: "bold" }}>
          {q.name || `Câu ${idx + 1}`}
        </div>

        {/* HTML Content Body */}
        <div 
          className="question-html-body"
          dangerouslySetInnerHTML={{ __html: q.content }} 
          style={{ fontSize: "1.1rem", lineHeight: "1.6", marginBottom: "20px" }}
        />

        {/* HTML Options */}
        <div style={{ marginTop: "10px" }}>
          {displayOptions.map((opt, aIdx) => {
            const val = opt.id || String.fromCharCode(65 + aIdx); // A, B, C...
            const isSelected = userAnswer === val;
            
            return (
              <div key={aIdx} style={{ 
                margin: "8px 0",
                border: isSelected ? "1px solid #2196F3" : "1px solid #eee",
                borderRadius: "6px",
                background: isSelected ? "#e3f2fd" : "#fff",
                transition: "all 0.2s"
              }}>
                <label style={{ cursor: "pointer", display: "flex", padding: "12px", alignItems: "center" }}>
                  <input 
                    type="radio" 
                    name={`q-${q.id}`} 
                    value={val} 
                    checked={isSelected} 
                    onChange={() => onAnswerChange(q.id, val, "MC_SINGLE_HTML")} 
                  />
                  {/* Label (A.) */}
                  <span style={{ fontWeight: "bold", marginLeft: "12px", marginRight: "8px", color: "#555" }}>
                    {val}.
                  </span>
                  {/* Option Content (HTML) */}
                  <div 
                    style={{ flex: 1 }}
                    dangerouslySetInnerHTML={{ __html: opt.content || opt.name || "" }}
                  />
                </label>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 2. Render for Normal Questions (Existing Logic)
  return (
    <div style={{ marginBottom: "20px", padding: "15px", border: "1px solid #ddd", borderRadius: "8px", background: "white" }}>
      <h4>Q{idx + 1}: {q.name}</h4>
      <p style={{ color: "#555" }}>{q.description}</p>
      
      {q.imageUrl && <img src={q.imageUrl} alt="Question" style={{maxWidth: "100%", maxHeight: "200px", marginBottom: "15px"}} />}

      <div style={{ marginTop: "10px" }}>
        {q.type === "MC_SINGLE" && displayOptions.map((ans, aIdx) => (
          <div key={aIdx} style={{ margin: "8px 0" }}>
            <label style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
              <input type="radio" name={`q-${q.id}`} value={ans.name} checked={userAnswer === ans.name} onChange={() => onAnswerChange(q.id, ans.name, "MC_SINGLE")} />
              <span style={{marginLeft: "10px"}}>{ans.name}</span>
            </label>
          </div>
        ))}

        {q.type === "MC_MULTI" && displayOptions.map((ans, aIdx) => (
          <div key={aIdx} style={{ margin: "8px 0" }}>
            <label style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
              <input type="checkbox" name={`q-${q.id}`} value={ans.name} checked={userAnswer?.includes(ans.name) || false} onChange={() => onAnswerChange(q.id, ans.name, "MC_MULTI")} />
              <span style={{marginLeft: "10px"}}>{ans.name}</span>
            </label>
          </div>
        ))}
        
        {q.type === "WRITING" && (
          <div>
            <input className="form-input" style={{ width: "100%", padding: "10px", marginTop: "5px" }} placeholder="Type your answer here..." value={userAnswer || ""} onChange={(e) => onAnswerChange(q.id, e.target.value, "WRITING")} />
          </div>
        )}

        {q.type === "MATCHING" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {displayOptions.map((pair, pIdx) => (
              <div key={pIdx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "15px", padding: "10px", background: "#f9f9f9", borderRadius: "5px" }}>
                <span style={{ fontWeight: "500", flex: 1 }}>{pair.name}</span>
                <span style={{ fontSize: "20px" }}>→</span>
                <select className="form-select" style={{ flex: 1, padding: "5px" }} value={(userAnswer && userAnswer[pair.name]) || ""} onChange={(e) => onAnswerChange(q.id, e.target.value, "MATCHING", pair.name)}>
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