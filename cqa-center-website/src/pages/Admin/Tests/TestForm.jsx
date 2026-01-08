import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom"; // Import useParams
import { addTest, updateTest, getTestById, getAllQuestions, getAllTags } from "../../../firebase/firebaseQuery";

const TestForm = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get ID from URL if editing
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: "", description: "", maxScore: 100, timeLimit: 60, imageUrl: ""
  });
  
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTagIds, setSelectedTagIds] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Load common data
      const questions = await getAllQuestions();
      setAvailableQuestions(questions);
      setAvailableTags(await getAllTags());

      // 2. If Edit Mode, load Test Data
      if (isEditMode) {
        const testData = await getTestById(id);
        if (testData) {
          setFormData({
            name: testData.name,
            description: testData.description,
            maxScore: testData.maxScore,
            timeLimit: testData.timeLimit,
            imageUrl: testData.imageUrl || ""
          });
          setSelectedTagIds(testData.tagIds || []);
          setSelectedQuestionIds(testData.questionIds || []);
        }
      }
    };
    fetchData();
  }, [id, isEditMode]);

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
    const payload = { ...formData, tagIds: selectedTagIds, questionIds: selectedQuestionIds };
    
    try {
      if (isEditMode) {
        await updateTest(id, payload);
        alert("Test Updated Successfully!");
      } else {
        await addTest(payload);
        alert("Test Created Successfully!");
      }
      navigate("/admin/tests");
    } catch (error) {
      alert("Failed to save test.");
    }
  };

  const handleEditQuestion = (e, qId) => {
    e.stopPropagation(); // Prevent toggling the checkbox
    e.preventDefault();
    // Open in new tab so user doesn't lose form state
    window.open(`/admin/questions/edit/${qId}`, '_blank');
  };

  return (
    <div className="admin-container">
      <h2>{isEditMode ? "Edit Test" : "Create Test"}</h2>
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
        <p style={{fontSize: '0.8rem', color: '#666'}}>Tip: Click "Edit" to modify the original question in a new tab.</p>
        <div className="scroll-box">
          {availableQuestions.map(q => (
            <div key={q.id} className="checkbox-item" style={{justifyContent: 'space-between'}}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", flex: 1 }}>
                <input type="checkbox" checked={selectedQuestionIds.includes(q.id)} onChange={() => handleToggleQuestion(q.id)} />
                <span><strong>{q.name}</strong> <small>({q.type})</small></span>
              </label>
              
              <button 
                onClick={(e) => handleEditQuestion(e, q.id)}
                className="btn" 
                style={{padding: '2px 8px', fontSize: '10px', height: 'fit-content'}}
              >
                Edit Origin
              </button>
            </div>
          ))}
        </div>

        <button type="submit" className="btn btn-blue" style={{ marginTop: "10px" }}>
            {isEditMode ? "Cập Nhật" : "Lưu"}
        </button>
      </form>
    </div>
  );
};

export default TestForm;