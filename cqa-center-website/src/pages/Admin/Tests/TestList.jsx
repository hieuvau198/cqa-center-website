import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAllTests, deleteTest } from "../../../firebase/firebaseQuery";

const TestList = () => {
  const [tests, setTests] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTests = async () => {
      const data = await getAllTests();
      setTests(data);
    };
    fetchTests();
  }, []);

  const handleDelete = async (id) => {
    if(confirm("Bạn có chắc chắn muốn xóa bài kiểm tra này không?")) {
      await deleteTest(id);
      setTests(tests.filter(t => t.id !== id));
    }
  };

  return (
    <div className="admin-container">
      <div className="page-header">
        <h2>Quản Lý Bài Kiểm Tra</h2>
        <Link to="/admin/tests/new">
          <button className="btn btn-primary">+ Tạo Bài Kiểm Tra Mới</button>
        </Link>
      </div>
      
      <div className="list-container">
        {tests.map(t => (
          <div key={t.id} className="item-card">
            <div className="item-header">
              <h4>{t.name} <small>(Điểm tối đa: {t.maxScore})</small></h4>
              <div className="form-row" style={{ gap: '10px' }}>
                <button 
                  onClick={() => navigate(`/admin/practices/${t.id}`)} 
                  className="btn btn-blue" 
                >
                  Quản Lý Lượt Thi
                </button>
                <button 
                  onClick={() => navigate(`/admin/tests/edit/${t.id}`)} 
                  className="btn" 
                >
                  Sửa
                </button>
                <button onClick={() => handleDelete(t.id)} className="btn-text-delete">Xóa</button>
              </div>
            </div>
            <p>{t.description}</p>
            <p><strong>Thời gian làm bài:</strong> {t.timeLimit} phút</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestList;