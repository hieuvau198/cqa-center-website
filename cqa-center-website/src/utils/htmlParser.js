/**
 * Parses MS Word HTML content to extract questions.
 * @param {string} htmlString - The raw HTML content.
 * @returns {Array} - Array of parsed question objects.
 */
export const parseWordHtml = (htmlString) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  
  // Select all paragraphs (standard Word class is MsoNormal, but we fallback to just p)
  const paragraphs = Array.from(doc.querySelectorAll("p.MsoNormal, p"));

  const questions = [];
  let currentQuestion = null;
  let parsingState = "IDLE"; // IDLE, CONTENT, SOLUTION

  paragraphs.forEach((p, index) => {
    // 1. Clean up text for detection (remove &nbsp; etc)
    const rawText = p.textContent; 
    const cleanText = rawText.trim().replace(/\u00a0/g, " ");

    // --- DETECTORS ---
    
    // Detect Question Start: "Câu 1:", "Câu 2.", "Question 1:"
    const questionMatch = cleanText.match(/^(Câu|Question)\s+(\d+)/i);
    
    // Detect Solution Header
    const isSolutionHeader = cleanText.toLowerCase().includes("lời giải") || cleanText.toLowerCase().includes("hướng dẫn giải");

    // --- LOGIC ---

    if (questionMatch) {
      // Save previous question
      if (currentQuestion) {
        questions.push(currentQuestion);
      }

      // Start new question
      currentQuestion = {
        id: `temp_${Date.now()}_${index}`,
        name: `${questionMatch[1]} ${questionMatch[2]}`, // e.g. "Câu 1"
        content: "", // HTML string
        options: [], 
        type: "MC_SINGLE",
        correctAnswer: "",
        explanation: "",
        rawImages: [] 
      };
      
      // We start in CONTENT mode
      parsingState = "CONTENT";
    }

    if (!currentQuestion) return;

    if (isSolutionHeader) {
      parsingState = "SOLUTION";
      return; // Skip the header line itself
    }

    // --- PARSING CONTENT vs OPTIONS ---

    if (parsingState === "CONTENT") {
      // Check for Option Identifiers in this paragraph
      // We look for patterns like "A." or "A:" at the start or inside
      // A strong signal is having both A. and B. or just starting with A.
      const hasOptionA = cleanText.match(/A[\.:]/);
      const hasOptionB = cleanText.match(/B[\.:]/);
      
      const isOptionLine = (hasOptionA && hasOptionB) || cleanText.match(/^A[\.:]/);

      if (isOptionLine) {
        // ==> THIS PARAGRAPH CONTAINS OPTIONS
        extractOptionsFromParagraph(p, currentQuestion);
      } else {
        // ==> THIS IS JUST QUESTION TEXT (or Image)
        // Check for images to track
        p.querySelectorAll('img').forEach(img => {
          const src = img.getAttribute('src');
          if (src) currentQuestion.rawImages.push(src);
        });
        
        // Add full HTML of the paragraph to content
        currentQuestion.content += p.outerHTML;
      }
    } 
    else if (parsingState === "SOLUTION") {
      // Extract Correct Answer: "Chọn C" or "Đáp án C"
      const ansMatch = cleanText.match(/(?:Chọn|Đáp án|Answer)\s+([A-D])/i);
      if (ansMatch) {
        currentQuestion.correctAnswer = ansMatch[1].toUpperCase();
      }
      
      // Append to explanation
      p.querySelectorAll('img').forEach(img => {
          const src = img.getAttribute('src');
          if (src) currentQuestion.rawImages.push(src);
      });
      currentQuestion.explanation += p.outerHTML;
    }
  });

  // Push the last question
  if (currentQuestion) {
    questions.push(currentQuestion);
  }

  return questions;
};

/**
 * Helper to split a paragraph's HTML into options A, B, C, D.
 * Handles mixed content like: "<b>A.</b> content <b>B.</b> content"
 * and complex markers like "<b><u>C</u>.</b>"
 */
function extractOptionsFromParagraph(pElement, currentQuestion) {
  let currentOptionId = null; // 'A', 'B', 'C', 'D'
  let buffer = document.createElement('div'); // Temp container for current option content

  const flush = () => {
    if (currentOptionId && buffer.innerHTML.trim()) {
      currentQuestion.options.push({
        id: currentOptionId,
        content: buffer.innerHTML.trim(),
        isCorrect: false // Set later by solution parser
      });
    }
    buffer = document.createElement('div'); // Reset
  };

  // Helper to check if a node REPRESENTS a marker
  // Returns { id: 'A', cleanNode: Node } if found, else null
  const getMarkerInfo = (node) => {
    // We look at textContent. 
    // Example 1: node is <b>A.</b> -> text "A." -> MATCH
    // Example 2: node is <b><u>C</u>.</b> -> text "C." -> MATCH
    // Example 3: node is TextNode "A." -> MATCH
    
    const text = node.textContent.trim().replace(/\u00a0/g, " ");
    const match = text.match(/^([A-D])[\.:]/);
    
    if (match) {
      // We found a marker text. 
      // We must remove the marker text from the node to get the content (if any)
      // Cloning is safer to avoid destroying the main iteration context
      const cleanNode = node.cloneNode(true);
      
      // Recursively remove the "A." prefix from the text nodes inside
      let removed = false;
      const removePrefix = (el) => {
        if (removed) return;
        if (el.nodeType === Node.TEXT_NODE) {
           const t = el.textContent.replace(/\u00a0/g, " ").trimStart();
           if (t.match(/^[A-D][\.:]/)) {
             // Replace matches in the original content to preserve formatting
             // We replace the pattern + any trailing spaces
             el.textContent = el.textContent.replace(/^\s*[A-D][\.:]\s*/, "");
             removed = true;
           }
        } else {
           el.childNodes.forEach(child => removePrefix(child));
        }
      };
      
      removePrefix(cleanNode);
      
      return { id: match[1], cleanNode };
    }
    return null;
  };

  // Iterate over all children of the paragraph
  Array.from(pElement.childNodes).forEach(node => {
    const markerInfo = getMarkerInfo(node);

    if (markerInfo) {
      // Found a new marker!
      flush(); // Save previous option
      currentOptionId = markerInfo.id;
      
      // If the node had content *after* the label (e.g. "A. 5"), add it
      if (markerInfo.cleanNode.textContent.trim() !== "" || markerInfo.cleanNode.querySelector('img')) {
        buffer.appendChild(markerInfo.cleanNode);
      }
    } else {
      // No marker, just content.
      // Only add if we have started collecting an option.
      if (currentOptionId) {
        buffer.appendChild(node.cloneNode(true));
      }
    }
  });

  flush(); // Flush the last option (D)
}