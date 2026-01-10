import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { addQuestion, updateQuestion, getQuestionById, getAllTags, getAllPools } from "../../../firebase/firebaseQuery";

const QuestionForm = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get ID if in Edit Mode
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: "", 
    content: "", // <--- NEW: Stores the HTML content from import
    description: "", 
    explanation: "", 
    type: "MC_SINGLE", 
    imageUrl: "",
    poolId: ""
  });
  
  const [availableTags, setAvailableTags] = useState([]);
  const [availablePools, setAvailablePools] = useState([]);
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  
  const [answers, setAnswers] = useState([
    { name: "", description: "", imageUrl: "", isCorrect: false }
  ]);

  useEffect(() => {
    const init = async () => {
      // 1. Load Resources
      const tags = await getAllTags();
      setAvailableTags(tags);
      const pools = await getAllPools();
      setAvailablePools(pools);

      // 2. If Edit Mode, Load Question Data
      if (isEditMode) {
        const qData = await getQuestionById(id);
        if (qData) {
          setFormData({
            name: qData.name,
            content: qData.content || "", // <--- Load content
            description: qData.description || "",
            explanation: qData.explanation || "",
            type: qData.type,
            imageUrl: qData.imageUrl || "",
            poolId: qData.poolId || ""
          });
          setSelectedTagIds(qData.tagIds || []);
          setAnswers(qData.answers || []);
        }
      }
    };
    init();
  }, [id, isEditMode]);

  const handleToggleTag = (tagId) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter(id => id !== tagId));
    } else {
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
  };

  const handleTypeChange = (newType) => {
    if(confirm("Thay đổi loại câu hỏi sẽ đặt lại các câu trả lời. Tiếp tục?")) {
      setFormData({ ...formData, type: newType });
      if (newType === "WRITING") {
        setAnswers([{ name: "", description: "", imageUrl: "", isCorrect: true }]);
      } else {
        setAnswers([{ name: "", description: "", imageUrl: "", isCorrect: false }]);
      }
    }
  };

  const handleAddOption = () => {
    setAnswers([...answers, { name: "", description: "", imageUrl: "", isCorrect: false }]);
  };

  const handleRemoveOption = (index) => {
    setAnswers(answers.filter((_, i) => i !== index));
  };

  const handleAnswerChange = (index, field, value) => {
    const newAnswers = [...answers];
    newAnswers[index][field] = value;
    setAnswers(newAnswers);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // For HTML/Content-based questions, we might not strictly need separate answers array 
    // if the parser didn't extract them, but for the system consistency, we keep the check.
    // You can relax this check if 'content' is present.
    if (answers.length === 0 && !formData.content) return alert("Vui lòng thêm ít nhất một câu trả lời.");

    const payload = { 
      ...formData, 
      tagIds: selectedTagIds, 
      answers: answers.map(ans => ({
        ...ans, 
        isCorrect: (formData.type === "MATCHING" || formData.type === "WRITING") ? true : ans.isCorrect
      }))
    };

    if (isEditMode) {
      await updateQuestion(id, payload);
      alert("Đã cập nhật câu hỏi!");
    } else {
      await addQuestion(payload);
      alert("Đã tạo câu hỏi!");
    }
    
    navigate(-1);
  };

  return (
    <div className="admin-container" style={{ display: "flex", gap: "20px" }}>
      
      {/* LEFT COLUMN: FORM */}
      <div style={{ flex: 1, maxWidth: "60%" }}>
        <h2>{isEditMode ? "Chỉnh Sửa Câu Hỏi" : "Tạo Câu Hỏi Mới"}</h2>
        <form onSubmit={handleSubmit} className="form-column">
          
          <div className="form-group">
            <label>Tên câu hỏi (ID/Mã)</label>
            <input className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          </div>

          {/* HTML CONTENT EDITING (Visible if content exists or user wants to add HTML) */}
          <div className="form-group">
            <label>Nội dung HTML (Dành cho câu hỏi nhập từ file)</label>
            <textarea 
              className="form-textarea" 
              style={{ fontFamily: "monospace", fontSize: "0.85rem", height: "150px", background: "#2d2d2d", color: "#eee" }}
              placeholder="<div>Nội dung HTML...</div>" 
              value={formData.content} 
              onChange={e => setFormData({...formData, content: e.target.value})} 
            />
            <small style={{ color: "#666" }}>Bạn có thể chỉnh sửa mã HTML tại đây. Hình ảnh sẽ được tải từ Firebase.</small>
          </div>

          <div className="form-group">
            <label>Ngân hàng / Thư mục</label>
            <select className="form-select" value={formData.poolId} onChange={e => setFormData({...formData, poolId: e.target.value})}>
              <option value="">-- Chưa phân loại --</option>
              {availablePools.map(pool => (
                <option key={pool.id} value={pool.id}>{pool.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Loại câu hỏi</label>
            <select className="form-select" value={formData.type} onChange={e => handleTypeChange(e.target.value)}>
              <option value="MC_SINGLE">Trắc nghiệm (1 đáp án)</option>
              <option value="MC_MULTI">Trắc nghiệm (Nhiều đáp án)</option>
              <option value="MATCHING">Nối cặp (Matching)</option>
              <option value="WRITING">Tự luận (Điền từ)</option>
            </select>
          </div>

          {/* <textarea className="form-textarea" placeholder="Mô tả thêm (Text)" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /> */}
          
          <div className="form-group">
             <label>Giải thích đáp án (HTML hoặc Text)</label>
             <textarea className="form-textarea" value={formData.explanation} onChange={e => setFormData({...formData, explanation: e.target.value})} />
          </div>

          <div className="section-box">
            <p className="section-title">Thẻ (Tags):</p>
            <div className="tag-list">
              {availableTags.map(tag => (
                <label key={tag.id} className="tag-chip">
                  <input type="checkbox" checked={selectedTagIds.includes(tag.id)} onChange={() => handleToggleTag(tag.id)} />
                  {tag.name}
                </label>
              ))}
            </div>
          </div>

          <hr style={{ width: '100%', margin: "20px 0" }} />

          {/* DYNAMIC ANSWERS */}
          {(formData.type === "MC_SINGLE" || formData.type === "MC_MULTI") && (
            <div>
              <h3>Các lựa chọn trả lời (Options)</h3>
              {answers.map((ans, index) => (
                <div key={index} className="box-dashed">
                  <div className="form-row" style={{ alignItems: 'center' }}>
                    {/* Checkbox for correctness */}
                    <input 
                      type="checkbox" 
                      style={{ width: "20px", height: "20px", marginRight: "10px" }}
                      checked={ans.isCorrect} 
                      onChange={e => handleAnswerChange(index, 'isCorrect', e.target.checked)} 
                    />
                    
                    {/* Option Text */}
                    <input 
                      className="form-input" 
                      placeholder={`Lựa chọn ${String.fromCharCode(65 + index)}`} 
                      value={ans.name || ans.content || ""} // Fallback for imported data format
                      onChange={e => handleAnswerChange(index, 'name', e.target.value)} 
                    />
                    
                    <button type="button" onClick={() => handleRemoveOption(index)} className="btn btn-danger" style={{ marginLeft: "10px" }}>X</button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={handleAddOption} className="btn">+ Thêm lựa chọn</button>
            </div>
          )}

          {/* ... (MATCHING and WRITING sections same as before) ... */}

          <div className="form-actions-right" style={{ marginTop: "20px" }}>
            <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">Hủy</button>
            <button type="submit" className="btn btn-primary" style={{ padding: "10px 30px" }}>
              {isEditMode ? "Lưu Thay Đổi" : "Tạo Câu Hỏi"}
            </button>
          </div>
        </form>
      </div>

      {/* RIGHT COLUMN: PREVIEW */}
      <div style={{ flex: 1, minWidth: "300px" }}>
        <div style={{ position: "sticky", top: "20px" }}>
           <h3>Xem trước (Preview)</h3>
           <div className="preview-box" style={{ 
             border: "2px solid #3498db", 
             borderRadius: "8px", 
             padding: "20px", 
             background: "white",
             boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
           }}>
              {/* 1. Header with Name */}
              <div style={{ borderBottom: "1px solid #eee", paddingBottom: "10px", marginBottom: "15px", color: "#888", fontWeight: "bold" }}>
                {formData.name || "Tên câu hỏi..."}
              </div>

              {/* 2. Content (Render HTML with Images) */}
              {formData.content ? (
                <div 
                  className="question-content-html"
                  dangerouslySetInnerHTML={{ __html: formData.content }} 
                  style={{ fontSize: "1.1rem", lineHeight: "1.6" }}
                />
              ) : (
                <p style={{ fontStyle: "italic", color: "#ccc" }}>Chưa có nội dung HTML...</p>
              )}

              {/* 3. Options (Visual Preview) */}
              <div style={{ marginTop: "20px" }}>
                {answers.map((ans, idx) => (
                   <div key={idx} style={{ 
                     display: "flex", 
                     padding: "10px", 
                     margin: "5px 0", 
                     background: ans.isCorrect ? "#e8f5e9" : "#f8f9fa",
                     border: ans.isCorrect ? "1px solid #4caf50" : "1px solid #ddd",
                     borderRadius: "5px"
                   }}>
                     <span style={{ fontWeight: "bold", marginRight: "10px" }}>{String.fromCharCode(65 + idx)}.</span>
                     {/* Try to render html in option if it exists, else plain text */}
                     <span dangerouslySetInnerHTML={{ __html: ans.content || ans.name }}></span>
                   </div>
                ))}
              </div>

              {/* 4. Explanation Preview */}
              {formData.explanation && (
                <div style={{ marginTop: "20px", paddingTop: "15px", borderTop: "1px dashed #ccc" }}>
                  <strong style={{ color: "#e67e22" }}>Giải thích:</strong>
                  <div dangerouslySetInnerHTML={{ __html: formData.explanation }} style={{ marginTop: "5px", fontSize: "0.95rem" }} />
                </div>
              )}
           </div>
           
           {/* Hint about images */}
           <div className="info-box" style={{ marginTop: "15px", fontSize: "0.85rem", color: "#666" }}>
             ℹ️ Hình ảnh được hiển thị trực tiếp từ mã HTML. Nếu ảnh không hiện, hãy kiểm tra lại đường dẫn trong ô "Nội dung HTML".
           </div>
        </div>
      </div>

    </div>
  );
};

export default QuestionForm;