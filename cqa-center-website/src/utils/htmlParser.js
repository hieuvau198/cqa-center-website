// hieuvau198/cqa-center-website/cqa-center-website-feat-import-file/cqa-center-website/src/utils/htmlParser.js

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
        type: "MC_SINGLE_HTML",
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
 * recursively traversing nodes to handle nested structures (like spans containing all options).
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

  /**
   * Checks if a node IS strictly a marker wrapper.
   * Example: <b>A.</b> or <span>A.</span> or TextNode "A."
   * Returns { id: 'A' } if true, null otherwise.
   */
  const getMarkerInfo = (node) => {
    const text = node.textContent.replace(/\u00a0/g, " ").trim();
    const match = text.match(/^([A-D])[\.:]$/);
    if (match) return { id: match[1] };
    return null;
  };

  /**
   * Checks if a node MIGHT CONTAIN a marker inside it.
   * Used to decide whether to recurse or treat as atomic content.
   */
  const containsMarkerPattern = (node) => {
    const text = node.textContent.replace(/\u00a0/g, " ");
    return /[A-D][\.:]/.test(text);
  };

  /**
   * Recursive processor
   */
  const processNode = (node) => {
    // 1. If Text Node
    if (node.nodeType === Node.TEXT_NODE) {
       const text = node.textContent.replace(/\u00a0/g, " ");
       
       // Check if this text STARTS with a marker: "A. Content..."
       const startMatch = text.match(/^\s*([A-D])[\.:]\s*/);
       
       if (startMatch) {
         flush(); // Save previous
         currentOptionId = startMatch[1];
         
         // Add the rest of the text (after the marker) to the buffer
         const rest = text.substring(startMatch[0].length); // Keep spaces?
         // Actually, typically we want to trim the leading space after "A."
         if (rest) {
            buffer.appendChild(document.createTextNode(rest));
         }
       } else {
         // Just content
         if (currentOptionId) {
            buffer.appendChild(node.cloneNode(true));
         }
       }
       return;
    }

    // 2. If Element Node
    // First, check if the element ITSELF is a marker (e.g. <b>A.</b>)
    const markerInfo = getMarkerInfo(node);
    if (markerInfo) {
      flush();
      currentOptionId = markerInfo.id;
      return; // Do not add the marker element to buffer
    }

    // If not a marker itself, does it CONTAIN markers?
    if (containsMarkerPattern(node)) {
      // Recurse to unwrap
      Array.from(node.childNodes).forEach(child => processNode(child));
    } else {
      // No markers inside, treat as atomic content block (e.g. an image, or formatted text)
      if (currentOptionId) {
        buffer.appendChild(node.cloneNode(true));
      }
    }
  };

  // Start processing all children of the paragraph
  Array.from(pElement.childNodes).forEach(processNode);
  
  flush(); // Flush the last option found
}