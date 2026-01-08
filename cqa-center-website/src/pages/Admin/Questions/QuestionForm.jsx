import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { addQuestion, getAllTags } from "../../../firebase/firebaseQuery";

const QuestionForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "", description: "", explanation: "", type: "MC_SINGLE", imageUrl: ""
  });
  
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [answers, setAnswers] = useState([{ name: "", description: "", imageUrl: "", isCorrect: false }]);

  useEffect(() => {
    const fetchTags = async () => {
      const tags = await getAllTags();
      setAvailableTags(tags);
    };
    fetchTags();
  }, []);

  const handleToggleTag = (tagId) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter(id => id !== tagId));
    } else {
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
  };

  const handleAddAnswer = () => {
    setAnswers([...answers, { name: "", description: "", imageUrl: "", isCorrect: false }]);
  };

  const handleAnswerChange = (index, field, value) => {
    const newAnswers = [...answers];
    newAnswers[index][field] = value;
    setAnswers(newAnswers);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addQuestion({ ...formData, tagIds: selectedTagIds, answers });
    alert("Question Created!");
    navigate("/admin/questions");
  };

  return (
    <div className="admin-container">
      <h2>Create Question</h2>
      <form onSubmit={handleSubmit} className="form-column">
        <input className="form-input" placeholder="Question Name" onChange={e => setFormData({...formData, name: e.target.value})} required />
        <textarea className="form-textarea" placeholder="Description" onChange={e => setFormData({...formData, description: e.target.value})} />
        <textarea className="form-textarea" placeholder="Explanation" onChange={e => setFormData({...formData, explanation: e.target.value})} />
        <input className="form-input" placeholder="Image URL" onChange={e => setFormData({...formData, imageUrl: e.target.value})} />

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
        
        <select className="form-select" onChange={e => setFormData({...formData, type: e.target.value})}>
          <option value="MC_SINGLE">Multiple Choice (Single Answer)</option>
          <option value="MC_MULTI">Multiple Choice (Multi Answer)</option>
          <option value="MATCHING">Matching</option>
          <option value="WRITING">Writing</option>
        </select>

        <h3>Answer Options</h3>
        {answers.map((ans, index) => (
          <div key={index} className="section-box" style={{ borderStyle: 'dashed' }}>
            <div className="form-row" style={{ alignItems: 'center' }}>
              <input className="form-input" placeholder="Answer Text" value={ans.name} onChange={e => handleAnswerChange(index, 'name', e.target.value)} required />
              <label style={{ whiteSpace: 'nowrap' }}>
                Correct? 
                <input type="checkbox" style={{ marginLeft: '5px' }} checked={ans.isCorrect} onChange={e => handleAnswerChange(index, 'isCorrect', e.target.checked)} />
              </label>
            </div>
          </div>
        ))}
        <button type="button" onClick={handleAddAnswer} className="btn">+ Add Option</button>

        <hr style={{ width: '100%' }} />
        <button type="submit" className="btn btn-primary">Save Question</button>
      </form>
    </div>
  );
};

export default QuestionForm;