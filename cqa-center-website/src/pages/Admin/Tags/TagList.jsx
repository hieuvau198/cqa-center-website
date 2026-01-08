// src/pages/Admin/Tags/TagList.jsx
import { useEffect, useState } from "react";
import { db } from "../../../firebase-config";
import { collection, getDocs, deleteDoc, doc, addDoc } from "firebase/firestore";

const TagList = () => {
  const [tags, setTags] = useState([]);
  const [newTagName, setNewTagName] = useState("");

  const fetchTags = async () => {
    const querySnapshot = await getDocs(collection(db, "tags"));
    setTags(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleAddTag = async (e) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    
    await addDoc(collection(db, "tags"), { 
      name: newTagName.trim() 
    });
    
    setNewTagName("");
    fetchTags(); // Refresh list
  };

  const handleDelete = async (id) => {
    if(confirm("Delete this tag? Questions using it will lose the reference.")) {
      await deleteDoc(doc(db, "tags", id));
      setTags(tags.filter(t => t.id !== id));
    }
  };

  return (
    <div style={{ background: "white", padding: "20px" }}>
      <h2>Tags Management</h2>
      
      {/* Add Tag Form */}
      <form onSubmit={handleAddTag} style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <input 
          value={newTagName} 
          onChange={(e) => setNewTagName(e.target.value)} 
          placeholder="New Tag Name" 
          required 
          style={{ padding: "8px" }}
        />
        <button type="submit" style={{ background: "green", color: "white" }}>+ Add Tag</button>
      </form>

      {/* Tags List */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        {tags.map(tag => (
          <div key={tag.id} style={{ border: "1px solid #ddd", padding: "5px 10px", borderRadius: "15px", display: "flex", alignItems: "center", gap: "10px", background: "#f8f9fa" }}>
            <span>{tag.name}</span>
            <button 
              onClick={() => handleDelete(tag.id)} 
              style={{ background: "none", border: "none", color: "red", cursor: "pointer", padding: 0, fontSize: "12px" }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TagList;