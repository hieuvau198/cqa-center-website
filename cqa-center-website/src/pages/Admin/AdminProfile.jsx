import { useState, useEffect } from "react";
import { auth, getUserProfile, updateUserProfile } from "../../firebase/firebaseQuery";

const AdminProfile = () => {
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    phoneNumber: "",
    role: "ADMIN" // Default role, though usually this shouldn't be changeable by user
  });

  useEffect(() => {
    const loadProfile = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        // 1. Try to get data from Firestore
        const profileData = await getUserProfile(currentUser.uid);
        
        if (profileData) {
          // Case A: Data exists in database
          setFormData({
            displayName: profileData.displayName || currentUser.displayName || "",
            email: profileData.email || currentUser.email || "",
            phoneNumber: profileData.phoneNumber || "",
            role: profileData.role || "ADMIN"
          });
        } else {
          // Case B: User logged in (e.g. Google) but NO data in Firestore yet
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
      // This will update existing data OR create the document if it was missing
      await updateUserProfile(auth.currentUser.uid, {
        displayName: formData.displayName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        role: formData.role, // Be careful letting users set their own role in a real app
        uid: auth.currentUser.uid,
        updatedAt: new Date().toISOString()
      });
      alert("Profile updated successfully!");
    } catch (error) {
      alert("Failed to update profile.");
    }
  };

  if (loading) return <div className="admin-container">Loading Profile...</div>;

  return (
    <div className="admin-container">
      <h2>My Profile</h2>
      <p>Update your account details below. If your account data was incomplete, saving here will fix it.</p>
      
      <form onSubmit={handleSubmit} className="form-column" style={{ maxWidth: "500px" }}>
        <div className="form-group">
          <label className="form-label">Email (Read Only)</label>
          <input 
            className="form-input" 
            value={formData.email} 
            disabled 
            style={{ backgroundColor: "#eee" }} 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Display Name</label>
          <input 
            className="form-input" 
            value={formData.displayName} 
            onChange={(e) => setFormData({...formData, displayName: e.target.value})}
            placeholder="Enter your full name"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Phone Number</label>
          <input 
            className="form-input" 
            value={formData.phoneNumber} 
            onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
            placeholder="Enter phone number"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Role</label>
          <input 
            className="form-input" 
            value={formData.role} 
            disabled
            style={{ backgroundColor: "#eee" }} 
          />
          <small>Role cannot be changed self-service.</small>
        </div>

        <button type="submit" className="btn btn-blue">Save Profile</button>
      </form>
    </div>
  );
};

export default AdminProfile;