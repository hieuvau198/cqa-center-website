import React from 'react';
import QuestionPreview from '../../../../components/QuestionPreview';

const ImportSection = ({ 
    newQuestions, onFolderSelect, pools, selectedPoolId, onPoolChange, 
    onEditQuestion, onRemoveQuestion 
}) => {
  return (
    <div className="section-box" style={{background: "#f0f8ff", border: "1px solid #cce5ff"}}>
        <h3 style={{marginTop:0, color: "#0056b3"}}>📥 Import Questions from HTML</h3>
        <p style={{fontSize: "0.9rem", color:"#555"}}>Questions will be created when you click Save.</p>
        
        <div className="form-row" style={{alignItems: "flex-end"}}>
            <div className="form-group" style={{flex:1}}>
                <label>Select Folder (.html + images)</label>
                <input 
                    type="file" webkitdirectory="true" directory="true" multiple 
                    onChange={onFolderSelect} 
                    className="form-input" style={{background:"white"}}
                />
            </div>
            <div className="form-group" style={{width: "250px"}}>
                    <label>Assign to Pool</label>
                    <select className="form-select" value={selectedPoolId} onChange={(e) => onPoolChange(e.target.value)}>
                    <option value="">-- No Pool --</option>
                    {pools.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
            </div>
        </div>

        {newQuestions.length > 0 && (
            <div style={{marginTop: "20px"}}>
                <h4 style={{color: "green"}}>Found {newQuestions.length} new questions:</h4>
                <div className="scroll-box" style={{maxHeight: "400px", background: "#fff"}}>
                    {newQuestions.map((q, idx) => (
                        <div key={idx} style={{display:'flex', gap:'10px', alignItems:'start', marginBottom: '15px', borderBottom:'1px solid #eee', paddingBottom:'10px'}}>
                            <div style={{flex:1}}>
                                <QuestionPreview data={q} index={idx} />
                            </div>
                            <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                                <button type="button" className="btn btn-sm btn-primary" onClick={() => onEditQuestion(idx)}>Edit</button>
                                <button type="button" className="btn btn-sm btn-danger" onClick={() => onRemoveQuestion(idx)}>Remove</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
  );
};
export default ImportSection;