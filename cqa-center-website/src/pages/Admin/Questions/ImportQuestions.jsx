import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { parseWordHtml } from "../../../utils/htmlParser";
import { uploadFile, addQuestion } from "../../../firebase/firebaseQuery";

const ImportQuestions = () => {
  const navigate = useNavigate();
  const [fileList, setFileList] = useState([]);
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState([]);
  const [poolId, setPoolId] = useState("");

  const handleFolderSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setFileList(files);

    const htmlFile = files.find(f => f.name.endsWith(".html") || f.name.endsWith(".htm"));
    
    if (!htmlFile) {
      alert("Không tìm thấy file .html hoặc .htm trong thư mục đã chọn!");
      return;
    }

    const text = await htmlFile.text();
    const questions = parseWordHtml(text);
    setParsedQuestions(questions);
    setLogs(prev => [...prev, `Đã tìm thấy ${questions.length} câu hỏi trong file ${htmlFile.name}`]);
  };

  // Helper to process a string (HTML), find images, and upload them
  const processHtmlImages = async (htmlContent) => {
    if (!htmlContent) return htmlContent;
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    const images = doc.querySelectorAll("img");

    if (images.length === 0) return htmlContent;

    const uploadPromises = Array.from(images).map(async (img) => {
      const originalSrc = img.getAttribute("src");
      if (!originalSrc || originalSrc.startsWith("http")) return; // Skip if already a URL

      const cleanSrc = originalSrc.replace(/\\/g, "/"); 
      
      // Find file in the uploaded list
      const matchingFile = fileList.find(f => {
        const relPath = f.webkitRelativePath || f.name; 
        return relPath.replace(/\\/g, "/").endsWith(cleanSrc);
      });

      if (matchingFile) {
        try {
          const downloadURL = await uploadFile(matchingFile, "question-images");
          img.setAttribute("src", downloadURL);
        } catch (err) {
          console.error("Failed to upload image:", cleanSrc, err);
        }
      }
    });

    await Promise.all(uploadPromises);
    return doc.body.innerHTML;
  };

  const handleImport = async () => {
    if (parsedQuestions.length === 0) return;
    setIsProcessing(true);
    setLogs([]);

    const total = parsedQuestions.length;
    let successCount = 0;

    for (let i = 0; i < total; i++) {
      let q = { ...parsedQuestions[i] };
      setLogs(prev => [...prev, `Đang xử lý câu hỏi ${i + 1}/${total}: ${q.name}...`]);

      try {
        // 1. Process Images in Content & Explanation
        q.content = await processHtmlImages(q.content);
        q.explanation = await processHtmlImages(q.explanation || "");

        // 2. Process Images in OPTIONS (Fix for missing option images)
        if (q.options && q.options.length > 0) {
          const processedOptions = await Promise.all(q.options.map(async (opt) => {
            const newContent = await processHtmlImages(opt.content);
            return { ...opt, content: newContent };
          }));
          q.options = processedOptions;
        }

        // 3. Prepare Data
        const newQuestionData = {
          name: q.name,
          content: q.content,
          type: q.type,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || "",
          poolId: poolId || "",
          tagIds: [],
          createdAt: new Date().toISOString()
        };

        // 4. Save
        await addQuestion(newQuestionData);
        successCount++;
        setLogs(prev => [...prev, `-> Đã nhập thành công: ${q.name}`]);

      } catch (error) {
        console.error(error);
        setLogs(prev => [...prev, `-> LỖI: ${q.name} - ${error.message}`]);
      }
    }

    setIsProcessing(false);
    alert(`Hoàn tất! Đã nhập thành công ${successCount}/${total} câu hỏi.`);
    navigate("/admin/questions");
  };

  return (
    <div className="admin-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Nhập Câu Hỏi Từ File (HTML + Ảnh)</h2>
      
      <div className="section-box">
        <p>Chọn thư mục chứa file <b>.html</b> và thư mục hình ảnh đi kèm (ví dụ: <code>file_files</code>).</p>
        
        <input 
          type="file" 
          webkitdirectory="true" 
          directory="true" 
          multiple 
          onChange={handleFolderSelect} 
          className="form-input"
          style={{ padding: "20px", border: "2px dashed #ccc" }}
        />

        {parsedQuestions.length > 0 && (
          <div style={{ marginTop: "20px" }}>
            <p><strong>Tìm thấy:</strong> {parsedQuestions.length} câu hỏi.</p>
            <button 
              onClick={handleImport} 
              disabled={isProcessing}
              className="btn btn-primary"
              style={{ width: "100%", padding: "15px", fontSize: "1.1rem" }}
            >
              {isProcessing ? "Đang xử lý..." : "Tiến hành Nhập Dữ Liệu"}
            </button>
          </div>
        )}
      </div>

      {logs.length > 0 && (
        <div className="section-box" style={{ background: "#1e1e1e", color: "#0f0", maxHeight: "300px", overflowY: "auto", fontFamily: "monospace" }}>
          {logs.map((log, idx) => (
            <div key={idx}>{log}</div>
          ))}
        </div>
      )}
      
      <Link to="/admin/questions">Quay lại danh sách</Link>
    </div>
  );
};

export default ImportQuestions;