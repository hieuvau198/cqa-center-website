import { useState, useEffect } from "react";
import { db } from "../../../firebase-config";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const TestForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "", description: "", maxScore: 100, timeLimit: 60, imageUrl: "", tags: ""
  });
  
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);

  // Fetch questions to allow selection
  useEffect(() => {
    const fetchQ = async () => {
      const snap = await getDocs(collection(db, "questions"));
      setAvailableQuestions(snap.docs.map(d => ({...d.data(), id: d.id})));
    };
    fetchQ();
  }, []);

  const handleToggleQuestion = (id) => {
    if (selectedQuestionIds.includes(id)) {
      setSelectedQuestionIds(selectedQuestionIds.filter(qId => qId !== id));
    } else {
      setSelectedQuestionIds([...selectedQuestionIds, id]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tagsArray = formData.tags.split(",").map(t => t.trim());
    
    await addDoc(collection(db, "tests"), {
      ...formData,
      tags: tagsArray,
      questionIds: selectedQuestionIds // Linking logic
    });

    alert("Test Created!");
    navigate("/admin/tests");
  };

  return (
    <div style={{ background: "white", padding: "20px" }}>
      <h2>Create Test Material</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input placeholder="Test Name" onChange={e => setFormData({...formData, name: e.target.value})} required />
        <textarea placeholder="Description" onChange={e => setFormData({...formData, description: e.target.value})} />
        <input type="number" placeholder="Max Score" onChange={e => setFormData({...formData, maxScore: e.target.value})} />
        <input type="number" placeholder="Time Limit (mins)" onChange={e => setFormData({...formData, timeLimit: e.target.value})} />
        <input placeholder="Tags (comma separated)" onChange={e => setFormData({...formData, tags: e.target.value})} />

        <h3>Select Questions for this Test</h3>
        <div style={{ maxHeight: "200px", overflowY: "scroll", border: "1px solid #ccc", padding: "10px" }}>
          {availableQuestions.map(q => (
            <div key={q.id}>
              <label>
                <input 
                  type="checkbox" 
                  checked={selectedQuestionIds.includes(q.id)}
                  onChange={() => handleToggleQuestion(q.id)}
                />
                {q.name} ({q.type})
              </label>
            </div>
          ))}
        </div>

        <button type="submit" style={{ background: "blue", color: "white", padding: "10px" }}>Save Test</button>
      </form>
    </div>
  );
};

export default TestForm;