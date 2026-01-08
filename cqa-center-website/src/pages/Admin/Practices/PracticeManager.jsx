import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  getTestById, 
  createPractice, 
  getPracticesByTest, 
  getAttemptsByPractice 
} from "../../../firebase/firebaseQuery";

const PracticeManager = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  
  // Data State
  const [testInfo, setTestInfo] = useState(null);
  const [practices, setPractices] = useState([]);
  const [selectedPractice, setSelectedPractice] = useState(null); // The practice currently being viewed
  const [attempts, setAttempts] = useState([]); // Attempts for the selected practice

  // UI State
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form State
  const [newPractice, setNewPractice] = useState({
    entryCode: "",
    startTime: "",
    endTime: ""
  });

  // 1. Initial Load: Fetch Test Info & Existing Practices
  useEffect(() => {
    const fetchData = async () => {
      try {
        const testData = await getTestById(testId);
        setTestInfo(testData);

        const practiceData = await getPracticesByTest(testId);
        setPractices(practiceData);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu", error);
      } finally {
        setLoading(false);
      }
    };
    if (testId) fetchData();
  }, [testId]);

  // 2. Load Attempts when a specific Practice is selected
  useEffect(() => {
    const fetchAttempts = async () => {
      if (selectedPractice) {
        const data = await getAttemptsByPractice(selectedPractice.id);
        setAttempts(data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
      }
    };
    fetchAttempts();
  }, [selectedPractice]);

  // Handle Create Practice
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newPractice.entryCode || !newPractice.startTime || !newPractice.endTime) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      const practicePayload = {
        testId,
        testName: testInfo.name,
        entryCode: newPractice.entryCode,
        startTime: newPractice.startTime,
        endTime: newPractice.endTime,
        isActive: true
      };

      await createPractice(practicePayload);
      
      // Refresh list
      const updatedPractices = await getPracticesByTest(testId);
      setPractices(updatedPractices);
      setShowCreateForm(false);
      setNewPractice({ entryCode: "", startTime: "", endTime: "" });
      alert("Đã tạo phiên luyện tập thành công!");
    } catch (error) {
      alert("Lỗi khi tạo phiên luyện tập");
    }
  };

  if (loading) return <div className="admin-container">Đang tải...</div>;
  if (!testInfo) return <div className="admin-container">Không tìm thấy bài kiểm tra.</div>;

  return (
    <div className="admin-container">
      <div className="page-header">
        <div>
          <button onClick={() => navigate("/admin/tests")} className="btn" style={{ marginBottom: "10px" }}>
            ← Quay lại Bài Kiểm Tra
          </button>
          <h2>Quản Lý Luyện Tập: <span className="text-highlight">{testInfo.name}</span></h2>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? "Hủy Bỏ" : "+ Tạo Phiên Luyện Tập"}
        </button>
      </div>

      {/* CREATE PRACTICE FORM */}
      {showCreateForm && (
        <div className="section-box" style={{ background: "#f0f4f8" }}>
          <h4 className="section-title">Thiết Lập Phiên Mới</h4>
          <form onSubmit={handleCreate} className="form-inline-creation">
            <div className="form-group">
              <label className="form-label">Mã Tham Gia (Code)</label>
              <input 
                className="form-input" 
                placeholder="VD: MATH-101-A" 
                value={newPractice.entryCode}
                onChange={e => setNewPractice({...newPractice, entryCode: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Thời Gian Bắt Đầu</label>
              <input 
                className="form-input" 
                type="datetime-local"
                value={newPractice.startTime}
                onChange={e => setNewPractice({...newPractice, startTime: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Thời Gian Kết Thúc</label>
              <input 
                className="form-input" 
                type="datetime-local"
                value={newPractice.endTime}
                onChange={e => setNewPractice({...newPractice, endTime: e.target.value})}
              />
            </div>
            <button type="submit" className="btn btn-blue" style={{ height: "46px" }}>Lưu</button>
          </form>
        </div>
      )}

      {/* PRACTICE LIST */}
      <div className="list-container">
        <h3>Các Phiên Đang Mở</h3>
        {practices.length === 0 ? <p>Chưa có phiên luyện tập nào được tạo.</p> : (
          <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", marginBottom: "30px" }}>
            {practices.map(p => (
              <div 
                key={p.id} 
                onClick={() => setSelectedPractice(p)}
                className={`card-selectable ${selectedPractice?.id === p.id ? 'active' : ''}`}
              >
                <h4 style={{ margin: "0 0 10px 0" }}>Mã: {p.entryCode}</h4>
                <p className="card-info-row"><strong>Bắt đầu:</strong> {new Date(p.startTime).toLocaleString('vi-VN')}</p>
                <p className="card-info-row"><strong>Kết thúc:</strong> {new Date(p.endTime).toLocaleString('vi-VN')}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SELECTED PRACTICE ATTEMPTS */}
      {selectedPractice && (
        <div className="section-box" style={{ borderTop: "4px solid #007bff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3>Kết Quả: {selectedPractice.entryCode}</h3>
            <span style={{ fontSize: "1.1rem" }}>Tổng lượt thi: <strong>{attempts.length}</strong></span>
          </div>

          <table className="table-responsive">
            <thead>
              <tr>
                <th>Email Học Viên</th>
                <th>Điểm Số</th>
                <th>Thời Gian Nộp Bài</th>
              </tr>
            </thead>
            <tbody>
              {attempts.length === 0 ? (
                <tr><td colSpan="3" style={{ textAlign: "center", padding: "30px" }}>Chưa có học viên nào làm bài.</td></tr>
              ) : (
                attempts.map(att => (
                  <tr key={att.id}>
                    <td>{att.userEmail || "Không xác định"}</td>
                    <td><b style={{ fontSize: "1.1em" }}>{att.score}</b> / {att.maxScore}</td>
                    <td>{new Date(att.timestamp).toLocaleString('vi-VN')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PracticeManager;