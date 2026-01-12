import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  getTestById, 
  createPractice, 
  getPracticesByTest, 
  getAttemptsByPractice,
  updatePractice,
  deletePractice // Import delete function
} from "../../../firebase/firebaseQuery";

const PracticeManager = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  
  // Data State
  const [testInfo, setTestInfo] = useState(null);
  const [practices, setPractices] = useState([]);
  const [selectedPractice, setSelectedPractice] = useState(null);
  const [attempts, setAttempts] = useState([]);

  // UI State
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    entryCode: "",
    startTime: "",
    endTime: ""
  });

  // 1. Initial Load
  useEffect(() => {
    const fetchData = async () => {
      try {
        const testData = await getTestById(testId);
        setTestInfo(testData);
        await refreshPractices();
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu", error);
      } finally {
        setLoading(false);
      }
    };
    if (testId) fetchData();
  }, [testId]);

  const refreshPractices = async () => {
    const practiceData = await getPracticesByTest(testId);
    setPractices(practiceData);
  };

  // 2. Load Attempts
  useEffect(() => {
    const fetchAttempts = async () => {
      if (selectedPractice) {
        const data = await getAttemptsByPractice(selectedPractice.id);
        setAttempts(data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
      }
    };
    fetchAttempts();
  }, [selectedPractice]);

  // Handle Create or Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.entryCode || !formData.startTime || !formData.endTime) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      if (isEditing && editingId) {
        // UPDATE Existing Practice
        await updatePractice(editingId, {
            entryCode: formData.entryCode,
            startTime: formData.startTime,
            endTime: formData.endTime
        });
        alert("Cập nhật thành công!");
      } else {
        // CREATE New Practice
        const practicePayload = {
            testId,
            testName: testInfo.name,
            entryCode: formData.entryCode,
            startTime: formData.startTime,
            endTime: formData.endTime,
            isActive: true
        };
        await createPractice(practicePayload);
        alert("Đã tạo phiên luyện tập thành công!");
      }

      await refreshPractices();
      resetForm();
    } catch (error) {
      alert("Lỗi khi lưu dữ liệu");
      console.error(error);
    }
  };

  const startEdit = (practice, e) => {
    e.stopPropagation(); // Prevent selecting the card
    setFormData({
        entryCode: practice.entryCode,
        startTime: practice.startTime,
        endTime: practice.endTime
    });
    setEditingId(practice.id);
    setIsEditing(true);
    setShowForm(true);
    window.scrollTo(0, 0);
  };

  // NEW: Delete Handler
  const handleDelete = async (practiceId, e) => {
    e.stopPropagation(); // Prevent selecting the card
    if (window.confirm("Bạn có chắc chắn muốn xóa phiên luyện tập này? Hành động này sẽ xóa cả các lượt làm bài của học viên.")) {
        try {
            await deletePractice(practiceId);
            if (selectedPractice?.id === practiceId) {
                setSelectedPractice(null);
            }
            await refreshPractices();
            alert("Đã xóa phiên luyện tập và các lượt thi liên quan.");
        } catch (error) {
            console.error("Lỗi xóa phiên:", error);
            alert("Đã xảy ra lỗi khi xóa.");
        }
    }
  };

  // Helper to get local time string for input
  const getLocalDateTime = (date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  // NEW: Handle creating new with default time
  const handleCreateNew = () => {
    if (showForm) {
        resetForm();
    } else {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Add 24 hours
        
        setFormData({
            entryCode: "",
            startTime: getLocalDateTime(now),
            endTime: getLocalDateTime(tomorrow)
        });
        setShowForm(true);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setIsEditing(false);
    setEditingId(null);
    setFormData({ entryCode: "", startTime: "", endTime: "" });
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
        <button className="btn btn-primary" onClick={handleCreateNew}>
          {showForm ? "Hủy Bỏ" : "+ Tạo Phiên Luyện Tập"}
        </button>
      </div>

      {/* FORM (Create & Edit) */}
      {showForm && (
        <div className="section-box" style={{ background: "#f0f4f8" }}>
          <h4 className="section-title">{isEditing ? "Cập Nhật Phiên Luyện Tập" : "Thiết Lập Phiên Mới"}</h4>
          <form onSubmit={handleSubmit} className="form-inline-creation">
            <div className="form-group">
              <label className="form-label">Mã Tham Gia (Code)</label>
              <input 
                className="form-input" 
                placeholder="VD: MATH-101-A" 
                value={formData.entryCode}
                onChange={e => setFormData({...formData, entryCode: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Thời Gian Bắt Đầu</label>
              <input 
                className="form-input" 
                type="datetime-local"
                value={formData.startTime}
                onChange={e => setFormData({...formData, startTime: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Thời Gian Kết Thúc</label>
              <input 
                className="form-input" 
                type="datetime-local"
                value={formData.endTime}
                onChange={e => setFormData({...formData, endTime: e.target.value})}
              />
            </div>
            <button type="submit" className="btn btn-blue" style={{ height: "46px" }}>
                {isEditing ? "Lưu Thay Đổi" : "Tạo Mới"}
            </button>
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
                style={{ position: 'relative' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ margin: "0 0 10px 0" }}>Mã: {p.entryCode}</h4>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <button 
                            onClick={(e) => startEdit(p, e)}
                            className="btn btn-sm"
                            style={{ fontSize: '0.8rem', padding: '2px 8px' }}
                        >
                            Sửa
                        </button>
                        <button 
                            onClick={(e) => handleDelete(p.id, e)}
                            className="btn btn-sm btn-danger"
                            style={{ fontSize: '0.8rem', padding: '2px 8px', background: '#dc3545', color: 'white', border: 'none' }}
                        >
                            Xóa
                        </button>
                    </div>
                </div>
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