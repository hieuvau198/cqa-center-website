import React from 'react';
import HtmlQuestionEditor from "../../Questions/components/HtmlQuestionEditor";

const modalStyles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' },
    content: { backgroundColor: '#fff', padding: '20px', borderRadius: '8px', width: '90%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto' }
};

const EditQuestionModal = ({ isOpen, data, onClose, onSave, setData, onImageReplace }) => {
    if (!isOpen || !data) return null;

    return (
        <div style={modalStyles.overlay}>
            <div style={modalStyles.content}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
                    <h3>Edit Imported Question</h3>
                    <button onClick={onClose} style={{background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer'}}>×</button>
                </div>
                
                <div className="form-group">
                    <label>Question Name</label>
                    <input className="form-input" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
                </div>

                <HtmlQuestionEditor 
                    formData={data}
                    answers={data.answers}
                    onUpdateForm={setData}
                    onUpdateAnswers={(newAns) => setData({...data, answers: newAns})}
                    onImageReplace={onImageReplace}
                />

                <div style={{display:'flex', justifyContent:'flex-end', gap:'10px', marginTop:'20px'}}>
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button type="button" className="btn btn-primary" onClick={onSave}>Done Editing</button>
                </div>
            </div>
        </div>
    );
};
export default EditQuestionModal;