import { useState, useRef, useEffect } from "react";

// A reusable box for editing HTML content with Image Replacement support
const EditableHtmlBox = ({ htmlContent, onUpdate, label, minHeight = "100px", onImageReplace }) => {
  const contentRef = useRef(null);
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);

  // Initialize content once
  useEffect(() => {
    if (contentRef.current && contentRef.current.innerHTML !== htmlContent) {
      contentRef.current.innerHTML = htmlContent || "";
    }
  }, []); // Only run on mount

  // Handle standard text editing
  const handleBlur = () => {
    if (contentRef.current) {
      onUpdate(contentRef.current.innerHTML);
    }
  };

  // Handle clicking inside the editor to detect images
  const handleClick = (e) => {
    if (e.target.tagName === "IMG") {
      setSelectedImage(e.target);
    } else {
      setSelectedImage(null);
    }
  };

  // Trigger file selection
  const handleReplaceImageClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file change: Preview immediately, defer upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file || !selectedImage) return;

    try {
      // 1. Create a local preview URL
      const tempUrl = URL.createObjectURL(file);
      const oldSrc = selectedImage.src;

      // 2. Update the DOM directly for preview
      selectedImage.src = tempUrl;
      
      // 3. Clear selection
      setSelectedImage(null);

      // 4. Trigger update to parent state (now containing blob URL)
      onUpdate(contentRef.current.innerHTML);

      // 5. Notify parent to track this replacement for saving later
      if (onImageReplace) {
        onImageReplace(file, oldSrc, tempUrl);
      }

    } catch (error) {
      alert("Lỗi khi xử lý ảnh: " + error.message);
    } finally {
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="form-group" style={{ marginBottom: "20px" }}>
      <label style={{ display: "flex", justifyContent: "space-between", color: "#333", fontWeight: "bold" }}>
        {label}
      </label>
      
      <div style={{ position: "relative", border: "1px solid #ccc", borderRadius: "4px", padding: "10px", background: "#fff" }}>
        
        {/* Floating Action Toolbar for Image */}
        {selectedImage && (
          <div style={{
            position: "absolute",
            top: "5px",
            right: "5px",
            background: "rgba(0,0,0,0.8)",
            padding: "5px",
            borderRadius: "4px",
            zIndex: 10,
            display: "flex",
            gap: "5px"
          }}>
            <span style={{ color: "#fff", fontSize: "12px", marginRight: "5px" }}>Đã chọn ảnh</span>
            <button 
              type="button" 
              className="btn btn-sm btn-primary" 
              onClick={handleReplaceImageClick}
            >
              Thay ảnh này
            </button>
          </div>
        )}

        {/* The Content Editor */}
        <div
          ref={contentRef}
          contentEditable
          onBlur={handleBlur}
          onClick={handleClick}
          style={{
            minHeight: minHeight,
            outline: "none",
            color: "#000",
            fontFamily: "Times New Roman, serif",
            fontSize: "1.1rem",
            lineHeight: "1.5"
          }}
        />
      </div>

      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: "none" }} 
        accept="image/*" 
        onChange={handleFileChange} 
      />
    </div>
  );
};

const HtmlQuestionEditor = ({ formData, answers, onUpdateForm, onUpdateAnswers, onImageReplace }) => {
  
  const handleAnswerChange = (index, newHtml) => {
    const newAnswers = [...answers];
    newAnswers[index] = {
      ...newAnswers[index],
      content: newHtml,
      name: newHtml // Keep name synced
    };
    onUpdateAnswers(newAnswers);
  };

  const handleCorrectChange = (index) => {
    const newAnswers = answers.map((ans, i) => ({
      ...ans,
      isCorrect: i === index
    }));
    onUpdateAnswers(newAnswers);
  };

  return (
    <div className="html-editor-container">
      <div style={{ background: "#f9f9f9", padding: "15px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #ddd" }}>
        <h4 style={{ marginTop: 0, color: "#333" }}>Trình chỉnh sửa HTML (Word Import)</h4>
        <small style={{ color: "#666", display: "block", marginBottom: "15px" }}>
          Bạn có thể sửa trực tiếp văn bản. Bấm vào ảnh để thay thế. <strong>Lưu ý:</strong> Ảnh chỉ được lưu lên server khi bạn bấm nút "Lưu" hoặc "Tạo câu hỏi" ở cuối trang.
        </small>

        {/* 1. Question Content */}
        <EditableHtmlBox 
          label="Nội dung câu hỏi" 
          htmlContent={formData.content} 
          onUpdate={(html) => onUpdateForm({ ...formData, content: html })}
          onImageReplace={onImageReplace}
          minHeight="120px"
        />

        {/* 2. Answers */}
        <label style={{ color: "#333", fontWeight: "bold" }}>Các phương án trả lời:</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginTop: "10px" }}>
          {answers.map((ans, index) => (
            <div key={index} style={{ border: "1px solid #ccc", borderRadius: "4px", padding: "10px", background: ans.isCorrect ? "#e6fffa" : "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                <strong style={{ color: "#555" }}>Phương án {String.fromCharCode(65 + index)}</strong>
                <input 
                  type="radio" 
                  name="correctAnswerHtml"
                  checked={ans.isCorrect}
                  onChange={() => handleCorrectChange(index)}
                  style={{ width: "20px", height: "20px" }}
                />
              </div>
              <EditableHtmlBox 
                label="" 
                htmlContent={ans.content || ans.name} 
                onUpdate={(html) => handleAnswerChange(index, html)}
                onImageReplace={onImageReplace}
                minHeight="60px"
              />
            </div>
          ))}
        </div>

        <hr style={{ borderColor: "#ddd", margin: "20px 0" }}/>

        {/* 3. Explanation */}
        <EditableHtmlBox 
          label="Lời giải chi tiết (Explanation)" 
          htmlContent={formData.explanation} 
          onUpdate={(html) => onUpdateForm({ ...formData, explanation: html })}
          onImageReplace={onImageReplace}
          minHeight="100px"
        />

      </div>
    </div>
  );
};

export default HtmlQuestionEditor;