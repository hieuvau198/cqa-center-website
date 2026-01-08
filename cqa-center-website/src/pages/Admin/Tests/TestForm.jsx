import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { addTest, getAllQuestions, getAllTags } from "../../../firebase/firebaseQuery";

const TestForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "", description: "", maxScore: 100, timeLimit: 60, imageUrl: ""
  });
  
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTagIds, setSelectedTagIds] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setAvailableQuestions(await getAllQuestions());
      setAvailableTags(await getAllTags());
    };
    fetchData();
  }, []);

  const handleToggleQuestion = (id) => {
    selectedQuestionIds.includes(id) 
      ? setSelectedQuestionIds(selectedQuestionIds.filter(qId => qId !== id))
      : setSelectedQuestionIds([...selectedQuestionIds, id]);
  };

  const handleToggleTag = (tagId) => {
    selectedTagIds.includes(tagId)
      ? setSelectedTagIds(selectedTagIds.filter(id => id !== tagId))
      : setSelectedTagIds([...selectedTagIds, tagId]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addTest({ ...formData, tagIds: selectedTagIds, questionIds: selectedQuestionIds });
      alert("Test Created Successfully!");
      navigate("/admin/tests");
    } catch (error) {
      alert("Failed to create test.");
    }
  };

  return (
    <div className="admin-container">
      <h2>Create Test Material</h2>
      <form onSubmit={handleSubmit} className="form-column">
        <input className="form-input" placeholder="Test Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
        <textarea className="form-textarea" placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
        
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Max Score</label>
            <input className="form-input" type="number" placeholder="Max Score" value={formData.maxScore} onChange={e => setFormData({...formData, maxScore: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Time Limit (mins)</label>
            <input className="form-input" type="number" placeholder="Time Limit" value={formData.timeLimit} onChange={e => setFormData({...formData, timeLimit: e.target.value})} />
          </div>
        </div>
        
        <input className="form-input" placeholder="Image URL (optional)" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />

        <div className="section-box">
          <p className="section-title">Select Tags:</p>
          <div className="tag-list">
            {availableTags.map(tag => (
              <label key={tag.id} className="tag-chip">
                <input type="checkbox" checked={selectedTagIds.includes(tag.id)} onChange={() => handleToggleTag(tag.id)} />
                {tag.name}
              </label>
            ))}
          </div>
        </div>

        <h3>Select Questions for this Test</h3>
        <div className="scroll-box">
          {availableQuestions.map(q => (
            <div key={q.id} className="checkbox-item">
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", width: '100%' }}>
                <input type="checkbox" checked={selectedQuestionIds.includes(q.id)} onChange={() => handleToggleQuestion(q.id)} />
                <span><strong>{q.name}</strong> <small>({q.type})</small></span>
              </label>
            </div>
          ))}
        </div>

        <button type="submit" className="btn btn-blue" style={{ marginTop: "10px" }}>Save Test</button>
      </form>
    </div>
  );
};

export default TestForm;