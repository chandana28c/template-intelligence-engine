const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PizZip = require('pizzip');
const xml2js = require('xml2js');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// PRODUCTION: Serve React build files
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/dist');
  app.use(express.static(clientBuildPath));
  console.log('Production mode: Serving static files from:', clientBuildPath);
}

// Template storage
const TEMPLATES_DIR = path.join(__dirname, 'templates');
const OUTPUT_DIR = path.join(__dirname, 'outputs');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Create directories if they don't exist
[TEMPLATES_DIR, OUTPUT_DIR, UPLOADS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});



// Create directories if they don't exist
[TEMPLATES_DIR, OUTPUT_DIR, UPLOADS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ADD THIS DEBUG SECTION ⬇️
console.log('=== DEBUGGING TEMPLATES ===');
console.log('Templates directory:', TEMPLATES_DIR);
console.log('Directory exists:', fs.existsSync(TEMPLATES_DIR));

if (fs.existsSync(TEMPLATES_DIR)) {
  const files = fs.readdirSync(TEMPLATES_DIR);
  console.log('Files in templates directory:', files);
  console.log('Number of templates:', files.length);
  
  // Check each template specifically
  const templateFiles = [
    'Annual_Update.docx',
    'Report.docx', 
    'Review_report.docx',
    'suitability_report.docx'
  ];
  
  templateFiles.forEach(file => {
    const fullPath = path.join(TEMPLATES_DIR, file);
    console.log(`${file}: ${fs.existsSync(fullPath) ? '✓ EXISTS' : '✗ MISSING'}`);
  });
} else {
  console.error('❌ Templates directory does not exist!');
}
console.log('=========================');
// END DEBUG SECTION ⬆️



// Configure multer for file uploads
const upload = multer({ dest: UPLOADS_DIR });

// Import processors
const DocumentProcessor = require('./documentProcessor');
const AIReportGenerator = require('./aiReportGenerator');

// Template Analysis Engine
class TemplateAnalyzer {
  constructor(docxBuffer) {
    this.zip = new PizZip(docxBuffer);
    this.documentXml = this.zip.file('word/document.xml').asText();
    this.placeholders = new Map();
  }

  async analyze() {
    const parser = new xml2js.Parser();
    const doc = await parser.parseStringPromise(this.documentXml);
    
    // Extract yellow highlighted text
    this.extractHighlightedPlaceholders(doc);
    
    return {
      placeholders: Array.from(this.placeholders.keys()),
      metadata: {
        totalPlaceholders: this.placeholders.size,
        analyzed: true
      }
    };
  }

  extractHighlightedPlaceholders(doc) {
    const body = doc['w:document']['w:body'][0];
    this.traverseForHighlights(body);
  }

  traverseForHighlights(node) {
    if (!node) return;

    if (Array.isArray(node)) {
      node.forEach(item => this.traverseForHighlights(item));
      return;
    }

    if (typeof node === 'object') {
      // Check if this is a run with highlighting
      if (node['w:r']) {
        const runs = Array.isArray(node['w:r']) ? node['w:r'] : [node['w:r']];
        runs.forEach(run => {
          if (run['w:rPr'] && run['w:rPr'][0]['w:highlight']) {
            const highlight = run['w:rPr'][0]['w:highlight'][0];
            if (highlight.$ && highlight.$['w:val'] === 'yellow') {
              // Extract text
              if (run['w:t'] && run['w:t'][0]) {
                const text = typeof run['w:t'][0] === 'string' ? run['w:t'][0] : run['w:t'][0]._;
                if (text && text.trim()) {
                  this.placeholders.set(text.trim(), {
                    original: text.trim(),
                    type: 'highlight'
                  });
                }
              }
            }
          }
        });
      }

      // Recursively traverse
      Object.keys(node).forEach(key => {
        if (key !== '$' && key !== '_') {
          this.traverseForHighlights(node[key]);
        }
      });
    }
  }
}

// Advanced Template Processor with XML Manipulation
class AdvancedTemplateProcessor {
  constructor(docxBuffer) {
    this.zip = new PizZip(docxBuffer);
  }

  async replaceHighlightedText(replacements) {
    let documentXml = this.zip.file('word/document.xml').asText();
    
    console.log('Processing replacements for', Object.keys(replacements).length, 'keys');
    
    let totalReplacements = 0;
    
    // Process each replacement - try to match the exact placeholder format
    for (const [key, value] of Object.entries(replacements)) {
      if (!value || value === '') continue;
      
      const stringValue = String(value);
      const escapedValue = this.escapeXml(stringValue);
      
      // Create multiple patterns to catch the placeholder
      // Pattern 1: Exact match with brackets [PLACEHOLDER]
      const pattern1 = new RegExp(`(<w:t[^>]*>)(\\[${this.escapeRegex(key.replace(/[\[\]]/g, ''))}\\])(</w:t>)`, 'g');
      
      // Pattern 2: Without brackets if key already has them
      const pattern2 = new RegExp(`(<w:t[^>]*>)(${this.escapeRegex(key)})(</w:t>)`, 'g');
      
      // Pattern 3: Case insensitive
      const pattern3 = new RegExp(`(<w:t[^>]*>)(${this.escapeRegex(key)})(</w:t>)`, 'gi');
      
      const patterns = [pattern1, pattern2, pattern3];
      
      patterns.forEach((pattern, index) => {
        const before = documentXml;
        documentXml = documentXml.replace(pattern, (match, p1, p2, p3) => {
          totalReplacements++;
          console.log(`Replaced: "${p2}" with "${stringValue}"`);
          return p1 + escapedValue + p3;
        });
      });
    }
    
    console.log(`Total replacements made: ${totalReplacements}`);
    
    this.zip.file('word/document.xml', documentXml);
    return this.zip.generate({ type: 'nodebuffer' });
  }

  escapeXml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  escapeRegex(text) {
    return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// API Endpoints

// Get all available templates
app.get('/api/templates', (req, res) => {
  const templates = [
    { id: 'annual_update', name: 'Annual Update', file: 'Annual_Update.docx' },
    // { id: 'ar_letter', name: 'Annual Review Letter', file: 'AR_Letter_New.docx' }, // Removed - template not found
    { id: 'report', name: 'Report', file: 'Report.docx' },
    { id: 'review_report', name: 'Review Report', file: 'Review_report.docx' },
    { id: 'suitability_report', name: 'Suitability Report', file: 'suitability_report.docx' }
  ];
  
  res.json(templates);
});

// Analyze a template
app.post('/api/analyze-template', async (req, res) => {
  try {
    const { templateId } = req.body;
    const templatePath = path.join(TEMPLATES_DIR, `${templateId}.docx`);
    
    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    const buffer = fs.readFileSync(templatePath);
    const analyzer = new TemplateAnalyzer(buffer);
    const analysis = await analyzer.analyze();
    
    res.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate document from template
app.post('/api/generate-document', async (req, res) => {
  try {
    const { templateId, clientData } = req.body;
    
    console.log(`Generating document for template: ${templateId}`);
    
    const templatePath = path.join(TEMPLATES_DIR, `${templateId}.docx`);
    
    if (!fs.existsSync(templatePath)) {
      console.error(`Template not found: ${templatePath}`);
      return res.status(404).json({ error: 'Template not found' });
    }
    
    const buffer = fs.readFileSync(templatePath);
    const processor = new AdvancedTemplateProcessor(buffer);
    const outputBuffer = await processor.replaceHighlightedText(clientData);
    
    // Generate unique filename
    const filename = `${templateId}_${Date.now()}.docx`;
    const outputPath = path.join(OUTPUT_DIR, filename);
    
    fs.writeFileSync(outputPath, outputBuffer);
    
    console.log(`Document generated successfully: ${filename}`);
    
    res.json({
      success: true,
      filename,
      downloadUrl: `/api/download/${filename}`
    });
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate multiple documents at once
app.post('/api/generate-batch', async (req, res) => {
  try {
    const { templates, clientData } = req.body;
    
    console.log(`Batch generation started for ${templates.length} templates`);
    console.log('Client data keys:', Object.keys(clientData));
    
    const results = [];
    
    for (const templateId of templates) {
      const templatePath = path.join(TEMPLATES_DIR, `${templateId}.docx`);
      
      if (!fs.existsSync(templatePath)) {
        console.error(`Template not found: ${templateId}`);
        results.push({ templateId, error: 'Template not found' });
        continue;
      }
      
      try {
        const buffer = fs.readFileSync(templatePath);
        const processor = new AdvancedTemplateProcessor(buffer);
        const outputBuffer = await processor.replaceHighlightedText(clientData);
        
        const filename = `${templateId}_${Date.now()}.docx`;
        const outputPath = path.join(OUTPUT_DIR, filename);
        
        fs.writeFileSync(outputPath, outputBuffer);
        
        console.log(`Generated: ${filename} (${outputBuffer.length} bytes)`);
        
        results.push({
          templateId,
          success: true,
          filename,
          downloadUrl: `/api/download/${filename}`
        });
        
        // Small delay to ensure unique filenames
        await new Promise(resolve => setTimeout(resolve, 10));
      } catch (error) {
        console.error(`Error generating ${templateId}:`, error);
        results.push({ templateId, error: error.message });
      }
    }
    
    console.log(`Batch generation complete. ${results.filter(r => r.success).length}/${templates.length} successful`);
    
    res.json({ results });
  } catch (error) {
    console.error('Batch generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI-Powered Report Generation Endpoint
app.post('/api/generate-ai-report', upload.array('documents', 20), async (req, res) => {
  try {
    const uploadedFiles = req.files;
    const { clientName } = req.body;
    
    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ error: 'No documents uploaded' });
    }
    
    if (!clientName) {
      return res.status(400).json({ error: 'Client name is required' });
    }
    
    console.log(`Generating AI report from ${uploadedFiles.length} documents for ${clientName}`);
    
    // Step 1: Extract text from all documents
    const processor = new DocumentProcessor();
    const extractedTexts = await processor.processDocuments(uploadedFiles);
    const formattedData = processor.formatForAI(extractedTexts);
    
    console.log('Extracted data from documents');
    console.log('Data preview:', formattedData.substring(0, 500) + '...');
    
    // Step 2: Generate report using AI
    const generator = new AIReportGenerator();
    const filename = `AI_Suitability_Report_${clientName.replace(/\s+/g, '_')}_${Date.now()}.docx`;
    const outputPath = path.join(OUTPUT_DIR, filename);
    
    await generator.generateReport(formattedData, clientName, outputPath);
    
    console.log(`Generated AI report: ${filename}`);
    
    // Step 3: Cleanup uploaded files
    uploadedFiles.forEach(f => {
      try {
        fs.unlinkSync(f.path);
      } catch (err) {
        console.error('Error cleaning up file:', err);
      }
    });
    
    res.json({
      success: true,
      filename,
      downloadUrl: `/api/download/${filename}`,
      message: 'AI-powered report generated successfully'
    });
    
  } catch (error) {
    console.error('AI report generation error:', error);
    
    // Cleanup on error
    if (req.files) {
      req.files.forEach(f => {
        try {
          fs.unlinkSync(f.path);
        } catch (err) {
          // Ignore cleanup errors
        }
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Download generated document
app.get('/api/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(OUTPUT_DIR, filename);
  
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  // Set proper headers for .docx download
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
  
  // Stream the file
  const fileStream = fs.createReadStream(filepath);
  fileStream.pipe(res);
  
  fileStream.on('error', (err) => {
    console.error('File stream error:', err);
    res.status(500).json({ error: 'Error streaming file' });
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// PRODUCTION: Serve React app for all non-API routes
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    const clientBuildPath = path.join(__dirname, '../client/dist');
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Template Intelligence Engine running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Templates directory: ${TEMPLATES_DIR}`);
  console.log(`Outputs directory: ${OUTPUT_DIR}`);
  console.log(`Uploads directory: ${UPLOADS_DIR}`);
});