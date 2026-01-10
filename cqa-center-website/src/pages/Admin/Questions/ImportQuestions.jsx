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
  const [poolId, setPoolId] = useState(""); // Optional: Select a pool to import into

  // Handle "Folder Upload"
  const handleFolderSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setFileList(files);

    // Find the HTML file
    const htmlFile = files.find(f => f.name.endsWith(".html") || f.name.endsWith(".htm"));
    
    if (!htmlFile) {
      alert("Không tìm thấy file .html hoặc .htm trong thư mục đã chọn!");
      return;
    }

    // Read and Parse HTML
    const text = await htmlFile.text();
    const questions = parseWordHtml(text);
    setParsedQuestions(questions);
    setLogs(prev => [...prev, `Đã tìm thấy ${questions.length} câu hỏi trong file ${htmlFile.name}`]);
  };

  // The Main Import Process
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
        // We look for any 'src' in the content string that matches a file in our fileList
        const parser = new DOMParser();
        const doc = parser.parseFromString(q.content + (q.explanation || ""), "text/html");
        const images = doc.querySelectorAll("img");

        const imageUploadPromises = Array.from(images).map(async (img) => {
          const originalSrc = img.getAttribute("src");
          if (!originalSrc) return;

          // File paths in HTML usually look like "file-test-math-2_files/image001.png"
          // We search the uploaded fileList for a file ending with that path segment
          // We normalize slashes for cross-platform compatibility
          const cleanSrc = originalSrc.replace(/\\/g, "/"); 
          
          const matchingFile = fileList.find(f => {
            // Check if file path ends with the src path (handling subdirectories)
            // f.webkitRelativePath contains "folder/sub/image.png"
            const relPath = f.webkitRelativePath || f.name; 
            return relPath.replace(/\\/g, "/").endsWith(cleanSrc);
          });

          if (matchingFile) {
            const downloadURL = await uploadFile(matchingFile, "question-images");
            // Replace in the actual Question Object strings
            q.content = q.content.replace(originalSrc, downloadURL);
            if (q.explanation) {
              q.explanation = q.explanation.replace(originalSrc, downloadURL);
            }
          }
        });

        await Promise.all(imageUploadPromises);

        // 2. Prepare Final Data Object
        const newQuestionData = {
          name: q.name,
          content: q.content,
          type: q.type,
          options: q.options, // Assuming options are simple or parsed
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || "",
          poolId: poolId || "", // Optional link to a bank
          tagIds: [],
          createdAt: new Date().toISOString()
        };

        // 3. Save to Firestore
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
    navigate("/admin/questions"); // Go back to list
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