import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginWithGoogle, loginWithEmail, registerWithEmail, getUserProfile } from "../../firebase/firebaseQuery";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState("STUDENT"); // Default role
  const navigate = useNavigate();

  const handleRedirect = async (user) => {
    // Fetch user profile to know where to redirect
    const profile = await getUserProfile(user.uid);
    if (profile?.role === "ADMIN") navigate("/admin");
    else if (profile?.role === "TEACHER") navigate("/teacher");
    else navigate("/student");
  };

  const handleGoogleLogin = async () => {
    try {
      const user = await loginWithGoogle();
      await handleRedirect(user);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        const user = await registerWithEmail(email, password, role);
        alert("Account created successfully!");
        await handleRedirect(user);
      } else {
        const result = await loginWithEmail(email, password);
        await handleRedirect(result.user);
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="auth-container">
      <h2 style={{ textAlign: "center" }}>{isSignUp ? "Create Account" : "Sign In"}</h2>
      
      <form onSubmit={handleEmailAuth} className="form-column">
        <input 
          className="form-input" 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        />
        <input 
          className="form-input" 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />
        
        {/* Role Selection only visible during Sign Up */}
        {isSignUp && (
          <div className="form-group">
            <label className="form-label">I am a:</label>
            <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="STUDENT">Student</option>
              <option value="TEACHER">Teacher</option>
              {/* Admin usually created manually in DB, but added here for testing */}
              <option value="ADMIN">Admin</option> 
            </select>
          </div>
        )}

        <button type="submit" className="btn btn-blue">
          {isSignUp ? "Sign Up" : "Login"}
        </button>
      </form>

      <hr style={{ margin: "20px 0" }} />

      <button onClick={handleGoogleLogin} className="btn btn-google">
        Sign in with Google
      </button>

      <p className="auth-switch">
        {isSignUp ? "Already have an account? " : "No account yet? "}
        <span onClick={() => setIsSignUp(!isSignUp)} className="link-text">
          {isSignUp ? "Login here" : "Sign up here"}
        </span>
      </p>
    </div>
  );
};

export default Login;