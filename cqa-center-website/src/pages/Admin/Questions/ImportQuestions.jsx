// src/pages/Admin/Questions/ImportQuestions.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { parseWordHtml } from "../../../utils/htmlParser";
import { uploadFile, addQuestion, getAllPools } from "../../../firebase/firebaseQuery";
import QuestionPreview from "../../../components/QuestionPreview";

const ImportQuestions = () => {
  const navigate = useNavigate();
  const [fileList, setFileList] = useState([]);
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [previewData, setPreviewData] = useState([]); // Stores data with Blob URLs for display
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState([]);
  const [poolId, setPoolId] = useState("");
  const [pools, setPools] = useState([]);

  useEffect(() => {
    getAllPools().then(setPools);
  }, []);

  // Effect to generate Preview Data (replace src with Blob URLs)
  useEffect(() => {
    if (parsedQuestions.length === 0 || fileList.length === 0) {
      setPreviewData([]);
      return;
    }

    const generatePreviews = async () => {
      // Helper to swap src with Blob URL
      const swapSrc = (html) => {
        if (!html) return html;
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        doc.querySelectorAll("img").forEach(img => {
            const src = img.getAttribute("src");
            if(src && !src.startsWith("http")) {
                const cleanSrc = src.replace(/\\/g, "/");
                // Find file in uploaded list
                const file = fileList.find(f => {
                    const relPath = f.webkitRelativePath || f.name;
                    return relPath.replace(/\\/g, "/").endsWith(cleanSrc);
                });
                if (file) {
                    img.src = URL.createObjectURL(file);
                }
            }
        });
        return doc.body.innerHTML;
      };

      const newPreviews = parsedQuestions.map(q => ({
          ...q,
          content: swapSrc(q.content),
          explanation: swapSrc(q.explanation),
          options: q.options.map(opt => ({
              ...opt,
              content: swapSrc(opt.content)
          }))
      }));
      setPreviewData(newPreviews);
    };

    generatePreviews();
  }, [parsedQuestions, fileList]);

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
    setParsedQuestions(questions); // Triggers the useEffect above to create previews
  };

  // Helper to process a string (HTML), find images, and upload them to Firebase
  // Uses the RAW parsedQuestions (with relative paths), not the preview data
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
    if (!confirm(`Bạn có chắc muốn nhập ${parsedQuestions.length} câu hỏi vào hệ thống?`)) return;

    setIsProcessing(true);
    setLogs([]);

    const total = parsedQuestions.length;
    let successCount = 0;

    for (let i = 0; i < total; i++) {
      let q = { ...parsedQuestions[i] };
      setLogs(prev => [...prev, `Đang xử lý ${i + 1}/${total}: ${q.name}...`]);

      try {
        // 1. Process Images in Content & Explanation
        q.content = await processHtmlImages(q.content);
        q.explanation = await processHtmlImages(q.explanation || "");

        // 2. Process Images in OPTIONS
        if (q.options && q.options.length > 0) {
          const processedOptions = await Promise.all(q.options.map(async (opt) => {
            const newContent = await processHtmlImages(opt.content);
            return { ...opt, content: newContent };
          }));
          q.options = processedOptions;
        }

        // 3. Map to Firebase Schema
        // Note: We convert 'options' (parser format) to 'answers' (firebase schema) if needed, 
        // but currently we just store 'options' or map them.
        // Assuming your schema uses 'answers':
        const answersPayload = q.options.map(opt => ({
             name: opt.content, // storing html content in 'name' or 'content' field
             content: opt.content,
             isCorrect: (q.correctAnswer && q.correctAnswer === opt.id) ? true : false,
             description: ""
        }));

        const newQuestionData = {
          name: q.name,
          content: q.content,
          type: q.type,
          answers: answersPayload, 
          // options: q.options, // Can keep this if your system uses it, but standardizing on 'answers' is better
          description: "",
          explanation: q.explanation || "",
          poolId: poolId || "",
          tagIds: [],
          createdAt: new Date().toISOString()
        };

        await addQuestion(newQuestionData);
        successCount++;
        // setLogs(prev => [...prev, `-> OK`]); // Reduce log noise

      } catch (error) {
        console.error(error);
        setLogs(prev => [...prev, `-> LỖI: ${error.message}`]);
      }
    }

    setIsProcessing(false);
    alert(`Hoàn tất! Đã nhập thành công ${successCount}/${total} câu hỏi.`);
    navigate("/admin/questions");
  };

  return (
    <div className="admin-container" style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', gap: '20px' }}>
      
      {/* Left Column: Controls */}
      <div style={{ flex: 1 }}>
        <h2>Nhập Câu Hỏi (Import)</h2>
        
        <div className="section-box">
            <div className="form-group">
                <label>1. Chọn Ngân hàng câu hỏi (Pool)</label>
                <select className="form-select" value={poolId} onChange={e => setPoolId(e.target.value)}>
                    <option value="">-- Chọn Pool --</option>
                    {pools.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>

            <div className="form-group">
                <label>2. Chọn thư mục chứa file HTML</label>
                <input 
                type="file" 
                webkitdirectory="true" 
                directory="true" 
                multiple 
                onChange={handleFolderSelect} 
                className="form-input"
                style={{ padding: "20px", border: "2px dashed #ccc", background: "#f9f9f9" }}
                />
            </div>

            {parsedQuestions.length > 0 && (
            <div style={{ marginTop: "20px" }}>
                <div style={{ marginBottom: "10px", color: "green", fontWeight: "bold" }}>
                    ✅ Tìm thấy {parsedQuestions.length} câu hỏi.
                </div>
                <p style={{ fontSize: "0.9rem", color: "#666" }}>
                    Kiểm tra danh sách bên phải. Nếu mọi thứ hiển thị đúng (bao gồm hình ảnh), nhấn nút bên dưới để tải lên hệ thống.
                </p>
                <button 
                onClick={handleImport} 
                disabled={isProcessing}
                className="btn btn-primary"
                style={{ width: "100%", padding: "15px", fontSize: "1.1rem" }}
                >
                {isProcessing ? "Đang xử lý..." : `Xác nhận & Lưu ${parsedQuestions.length} câu hỏi`}
                </button>
            </div>
            )}
        </div>

        {logs.length > 0 && (
            <div className="section-box" style={{ background: "#222", color: "#0f0", maxHeight: "300px", overflowY: "auto", fontFamily: "monospace", fontSize: "0.8rem" }}>
            {logs.map((log, idx) => (
                <div key={idx}>{log}</div>
            ))}
            </div>
        )}
        
        <div style={{ marginTop: "20px" }}>
             <Link to="/admin/questions">← Quay lại danh sách</Link>
        </div>
      </div>

      {/* Right Column: Preview List */}
      <div style={{ flex: 1.5, borderLeft: "1px solid #ddd", paddingLeft: "20px" }}>
         <h3>Xem trước ({parsedQuestions.length})</h3>
         <div style={{ height: "80vh", overflowY: "auto", paddingRight: "10px" }}>
            {previewData.length === 0 ? (
                <div style={{ textAlign: "center", color: "#999", marginTop: "50px" }}>
                    Chưa có dữ liệu. Vui lòng chọn thư mục để xem trước.
                </div>
            ) : (
                previewData.map((q, idx) => (
                    <QuestionPreview key={idx} data={q} index={idx} />
                ))
            )}
         </div>
      </div>

    </div>
  );
};

export default ImportQuestions;