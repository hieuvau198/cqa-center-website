import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllUsers, deleteUser } from "../../../firebase/firebaseQuery";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tài khoản này?")) {
      await deleteUser(id);
      loadUsers();
    }
  };

  if (loading) return <div>Đang tải...</div>;

  return (
    <div className="container">
      <div className="header-flex">
        <h2>Quản Lý Tài Khoản</h2>
        <Link to="/admin/users/new" className="btn btn-blue">Thêm Tài Khoản</Link>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Tên hiển thị</th>
            <th>Tên đăng nhập / Email</th>
            <th>Vai trò</th>
            <th>Mật khẩu</th> {/* Explicitly requested */}
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.displayName || "Chưa đặt tên"}</td>
              <td>{user.username || user.email}</td>
              <td>
                <span className={`badge ${user.role === 'ADMIN' ? 'badge-red' : user.role === 'TEACHER' ? 'badge-yellow' : 'badge-green'}`}>
                  {user.role}
                </span>
              </td>
              <td style={{ fontFamily: 'monospace' }}>{user.password || '******'}</td>
              <td>
                <div className="action-buttons">
                  <Link to={`/admin/users/edit/${user.id}`} className="btn-icon edit">✏️</Link>
                  <button onClick={() => handleDelete(user.id)} className="btn-icon delete">🗑️</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserList;