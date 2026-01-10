// src/pages/Admin/Questions/QuestionForm.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { addQuestion, updateQuestion, getQuestionById, getAllTags, getAllPools } from "../../../firebase/firebaseQuery";
import QuestionPreview from "../../../components/QuestionPreview"; // Import the component

const QuestionForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: "", 
    content: "", 
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
      const tags = await getAllTags();
      setAvailableTags(tags);
      const pools = await getAllPools();
      setAvailablePools(pools);

      if (isEditMode) {
        const qData = await getQuestionById(id);
        if (qData) {
          setFormData({
            name: qData.name,
            content: qData.content || "",
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

  // ... (Handlers: handleToggleTag, handleTypeChange, handleAddOption, handleRemoveOption, handleAnswerChange, handleSubmit - NO CHANGES NEEDED)
  
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
      
      {/* LEFT COLUMN: FORM - NO CHANGES */}
      <div style={{ flex: 1, maxWidth: "60%" }}>
        <h2>{isEditMode ? "Chỉnh Sửa Câu Hỏi" : "Tạo Câu Hỏi Mới"}</h2>
        <form onSubmit={handleSubmit} className="form-column">
          <div className="form-group">
            <label>Tên câu hỏi (ID/Mã)</label>
            <input className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          </div>

          <div className="form-group">
            <label>Nội dung HTML (Dành cho câu hỏi nhập từ file)</label>
            <textarea 
              className="form-textarea" 
              style={{ fontFamily: "monospace", fontSize: "0.85rem", height: "150px", background: "#2d2d2d", color: "#eee" }}
              placeholder="<div>Nội dung HTML...</div>" 
              value={formData.content} 
              onChange={e => setFormData({...formData, content: e.target.value})} 
            />
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

          {(formData.type === "MC_SINGLE" || formData.type === "MC_MULTI") && (
            <div>
              <h3>Các lựa chọn trả lời (Options)</h3>
              {answers.map((ans, index) => (
                <div key={index} className="box-dashed">
                  <div className="form-row" style={{ alignItems: 'center' }}>
                    <input 
                      type="checkbox" 
                      style={{ width: "20px", height: "20px", marginRight: "10px" }}
                      checked={ans.isCorrect} 
                      onChange={e => handleAnswerChange(index, 'isCorrect', e.target.checked)} 
                    />
                    <input 
                      className="form-input" 
                      placeholder={`Lựa chọn ${String.fromCharCode(65 + index)}`} 
                      value={ans.name || ans.content || ""} 
                      onChange={e => handleAnswerChange(index, 'name', e.target.value)} 
                    />
                    <button type="button" onClick={() => handleRemoveOption(index)} className="btn btn-danger" style={{ marginLeft: "10px" }}>X</button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={handleAddOption} className="btn">+ Thêm lựa chọn</button>
            </div>
          )}

          <div className="form-actions-right" style={{ marginTop: "20px" }}>
            <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">Hủy</button>
            <button type="submit" className="btn btn-primary" style={{ padding: "10px 30px" }}>
              {isEditMode ? "Lưu Thay Đổi" : "Tạo Câu Hỏi"}
            </button>
          </div>
        </form>
      </div>

      {/* RIGHT COLUMN: PREVIEW - UPDATED */}
      <div style={{ flex: 1, minWidth: "300px" }}>
        <div style={{ position: "sticky", top: "20px" }}>
           <h3>Xem trước (Preview)</h3>
           <QuestionPreview 
             data={{
               name: formData.name,
               content: formData.content,
               explanation: formData.explanation,
               answers: answers,
               type: formData.type
             }}
           />
           <div className="info-box" style={{ marginTop: "15px", fontSize: "0.85rem", color: "#666" }}>
             ℹ️ Hình ảnh được hiển thị trực tiếp từ mã HTML.
           </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionForm;