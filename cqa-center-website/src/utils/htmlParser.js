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
    // Matches "Câu 1", "Câu 1.", "Câu 1:", "Câu 10"
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
      
      // We often want to include the text of the question immediately (removing the "Câu X:" label is optional)
      // For simplicity, we keep the whole line or paragraph as the question text starts here.
      // But we check if this same paragraph ALSO contains options (rare but possible).
    }

    if (!currentQuestion) return;

    if (isSolutionHeader) {
      parsingState = "SOLUTION";
      return; // Skip the header line itself
    }

    // --- PARSING CONTENT vs OPTIONS ---

    if (parsingState === "CONTENT") {
      // Check if this paragraph looks like an Option Block (contains "A." and "B.")
      // or if it's just part of the question text.
      
      // We check for at least "A." and "B." or just "A." at the start to consider it an option line.
      // Regex looks for "A." followed by space, or inside a tag.
      const hasOptionA = cleanText.match(/A\./);
      const hasOptionB = cleanText.match(/B\./);
      
      if (hasOptionA && (hasOptionB || cleanText.trim().startsWith("A."))) {
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
        // We strip the "Câu X:" prefix if it's the first line to keep it clean, optional.
        if (currentQuestion.content === "") {
             // Optional: highlight the Question Label
             currentQuestion.content += p.outerHTML; 
        } else {
             currentQuestion.content += p.outerHTML;
        }
      }
    } 
    else if (parsingState === "SOLUTION") {
      // Extract Correct Answer: "Chọn C" or "Đáp án C"
      const ansMatch = cleanText.match(/(?:Chọn|Đáp án|Answer)\s+([A-D])/i);
      if (ansMatch) {
        currentQuestion.correctAnswer = ansMatch[1].toUpperCase();
      }
      
      // Append to explanation
      // Capture images in explanation too
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
 */
function extractOptionsFromParagraph(pElement, currentQuestion) {
  // Strategy: We convert the paragraph into a string and split by the markers
  // However, simple string split breaks HTML tags.
  // Robust Strategy: Iterate through child nodes and "switch buckets" when we hit a marker.

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

  // Helper to check if a node REPRESENTS a marker like "A." or "<b>A.</b>"
  const getMarker = (node) => {
    const text = node.textContent.trim().replace(/\u00a0/g, " ");
    // Matches "A." or "A:" at start
    const match = text.match(/^([A-D])[\.:]/);
    if (match) {
       // Only valid if the node ITSELF is small (like just the label) 
       // or if it's a text node starting with it.
       if (text.length < 10 || node.nodeType === Node.TEXT_NODE) {
         return match[1];
       }
    }
    return null;
  };

  // Iterate over all children (spans, bolds, text, etc.)
  Array.from(pElement.childNodes).forEach(node => {
    const marker = getMarker(node);

    if (marker) {
      // Found a new marker (e.g., "B.") -> Flush previous 'A' and start 'B'
      flush();
      currentOptionId = marker;
      
      // We want to add the content of this node MINUS the marker "B."
      // If it's a text node: slice it.
      // If it's an element: usually we assume the element IS just the marker (like <b>B.</b>)
      // and we don't add it to the content buffer to keep content clean.
      if (node.nodeType === Node.TEXT_NODE) {
        const cleanText = node.textContent.replace(/^[A-D][\.:]\s*/, "");
        if (cleanText) buffer.appendChild(document.createTextNode(cleanText));
      } else {
         // It's an element like <b>A.</b>. Do not add to buffer (removes label from content).
         // If the element contained more text "<b>A. Answer</b>", we might lose "Answer".
         // But usually Word separates them.
         // Edge case check:
         const textInside = node.textContent.replace(/^[A-D][\.:]\s*/, "");
         if (textInside.length > 2) {
            // It has content inside the bold tag
            // Clone and modify content? Hard with DOM API.
            // Just append the whole thing for safety, user can edit later.
            // buffer.appendChild(node.cloneNode(true));
         }
      }
    } else {
      // No marker, just content. Add to current bucket.
      if (currentOptionId) {
        buffer.appendChild(node.cloneNode(true));
      } else {
        // Content before any "A." marker? (e.g., "Calculate: A. 1  B. 2")
        // We append this to the MAIN CONTENT of the question, not options.
        // But for simplicity, we often ignore pre-text in the options line 
        // or treat strict "A." starts.
      }
    }
  });

  flush(); // Flush the last one (D)
}