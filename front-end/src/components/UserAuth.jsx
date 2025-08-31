import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style.css";

const UserAuth = () => {
  const [mode, setMode] = useState("login");
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch("http://localhost/chatapp/login.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(formData),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log("Login response:", data);
      
      if (data.success) {
        localStorage.setItem('user', data.user);
        navigate("/chat");
      } else {
        alert(data.message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Something went wrong while connecting to server!");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch("http://localhost/chatapp/signup.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(formData),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log("Signup response:", data);
      
      if (data.success) {
        alert("Signup successful! Please login.");
        setMode("login");
        setFormData({ username: "", password: "" });
      } else {
        alert(data.message || "Signup failed");
      }
    } catch (err) {
      console.error("Signup error:", err);
      alert("Something went wrong while signing up!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login_container">
      <div className="login_title">
        <h1>Chat Application</h1>
      </div>
      
      <div className="auth_toggle">
        <button 
          className={`auth_btn ${mode === "login" ? "active" : ""}`}
          onClick={() => {
            setMode("login");
            setFormData({ username: "", password: "" });
          }}
        >
          Login
        </button>
        <button 
          className={`auth_btn ${mode === "signup" ? "active" : ""}`}
          onClick={() => {
            setMode("signup");
            setFormData({ username: "", password: "" });
          }}
        >
          Sign Up
        </button>
      </div>
      
      <form className="login_form" onSubmit={mode === "login" ? handleLogin : handleSignup}>
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          required
        />
        
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        
        <button type="submit" disabled={loading}>
          {loading ? "Processing..." : (mode === "login" ? "Login" : "Sign Up")}
        </button>
      </form>
    </div>
  );
};

export default UserAuth;
