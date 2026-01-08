import { useState, useEffect } from "react";
import { db } from "../../../firebase-config";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const TestForm = () => {
  const navigate = useNavigate();
  
  // Basic form data
  const [formData, setFormData] = useState({
    name: "", 
    description: "", 
    maxScore: 100, 
    timeLimit: 60, 
    imageUrl: ""
  });
  
  // State for questions and tags management
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTagIds, setSelectedTagIds] = useState([]);

  // Fetch Questions and Tags on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Questions
        const questionsSnap = await getDocs(collection(db, "questions"));
        setAvailableQuestions(questionsSnap.docs.map(d => ({...d.data(), id: d.id})));
        
        // Fetch Tags
        const tagsSnap = await getDocs(collection(db, "tags"));
        setAvailableTags(tagsSnap.docs.map(d => ({...d.data(), id: d.id})));
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  // Handler for Question selection
  const handleToggleQuestion = (id) => {
    if (selectedQuestionIds.includes(id)) {
      setSelectedQuestionIds(selectedQuestionIds.filter(qId => qId !== id));
    } else {
      setSelectedQuestionIds([...selectedQuestionIds, id]);
    }
  };

  // Handler for Tag selection
  const handleToggleTag = (tagId) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter(id => id !== tagId));
    } else {
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await addDoc(collection(db, "tests"), {
        ...formData,
        tagIds: selectedTagIds,       // Saving reference to Tag IDs
        questionIds: selectedQuestionIds // Saving reference to Question IDs
      });

      alert("Test Created Successfully!");
      navigate("/admin/tests");
    } catch (error) {
      console.error("Error creating test:", error);
      alert("Failed to create test.");
    }
  };

  return (
    <div style={{ background: "white", padding: "20px" }}>
      <h2>Create Test Material</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        
        {/* Basic Information Inputs */}
        <input 
          placeholder="Test Name" 
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})} 
          required 
        />
        <textarea 
          placeholder="Description" 
          value={formData.description}
          onChange={e => setFormData({...formData, description: e.target.value})} 
        />
        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "12px", color: "#666" }}>Max Score</label>
            <input 
              type="number" 
              placeholder="Max Score" 
              value={formData.maxScore}
              onChange={e => setFormData({...formData, maxScore: e.target.value})} 
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "12px", color: "#666" }}>Time Limit (mins)</label>
            <input 
              type="number" 
              placeholder="Time Limit" 
              value={formData.timeLimit}
              onChange={e => setFormData({...formData, timeLimit: e.target.value})} 
              style={{ width: "100%" }}
            />
          </div>
        </div>
        <input 
          placeholder="Image URL (optional)" 
          value={formData.imageUrl}
          onChange={e => setFormData({...formData, imageUrl: e.target.value})} 
        />

        {/* Tags Selection Section */}
        <div style={{ border: "1px solid #ccc", padding: "10px", borderRadius: "5px" }}>
          <p style={{ margin: "0 0 10px 0", fontWeight: "bold" }}>Select Tags:</p>
          {availableTags.length === 0 ? (
            <p style={{ color: "#777", fontSize: "14px" }}>No tags found. Please create tags in Tag Management first.</p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {availableTags.map(tag => (
                <label key={tag.id} style={{ display: "flex", alignItems: "center", gap: "5px", background: "#f8f9fa", padding: "5px 10px", borderRadius: "15px", border: "1px solid #ddd", cursor: "pointer" }}>
                  <input 
                    type="checkbox" 
                    checked={selectedTagIds.includes(tag.id)}
                    onChange={() => handleToggleTag(tag.id)}
                  />
                  {tag.name}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Question Selection Section */}
        <h3>Select Questions for this Test</h3>
        <div style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid #ccc", padding: "10px", borderRadius: "5px" }}>
          {availableQuestions.length === 0 ? (
            <p style={{ textAlign: "center", color: "#777" }}>No questions available.</p>
          ) : (
            availableQuestions.map(q => (
              <div key={q.id} style={{ marginBottom: "5px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input 
                    type="checkbox" 
                    checked={selectedQuestionIds.includes(q.id)}
                    onChange={() => handleToggleQuestion(q.id)}
                  />
                  <span>
                    <strong>{q.name}</strong> <span style={{ color: "#666", fontSize: "0.9em" }}>({q.type})</span>
                  </span>
                </label>
              </div>
            ))
          )}
        </div>

        <button 
          type="submit" 
          style={{ 
            background: "blue", 
            color: "white", 
            padding: "12px", 
            border: "none", 
            borderRadius: "5px", 
            cursor: "pointer", 
            fontSize: "16px",
            marginTop: "10px"
          }}
        >
          Save Test
        </button>
      </form>
    </div>
  );
};

export default TestForm;