import { useEffect, useState } from "react";
import { getAllTags, addTag, deleteTag } from "../../../firebase/firebaseQuery";

const TagList = () => {
  const [tags, setTags] = useState([]);
  const [newTagName, setNewTagName] = useState("");

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
            <span>{tag.name}</span>
            <button onClick={() => handleDelete(tag.id)} className="tag-chip-delete">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TagList;