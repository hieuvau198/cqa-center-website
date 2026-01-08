import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import './App.css'
import './index.css' // Ensure global styles are loaded

// Pages
import Login from "./pages/Auth/Login";
import AdminHome from "./pages/Admin/AdminHome";
import AdminLayout from "./pages/Admin/AdminLayout";
import QuestionList from "./pages/Admin/Questions/QuestionList";
import QuestionForm from "./pages/Admin/Questions/QuestionForm";
import TagList from "./pages/Admin/Tags/TagList";
import TestList from "./pages/Admin/Tests/TestList";
import TestForm from "./pages/Admin/Tests/TestForm";
import PracticeManager from "./pages/Admin/Practices/PracticeManager"; // <--- Import New Page

// Placeholders for other roles (based on your structure)
const StudentHome = () => <div>Student Dashboard (Coming Soon)</div>;
const TeacherHome = () => <div>Teacher Dashboard (Coming Soon)</div>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminHome />} />
          
          {/* Question Management */}
          <Route path="questions" element={<QuestionList />} />
          <Route path="questions/new" element={<QuestionForm />} />
          
          {/* Tag Management */}
          <Route path="tags" element={<TagList />} />
          
          {/* Test Management */}
          <Route path="tests" element={<TestList />} />
          <Route path="tests/new" element={<TestForm />} />
          
          {/* Practice Management (New) */}
          <Route path="practices/:testId" element={<PracticeManager />} />
        </Route>

        {/* Other Role Routes */}
        <Route path="/student" element={<StudentHome />} />
        <Route path="/teacher" element={<TeacherHome />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;