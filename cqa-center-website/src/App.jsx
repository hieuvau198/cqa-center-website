// src/App.jsx
import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import './App.css'
import './index.css' 

// Pages
import Login from "./pages/Auth/Login";
import AdminHome from "./pages/Admin/Home/AdminHome";
import AdminLayout from "./pages/Admin/Layout/AdminLayout";
import QuestionList from "./pages/Admin/Questions/QuestionList";
import QuestionForm from "./pages/Admin/Questions/QuestionForm";
import TagList from "./pages/Admin/Tags/TagList";
import TestList from "./pages/Admin/Tests/TestList";
import TestForm from "./pages/Admin/Tests/TestForm";
import PracticeManager from "./pages/Admin/Practices/PracticeManager";
import AdminProfile from "./pages/Admin/Profile/AdminProfile";   
import PoolList from "./pages/Admin/Questions/PoolList";
import ImportQuestions from "./pages/Admin/Questions/ImportQuestions";
import UserList from './pages/Admin/Users/UserList';
import UserForm from './pages/Admin/Users/UserForm';

// Student Pages
import StudentHome from "./pages/Student/StudentHome";
import PracticeAttempt from "./pages/Student/Practice/PracticeAttempt"; // <--- Import New Component

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
          <Route path="questions" element={<PoolList />} /> 
          <Route path="questions/all" element={<QuestionList />} /> 
          <Route path="questions/pool/:poolId" element={<QuestionList />} /> 
          <Route path="questions/new" element={<QuestionForm />} />
          <Route path="questions/edit/:id" element={<QuestionForm />} /> 
          <Route path="questions/import" element={<ImportQuestions />} />
          <Route path="tags" element={<TagList />} />
          <Route path="tests" element={<TestList />} />
          <Route path="tests/new" element={<TestForm />} />
          <Route path="tests/edit/:id" element={<TestForm />} /> 
          <Route path="practices/:testId" element={<PracticeManager />} />
          <Route path="users" element={<UserList />} />
          <Route path="users/new" element={<UserForm />} />
          <Route path="users/edit/:id" element={<UserForm />} />
          <Route path="profile" element={<AdminProfile />} />
        </Route>

        {/* Student Routes */}
        <Route path="/student" element={<StudentHome />} />
        <Route path="/student/attempt/:practiceId" element={<PracticeAttempt />} /> {/* <--- New Route */}

        <Route path="/teacher" element={<TeacherHome />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;