const AdminHome = () => {
  return (
    <div className="admin-container">
      <h1>Trang Web Kiểm Soát Quản Trị</h1>
      <div style={{ marginTop: '20px' }}>
        <h2>Tính Năng Quản Trị</h2>
        <ul>
          <li>Quản lý câu hỏi: Tạo, chỉnh sửa, và xóa câu hỏi trong các bộ câu hỏi.</li>
          <li>Quản lý bài kiểm tra: Tạo và cấu hình các bài kiểm tra cho người dùng.</li>
          <li>Quản lý người dùng: Xem và quản lý thông tin người dùng hệ thống.</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminHome;