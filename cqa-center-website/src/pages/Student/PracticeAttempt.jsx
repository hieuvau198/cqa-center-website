// src/pages/Student/PracticeAttempt.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPracticeById, getTestById, getQuestionsByIds, saveAttempt, auth } from "../../firebase/firebaseQuery";

const PracticeAttempt = () => {
  const { practiceId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [practice, setPractice] = useState(null);
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  
  // Answers state: { questionId: value }
  // For MC_MULTI, value might be an array of indices or strings
  const [userAnswers, setUserAnswers] = useState({});

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
          setQuestions(questionsData);
        }
        
        setLoading(false);
      } catch (error) {
        console.error(error);
        alert("Error loading attempt data");
      }
    };
    initialize();
  }, [practiceId, navigate]);

  const handleAnswerChange = (qId, val, type) => {
    if (type === "MC_MULTI") {
      // Toggle logic for multi-select
      const current = userAnswers[qId] || [];
      if (current.includes(val)) {
        setUserAnswers({ ...userAnswers, [qId]: current.filter(v => v !== val) });
      } else {
        setUserAnswers({ ...userAnswers, [qId]: [...current, val] });
      }
    } else {
      // Single value for others
      setUserAnswers({ ...userAnswers, [qId]: val });
    }
  };

  const handleSubmit = async () => {
    if (!confirm("Are you sure you want to submit?")) return;

    let earnedScore = 0;
    const totalQuestions = questions.length;
    
    // Simple Auto-Grading Logic
    questions.forEach(q => {
      const uAns = userAnswers[q.id];
      
      if (q.type === "MC_SINGLE") {
        const correctOpt = q.answers.find(a => a.isCorrect);
        // Compare answer text or index. Assuming value stored is answer name/text for simplicity
        if (correctOpt && uAns === correctOpt.name) {
          earnedScore += 1;
        }
      } else if (q.type === "MC_MULTI") {
        // Multi logic: User must select ALL correct and NO incorrect
        const correctNames = q.answers.filter(a => a.isCorrect).map(a => a.name);
        const userSelection = uAns || [];
        
        const isCorrect = correctNames.length === userSelection.length && 
                          correctNames.every(name => userSelection.includes(name));
        
        if (isCorrect) earnedScore += 1;
      }
      // WRITING/MATCHING grading skipped for MVP or give points for non-empty
    });

    // Scale score to Max Score of Test
    const finalScore = totalQuestions > 0 ? Math.round((earnedScore / totalQuestions) * test.maxScore) : 0;

    await saveAttempt({
      practiceId,
      testId: practice.testId,
      userId: auth.currentUser ? auth.currentUser.uid : "anonymous",
      userEmail: auth.currentUser ? auth.currentUser.email : "anonymous",
      score: finalScore,
      maxScore: test.maxScore,
      details: userAnswers // Optional: save actual answers
    });

    alert(`Submitted! Your Score: ${finalScore} / ${test.maxScore}`);
    navigate("/student");
  };

  if (loading) return <div style={{padding: 20}}>Loading assessment...</div>;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <h2>{test.name}</h2>
      <p>{test.description}</p>
      <hr />
      
      {questions.map((q, idx) => (
        <div key={q.id} style={{ marginBottom: "20px", padding: "15px", border: "1px solid #ddd", borderRadius: "8px", background: "white" }}>
          <h4>Q{idx + 1}: {q.name}</h4>
          <p>{q.description}</p>
          
          {q.imageUrl && <img src={q.imageUrl} alt="Question" style={{maxWidth: "100%", maxHeight: "200px"}} />}

          <div style={{ marginTop: "10px" }}>
            {/* RENDER OPTIONS BASED ON TYPE */}
            {q.type === "MC_SINGLE" && q.answers.map((ans, aIdx) => (
              <div key={aIdx} style={{ margin: "5px 0" }}>
                <label>
                  <input 
                    type="radio" 
                    name={`q-${q.id}`} 
                    value={ans.name}
                    checked={userAnswers[q.id] === ans.name}
                    onChange={() => handleAnswerChange(q.id, ans.name, "MC_SINGLE")}
                  />
                  <span style={{marginLeft: "8px"}}>{ans.name}</span>
                </label>
              </div>
            ))}

            {q.type === "MC_MULTI" && q.answers.map((ans, aIdx) => (
              <div key={aIdx} style={{ margin: "5px 0" }}>
                <label>
                  <input 
                    type="checkbox" 
                    name={`q-${q.id}`} 
                    value={ans.name}
                    checked={userAnswers[q.id]?.includes(ans.name) || false}
                    onChange={() => handleAnswerChange(q.id, ans.name, "MC_MULTI")}
                  />
                  <span style={{marginLeft: "8px"}}>{ans.name}</span>
                </label>
              </div>
            ))}
            
            {q.type === "WRITING" && (
              <textarea 
                className="form-textarea" 
                rows="4" 
                placeholder="Type your answer here..."
                onChange={(e) => handleAnswerChange(q.id, e.target.value, "WRITING")}
              />
            )}
          </div>
        </div>
      ))}

      <button onClick={handleSubmit} className="btn btn-primary" style={{ width: "100%", fontSize: "16px" }}>
        Submit Attempt
      </button>
    </div>
  );
};

export default PracticeAttempt;