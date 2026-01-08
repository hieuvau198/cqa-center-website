import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { 
  getAllQuestions, 
  getQuestionsByPool, 
  deleteQuestion, 
  getAllPools, 
  getAllTags, 
  updateQuestion 
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
  const [poolQuestions, setPoolQuestions] = useState([]); // View A Data
  const [allQuestions, setAllQuestions] = useState([]);   // View B Data
  const [tags, setTags] = useState([]);                   // For Filter
  const [poolName, setPoolName] = useState("Tất Cả Câu Hỏi");

  // UI / Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);

  // 1. Initial Data Loading
  useEffect(() => {
    const fetchData = async () => {
      // Always load tags and all questions
      const tagsData = await getAllTags();
      setTags(tagsData);

      const allQ = await getAllQuestions();
      setAllQuestions(allQ);

      // If viewing a specific pool, load its details
      if (poolId) {
        const poolQ = await getQuestionsByPool(poolId);
        setPoolQuestions(poolQ);

        const pools = await getAllPools();
        const currentPool = pools.find(p => p.id === poolId);
        if (currentPool) setPoolName(currentPool.name);
      } else {
        // If viewing "All Questions" page, just treat poolQuestions as all
        setPoolQuestions(allQ);
      }
    };
    fetchData();
  }, [poolId]);

  // 2. Logic: Add Question to Pool
  const handleAddToPool = async (question) => {
    if (!poolId) return;
    
    // Update DB
    await updateQuestion(question.id, { poolId: poolId });
    
    // Optimistic UI Update
    const updatedQ = { ...question, poolId: poolId };
    setPoolQuestions([...poolQuestions, updatedQ]);
    
    // Update list B to reflect status change
    setAllQuestions(allQuestions.map(q => q.id === question.id ? updatedQ : q));
  };

  // 3. Logic: Remove Question from Pool
  const handleRemoveFromPool = async (question) => {
    if (!poolId) return;

    // Update DB (set poolId to empty string or null)
    await updateQuestion(question.id, { poolId: "" });
    
    // Optimistic UI Update
    setPoolQuestions(poolQuestions.filter(q => q.id !== question.id));
    setAllQuestions(allQuestions.map(q => q.id === question.id ? { ...q, poolId: "" } : q));
  };

  const handleDelete = async (id) => {
    if(confirm("Bạn có chắc chắn muốn xóa vĩnh viễn câu hỏi này không?")) {
      await deleteQuestion(id);
      setPoolQuestions(poolQuestions.filter(q => q.id !== id));
      setAllQuestions(allQuestions.filter(q => q.id !== id));
    }
  };

  const toggleTag = (tagId) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(t => t !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  // 4. Filter Logic for "View B" (All Questions)
  const filteredAllQuestions = allQuestions.filter(q => {
    const nameMatch = q.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Check if question has ALL selected tags
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
          <h2>{poolName}</h2>
        </div>
        <Link to="/admin/questions/new">
          <button className="btn btn-primary">+ Tạo Câu Hỏi Mới</button>
        </Link>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="section-box" style={{ marginBottom: "20px" }}>
        <div className="form-row" style={{ alignItems: "center", marginBottom: "15px" }}>
          <input 
            className="form-input" 
            placeholder="Tìm kiếm câu hỏi..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>
        
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "0.9rem", fontWeight: "bold" }}>Lọc theo thẻ:</span>
          {tags.map(tag => (
            <button 
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              style={{
                padding: "6px 12px",
                borderRadius: "20px",
                border: "1px solid #aaa",
                background: selectedTags.includes(tag.id) ? "#2c3e50" : "#fff",
                color: selectedTags.includes(tag.id) ? "#fff" : "#333",
                cursor: "pointer",
                fontSize: "0.8rem"
              }}
            >
              {tag.name}
            </button>
          ))}
          {selectedTags.length > 0 && (
            <button onClick={() => setSelectedTags([])} style={{ background: "none", border: "none", textDecoration: "underline", cursor: "pointer", fontSize: "0.8rem" }}>
              Xóa lọc
            </button>
          )}
        </div>
      </div>

      {/* SPLIT VIEW (Only when inside a Pool) */}
      {poolId ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" }}>
          
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
          <div className="section-box" style={{ background: "#fff" }}>
            <h3 style={{ borderBottom: "1px solid #ccc", paddingBottom: "10px", marginTop: 0 }}>
              Chế độ xem B: Kho câu hỏi
            </h3>
            <div className="list-container" style={{ marginTop: "10px" }}>
              {filteredAllQuestions.map(q => {
                const isInCurrentPool = q.poolId === poolId;
                
                return (
                  <div 
                    key={q.id} 
                    className="item-card" 
                    style={{ 
                      padding: "15px", 
                      marginBottom: "10px", 
                      opacity: isInCurrentPool ? 0.6 : 1, // Dim if already added
                      backgroundColor: isInCurrentPool ? "#eee" : "#fff"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <div>
                        <strong>{q.name}</strong>
                        <div style={{ display: "flex", gap: "5px", marginTop: "5px" }}>
                          <span style={{ fontSize: "0.8em", background: "#eee", padding: "2px 6px", borderRadius: "4px" }}>
                            {TYPE_LABELS[q.type]}
                          </span>
                          {q.poolId && q.poolId !== poolId && (
                            <span style={{ fontSize: "0.8em", background: "#fff3cd", padding: "2px 6px", borderRadius: "4px" }}>
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
        /* FALLBACK VIEW (If not in a specific pool, just show list) */
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