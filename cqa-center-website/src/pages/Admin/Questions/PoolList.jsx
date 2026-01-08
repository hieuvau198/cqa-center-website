import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllPools, addPool } from "../../../firebase/firebaseQuery";

const PoolList = () => {
  const [pools, setPools] = useState([]);
  const [newPoolName, setNewPoolName] = useState("");

  useEffect(() => {
    loadPools();
  }, []);

  const loadPools = async () => {
    const data = await getAllPools();
    setPools(data);
  };

  const handleCreatePool = async () => {
    if (!newPoolName.trim()) return;
    await addPool(newPoolName);
    setNewPoolName("");
    loadPools();
  };

  return (
    <div className="admin-container">
      <div className="page-header">
        <h2>Quản Lý Ngân Hàng Câu Hỏi</h2>
        <Link to="/admin/questions/all">
          <button className="btn btn-secondary">Xem Tất Cả Câu Hỏi</button>
        </Link>
      </div>

      {/* Create Pool Section */}
      <div className="section-box">
        <h4>Tạo Ngân Hàng Mới</h4>
        <div className="form-row">
          <input 
            className="form-input" 
            style={{ flex: 1 }}
            placeholder="Tên ngân hàng (VD: Toán học, Học kỳ 1)" 
            value={newPoolName}
            onChange={(e) => setNewPoolName(e.target.value)}
          />
          <button onClick={handleCreatePool} className="btn btn-primary">Tạo</button>
        </div>
      </div>

      {/* List of Pools */}
      <div className="grid-list">
        {pools.map(pool => (
          <div key={pool.id} className="item-card card-pool">
            <h3>{pool.name}</h3>
            <p>ID: {pool.id}</p>
            <Link to={`/admin/questions/pool/${pool.id}`}>
              <button className="btn btn-primary" style={{ width: "100%", marginTop: "10px" }}>
                Quản Lý Câu Hỏi
              </button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PoolList;