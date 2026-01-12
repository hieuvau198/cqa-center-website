// src/pages/Admin/Questions/QuestionForm.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { addQuestion, updateQuestion, getQuestionById, getAllTags, getAllPools } from "../../../firebase/firebaseQuery";
import QuestionPreview from "../../../components/QuestionPreview";
import HtmlQuestionEditor from "./components/HtmlQuestionEditor"; // Import the new component

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

  const handleToggleTag = (tagId) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter(id => id !== tagId));
    } else {
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
  };

  const handleTypeChange = (newType) => {
    // This function will effectively only run in "Create Mode" now, 
    // because the input is disabled in Edit Mode.
    if(confirm("Thay đổi loại câu hỏi có thể ảnh hưởng đến dữ liệu câu trả lời. Tiếp tục?")) {
      setFormData({ ...formData, type: newType });
      
      if (newType === "WRITING") {
        setAnswers([{ name: "", description: "", imageUrl: "", isCorrect: true }]);
      } else if (newType === "MC_SINGLE_HTML") {
        if (answers.length < 2) {
          setAnswers(Array(4).fill(null).map(() => ({ name: "", content: "", isCorrect: false })));
        }
      } else {
         if(answers.length === 0) setAnswers([{ name: "", description: "", imageUrl: "", isCorrect: false }]);
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

  const isHtmlMode = formData.type === "MC_SINGLE_HTML";

  return (
    <div className="admin-container" style={{ display: "flex", gap: "20px" }}>
      
      {/* LEFT COLUMN: FORM */}
      <div style={{ flex: 1, maxWidth: "60%" }}>
        <h2>{isEditMode ? "Chỉnh Sửa Câu Hỏi" : "Tạo Câu Hỏi Mới"}</h2>
        <form onSubmit={handleSubmit} className="form-column">
          
          <div style={{ display: "flex", gap: "10px" }}>
             <div className="form-group" style={{ flex: 1 }}>
                <label>Mã câu hỏi (Name/ID)</label>
                <input className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
             </div>
             <div className="form-group" style={{ flex: 1 }}>
                <label>Loại câu hỏi</label>
                <select 
                  className="form-select" 
                  value={formData.type} 
                  onChange={e => handleTypeChange(e.target.value)}
                  disabled={isEditMode} // DISABLED IN EDIT MODE
                  style={isEditMode ? { background: "#eee", cursor: "not-allowed" } : {}}
                >
                  <option value="MC_SINGLE">Trắc nghiệm (1 đáp án)</option>
                  <option value="MC_MULTI">Trắc nghiệm (Nhiều đáp án)</option>
                  <option value="MC_SINGLE_HTML">Trắc nghiệm (HTML Import)</option>
                  <option value="MATCHING">Nối cặp (Matching)</option>
                  <option value="WRITING">Tự luận (Điền từ)</option>
                </select>
             </div>
          </div>

          <div className="form-group">
            <label>Ngân hàng / Thư mục</label>
            <select 
              className="form-select" 
              value={formData.poolId} 
              onChange={e => setFormData({...formData, poolId: e.target.value})}
              disabled={isEditMode} // DISABLED IN EDIT MODE
              style={isEditMode ? { background: "#eee", cursor: "not-allowed" } : {}}
            >
              <option value="">-- Chưa phân loại --</option>
              {availablePools.map(pool => (
                <option key={pool.id} value={pool.id}>{pool.name}</option>
              ))}
            </select>
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

          {/* === CONTENT EDITOR AREA === */}
          
          {isHtmlMode ? (
            <HtmlQuestionEditor 
              formData={formData}
              answers={answers}
              onUpdateForm={setFormData}
              onUpdateAnswers={setAnswers}
            />
          ) : (
            // STANDARD EDITOR
            <>
              <div className="form-group">
                <label>Nội dung câu hỏi (Text/HTML)</label>
                <textarea 
                  className="form-textarea" 
                  // Removed dark theme styles
                  style={{ fontFamily: "monospace", fontSize: "0.95rem", height: "100px", color: "#000", background: "#fff" }}
                  value={formData.content} 
                  onChange={e => setFormData({...formData, content: e.target.value})} 
                />
              </div>

              <div className="form-group">
                 <label>Giải thích đáp án</label>
                 <textarea className="form-textarea" value={formData.explanation} onChange={e => setFormData({...formData, explanation: e.target.value})} />
              </div>

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
            </>
          )}

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
           <QuestionPreview 
             data={{
               name: formData.name,
               content: formData.content,
               explanation: formData.explanation,
               answers: answers,
               type: formData.type
             }}
           />
           {isHtmlMode && (
             <div className="info-box" style={{ marginTop: "15px", fontSize: "0.85rem", color: "#666" }}>
               ℹ️ Chế độ HTML Import: Hình ảnh được hiển thị trực tiếp. Bạn có thể thay đổi ảnh bằng cách click vào ảnh trong khung chỉnh sửa bên trái.
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default QuestionForm;