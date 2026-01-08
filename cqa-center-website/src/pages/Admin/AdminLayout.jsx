import { Link, Outlet, useNavigate } from "react-router-dom"; // Import useNavigate
import { logoutUser } from "../../firebase/firebaseQuery"; // Import logout

const AdminLayout = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/login");
    } catch (error) {
      alert("Error logging out");
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside style={{ width: "250px", backgroundColor: "#2c3e50", color: "white", padding: "20px", display: "flex", flexDirection: "column" }}>
        <h3>Admin Dashboard</h3>
        <ul style={{ listStyle: "none", padding: 0, flex: 1 }}>
          <li style={{ybMm: "15px 0" }}>
            <Link to="/admin" style={{ color: "white", textDecoration: "none" }}>Home</Link>
          </li>
          <li style={{ margin: "15px 0" }}>
            <Link to="/admin/questions" style={{ color: "white", textDecoration: "none" }}>Pool Management</Link>
          </li>
          <li style={{ybMm: "15px 0" }}>
            <Link to="/admin/tests" style={{ color: "white", textDecoration: "none" }}>Test Management</Link>
          </li>
          <li style={{ margin: "15px 0" }}>
            <Link to="/admin/tags" style={{ color: "white", textDecoration: "none" }}>Tags Management</Link>
          </li>
          <hr style={{ borderColor: "#4b6cb7", margin: "15px 0" }} />
          <li style={{ margin: "15px 0" }}>
            {/* New Profile Link */}
            <Link to="/admin/profile" style={{ color: "#fff", textDecoration: "underline" }}>My Profile</Link>
          </li>
        </ul>

        {/* Logout Button at bottom of sidebar */}
        <button 
          onClick={handleLogout} 
          className="btn btn-danger" 
          style={{ width: "100%", marginTop: "auto" }}
        >
          Logout
        </button>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: "20px", backgroundColor: "#f4f6f8" }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;