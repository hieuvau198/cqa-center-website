import { useState, useEffect } from "react"; // Added useEffect
import { db } from "../../../firebase-config";
import { collection, addDoc, getDocs } from "firebase/firestore"; // Added getDocs
import { useNavigate } from "react-router-dom";

const QuestionForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "", description: "", explanation: "", type: "MC_SINGLE", imageUrl: ""
    // Removed "tags" string from here, we will manage it separately
  });
  
  // State for tags
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTagIds, setSelectedTagIds] = useState([]);

  // Fetch Tags on load
  useEffect(() => {
    const fetchTags = async () => {
      const snap = await getDocs(collection(db, "tags"));
      setAvailableTags(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    };
    fetchTags();
  }, []);

  // Handle Tag Selection
  const handleToggleTag = (tagId) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter(id => id !== tagId));
    } else {
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
  };

  // ... (Keep existing answers state and handlers: answers, handleAddAnswer, handleAnswerChange) ...
  const [answers, setAnswers] = useState([
    { name: "", description: "", imageUrl: "", isCorrect: false }
  ]);
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
    
    await addDoc(collection(db, "questions"), {
      ...formData,
      tagIds: selectedTagIds, // Save the IDs reference
      answers: answers
    });
    
    alert("Question Created!");
    navigate("/admin/questions");
  };

  return (
    <div style={{ background: "white", padding: "20px" }}>
      <h2>Create Question</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {/* ... Keep existing inputs for Name, Description, Explanation, Image ... */}
        <input placeholder="Question Name" onChange={e => setFormData({...formData, name: e.target.value})} required />
        <textarea placeholder="Description" onChange={e => setFormData({...formData, description: e.target.value})} />
        <textarea placeholder="Explanation" onChange={e => setFormData({...formData, explanation: e.target.value})} />
        <input placeholder="Image URL" onChange={e => setFormData({...formData, imageUrl: e.target.value})} />

        {/* REPLACED Tags Input with Selection */}
        <div style={{ border: "1px solid #ccc", padding: "10px", borderRadius: "5px" }}>
          <p style={{ margin: "0 0 10px 0", fontWeight: "bold" }}>Select Tags:</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {availableTags.map(tag => (
              <label key={tag.id} style={{ display: "flex", alignItems: "center", gap: "5px", background: "#eee", padding: "5px", borderRadius: "4px", cursor: "pointer" }}>
                <input 
                  type="checkbox" 
                  checked={selectedTagIds.includes(tag.id)}
                  onChange={() => handleToggleTag(tag.id)}
                />
                {tag.name}
              </label>
            ))}
          </div>
        </div>
        
        <select onChange={e => setFormData({...formData, type: e.target.value})}>
          <option value="MC_SINGLE">Multiple Choice (Single Answer)</option>
          <option value="MC_MULTI">Multiple Choice (Multi Answer)</option>
          <option value="MATCHING">Matching</option>
          <option value="WRITING">Writing</option>
        </select>

        {/* ... Keep Answer Options section and Submit button ... */}
        <h3>Answer Options</h3>
        {answers.map((ans, index) => (
          <div key={index} style={{ border: "1px dashed #ccc", padding: "10px" }}>
            <input placeholder="Answer Text" value={ans.name} onChange={e => handleAnswerChange(index, 'name', e.target.value)} required />
            <label style={{ marginLeft: "10px" }}>
              Correct? 
              <input type="checkbox" checked={ans.isCorrect} onChange={e => handleAnswerChange(index, 'isCorrect', e.target.checked)} />
            </label>
          </div>
        ))}
        <button type="button" onClick={handleAddAnswer}>+ Add Option</button>

        <hr />
        <button type="submit" style={{ background: "green", color: "white", padding: "10px" }}>Save Question</button>
      </form>
    </div>
  );
};

export default QuestionForm;