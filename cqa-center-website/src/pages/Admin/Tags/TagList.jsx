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
    if(confirm("Delete this tag? Questions using it will lose the reference.")) {
      await deleteTag(id);
      setTags(tags.filter(t => t.id !== id));
    }
  };

  return (
    <div className="admin-container">
      <h2>Tags Management</h2>
      
      <form onSubmit={handleAddTag} className="form-row" style={{ marginBottom: "20px" }}>
        <input 
          className="form-input"
          value={newTagName} 
          onChange={(e) => setNewTagName(e.target.value)} 
          placeholder="New Tag Name" 
          required 
        />
        <button type="submit" className="btn btn-primary">+ Add Tag</button>
      </form>

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