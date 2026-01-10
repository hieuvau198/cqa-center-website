import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { 
  getAllQuestions, 
  getQuestionsByPool, 
  deleteQuestion, 
  getAllPools, 
  getAllTags, 
  updateQuestion,
  updatePool,
  deleteFile // <--- Import deleteFile
} from "../../../firebase/firebaseQuery";

const TYPE_LABELS = {
  "MC_SINGLE": "Trắc nghiệm (1 đáp án)",
  "MC_MULTI": "Trắc nghiệm (Nhiều đáp án)",
  "MATCHING": "Nối cặp",
  "WRITING": "Tự luận"
};

const QuestionList = () => {
  const { poolId } = useParams(); 
  
  // Data State
  const [poolQuestions, setPoolQuestions] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
  const [tags, setTags] = useState([]);
  const [poolName, setPoolName] = useState("Tất Cả Câu Hỏi");

  // UI / Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);

  // Edit Name State
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const tagsData = await getAllTags();
      setTags(tagsData);

      const allQ = await getAllQuestions();
      setAllQuestions(allQ);

      if (poolId) {
        const poolQ = await getQuestionsByPool(poolId);
        setPoolQuestions(poolQ);

        const pools = await getAllPools();
        const currentPool = pools.find(p => p.id === poolId);
        if (currentPool) {
          setPoolName(currentPool.name);
          setEditName(currentPool.name);
        }
      } else {
        setPoolQuestions(allQ);
      }
    };
    fetchData();
  }, [poolId]);

  const handleAddToPool = async (question) => {
    if (!poolId) return;
    await updateQuestion(question.id, { poolId: poolId });
    const updatedQ = { ...question, poolId: poolId };
    setPoolQuestions([...poolQuestions, updatedQ]);
    setAllQuestions(allQuestions.map(q => q.id === question.id ? updatedQ : q));
  };

  const handleRemoveFromPool = async (question) => {
    if (!poolId) return;
    await updateQuestion(question.id, { poolId: "" });
    setPoolQuestions(poolQuestions.filter(q => q.id !== question.id));
    setAllQuestions(allQuestions.map(q => q.id === question.id ? { ...q, poolId: "" } : q));
  };

  // Helper to find image URLs in HTML content
  const extractImageUrls = (htmlString) => {
    if (!htmlString) return [];
    // Regex to match src="..." where the url contains firebase storage
    const regex = /<img[^>]+src="([^">]+)"/g;
    const urls = [];
    let match;
    while ((match = regex.exec(htmlString)) !== null) {
      if (match[1].includes("firebasestorage.googleapis.com")) {
        urls.push(match[1]);
      }
    }
    return urls;
  };

  const handleDelete = async (id) => {
    if(confirm("Bạn có chắc chắn muốn xóa vĩnh viễn câu hỏi này không?")) {
      try {
        // 1. Find the question data to get image URLs
        const questionToDelete = allQuestions.find(q => q.id === id);
        
        if (questionToDelete) {
          // 2. Extract URLs from Content and Explanation
          const contentImages = extractImageUrls(questionToDelete.content);
          const explanationImages = extractImageUrls(questionToDelete.explanation);
          const allImages = [...new Set([...contentImages, ...explanationImages])]; // Unique URLs

          // 3. Delete files from Storage
          if (allImages.length > 0) {
            console.log("Deleting images...", allImages);
            await Promise.all(allImages.map(url => deleteFile(url)));
          }
        }

        // 4. Delete document from Firestore
        await deleteQuestion(id);
        
        // 5. Update UI
        setPoolQuestions(poolQuestions.filter(q => q.id !== id));
        setAllQuestions(allQuestions.filter(q => q.id !== id));

      } catch (error) {
        console.error("Error deleting question or images:", error);
        alert("Có lỗi xảy ra khi xóa câu hỏi.");
      }
    }
  };

  const toggleTag = (tagId) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(t => t !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const handleUpdateName = async () => {
    if (!editName.trim()) return;
    try {
      await updatePool(poolId, editName.trim());
      setPoolName(editName.trim());
      setIsEditingName(false);
    } catch (error) {
      alert("Lỗi khi cập nhật tên ngân hàng");
    }
  };

  const filteredAllQuestions = allQuestions.filter(q => {
    const nameMatch = q.name.toLowerCase().includes(searchTerm.toLowerCase());
    const qTags = q.tagIds || [];
    const tagsMatch = selectedTags.length === 0 || selectedTags.every(t => qTags.includes(t));
    return nameMatch && tagsMatch;
  });

  return (
    <div className="admin-container" style={{ maxWidth: '1400px' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <small style={{ color: "#888", textTransform: "uppercase" }}>Quản Lý Ngân Hàng</small>
          
          {poolId && isEditingName ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "5px" }}>
              <input 
                className="form-input"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={{ fontSize: "1.5rem", fontWeight: "bold", padding: "5px", width: "300px" }}
                autoFocus
              />
              <button onClick={handleUpdateName} className="btn btn-success">Lưu</button>
              <button onClick={() => { setIsEditingName(false); setEditName(poolName); }} className="btn btn-secondary">Hủy</button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h2>{poolName}</h2>
              {poolId && (
                <button 
                  onClick={() => setIsEditingName(true)} 
                  className="btn" 
                  title="Đổi tên ngân hàng"
                  style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "#666" }}
                >
                  ✎
                </button>
              )}
            </div>
          )}

        </div>
        <Link to="/admin/questions/new">
          <button className="btn btn-primary">+ Tạo Câu Hỏi Mới</button>
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <Link to="/admin/questions/import">
          <button className="btn btn-secondary">⬆ Nhập từ File</button>
        </Link>
        
        <Link to="/admin/questions/new">
          <button className="btn btn-primary">+ Tạo Câu Hỏi Mới</button>
        </Link>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="section-box">
        <div className="form-row" style={{ alignItems: "center", marginBottom: "15px" }}>
          <input 
            className="form-input" 
            placeholder="Tìm kiếm câu hỏi..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>
        
        <div className="filter-bar">
          <span style={{ fontSize: "0.9rem", fontWeight: "bold" }}>Lọc theo thẻ:</span>
          {tags.map(tag => (
            <button 
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              className={`btn-filter ${selectedTags.includes(tag.id) ? 'active' : ''}`}
            >
              {tag.name}
            </button>
          ))}
          {selectedTags.length > 0 && (
            <button onClick={() => setSelectedTags([])} className="btn-filter-clear">
              Xóa lọc
            </button>
          )}
        </div>
      </div>

      {/* SPLIT VIEW (Only when inside a Pool) */}
      {poolId ? (
        <div className="grid-split">
          
          {/* --- VIEW A: CURRENT POOL --- */}
          <div className="section-box" style={{ background: "#f0f8ff", border: "2px solid #3498db" }}>
            <h3 style={{ borderBottom: "1px solid #ccc", paddingBottom: "10px", marginTop: 0 }}>
              Chế độ xem A: Đã thêm ({poolQuestions.length})
            </h3>
            <div className="list-container" style={{ marginTop: "10px" }}>
              {poolQuestions.length === 0 ? <p>Chưa có câu hỏi nào trong ngân hàng này.</p> : (
                poolQuestions.map(q => (
                  <div key={q.id} className="item-card" style={{ padding: "15px", background: "white", marginBottom: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <div>
                        <strong>{q.name}</strong>
                        <div style={{ fontSize: "0.8em", color: "#666" }}>{TYPE_LABELS[q.type]}</div>
                      </div>
                      <button 
                        onClick={() => handleRemoveFromPool(q)} 
                        className="btn btn-danger" 
                        style={{ padding: "5px 10px", fontSize: "0.8rem" }}
                      >
                        Gỡ bỏ
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* --- VIEW B: ALL QUESTIONS (SELECTOR) --- */}
          <div className="section-box">
            <h3 style={{ borderBottom: "1px solid #ccc", paddingBottom: "10px", marginTop: 0 }}>
              Chế độ xem B: Kho câu hỏi
            </h3>
            <div className="list-container" style={{ marginTop: "10px" }}>
              {filteredAllQuestions.map(q => {
                const isInCurrentPool = q.poolId === poolId;
                
                return (
                  <div 
                    key={q.id} 
                    className={`item-card ${isInCurrentPool ? 'card-dimmed' : ''}`}
                    style={{ padding: "15px", marginBottom: "10px" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <div>
                        <strong>{q.name}</strong>
                        <div style={{ display: "flex", gap: "5px", marginTop: "5px" }}>
                          <span className="badge badge-gray">
                            {TYPE_LABELS[q.type]}
                          </span>
                          {q.poolId && q.poolId !== poolId && (
                            <span className="badge badge-warn">
                              Ở ngân hàng khác
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "8px" }}>
                        {isInCurrentPool ? (
                          <span style={{ color: "green", fontWeight: "bold", fontSize: "0.9rem", alignSelf: "center" }}>
                            Đã thêm
                          </span>
                        ) : (
                          <button 
                            onClick={() => handleAddToPool(q)} 
                            className="btn btn-primary"
                            style={{ padding: "5px 15px", fontSize: "0.8rem" }}
                          >
                            + Thêm
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredAllQuestions.length === 0 && <p>Không tìm thấy câu hỏi nào phù hợp.</p>}
            </div>
          </div>

        </div>
      ) : (
        /* FALLBACK VIEW */
        <div className="list-container">
          {filteredAllQuestions.map(q => (
            <div key={q.id} className="item-card">
              <div className="item-header">
                <h4>{q.name}</h4>
                <div>
                  <Link to={`/admin/questions/edit/${q.id}`}>
                    <button className="btn-text">Sửa</button>
                  </Link>
                  <button onClick={() => handleDelete(q.id)} className="btn-text-delete">Xóa</button>
                </div>
              </div>
              <p>{q.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionList;