// src/pages/Admin/Tags/TagList.jsx
import { useEffect, useState } from "react";
import { getAllTags, addTag, deleteTag, updateTag } from "../../../firebase/firebaseQuery";

const TagList = () => {
  const [tags, setTags] = useState([]);
  const [rootTagName, setRootTagName] = useState("");

  const fetchTags = async () => {
    const data = await getAllTags();
    setTags(data);
  };

  useEffect(() => { fetchTags(); }, []);

  // Add a top-level tag
  const handleAddRootTag = async (e) => {
    e.preventDefault();
    if (!rootTagName.trim()) return;
    await addTag(rootTagName.trim(), null);
    setRootTagName("");
    fetchTags(); 
  };

  // Helper: Find all descendant IDs for recursive deletion
  const getDescendantIds = (tagId, allTags) => {
    let ids = [tagId];
    const children = allTags.filter(t => t.parentId === tagId);
    children.forEach(child => {
      ids = [...ids, ...getDescendantIds(child.id, allTags)];
    });
    return ids;
  };

  const handleDelete = async (tagId) => {
    if(!confirm("Xóa thẻ này? Tất cả các thẻ con cũng sẽ bị xóa.")) return;

    const idsToDelete = getDescendantIds(tagId, tags);
    
    // Delete all found IDs concurrently
    await Promise.all(idsToDelete.map(id => deleteTag(id)));
    
    // Optimistically update UI
    setTags(prev => prev.filter(t => !idsToDelete.includes(t.id)));
  };

  const handleUpdate = async (id, newName) => {
    await updateTag(id, newName);
    fetchTags();
  };

  const handleAddChild = async (parentId, childName) => {
    await addTag(childName, parentId);
    fetchTags();
  };

  // Filter for Root Tags (parentId is null or undefined)
  const rootTags = tags.filter(t => !t.parentId);

  return (
    <div className="admin-container">
      <h2 style={{ marginBottom: "20px", borderBottom: "1px solid #ddd", paddingBottom: "10px" }}>Quản Lý Thẻ (Tags)</h2>
      
      {/* Add Root Tag Form */}
      <div style={{ background: "#f8f9fa", padding: "15px", border: "1px solid #ddd", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
        <strong style={{ whiteSpace: 'nowrap', color: '#333' }}>+ Tạo Thẻ Gốc:</strong>
        <input 
          value={rootTagName} 
          onChange={(e) => setRootTagName(e.target.value)} 
          placeholder="Ví dụ: Toán Học, Tiếng Anh..." 
          style={{ flex: 1, padding: "8px", border: "1px solid #ccc" }}
        />
        <button 
          onClick={handleAddRootTag}
          disabled={!rootTagName.trim()}
          style={{ 
            padding: "8px 20px", 
            backgroundColor: "#2c3e50", 
            color: "white", 
            border: "none", 
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          Thêm
        </button>
      </div>

      <div style={{ marginTop: "20px" }}>
        {rootTags.length === 0 && <p style={{ color: '#888', fontStyle: 'italic' }}>Chưa có thẻ nào.</p>}
        {rootTags.map(tag => (
          <TagNode 
            key={tag.id} 
            tag={tag} 
            allTags={tags} 
            onDelete={handleDelete}
            onUpdate={handleUpdate}
            onAddChild={handleAddChild}
          />
        ))}
      </div>
    </div>
  );
};

// Recursive Component to Render Tree
const TagNode = ({ tag, allTags, onDelete, onUpdate, onAddChild }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(tag.name);
  
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [newChildName, setNewChildName] = useState("");
  
  const [isExpanded, setIsExpanded] = useState(true);

  // Find children of this tag
  const children = allTags.filter(t => t.parentId === tag.id);

  const saveEdit = () => {
    if (editName.trim() && editName !== tag.name) {
      onUpdate(tag.id, editName.trim());
    }
    setIsEditing(false);
  };

  const saveChild = () => {
    if (newChildName.trim()) {
      onAddChild(tag.id, newChildName.trim());
      setNewChildName("");
      setIsAddingChild(false);
      setIsExpanded(true); // Auto expand to show new child
    }
  };

  // Explicit styles to ensure visibility and contrast
  const nodeContainerStyle = {
    display: "flex", 
    alignItems: "center", 
    justifyContent: "space-between",
    background: "#fff",
    borderBottom: "1px solid #eee",
    padding: "10px 0",
    color: "#333", // Force text color to black
    marginBottom: "5px"
  };

  const buttonBaseStyle = {
    border: "1px solid #ddd",
    background: "transparent",
    cursor: "pointer",
    padding: "4px 8px",
    fontSize: "0.85rem",
    marginLeft: "5px",
    color: "#555"
  };

  return (
    <div style={{ marginLeft: "25px", borderLeft: "2px solid #eee", paddingLeft: "15px" }}>
      {/* Node Content */}
      <div style={nodeContainerStyle}>
        
        {/* Left Side: Expand Toggle & Name */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              fontWeight: 'bold', 
              color: '#7f8c8d',
              width: '20px',
              visibility: children.length > 0 ? 'visible' : 'hidden'
            }}
          >
            {isExpanded ? "▼" : "▶"}
          </button>

          {isEditing ? (
            <div style={{ display: 'flex', gap: '5px' }}>
              <input 
                value={editName}
                onChange={e => setEditName(e.target.value)}
                style={{ padding: '4px', border: '1px solid #999' }}
                autoFocus
              />
              <button onClick={saveEdit} style={{ ...buttonBaseStyle, background: "#27ae60", color: "#fff", border: "none" }}>Lưu</button>
              <button onClick={() => setIsEditing(false)} style={{ ...buttonBaseStyle, background: "#95a5a6", color: "#fff", border: "none" }}>Hủy</button>
            </div>
          ) : (
            <span style={{ fontWeight: "600", fontSize: "1rem", color: "#2c3e50" }}>{tag.name}</span>
          )}
        </div>

        {/* Right Side: Actions (Simple & Visible) */}
        {!isEditing && (
          <div style={{ display: "flex", opacity: 0.8 }}>
            <button 
              onClick={() => setIsAddingChild(true)} 
              title="Thêm thẻ con"
              style={{ ...buttonBaseStyle, color: "#2980b9", borderColor: "#2980b9" }}
            >
              + 
            </button>
            <button 
              onClick={() => { setIsEditing(true); setEditName(tag.name); }} 
              title="Sửa tên"
              style={{ ...buttonBaseStyle, color: "#e67e22", borderColor: "#e67e22" }}
            >
              Sửa
            </button>
            <button 
              onClick={() => onDelete(tag.id)} 
              title="Xóa thẻ"
              style={{ ...buttonBaseStyle, color: "#c0392b", borderColor: "#c0392b" }}
            >
              Xóa
            </button>
          </div>
        )}
      </div>

      {/* Add Child Form */}
      {isAddingChild && (
        <div style={{ marginLeft: "35px", marginBottom: "10px", padding: "10px", background: "#f0f8ff", border: "1px dashed #ccc", display: "flex", gap: "5px", alignItems: "center" }}>
          <span style={{ fontSize: "0.9rem", color: "#555" }}>↳ Thêm vào <b>{tag.name}</b>:</span>
          <input 
            value={newChildName}
            onChange={e => setNewChildName(e.target.value)}
            placeholder="Tên thẻ con..."
            style={{ padding: "4px 8px", flex: 1, border: "1px solid #ccc" }}
            autoFocus
          />
          <button onClick={saveChild} style={{ ...buttonBaseStyle, background: "#2980b9", color: "#fff", border: "none" }}>OK</button>
          <button onClick={() => setIsAddingChild(false)} style={{ ...buttonBaseStyle, background: "#95a5a6", color: "#fff", border: "none" }}>Hủy</button>
        </div>
      )}

      {/* Render Children Recursively */}
      {isExpanded && children.length > 0 && (
        <div>
          {children.map(child => (
            <TagNode 
              key={child.id} 
              tag={child} 
              allTags={allTags} 
              onDelete={onDelete}
              onUpdate={onUpdate}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TagList;