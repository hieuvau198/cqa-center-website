import React, { useState } from 'react';

const TagNode = ({ tag, allTags, selectedIds, onToggle }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const children = allTags.filter(t => t.parentId === tag.id);
  const hasChildren = children.length > 0;

  return (
    <div style={{ marginLeft: "5px", marginBottom: "2px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
        <button 
          type="button" 
          onClick={(e) => { e.preventDefault(); setIsExpanded(!isExpanded); }}
          style={{ 
            border: "none", background: "none", cursor: "pointer", 
            color: "#666", padding: 0, width: "20px", visibility: hasChildren ? "visible" : "hidden" 
          }}
        >
          {isExpanded ? "▼" : "▶"}
        </button>
        <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", userSelect: "none" }}>
            <input type="checkbox" checked={selectedIds.includes(tag.id)} onChange={() => onToggle(tag.id)} />
            <span style={{ color: selectedIds.includes(tag.id) ? "#0056b3" : "#333" }}>{tag.name}</span>
        </label>
      </div>
      {isExpanded && hasChildren && (
        <div style={{ borderLeft: "1px solid #ddd", marginLeft: "9px", paddingLeft: "5px" }}>
            {children.map(child => (
                <TagNode key={child.id} tag={child} allTags={allTags} selectedIds={selectedIds} onToggle={onToggle} />
            ))}
        </div>
      )}
    </div>
  );
};

const TagTreeSelector = ({ tags, selectedIds, onToggle }) => {
  const rootTags = tags.filter(t => !t.parentId);
  return (
    <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #eee', padding: '10px', background: '#fff', borderRadius: '4px' }}>
      {tags.length === 0 && <p style={{fontStyle:'italic', color:'#888'}}>No tags available.</p>}
      {rootTags.map(rootTag => (
        <TagNode key={rootTag.id} tag={rootTag} allTags={tags} selectedIds={selectedIds} onToggle={onToggle} />
      ))}
    </div>
  );
};
export default TagTreeSelector;