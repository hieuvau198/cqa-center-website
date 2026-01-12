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
  deleteFile 
} from "../../../firebase/firebaseQuery";
import TagTreeSelector from "../Tests/components/TagTreeSelector"; //

const TYPE_LABELS = {
  "MC_SINGLE": "Trắc nghiệm (1 đáp án)",
  "MC_MULTI": "Trắc nghiệm (Nhiều đáp án)",
  "MATCHING": "Nối cặp",
  "WRITING": "Tự luận",
  "MC_SINGLE_HTML": "Trắc nghiệm (HTML)"
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
  const [isTagFilterOpen, setIsTagFilterOpen] = useState(false); // To toggle tree view

  // Edit Name State
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");

  // Bulk Action State
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);

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
    if (!htmlString || typeof htmlString !== 'string') return [];
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

  const collectImagesForQuestions = (questions) => {
    let allImages = [];
    questions.forEach(q => {
      const contentImages = extractImageUrls(q.content);
      const explanationImages = extractImageUrls(q.explanation);
      
      let answerImages = [];
      if (q.answers && Array.isArray(q.answers)) {
        q.answers.forEach(ans => {
          const imgsContent = extractImageUrls(ans.content);
          const imgsName = extractImageUrls(ans.name);
          if (ans.imageUrl && ans.imageUrl.includes("firebasestorage.googleapis.com")) {
            answerImages.push(ans.imageUrl);
          }
          answerImages = [...answerImages, ...imgsContent, ...imgsName];
        });
      }

      let mainImage = [];
      if (q.imageUrl && q.imageUrl.includes("firebasestorage.googleapis.com")) {
        mainImage.push(q.imageUrl);
      }
      allImages = [...allImages, ...contentImages, ...explanationImages, ...answerImages, ...mainImage];
    });
    return [...new Set(allImages)];
  };

  const handleDelete = async (id) => {
    if(confirm("Bạn có chắc chắn muốn xóa vĩnh viễn câu hỏi này không?")) {
      await performDelete([id]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedQuestionIds.length === 0) return;
    if(confirm(`Bạn có chắc chắn muốn xóa ${selectedQuestionIds.length} câu hỏi đã chọn?`)) {
      await performDelete(selectedQuestionIds);
      setSelectedQuestionIds([]);
    }
  };

  const performDelete = async (idsToDelete) => {
    try {
      const questionsToDelete = allQuestions.filter(q => idsToDelete.includes(q.id));
      
      // 1. Collect and Delete Images
      const imagesToDelete = collectImagesForQuestions(questionsToDelete);
      if (imagesToDelete.length > 0) {
        console.log("Deleting images:", imagesToDelete.length);
        await Promise.all(imagesToDelete.map(url => deleteFile(url)));
      }

      // 2. Delete Questions form DB
      await Promise.all(idsToDelete.map(id => deleteQuestion(id)));

      // 3. Update UI
      setPoolQuestions(prev => prev.filter(q => !idsToDelete.includes(q.id)));
      setAllQuestions(prev => prev.filter(q => !idsToDelete.includes(q.id)));
      
      alert(`Đã xóa ${idsToDelete.length} câu hỏi thành công.`);
    } catch (error) {
      console.error("Delete error:", error);
      alert("Lỗi khi xóa: " + error.message);
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

  const handleSelectQuestion = (id) => {
    if (selectedQuestionIds.includes(id)) {
      setSelectedQuestionIds(prev => prev.filter(i => i !== id));
    } else {
      setSelectedQuestionIds(prev => [...prev, id]);
    }
  };

  const handleSelectAll = (filteredList) => {
    const allIds = filteredList.map(q => q.id);
    // If all currently shown are selected, deselect all. Otherwise, select all.
    const isAllSelected = allIds.every(id => selectedQuestionIds.includes(id));
    if (isAllSelected) {
      setSelectedQuestionIds(prev => prev.filter(id => !allIds.includes(id)));
    } else {
      // Merge unique IDs
      const newSelected = [...new Set([...selectedQuestionIds, ...allIds])];
      setSelectedQuestionIds(newSelected);
    }
  };

  const filteredAllQuestions = allQuestions.filter(q => {
    const nameMatch = q.name.toLowerCase().includes(searchTerm.toLowerCase());
    const qTags = q.tagIds || [];
    // If no tags selected, match all. If tags selected, question MUST have all selected tags.
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
        <div style={{ display: 'flex', gap: '10px' }}>
            {selectedQuestionIds.length > 0 && (
                 <button 
                    onClick={handleBulkDelete} 
                    className="btn btn-danger"
                    style={{ animation: "fadeIn 0.2s" }}
                 >
                    🗑 Xóa ({selectedQuestionIds.length}) mục
                 </button>
            )}
            <Link to="/admin/questions/new">
                <button className="btn btn-primary">+ Tạo Câu Hỏi Mới</button>
            </Link>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <Link to="/admin/questions/import">
          <button className="btn btn-secondary">⬆ Nhập từ File</button>
        </Link>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="section-box" style={{ position: "relative" }}>
        <div className="form-row" style={{ alignItems: "center", marginBottom: "15px" }}>
          <input 
            className="form-input" 
            placeholder="Tìm kiếm câu hỏi..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ flex: 1 }}
          />
          <button 
            className="btn btn-secondary" 
            onClick={() => setIsTagFilterOpen(!isTagFilterOpen)}
          >
            {isTagFilterOpen ? "Ẩn bộ lọc thẻ ▲" : "Lọc theo thẻ ▼"}
          </button>
        </div>
        
        {isTagFilterOpen && (
            <div style={{ marginBottom: "15px", borderTop: "1px solid #eee", paddingTop: "10px" }}>
                <span style={{ fontSize: "0.9rem", fontWeight: "bold", display: "block", marginBottom: "5px" }}>Chọn thẻ để lọc:</span>
                <TagTreeSelector tags={tags} selectedIds={selectedTags} onToggle={toggleTag} />
                {selectedTags.length > 0 && (
                    <button onClick={() => setSelectedTags([])} className="btn-filter-clear" style={{ marginTop: "10px" }}>
                        Xóa lọc ({selectedTags.length})
                    </button>
                )}
            </div>
        )}
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #ccc", paddingBottom: "10px", marginBottom: "10px" }}>
                 <h3 style={{ margin: 0 }}>Kho câu hỏi</h3>
                 <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <input 
                        type="checkbox" 
                        id="selectAllB"
                        onChange={() => handleSelectAll(filteredAllQuestions)}
                        checked={filteredAllQuestions.length > 0 && filteredAllQuestions.every(q => selectedQuestionIds.includes(q.id))}
                    />
                    <label htmlFor="selectAllB" style={{ cursor: "pointer", userSelect: "none" }}>Chọn tất cả</label>
                 </div>
            </div>

            <div className="list-container">
              {filteredAllQuestions.map(q => {
                const isInCurrentPool = q.poolId === poolId;
                
                return (
                  <div 
                    key={q.id} 
                    className={`item-card ${isInCurrentPool ? 'card-dimmed' : ''}`}
                    style={{ padding: "10px 15px", marginBottom: "10px", display: "flex", gap: "10px" }}
                  >
                    <input 
                        type="checkbox" 
                        checked={selectedQuestionIds.includes(q.id)}
                        onChange={() => handleSelectQuestion(q.id)}
                        style={{ width: "18px", height: "18px", marginTop: "5px" }}
                    />
                    
                    <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "start" }}>
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
        /* FALLBACK VIEW (When not in a specific pool) */
        <div className="list-container">
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <input 
                        type="checkbox" 
                        id="selectAllMain"
                        onChange={() => handleSelectAll(filteredAllQuestions)}
                        checked={filteredAllQuestions.length > 0 && filteredAllQuestions.every(q => selectedQuestionIds.includes(q.id))}
                        style={{ width: "18px", height: "18px" }}
                    />
                    <label htmlFor="selectAllMain" style={{ fontWeight: "bold", cursor: "pointer" }}>Chọn tất cả trang này</label>
                </div>
          </div>

          {filteredAllQuestions.map(q => (
            <div key={q.id} className="item-card" style={{ display: "flex", gap: "15px" }}>
               <input 
                    type="checkbox" 
                    checked={selectedQuestionIds.includes(q.id)}
                    onChange={() => handleSelectQuestion(q.id)}
                    style={{ width: "18px", height: "18px", marginTop: "5px" }}
                />
              <div style={{ flex: 1 }}>
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
                <small style={{ color: "#666" }}>{TYPE_LABELS[q.type]}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionList;