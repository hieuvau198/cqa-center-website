import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import StudentHome from './pages/Student/StudentHome';
import TeacherHome from './pages/Teacher/TeacherHome';
import StaffHome from './pages/Staff/StaffHome';
import AdminHome from './pages/Admin/AdminHome';
import Login from './pages/Auth/Login';
import AdminLayout from './pages/Admin/AdminLayout';
import TestForm from './pages/Admin/Tests/TestForm';
import QuestionForm from './pages/Admin/Questions/QuestionForm';
import QuestionList from './pages/Admin/Questions/QuestionList';

function App() {
  return (
    <BrowserRouter>
      <nav style={{ padding: '10px', borderBottom: '1px solid #ccc', display: "flex", gap: "15px" }}>
        <Link to="/login"><strong>Login</strong></Link>
        <Link to="/student">Student</Link>
        <Link to="/teacher">Teacher</Link>
        <Link to="/staff">Staff</Link>
        <Link to="/admin">Admin</Link>
      </nav>

      <Routes>
        <Route path="/" element={<div style={{padding: '20px'}}><h2>Welcome. Please <Link to="/login">Login</Link></h2></div>} />
        <Route path="/login" element={<Login />} /> {/* Task 4: Auth Route */}
        
        <Route path="/student/*" element={<StudentHome />} />
        <Route path="/teacher/*" element={<TeacherHome />} />
        <Route path="/staff/*" element={<StaffHome />} />
        <Route path="/admin/*" element={<AdminHome />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;