// src/pages/Admin/Questions/components/HtmlQuestionEditor.jsx
import { useState, useRef, useEffect } from "react";
import { uploadFile } from "../../../../firebase/firebaseQuery"; 

// A reusable box for editing HTML content with Image Replacement support
const EditableHtmlBox = ({ htmlContent, onUpdate, label, minHeight = "100px" }) => {
  const contentRef = useRef(null);
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Initialize content once
  useEffect(() => {
    if (contentRef.current && contentRef.current.innerHTML !== htmlContent) {
      contentRef.current.innerHTML = htmlContent || "";
    }
  }, []); // Only run on mount to prevent cursor jumping

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

  // Handle file upload and image source replacement
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedImage) return;

    setIsUploading(true);
    try {
      const newUrl = await uploadFile(file, "question-images");
      
      // Update the DOM directly
      selectedImage.src = newUrl;
      // Clear selection
      setSelectedImage(null);
      // Trigger update to parent state
      onUpdate(contentRef.current.innerHTML);
    } catch (error) {
      alert("Lỗi khi tải ảnh lên: " + error.message);
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="form-group" style={{ marginBottom: "20px" }}>
      <label style={{ display: "flex", justifyContent: "space-between", color: "#333", fontWeight: "bold" }}>
        {label}
        {isUploading && <span style={{ color: "orange" }}>Đang tải ảnh...</span>}
      </label>
      
      {/* Changed background to white and border to light gray */}
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
              disabled={isUploading}
            >
              Thay ảnh này
            </button>
          </div>
        )}

        {/* The Content Editor - Changed color to black */}
        <div
          ref={contentRef}
          contentEditable
          onBlur={handleBlur}
          onClick={handleClick}
          style={{
            minHeight: minHeight,
            outline: "none",
            color: "#000", // Black text
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

const HtmlQuestionEditor = ({ formData, answers, onUpdateForm, onUpdateAnswers }) => {
  
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
      {/* Changed container background to white/light gray */}
      <div style={{ background: "#f9f9f9", padding: "15px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #ddd" }}>
        <h4 style={{ marginTop: 0, color: "#333" }}>Trình chỉnh sửa HTML (Word Import)</h4>
        <small style={{ color: "#666", display: "block", marginBottom: "15px" }}>
          Bạn có thể sửa trực tiếp văn bản bên dưới. Bấm vào ảnh để thay thế ảnh khác.
        </small>

        {/* 1. Question Content */}
        <EditableHtmlBox 
          label="Nội dung câu hỏi" 
          htmlContent={formData.content} 
          onUpdate={(html) => onUpdateForm({ ...formData, content: html })}
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
          minHeight="100px"
        />

      </div>
    </div>
  );
};

export default HtmlQuestionEditor;