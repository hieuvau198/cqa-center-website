import { Link, Outlet, useNavigate } from "react-router-dom";
import { logoutUser } from "../../../firebase/firebaseQuery";

const AdminLayout = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/login");
    } catch (error) {
      alert("Lỗi khi đăng xuất");
    }
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <h3>Bảng Quản Trị</h3>
        <ul className="sidebar-nav">
          <li>
            <Link to="/admin" className="sidebar-link">Tổng quan</Link>
          </li>
          <li>
            <Link to="/admin/questions" className="sidebar-link">Ngân Hàng Câu Hỏi</Link>
          </li>
          <li>
            <Link to="/admin/tests" className="sidebar-link">Bài Kiểm Tra</Link>
          </li>
          <li>
            <Link to="/admin/tags" className="sidebar-link">Tag</Link>
          </li>
          <li>
            <Link to="/admin/profile" className="sidebar-link">Hồ Sơ Cá Nhân</Link>
          </li>
        </ul>

        <button 
          onClick={handleLogout} 
          className="btn btn-danger" 
          style={{ width: "100%", marginTop: "auto" }}
        >
          Đăng Xuất
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;