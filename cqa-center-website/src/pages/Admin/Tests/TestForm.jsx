import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  addTest, updateTest, getTestById, getAllQuestions, getAllTags, getAllPools,
  addQuestion, uploadFile 
} from "../../../firebase/firebaseQuery";
import { parseWordHtml } from "../../../utils/htmlParser";
import QuestionPreview from "../../../components/QuestionPreview";
import HtmlQuestionEditor from "../Questions/components/HtmlQuestionEditor";

// --- Styles for the Modal ---
const modalStyles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 1000,
    display: 'flex', justifyContent: 'center', alignItems: 'center'
  },
  content: {
    backgroundColor: '#fff', padding: '20px', borderRadius: '8px',
    width: '90%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto',
    position: 'relative'
  }
};

const TestForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  // --- Form Data ---
  const [formData, setFormData] = useState({
    name: "", description: "", maxScore: 100, timeLimit: 60, imageUrl: ""
  });
  
  // --- Existing Data (from DB) ---
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [availablePools, setAvailablePools] = useState([]);
  
  // --- Selected Data ---
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [selectedTagIds, setSelectedTagIds] = useState([]);

  // --- IMPORT & NEW QUESTIONS STATE ---
  const [newQuestions, setNewQuestions] = useState([]); // Draft questions
  const [importFileList, setImportFileList] = useState([]); // Files from folder import
  const [customImageMap, setCustomImageMap] = useState({}); // Map blobUrl -> File (for replaced images)
  const [selectedPoolId, setSelectedPoolId] = useState(""); // Default pool for new questions
  const [isProcessing, setIsProcessing] = useState(false);

  // --- MODAL STATE ---
  const [editingIndex, setEditingIndex] = useState(null); // Index in newQuestions
  const [editQData, setEditQData] = useState(null); // Temporary data for modal

  useEffect(() => {
    const fetchData = async () => {
      // 1. Load common data
      const [questions, tags, pools] = await Promise.all([
        getAllQuestions(),
        getAllTags(),
        getAllPools()
      ]);
      setAvailableQuestions(questions);
      setAvailableTags(tags);
      setAvailablePools(pools);

      // 2. If Edit Mode, load Test Data
      if (isEditMode) {
        const testData = await getTestById(id);
        if (testData) {
          setFormData({
            name: testData.name,
            description: testData.description,
            maxScore: testData.maxScore,
            timeLimit: testData.timeLimit,
            imageUrl: testData.imageUrl || ""
          });
          setSelectedTagIds(testData.tagIds || []);
          setSelectedQuestionIds(testData.questionIds || []);
        }
      }
    };
    fetchData();
  }, [id, isEditMode]);

  // ==========================
  // 1. IMPORT LOGIC
  // ==========================
  const handleFolderSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setImportFileList(files);

    const htmlFile = files.find(f => f.name.endsWith(".html") || f.name.endsWith(".htm"));
    if (!htmlFile) {
      alert("No .html file found in the selected folder!");
      return;
    }

    const text = await htmlFile.text();
    const parsed = parseWordHtml(text);
    
    // Transform parsed questions to fit our Schema & pre-calculate blob previews
    const transformed = parsed.map(q => {
        // Convert parser 'options' to firebase 'answers'
        const answers = q.options.map(opt => ({
            name: opt.content,
            content: opt.content,
            isCorrect: (q.correctAnswer && q.correctAnswer === opt.id) || false,
        }));

        // Replace src paths with Blob URLs for preview
        const swapSrc = (htmlContent) => {
            if (!htmlContent) return htmlContent;
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, "text/html");
            doc.querySelectorAll("img").forEach(img => {
                const src = img.getAttribute("src");
                if(src && !src.startsWith("http") && !src.startsWith("blob:")) {
                    const cleanSrc = src.replace(/\\/g, "/");
                    const file = files.find(f => (f.webkitRelativePath || f.name).replace(/\\/g, "/").endsWith(cleanSrc));
                    if (file) img.src = URL.createObjectURL(file);
                }
            });
            return doc.body.innerHTML;
        };

        return {
            ...q,
            content: swapSrc(q.content),
            explanation: swapSrc(q.explanation),
            answers: answers.map(a => ({ ...a, content: swapSrc(a.content), name: swapSrc(a.name) })),
            type: "MC_SINGLE_HTML" // Default type
        };
    });

    setNewQuestions(transformed);
  };

  // ==========================
  // 2. MODAL EDIT LOGIC
  // ==========================
  const openEditModal = (index) => {
    setEditingIndex(index);
    setEditQData(JSON.parse(JSON.stringify(newQuestions[index]))); // Deep copy
  };

  const closeEditModal = () => {
    setEditingIndex(null);
    setEditQData(null);
  };

  const handleSaveModal = () => {
    const updatedList = [...newQuestions];
    updatedList[editingIndex] = editQData;
    setNewQuestions(updatedList);
    closeEditModal();
  };

  const handleImageReplaceInModal = (file, oldSrc, tempUrl) => {
    // Store the new file in a map to upload later
    setCustomImageMap(prev => ({ ...prev, [tempUrl]: file }));
  };

  const handleRemoveNewQuestion = (index) => {
    if(confirm("Remove this imported question?")) {
        setNewQuestions(newQuestions.filter((_, i) => i !== index));
    }
  };

  // ==========================
  // 3. FINAL SUBMIT LOGIC
  // ==========================
  const processHtmlImagesUpload = async (htmlContent) => {
    if (!htmlContent) return htmlContent;
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    const images = Array.from(doc.querySelectorAll("img"));

    if (images.length === 0) return htmlContent;

    await Promise.all(images.map(async (img) => {
        const src = img.getAttribute("src");
        if (!src) return;

        // CASE A: It's a Blob URL we created (either from import or replacement)
        if (src.startsWith("blob:")) {
            let fileToUpload = customImageMap[src]; // First check manually replaced images

            // If not found in custom map, check original import files
            if (!fileToUpload) {
                 // We need to reverse-lookup the file from the blob URL 
                 // (This is tricky. Simpler way: iterate importFileList, createObjectURL, compare.)
                 // Optimization: We rely on the initial parsing logic. 
                 // Actually, we can just look for the Original Path if we stored it?
                 // Current approach: We can't easily reverse blob->file.
                 // FIX: We will just search in importFileList using the *filename* if possible?
                 // BETTER FIX: The 'swapSrc' logic in handleFolderSelect replaced relative paths with Blobs.
                 // We lost the mapping. 
                 
                 // REVISED STRATEGY for Imports:
                 // We will upload ALL images that are blobs.
                 // To find the file for a blob, we can iterate our importFileList and check if URL.createObjectURL(f) === src.
                 // NOTE: createObjectURL returns a NEW string each time. This won't work easily.
                 
                 // WORKING STRATEGY:
                 // When parsing, we keep the original SRC? No.
                 // We need to find the file content.
                 // Let's assume we handle "customImageMap" for edits.
                 // For the original imports, we need to re-scan `importFileList` and match by logic? 
                 // NO, simply: when we rendered the blob, we had the file.
                 // Let's just upload images that match the *filename* pattern if we can't find exact match?
                 // 
                 // SIMPLEST FIX for this codebase:
                 // Pass `importFileList` to this function.
                 // But we have `src="blob:..."`. 
                 // We will iterate `importFileList` and see if we can find a file that matches the image context? Hard.
                 
                 // ACTUAL SOLUTION: 
                 // In `handleFolderSelect`, we replaced src with blob. 
                 // Let's store the `File` object directly in a temporary dictionary keyed by the Blob URL!
            }
        }
    }));
    
    // RE-WRITE: processHtmlImagesUpload
    // To make this robust, we need to pass a `blobLookup` map.
    // Let's build that map when we generate the previews.
  };

  // --- Helper to build Blob Map on the fly ---
  // Since state updates are async, we'll rebuild a map of { blobUrl: File } right before saving
  // Wait, we can't reconstruct blobs to match existing `src`.
  // WE MUST maintain a `blobFileRegistry` state.
  const [blobFileRegistry, setBlobFileRegistry] = useState({});

  // Updated `handleFolderSelect` with registry
  const handleFolderSelectWithRegistry = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setImportFileList(files);

    const htmlFile = files.find(f => f.name.endsWith(".html") || f.name.endsWith(".htm"));
    if (!htmlFile) return alert("No HTML file found.");

    const text = await htmlFile.text();
    const parsed = parseWordHtml(text);
    
    let newRegistry = { ...blobFileRegistry };

    const swapSrc = (html) => {
        if (!html) return html;
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        doc.querySelectorAll("img").forEach(img => {
            const src = img.getAttribute("src");
            if(src && !src.startsWith("http")) {
                const cleanSrc = src.replace(/\\/g, "/");
                const file = files.find(f => (f.webkitRelativePath || f.name).replace(/\\/g, "/").endsWith(cleanSrc));
                if (file) {
                    const blobUrl = URL.createObjectURL(file);
                    img.src = blobUrl;
                    newRegistry[blobUrl] = file; // Register mapping
                }
            }
        });
        return doc.body.innerHTML;
    };

    const transformed = parsed.map(q => {
        const answers = q.options.map(opt => ({
            name: opt.content,
            content: opt.content,
            isCorrect: (q.correctAnswer && q.correctAnswer === opt.id) || false,
        }));
        return {
            ...q,
            content: swapSrc(q.content),
            explanation: swapSrc(q.explanation),
            answers: answers.map(a => ({ ...a, content: swapSrc(a.content), name: swapSrc(a.name) })),
            type: "MC_SINGLE_HTML"
        };
    });

    setBlobFileRegistry(newRegistry);
    setNewQuestions(transformed);
  };
  
  // Updated Image Replacer in Modal
  const handleImageReplaceWithRegistry = (file, oldSrc, tempUrl) => {
      setBlobFileRegistry(prev => ({ ...prev, [tempUrl]: file }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // 1. SAVE NEW QUESTIONS FIRST
      const newQuestionIds = [];

      // Helper to process a string, upload any blobs found in registry, replace with URL
      const resolveStringImages = async (str) => {
          if (!str) return str;
          let finalStr = str;
          // Find all blob: URLs
          const blobUrls = str.match(/blob:[^"'\s)]+/g) || [];
          
          for (const blobUrl of blobUrls) {
              const file = blobFileRegistry[blobUrl];
              if (file) {
                  try {
                      // Check if we already uploaded this specific file/blob to avoid dups? 
                      // For now, just upload.
                      const downloadUrl = await uploadFile(file, "question-images");
                      finalStr = finalStr.replaceAll(blobUrl, downloadUrl);
                  } catch (err) {
                      console.error("Image upload failed", err);
                  }
              }
          }
          return finalStr;
      };

      for (const q of newQuestions) {
          // Process Content
          const finalContent = await resolveStringImages(q.content);
          const finalExplanation = await resolveStringImages(q.explanation);
          
          // Process Answers
          const finalAnswers = await Promise.all(q.answers.map(async (ans) => {
              const content = await resolveStringImages(ans.content);
              return { ...ans, content: content, name: content }; // Sync name
          }));

          const payload = {
              name: q.name,
              content: finalContent,
              explanation: finalExplanation,
              answers: finalAnswers,
              type: q.type || "MC_SINGLE_HTML",
              poolId: selectedPoolId,
              tagIds: [], // Could add tags here if needed
              createdAt: new Date().toISOString()
          };

          const docRef = await addQuestion(payload);
          newQuestionIds.push(docRef.id);
      }

      // 2. SAVE TEST
      const allQuestionIds = [...selectedQuestionIds, ...newQuestionIds];
      const testPayload = { ...formData, tagIds: selectedTagIds, questionIds: allQuestionIds };

      if (isEditMode) {
        await updateTest(id, testPayload);
        alert(`Test updated! Added ${newQuestionIds.length} new imported questions.`);
      } else {
        await addTest(testPayload);
        alert(`Test created! Added ${newQuestionIds.length} new imported questions.`);
      }

      navigate("/admin/tests");

    } catch (error) {
      console.error(error);
      alert("Error saving test: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };


  // ==========================
  // RENDER
  // ==========================
  return (
    <div className="admin-container">
      <h2>{isEditMode ? "Edit Test" : "Create Test"}</h2>
      <form onSubmit={handleSubmit} className="form-column">
        
        {/* --- BASIC TEST INFO --- */}
        <div style={{display:'flex', gap:'20px'}}>
             <div style={{flex:1}}>
                <input className="form-input" placeholder="Test Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                <textarea className="form-textarea" placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Max Score</label>
                        <input className="form-input" type="number" value={formData.maxScore} onChange={e => setFormData({...formData, maxScore: e.target.value})} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Time (min)</label>
                        <input className="form-input" type="number" value={formData.timeLimit} onChange={e => setFormData({...formData, timeLimit: e.target.value})} />
                    </div>
                </div>
             </div>
             <div style={{width:'300px'}}>
                <div className="section-box">
                    <p className="section-title">Tags:</p>
                    <div className="tag-list">
                        {availableTags.map(tag => (
                        <label key={tag.id} className="tag-chip">
                            <input type="checkbox" checked={selectedTagIds.includes(tag.id)} onChange={() => {
                                selectedTagIds.includes(tag.id) 
                                ? setSelectedTagIds(selectedTagIds.filter(t => t!==tag.id))
                                : setSelectedTagIds([...selectedTagIds, tag.id]);
                            }} />
                            {tag.name}
                        </label>
                        ))}
                    </div>
                </div>
             </div>
        </div>

        <hr style={{margin: "30px 0", borderTop:"2px dashed #ddd"}} />

        {/* --- IMPORT SECTION --- */}
        <div className="section-box" style={{background: "#f0f8ff", border: "1px solid #cce5ff"}}>
            <h3 style={{marginTop:0, color: "#0056b3"}}>📥 Import Questions from HTML</h3>
            <p style={{fontSize: "0.9rem", color:"#555"}}>Import questions directly into this test. They will be created in the database when you click Save.</p>
            
            <div className="form-row" style={{alignItems: "flex-end"}}>
                <div className="form-group" style={{flex:1}}>
                    <label>Select Folder (containing .html + images)</label>
                    <input 
                        type="file" 
                        webkitdirectory="true" 
                        directory="true" 
                        multiple 
                        onChange={handleFolderSelectWithRegistry} 
                        className="form-input" 
                        style={{background:"white"}}
                    />
                </div>
                <div className="form-group" style={{width: "250px"}}>
                     <label>Assign to Pool (Optional)</label>
                     <select className="form-select" value={selectedPoolId} onChange={e=>setSelectedPoolId(e.target.value)}>
                        <option value="">-- No Pool --</option>
                        {availablePools.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                     </select>
                </div>
            </div>

            {/* PREVIEW OF NEW QUESTIONS */}
            {newQuestions.length > 0 && (
                <div style={{marginTop: "20px"}}>
                    <h4 style={{color: "green"}}>Found {newQuestions.length} new questions:</h4>
                    <div className="scroll-box" style={{maxHeight: "400px", background: "#fff"}}>
                        {newQuestions.map((q, idx) => (
                            <div key={idx} style={{display:'flex', gap:'10px', alignItems:'start', marginBottom: '15px', borderBottom:'1px solid #eee', paddingBottom:'10px'}}>
                                <div style={{flex:1}}>
                                    <QuestionPreview data={q} index={idx} />
                                </div>
                                <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                                    <button type="button" className="btn btn-sm btn-primary" onClick={() => openEditModal(idx)}>Edit</button>
                                    <button type="button" className="btn btn-sm btn-danger" onClick={() => handleRemoveNewQuestion(idx)}>Remove</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* --- EXISTING QUESTIONS --- */}
        <h3>Select Existing Questions</h3>
        <div className="scroll-box">
          {availableQuestions.map(q => (
            <div key={q.id} className="checkbox-item" style={{justifyContent: 'space-between'}}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", flex: 1 }}>
                <input type="checkbox" checked={selectedQuestionIds.includes(q.id)} onChange={() => {
                     selectedQuestionIds.includes(q.id) 
                     ? setSelectedQuestionIds(selectedQuestionIds.filter(id => id !== q.id))
                     : setSelectedQuestionIds([...selectedQuestionIds, q.id]);
                }} />
                <span><strong>{q.name}</strong> <small>({q.type})</small></span>
              </label>
              <button type="button" onClick={() => window.open(`/admin/questions/edit/${q.id}`, '_blank')} className="btn" style={{padding: '2px 8px', fontSize: '10px'}}>
                View Origin
              </button>
            </div>
          ))}
        </div>

        {/* --- SUBMIT --- */}
        <div style={{marginTop: "20px", padding: "20px", background: "#eee", position:"sticky", bottom:0, display:"flex", justifyContent:"flex-end"}}>
            <button type="submit" className="btn btn-blue" style={{ fontSize: "1.2rem", padding: "12px 30px" }} disabled={isProcessing}>
                {isProcessing ? "Saving & Uploading..." : (isEditMode ? "Update Test" : "Create Test")}
            </button>
        </div>
      </form>

      {/* --- EDIT MODAL --- */}
      {editingIndex !== null && editQData && (
        <div style={modalStyles.overlay}>
            <div style={modalStyles.content}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
                    <h3>Edit Imported Question #{editingIndex + 1}</h3>
                    <button onClick={closeEditModal} style={{background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer'}}>×</button>
                </div>
                
                <div className="form-group">
                    <label>Question Name</label>
                    <input className="form-input" value={editQData.name} onChange={e => setEditQData({...editQData, name: e.target.value})} />
                </div>

                {/* Reuse the Editor */}
                <HtmlQuestionEditor 
                    formData={editQData}
                    answers={editQData.answers}
                    onUpdateForm={setEditQData}
                    onUpdateAnswers={(newAns) => setEditQData({...editQData, answers: newAns})}
                    onImageReplace={handleImageReplaceWithRegistry}
                />

                <div style={{display:'flex', justifyContent:'flex-end', gap:'10px', marginTop:'20px'}}>
                    <button type="button" className="btn btn-secondary" onClick={closeEditModal}>Cancel</button>
                    <button type="button" className="btn btn-primary" onClick={handleSaveModal}>Done Editing</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default TestForm;