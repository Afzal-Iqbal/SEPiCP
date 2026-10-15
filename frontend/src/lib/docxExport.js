// frontend/src/lib/docxExport.js
// Utility to export Assistant Analysis Results & Recommendations to Microsoft Word (.doc / .docx)

/**
 * Formats raw citation object or JSON string into a standardized APA 7th style academic citation.
 * @param {Object|string} cit Citation object or raw string
 * @param {number} index Citation marker number (1-indexed)
 * @returns {string} Standardized APA 7th Academic Citation
 */
export function formatAcademicCitation(cit, index = 1) {
  let data = cit;

  if (typeof cit === 'string') {
    const trimmed = cit.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        data = JSON.parse(trimmed);
      } catch (e) {
        data = { paper_title: cit };
      }
    } else {
      data = { paper_title: cit };
    }
  }

  if (!data || typeof data !== 'object') {
    return `[${index}] SEPiCP Academic Corpus (n.d.). Reference #${index}.`;
  }

  const marker = data.marker || `[${index}]`;
  let title = data.paper_title || data.title || "Academic Study";

  // Clean up .pdf extension, underscores, and trailing whitespace
  title = title.replace(/\.pdf$/i, '').replace(/_/g, ' ').trim();

  let author = data.author || data.authors || "";
  let year = data.year || data.publication_year || "";

  // Extract year if embedded in title (e.g. 2023 or 2021)
  if (!year) {
    const yearMatch = title.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      year = yearMatch[0];
      title = title.replace(yearMatch[0], '').replace(/\(\s*\)/g, '').replace(/\[\s*\]/g, '').trim();
    } else {
      year = "n.d.";
    }
  }

  // Extract author if embedded in title (e.g. "Smith et al - Title")
  if (!author && title.includes('-')) {
    const parts = title.split('-');
    if (parts.length >= 2 && parts[0].trim().length < 40) {
      author = parts[0].trim();
      title = parts.slice(1).join('-').trim();
    }
  }

  if (!author) {
    author = "SEPiCP Research Corpus";
  }

  const pageStr = data.page_number ? `, p. ${data.page_number}` : '';
  const sectionStr = data.section ? ` (${String(data.section).toUpperCase()} section)` : '';
  const journalStr = data.journal || data.source || "Social Innovation Education Corpus";

  // Standard APA 7th style format: Marker Author (Year). Title. Source/Journal (Section), p. X.
  return `${marker} ${author} (${year}). ${title}. ${journalStr}${sectionStr}${pageStr}.`;
}

/**
 * Converts batch assistant analysis results into a styled Microsoft Word document and triggers download.
 * @param {Array} items Array of result objects: { variable, question, column, prompt, answer, citations, mean }
 * @param {Object} metadata Dataset and session metadata (datasetId, courseName, totalFeatures)
 */
export function exportBatchToWord(items = [], metadata = {}) {
  if (!items || items.length === 0) {
    alert("No batch analysis results to export.");
    return;
  }

  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const title = metadata.courseName 
    ? `Actionable Research Advisory: ${metadata.courseName}`
    : `Low Features Analysis & Advisory Report`;

  // Build HTML string compatible with Microsoft Word import
  let htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:w="urn:schemas-microsoft-com:office:word" 
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Calibri', 'Arial', sans-serif;
          font-size: 11pt;
          line-height: 1.5;
          color: #1e293b;
          padding: 20px;
        }
        h1 {
          color: #1e3a8a;
          font-size: 20pt;
          font-weight: bold;
          margin-bottom: 5px;
          border-bottom: 2px solid #1e3a8a;
          padding-bottom: 8px;
        }
        .meta-info {
          font-size: 9.5pt;
          color: #64748b;
          margin-bottom: 25px;
        }
        .feature-card {
          border: 1px solid #cbd5e1;
          background-color: #f8fafc;
          padding: 15px;
          margin-bottom: 25px;
          border-radius: 8px;
        }
        .feature-header {
          font-size: 14pt;
          font-weight: bold;
          color: #0f172a;
          margin-bottom: 6px;
        }
        .badge {
          display: inline-block;
          background-color: #dbeafe;
          color: #1e40af;
          font-size: 9pt;
          font-weight: bold;
          padding: 3px 8px;
          border-radius: 4px;
          margin-right: 8px;
        }
        .prompt-box {
          background-color: #eff6ff;
          border-left: 4px solid #2563eb;
          padding: 10px 14px;
          margin: 12px 0;
          font-style: italic;
          font-weight: 500;
          color: #1e3a8a;
        }
        .section-title {
          font-size: 11pt;
          font-weight: bold;
          color: #0f172a;
          margin-top: 14px;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .answer-content {
          font-size: 11pt;
          color: #334155;
          margin-bottom: 12px;
          white-space: pre-wrap;
        }
        .citation-item {
          font-size: 9.5pt;
          color: #334155;
          margin-left: 15px;
          margin-bottom: 6px;
          line-height: 1.4;
        }
        .footer {
          margin-top: 40px;
          border-top: 1px solid #e2e8f0;
          padding-top: 10px;
          font-size: 9pt;
          color: #94a3b8;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="meta-info">
        <strong>Generated:</strong> ${dateStr} | 
        <strong>Analyzed Features:</strong> ${items.length} | 
        <strong>Dataset:</strong> ${metadata.datasetId ? `Dataset #${metadata.datasetId}` : 'Survey Analysis Session'}
      </div>

      <p>This report contains grounded academic recommendations generated by the Research Assistant for low-scoring survey variables. Each section details the diagnostic query executed and evidence-backed pedagogical strategies formatted with standardized APA 7th citations.</p>

      <hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 20px 0;" />
  `;

  items.forEach((item, index) => {
    const colBadge = item.column ? `<span class="badge">Column ${item.column}</span>` : '';
    const scoreBadge = (item.mean !== undefined && item.mean !== null) 
      ? `<span class="badge" style="background-color: #ffe4e6; color: #9f1239;">Mean Score: ${Number(item.mean).toFixed(2)}</span>` 
      : '';

    htmlContent += `
      <div class="feature-card">
        <div class="feature-header">
          ${index + 1}. ${item.question || item.variable || `Feature #${index + 1}`}
        </div>
        <div>
          ${colBadge}
          ${scoreBadge}
          <span style="font-size: 9pt; color: #64748b;">Variable: <code>${item.variable}</code></span>
        </div>

        <div class="section-title">Executed Diagnostic Prompt:</div>
        <div class="prompt-box">
          "${item.prompt}"
        </div>

        <div class="section-title">Assistant Analysis & Recommendations:</div>
        <div class="answer-content">
          ${item.answer ? item.answer.replace(/\n/g, '<br/>') : 'No recommendations generated.'}
        </div>
    `;

    if (item.citations && item.citations.length > 0) {
      htmlContent += `
        <div class="section-title" style="font-size: 10pt; color: #475569;">Supporting Academic Citations (APA 7th):</div>
      `;
      item.citations.forEach((cit, cIdx) => {
        const formattedAPA = formatAcademicCitation(cit, cIdx + 1);
        htmlContent += `<div class="citation-item">${formattedAPA}</div>`;
      });
    }

    htmlContent += `</div>`;
  });

  htmlContent += `
      <div class="footer">
        Generated by SEPiCP Grounded PDF Research Assistant • Social Innovation Education Project
      </div>
    </body>
    </html>
  `;

  // Create Blob with Word Document MIME type
  const blob = new Blob(['\ufeff' + htmlContent], {
    type: 'application/msword;charset=utf-8'
  });

  // Trigger browser file download
  const fileName = `SEPiCP_Feature_Analysis_Report_${new Date().toISOString().slice(0, 10)}.doc`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
