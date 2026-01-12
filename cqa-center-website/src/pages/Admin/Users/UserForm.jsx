import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createSystemUser, getUserById, updateUser } from "../../../firebase/firebaseQuery";

const UserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    role: "STUDENT"
  });

  useEffect(() => {
    if (isEdit) {
      fetchUser();
    }
  }, [id]);

  const fetchUser = async () => {
    const data = await getUserById(id);
    if (data) {
      setFormData({
        username: data.username || data.email?.split('@')[0] || "",
        password: data.password || "",
        name: data.displayName || "",
        role: data.role || "STUDENT"
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        // Warning: Updating password here only updates Firestore, not Auth credentials for existing users
        await updateUser(id, {
          displayName: formData.name,
          role: formData.role,
          username: formData.username,
          password: formData.password 
        });
        alert("Cập nhật thông tin thành công!");
      } else {
        await createSystemUser({
          username: formData.username,
          password: formData.password,
          name: formData.name,
          role: formData.role
        });
        alert("Tạo tài khoản thành công!");
      }
      navigate("/admin/users");
    } catch (error) {
      alert("Lỗi: " + error.message);
    }
  };

  return (
    <div className="form-container">
      <h2>{isEdit ? "Chỉnh Sửa Tài Khoản" : "Tạo Tài Khoản Mới"}</h2>
      <form onSubmit={handleSubmit}>
        
        <div className="form-group">
          <label>Tên hiển thị</label>
          <input
            type="text"
            className="form-input"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Tên đăng nhập (hoặc Email)</label>
          <input
            type="text"
            className="form-input"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            placeholder="ví dụ: nguyenvanan"
            required
            disabled={isEdit} // Often safer to disable username edits to avoid auth mismatch
          />
          {!isEdit && <small style={{color: '#666'}}>Nếu không nhập @, hệ thống sẽ tự tạo email hệ thống.</small>}
        </div>

        <div className="form-group">
          <label>Mật khẩu</label>
          <input
            type="text" // Using text to make it visible as requested
            className="form-input"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          {isEdit && <small style={{color: 'red'}}>Lưu ý: Đổi mật khẩu ở đây chỉ lưu lại ghi chú. Mật khẩu đăng nhập thực tế không đổi.</small>}
        </div>

        <div className="form-group">
          <label>Vai trò</label>
          <select
            className="form-select"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          >
            <option value="STUDENT">Học sinh (Student)</option>
            <option value="TEACHER">Giáo viên (Teacher)</option>
            <option value="ADMIN">Quản trị viên (Admin)</option>
          </select>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-blue">Lưu</button>
          <button type="button" className="btn btn-gray" onClick={() => navigate("/admin/users")}>Hủy</button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;