import { Link, Outlet } from "react-router-dom";

const AdminLayout = () => {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside style={{ width: "250px", backgroundColor: "#2c3e50", color: "white", padding: "20px" }}>
        <h3>Admin Dashboard</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          <li style={{ margin: "15px 0" }}>
            <Link to="/admin/questions" style={{ color: "white", textDecoration: "none" }}>Pool Management (Questions)</Link>
          </li>
          <li style={{ margin: "15px 0" }}>
            <Link to="/admin/tests" style={{ color: "white", textDecoration: "none" }}>Test Material Management</Link>
          </li>
          <li style={{ margin: "15px 0" }}>
            <Link to="/admin/tags" style={{ color: "white", textDecoration: "none" }}>Tags Management</Link>
          </li>
        </ul>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: "20px", backgroundColor: "#f4f6f8" }}>
        <Outlet /> {/* This renders the child route components */}
      </main>
    </div>
  );
};

export default AdminLayout;