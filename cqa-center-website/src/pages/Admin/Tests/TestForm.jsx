// src/pages/Admin/Tests/TestForm.jsx
import React from "react";
import { useTestFormLogic } from "./hooks/useTestFormLogic";

// Components
import TagTreeSelector from "./components/TagTreeSelector";
import ImportSection from "./components/ImportSection";
import EditQuestionModal from "./components/EditQuestionModal";

const TestForm = () => {
  const {
    isEditMode, isProcessing, formData, setFormData,
    availableTags, availablePools, availableQuestions,
    selectedTagIds, handleTagToggle,
    selectedQuestionIds, handleQuestionToggle,
    newQuestions, setNewQuestions,
    selectedPoolId, setSelectedPoolId,
    handleFolderSelect, handleSubmit,
    editingIndex, setEditingIndex, editQData, setEditQData,
    handleImageReplace
  } = useTestFormLogic();

  return (
    <div className="admin-container">
      <h2>{isEditMode ? "Edit Test" : "Create Test"}</h2>
      <form onSubmit={handleSubmit} className="form-column">
        
        {/* --- 1. BASIC INFO & TAGS --- */}
        <div style={{ display: 'flex', gap: '20px' }}>
             <div style={{ flex: 1 }}>
                <input className="form-input" placeholder="Test Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                <textarea className="form-textarea" placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Max Score</label>
                        <input className="form-input" type="number" value={formData.maxScore} onChange={e => setFormData({...formData, maxScore: e.target.value})} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Time (min)</label>
                        <input className="form-input" type="number" value={formData.timeLimit} onChange={e => setFormData({...formData, timeLimit: e.target.value})} />
                    </div>
                </div>
             </div>
             
             {/* Tag Tree Component */}
             <div style={{ width: '300px' }}>
                <div className="section-box">
                    <p className="section-title">Tags:</p>
                    <TagTreeSelector tags={availableTags} selectedIds={selectedTagIds} onToggle={handleTagToggle} />
                </div>
             </div>
        </div>

        <hr style={{ margin: "30px 0", borderTop:"2px dashed #ddd" }} />

        {/* --- 2. IMPORT SECTION --- */}
        <ImportSection 
            newQuestions={newQuestions}
            onFolderSelect={handleFolderSelect}
            pools={availablePools}
            selectedPoolId={selectedPoolId}
            onPoolChange={setSelectedPoolId}
            onEditQuestion={(idx) => { setEditingIndex(idx); setEditQData(JSON.parse(JSON.stringify(newQuestions[idx]))); }}
            onRemoveQuestion={(idx) => { if(confirm("Remove?")) setNewQuestions(newQuestions.filter((_,i)=>i!==idx)); }}
        />

        {/* --- 3. EXISTING QUESTIONS --- */}
        <h3>Select Existing Questions</h3>
        <div className="scroll-box">
          {availableQuestions.map(q => (
            <div key={q.id} className="checkbox-item" style={{justifyContent: 'space-between'}}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", flex: 1 }}>
                <input type="checkbox" checked={selectedQuestionIds.includes(q.id)} onChange={() => handleQuestionToggle(q.id)} />
                <span><strong>{q.name}</strong> <small>({q.type})</small></span>
              </label>
              <button type="button" onClick={() => window.open(`/admin/questions/edit/${q.id}`, '_blank')} className="btn" style={{padding: '2px 8px', fontSize: '10px'}}>
                View
              </button>
            </div>
          ))}
        </div>

        {/* --- SUBMIT --- */}
        <div style={{ marginTop: "20px", padding: "20px", background: "#eee", position:"sticky", bottom:0, display:"flex", justifyContent:"flex-end" }}>
            <button type="submit" className="btn btn-blue" style={{ fontSize: "1.2rem", padding: "12px 30px" }} disabled={isProcessing}>
                {isProcessing ? "Saving..." : (isEditMode ? "Update Test" : "Create Test")}
            </button>
        </div>
      </form>

      {/* --- EDIT MODAL --- */}
      <EditQuestionModal 
        isOpen={editingIndex !== null}
        data={editQData}
        setData={setEditQData}
        onClose={() => { setEditingIndex(null); setEditQData(null); }}
        onSave={() => { 
            const updated = [...newQuestions]; 
            updated[editingIndex] = editQData; 
            setNewQuestions(updated); 
            setEditingIndex(null); 
        }}
        onImageReplace={handleImageReplace}
      />
    </div>
  );
};

export default TestForm;