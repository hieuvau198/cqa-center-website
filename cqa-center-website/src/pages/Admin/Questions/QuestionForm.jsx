import { useState } from "react";
import { db } from "../../../firebase-config";
import { collection, addDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const QuestionForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "", description: "", explanation: "", type: "MC_SINGLE", imageUrl: "", tags: ""
  });
  
  // Manage dynamic answer options
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
    // Split tags string into array
    const tagsArray = formData.tags.split(",").map(t => t.trim());
    
    await addDoc(collection(db, "questions"), {
      ...formData,
      tags: tagsArray,
      answers: answers
    });
    
    alert("Question Created!");
    navigate("/admin/questions");
  };

  return (
    <div style={{ background: "white", padding: "20px" }}>
      <h2>Create Question</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input placeholder="Question Name" onChange={e => setFormData({...formData, name: e.target.value})} required />
        <textarea placeholder="Description" onChange={e => setFormData({...formData, description: e.target.value})} />
        <textarea placeholder="Explanation" onChange={e => setFormData({...formData, explanation: e.target.value})} />
        <input placeholder="Image URL" onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
        <input placeholder="Tags (comma separated)" onChange={e => setFormData({...formData, tags: e.target.value})} />
        
        <select onChange={e => setFormData({...formData, type: e.target.value})}>
          <option value="MC_SINGLE">Multiple Choice (Single Answer)</option>
          <option value="MC_MULTI">Multiple Choice (Multi Answer)</option>
          <option value="MATCHING">Matching</option>
          <option value="WRITING">Writing</option>
        </select>

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