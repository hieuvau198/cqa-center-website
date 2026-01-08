import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { addQuestion, updateQuestion, getQuestionById, getAllTags, getAllPools } from "../../../firebase/firebaseQuery";

const QuestionForm = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get ID if in Edit Mode
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: "", 
    description: "", 
    explanation: "", 
    type: "MC_SINGLE", 
    imageUrl: "",
    poolId: "" // New Field
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
    if (answers.length === 0) return alert("Vui lòng thêm ít nhất một câu trả lời.");

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
    
    navigate(-1); // Go back to previous page
  };

  return (
    <div className="admin-container">
      <h2>{isEditMode ? "Chỉnh Sửa Câu Hỏi" : "Tạo Câu Hỏi Mới"}</h2>
      <form onSubmit={handleSubmit} className="form-column">
        
        <div className="form-group">
          <label>Nội dung câu hỏi / Tên</label>
          <input className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
        </div>

        {/* POOL SELECTION */}
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

        <textarea className="form-textarea" placeholder="Mô tả" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
        <textarea className="form-textarea" placeholder="Giải thích đáp án" value={formData.explanation} onChange={e => setFormData({...formData, explanation: e.target.value})} />
        <input className="form-input" placeholder="URL Hình ảnh" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />

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

        {/* DYNAMIC ANSWERS (Reuse logic from previous, but with value binding) */}
        {(formData.type === "MC_SINGLE" || formData.type === "MC_MULTI") && (
          <div>
            <h3>Các lựa chọn trả lời</h3>
            {answers.map((ans, index) => (
              <div key={index} className="section-box" style={{ borderStyle: 'dashed' }}>
                <div className="form-row" style={{ alignItems: 'center' }}>
                  <input className="form-input" placeholder="Nội dung lựa chọn" value={ans.name} onChange={e => handleAnswerChange(index, 'name', e.target.value)} required />
                  <label style={{ whiteSpace: 'nowrap', marginLeft: '10px' }}>
                    Đúng? 
                    <input type="checkbox" style={{ marginLeft: '5px' }} checked={ans.isCorrect} onChange={e => handleAnswerChange(index, 'isCorrect', e.target.checked)} />
                  </label>
                  <button type="button" onClick={() => handleRemoveOption(index)} className="btn btn-danger" style={{ marginLeft: "10px" }}>X</button>
                </div>
              </div>
            ))}
            <button type="button" onClick={handleAddOption} className="btn">+ Thêm lựa chọn</button>
          </div>
        )}

        {formData.type === "MATCHING" && (
           <div>
             <h3>Các cặp nối</h3>
             {answers.map((ans, index) => (
               <div key={index} className="section-box" style={{ borderStyle: 'dashed' }}>
                 <div className="form-row" style={{ alignItems: 'center', gap: "10px" }}>
                   <input className="form-input" placeholder="Vế Trái" value={ans.name} onChange={e => handleAnswerChange(index, 'name', e.target.value)} required />
                   <span>→</span>
                   <input className="form-input" placeholder="Vế Phải" value={ans.description} onChange={e => handleAnswerChange(index, 'description', e.target.value)} required />
                   <button type="button" onClick={() => handleRemoveOption(index)} className="btn btn-danger">X</button>
                 </div>
               </div>
             ))}
             <button type="button" onClick={handleAddOption} className="btn">+ Thêm cặp</button>
           </div>
        )}

        {formData.type === "WRITING" && (
          <div>
            <h3>Đáp án đúng</h3>
            <input className="form-input" placeholder="Từ khóa đáp án" value={answers[0]?.name || ""} onChange={e => handleAnswerChange(0, 'name', e.target.value)} required />
          </div>
        )}

        <div style={{ marginTop: "30px", display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" className="btn btn-primary" style={{ padding: "10px 30px" }}>
            {isEditMode ? "Cập Nhật Câu Hỏi" : "Tạo Câu Hỏi"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuestionForm;