import { useState, useEffect } from "react";
import { auth, getUserProfile, updateUserProfile } from "../../../firebase/firebaseQuery";

const AdminProfile = () => {
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    phoneNumber: "",
    role: "ADMIN"
  });

  useEffect(() => {
    const loadProfile = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const profileData = await getUserProfile(currentUser.uid);
        
        if (profileData) {
          setFormData({
            displayName: profileData.displayName || currentUser.displayName || "",
            email: profileData.email || currentUser.email || "",
            phoneNumber: profileData.phoneNumber || "",
            role: profileData.role || "ADMIN"
          });
        } else {
          setFormData({
            displayName: currentUser.displayName || "",
            email: currentUser.email || "",
            phoneNumber: "",
            role: "ADMIN"
          });
        }
      }
      setLoading(false);
    };
    loadProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!auth.currentUser) return;

    try {
      await updateUserProfile(auth.currentUser.uid, {
        displayName: formData.displayName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        role: formData.role,
        uid: auth.currentUser.uid,
        updatedAt: new Date().toISOString()
      });
      alert("Đã cập nhật hồ sơ thành công!");
    } catch (error) {
      alert("Lỗi khi cập nhật hồ sơ.");
    }
  };

  if (loading) return <div className="admin-container">Đang tải hồ sơ...</div>;

  return (
    <div className="admin-container">
      <h2>Hồ Sơ Của Tôi</h2>
      <p style={{ marginBottom: "20px" }}>Cập nhật thông tin cá nhân. Nếu dữ liệu tài khoản chưa đầy đủ, việc lưu lại sẽ khắc phục điều đó.</p>
      
      <form onSubmit={handleSubmit} className="form-column" style={{ maxWidth: "500px" }}>
        <div className="form-group">
          <label className="form-label">Email (Chỉ đọc)</label>
          <input 
            className="form-input" 
            value={formData.email} 
            disabled 
            style={{ backgroundColor: "#eee" }} 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Tên Hiển Thị</label>
          <input 
            className="form-input" 
            value={formData.displayName} 
            onChange={(e) => setFormData({...formData, displayName: e.target.value})}
            placeholder="Nhập họ và tên"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Số Điện Thoại</label>
          <input 
            className="form-input" 
            value={formData.phoneNumber} 
            onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
            placeholder="Nhập số điện thoại"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Vai Trò</label>
          <input 
            className="form-input" 
            value={formData.role} 
            disabled
            style={{ backgroundColor: "#eee" }} 
          />
          <small style={{ color: "#666" }}>Bạn không thể tự thay đổi vai trò quản trị viên.</small>
        </div>

        <button type="submit" className="btn btn-blue">Lưu Thay Đổi</button>
      </form>
    </div>
  );
};

export default AdminProfile;