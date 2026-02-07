const mammoth = require('mammoth');
const pdfParse = require('pdf-parse'); // Changed from 'pdf-parse' import
const fs = require('fs');

class DocumentProcessor {
  async extractDocx(filePath) {
    try {
      const buffer = fs.readFileSync(filePath);
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      console.error('Error extracting DOCX:', error);
      return '';
    }
  }

  async extractPdf(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer); // Fixed: use pdfParse
      return data.text;
    } catch (error) {
      console.error('Error extracting PDF:', error);
      return '';
    }
  }

  async processDocuments(files) {
    const extractedTexts = {};
    
    for (const file of files) {
      let text = '';
      const fileName = file.originalname || file.filename || 'unknown';
      
      console.log(`Processing: ${fileName}`);
      
      try {
        if (fileName.toLowerCase().endsWith('.docx')) {
          text = await this.extractDocx(file.path);
        } else if (fileName.toLowerCase().endsWith('.pdf')) {
          text = await this.extractPdf(file.path);
        } else {
          console.log(`Skipping unsupported file: ${fileName}`);
          continue;
        }
        
        // Categorize by document type
        const lowerName = fileName.toLowerCase();
        
        if (lowerName.includes('fact find') || lowerName.includes('factfind')) {
          extractedTexts.factFind = (extractedTexts.factFind || '') + text + '\n\n';
        } else if (lowerName.includes('meeting note') || lowerName.includes('meetingnote')) {
          extractedTexts.meetingNotes = (extractedTexts.meetingNotes || '') + text + '\n\n';
        } else if (lowerName.includes('risk')) {
          extractedTexts.riskQuestionnaire = (extractedTexts.riskQuestionnaire || '') + text + '\n\n';
        } else if (lowerName.includes('illustration')) {
          extractedTexts.illustration = (extractedTexts.illustration || '') + text + '\n\n';
        } else {
          extractedTexts.other = (extractedTexts.other || '') + text + '\n\n';
        }
        
        console.log(`Extracted ${text.length} characters from ${fileName}`);
        
      } catch (error) {
        console.error(`Error processing ${fileName}:`, error);
      }
    }
    
    return extractedTexts;
  }

  formatForAI(extractedTexts) {
    let formatted = '';
    
    if (extractedTexts.factFind) {
      formatted += `FACT FIND:\n${extractedTexts.factFind}\n\n`;
    }
    if (extractedTexts.meetingNotes) {
      formatted += `MEETING NOTES:\n${extractedTexts.meetingNotes}\n\n`;
    }
    if (extractedTexts.riskQuestionnaire) {
      formatted += `RISK ASSESSMENT:\n${extractedTexts.riskQuestionnaire}\n\n`;
    }
    if (extractedTexts.illustration) {
      formatted += `PRODUCT ILLUSTRATION:\n${extractedTexts.illustration}\n\n`;
    }
    if (extractedTexts.other) {
      formatted += `OTHER DOCUMENTS:\n${extractedTexts.other}\n\n`;
    }
    
    return formatted;
  }
}

module.exports = DocumentProcessor;