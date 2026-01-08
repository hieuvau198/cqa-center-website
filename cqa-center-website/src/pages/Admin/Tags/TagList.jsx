import { useEffect, useState } from "react";
import { getAllTags, addTag, deleteTag, updateTag } from "../../../firebase/firebaseQuery";

const TagList = () => {
  const [tags, setTags] = useState([]);
  const [newTagName, setNewTagName] = useState("");
  
  // State for editing
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const fetchTags = async () => {
    const data = await getAllTags();
    setTags(data);
  };

  useEffect(() => { fetchTags(); }, []);

  const handleAddTag = async (e) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    await addTag(newTagName.trim());
    setNewTagName("");
    fetchTags(); 
  };

  const handleDelete = async (id) => {
    if(confirm("Xóa thẻ này? Các câu hỏi đang sử dụng thẻ này sẽ bị mất liên kết.")) {
      await deleteTag(id);
      setTags(tags.filter(t => t.id !== id));
    }
  };

  // Start editing mode
  const startEdit = (tag) => {
    setEditingId(tag.id);
    setEditName(tag.name);
  };

  // Save changes
  const handleUpdate = async (id) => {
    if (!editName.trim()) return;
    await updateTag(id, editName.trim());
    setEditingId(null);
    fetchTags();
  };

  return (
    <div className="admin-container">
      <h2>Quản Lý Thẻ (Tags)</h2>
      
      <div className="section-box">
        <form onSubmit={handleAddTag} className="form-row" style={{ alignItems: "center" }}>
          <input 
            className="form-input"
            value={newTagName} 
            onChange={(e) => setNewTagName(e.target.value)} 
            placeholder="Nhập tên thẻ mới..." 
            style={{ flex: 1 }}
            required 
          />
          <button type="submit" className="btn btn-primary">+ Thêm Thẻ</button>
        </form>
      </div>

      <div className="tag-list">
        {tags.map(tag => (
          <div key={tag.id} className="tag-chip">
            {editingId === tag.id ? (
              // EDIT MODE
              <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                <input 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)}
                  className="form-input"
                  style={{ padding: '2px 5px', height: 'auto', width: '150px' }}
                />
                <button onClick={() => handleUpdate(tag.id)} className="btn btn-success" style={{ padding: '2px 5px', fontSize: '12px' }}>✓</button>
                <button onClick={() => setEditingId(null)} className="btn btn-danger" style={{ padding: '2px 5px', fontSize: '12px' }}>✕</button>
              </div>
            ) : (
              // VIEW MODE
              <>
                <span>{tag.name}</span>
                <div style={{ display: 'flex', gap: '5px', marginLeft: '10px' }}>
                    <button 
                        onClick={() => startEdit(tag)} 
                        className="btn" 
                        style={{ padding: '0 5px', fontSize: '12px', background: 'transparent', color: '#007bff', border: 'none' }}
                    >
                        ✎
                    </button>
                    <button onClick={() => handleDelete(tag.id)} className="tag-chip-delete">✕</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TagList;