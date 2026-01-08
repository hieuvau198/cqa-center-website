import { useState } from "react";
import { auth, googleProvider } from "../../firebase-config";
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false); // Toggle between Login and Signup
  const navigate = useNavigate();

  // Handle Google Login
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/student"); // Default redirect after login
    } catch (error) {
      console.error("Google Login Error:", error);
      alert(error.message);
    }
  };

  // Handle Email/Password
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        alert("Account created! Logging you in...");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/student"); // Default redirect
    } catch (error) {
      console.error("Auth Error:", error);
      alert(error.message);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}>
      <h2>{isSignUp ? "Create Account" : "Sign In"}</h2>
      
      <form onSubmit={handleEmailAuth} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          style={{ padding: "8px" }}
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
          style={{ padding: "8px" }}
        />
        <button type="submit" style={{ padding: "10px", backgroundColor: "#007bff", color: "white", border: "none" }}>
          {isSignUp ? "Sign Up" : "Login"}
        </button>
      </form>

      <hr />

      <button onClick={handleGoogleLogin} style={{ width: "100%", padding: "10px", backgroundColor: "#db4437", color: "white", border: "none" }}>
        Sign in with Google
      </button>

      <p style={{ marginTop: "15px", textAlign: "center" }}>
        {isSignUp ? "Already have an account? " : "No account yet? "}
        <span 
          onClick={() => setIsSignUp(!isSignUp)} 
          style={{ color: "blue", cursor: "pointer", textDecoration: "underline" }}
        >
          {isSignUp ? "Login here" : "Sign up here"}
        </span>
      </p>
    </div>
  );
};

export default Login;