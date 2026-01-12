// src/pages/Admin/Tests/hooks/useTestFormLogic.js
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  addTest, updateTest, getTestById, getAllQuestions, getAllTags, getAllPools,
  addQuestion, uploadFile 
} from "../../../firebase/firebaseQuery";
import { parseWordHtml } from "../../../utils/htmlParser";

export const useTestFormLogic = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  // --- Form Data ---
  const [formData, setFormData] = useState({
    name: "", description: "", maxScore: 100, timeLimit: 60, imageUrl: ""
  });

  // --- Data Sources ---
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [availablePools, setAvailablePools] = useState([]);

  // --- Selections ---
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [selectedTagIds, setSelectedTagIds] = useState([]);

  // --- Import State ---
  const [newQuestions, setNewQuestions] = useState([]);
  const [importFileList, setImportFileList] = useState([]);
  const [blobFileRegistry, setBlobFileRegistry] = useState({});
  const [selectedPoolId, setSelectedPoolId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // --- Modal State ---
  const [editingIndex, setEditingIndex] = useState(null);
  const [editQData, setEditQData] = useState(null);

  // 1. Initial Data Fetch
  useEffect(() => {
    const fetchData = async () => {
      const [questions, tags, pools] = await Promise.all([
        getAllQuestions(), getAllTags(), getAllPools()
      ]);
      setAvailableQuestions(questions);
      setAvailableTags(tags);
      setAvailablePools(pools);

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

  // 2. Import Logic
  const handleFolderSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setImportFileList(files);

    const htmlFile = files.find(f => f.name.endsWith(".html") || f.name.endsWith(".htm"));
    if (!htmlFile) return alert("No .html file found!");

    const text = await htmlFile.text();
    const parsed = parseWordHtml(text);
    
    let newRegistry = { ...blobFileRegistry };

    const swapSrc = (html) => {
        if (!html) return html;
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        doc.querySelectorAll("img").forEach(img => {
            const src = img.getAttribute("src");
            if(src && !src.startsWith("http") && !src.startsWith("blob:")) {
                const cleanSrc = src.replace(/\\/g, "/");
                const file = files.find(f => (f.webkitRelativePath || f.name).replace(/\\/g, "/").endsWith(cleanSrc));
                if (file) {
                    const blobUrl = URL.createObjectURL(file);
                    img.src = blobUrl;
                    newRegistry[blobUrl] = file; 
                }
            }
        });
        return doc.body.innerHTML;
    };

    const transformed = parsed.map(q => ({
        ...q,
        content: swapSrc(q.content),
        explanation: swapSrc(q.explanation),
        answers: q.options.map(opt => ({
            name: swapSrc(opt.content),
            content: swapSrc(opt.content),
            isCorrect: (q.correctAnswer === opt.id) || false,
        })),
        type: "MC_SINGLE_HTML"
    }));

    setBlobFileRegistry(newRegistry);
    setNewQuestions(transformed);
  };

  // 3. Submit Logic
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const newQuestionIds = [];
      const resolveStringImages = async (str) => {
          if (!str) return str;
          let finalStr = str;
          const blobUrls = str.match(/blob:[^"'\s)]+/g) || [];
          for (const blobUrl of blobUrls) {
              const file = blobFileRegistry[blobUrl];
              if (file) {
                  try {
                      const downloadUrl = await uploadFile(file, "question-images");
                      finalStr = finalStr.replaceAll(blobUrl, downloadUrl);
                  } catch (err) { console.error("Upload failed", err); }
              }
          }
          return finalStr;
      };

      for (const q of newQuestions) {
          const finalContent = await resolveStringImages(q.content);
          const finalExplanation = await resolveStringImages(q.explanation);
          const finalAnswers = await Promise.all(q.answers.map(async (ans) => ({
              ...ans, content: await resolveStringImages(ans.content), name: await resolveStringImages(ans.name)
          })));

          const docRef = await addQuestion({
              ...q, content: finalContent, explanation: finalExplanation, answers: finalAnswers,
              poolId: selectedPoolId, tagIds: [], createdAt: new Date().toISOString()
          });
          newQuestionIds.push(docRef.id);
      }

      const payload = { ...formData, tagIds: selectedTagIds, questionIds: [...selectedQuestionIds, ...newQuestionIds] };
      isEditMode ? await updateTest(id, payload) : await addTest(payload);
      
      alert(isEditMode ? "Updated successfully!" : "Created successfully!");
      navigate("/admin/tests");
    } catch (error) {
      console.error(error);
      alert("Error: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Helpers
  const handleTagToggle = (tId) => setSelectedTagIds(p => p.includes(tId) ? p.filter(x => x!==tId) : [...p, tId]);
  const handleQuestionToggle = (qId) => setSelectedQuestionIds(p => p.includes(qId) ? p.filter(x => x!==qId) : [...p, qId]);
  const handleImageReplace = (file, _, tempUrl) => setBlobFileRegistry(p => ({ ...p, [tempUrl]: file }));
  
  return {
    isEditMode, isProcessing,
    formData, setFormData,
    availableTags, availablePools, availableQuestions,
    selectedTagIds, handleTagToggle,
    selectedQuestionIds, handleQuestionToggle,
    newQuestions, setNewQuestions,
    selectedPoolId, setSelectedPoolId,
    handleFolderSelect, handleSubmit,
    editingIndex, setEditingIndex,
    editQData, setEditQData,
    handleImageReplace
  };
};