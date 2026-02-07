# Template Intelligence Engine - Technical Documentation

## System Architecture

### Overview
The Template Intelligence Engine is a full-stack web application designed to automate the generation of personalized financial advisory documents from Word templates with highlighted placeholders.

### Architecture Diagram
```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Template   │  │ Client Data  │  │  Document Download   │  │
│  │   Selection  │  │    Input     │  │     Management       │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP/REST API
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (Node.js/Express)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Template   │  │   Template   │  │    Document          │  │
│  │   Analysis   │  │  Processing  │  │   Generation         │  │
│  │   Engine     │  │   Engine     │  │   & Delivery         │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         File System                              │
│        Templates (Input)          Outputs (Generated)            │
│         server/templates/          server/outputs/               │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Template Analysis Engine (`TemplateAnalyzer`)

**Purpose**: Analyzes Word documents to identify placeholders

**How it works**:
1. Unzips the `.docx` file (which is a ZIP archive containing XML files)
2. Parses `word/document.xml` using xml2js
3. Traverses the XML tree to find runs (`<w:r>`) with yellow highlighting
4. Extracts text content from highlighted runs
5. Returns a list of unique placeholders

**Key Code**:
```javascript
class TemplateAnalyzer {
  constructor(docxBuffer) {
    this.zip = new PizZip(docxBuffer);
    this.documentXml = this.zip.file('word/document.xml').asText();
  }

  async analyze() {
    // Parse XML and extract highlighted text
    const parser = new xml2js.Parser();
    const doc = await parser.parseStringPromise(this.documentXml);
    this.extractHighlightedPlaceholders(doc);
    return {
      placeholders: Array.from(this.placeholders.keys()),
      metadata: { totalPlaceholders: this.placeholders.size }
    };
  }
}
```

### 2. Template Processing Engine (`AdvancedTemplateProcessor`)

**Purpose**: Replaces placeholders with client data while preserving formatting

**How it works**:
1. Loads the template as a ZIP archive
2. Extracts `word/document.xml`
3. Uses regex to find and replace text within `<w:t>` tags
4. Escapes XML special characters in replacement values
5. Preserves all formatting tags (`<w:rPr>`, `<w:highlight>`, etc.)
6. Repackages the modified XML into a new `.docx` file

**Key Code**:
```javascript
class AdvancedTemplateProcessor {
  async replaceHighlightedText(replacements) {
    let documentXml = this.zip.file('word/document.xml').asText();
    
    for (const [key, value] of Object.entries(replacements)) {
      const escapedValue = this.escapeXml(value);
      const pattern = new RegExp(
        `(<w:t[^>]*>)${this.escapeRegex(key)}(</w:t>)`, 
        'g'
      );
      documentXml = documentXml.replace(pattern, `$1${escapedValue}$2`);
    }
    
    this.zip.file('word/document.xml', documentXml);
    return this.zip.generate({ type: 'nodebuffer' });
  }
}
```

## Word Document Structure (WordML)

### Understanding .docx Files

A `.docx` file is actually a ZIP archive containing:
- XML files (document content, styles, settings)
- Media files (images, embedded objects)
- Relationship files (linking content together)

**Structure**:
```
document.docx (ZIP archive)
├── word/
│   ├── document.xml          ← Main content
│   ├── styles.xml            ← Formatting styles
│   ├── numbering.xml         ← List definitions
│   ├── header1.xml           ← Header content
│   ├── footer1.xml           ← Footer content
│   └── _rels/
│       └── document.xml.rels ← Relationships
├── _rels/
│   └── .rels
└── [Content_Types].xml
```

### XML Structure for Highlighted Text

```xml
<w:p>                                    <!-- Paragraph -->
  <w:r>                                  <!-- Run (text with same formatting) -->
    <w:rPr>                              <!-- Run properties -->
      <w:highlight w:val="yellow"/>     <!-- Yellow highlighting -->
      <w:b/>                            <!-- Bold -->
      <w:sz w:val="24"/>                <!-- Font size -->
    </w:rPr>
    <w:t>[Client Name]</w:t>            <!-- Text content (placeholder) -->
  </w:r>
</w:p>
```

### How Replacement Works

**Before Replacement**:
```xml
<w:r>
  <w:rPr><w:highlight w:val="yellow"/></w:rPr>
  <w:t>[Client Name]</w:t>
</w:r>
```

**After Replacement**:
```xml
<w:r>
  <w:rPr><w:highlight w:val="yellow"/></w:rPr>
  <w:t>John Smith</w:t>
</w:r>
```

Note: The highlighting and all other formatting is preserved!

## API Reference

### GET /api/templates
Returns list of available templates

**Response**:
```json
[
  {
    "id": "annual_update",
    "name": "Annual Update",
    "file": "annual_update.docx"
  },
  ...
]
```

### POST /api/analyze-template
Analyzes a template to extract placeholders

**Request**:
```json
{
  "templateId": "annual_update"
}
```

**Response**:
```json
{
  "placeholders": ["[Client Name]", "[Portfolio Value]", ...],
  "metadata": {
    "totalPlaceholders": 32,
    "analyzed": true
  }
}
```

### POST /api/generate-batch
Generates multiple documents at once

**Request**:
```json
{
  "templates": ["annual_update", "report"],
  "clientData": {
    "[Client Name]": "John Smith",
    "[Portfolio Value]": "£100,000",
    ...
  }
}
```

**Response**:
```json
{
  "results": [
    {
      "templateId": "annual_update",
      "success": true,
      "filename": "annual_update_1707264000000.docx",
      "downloadUrl": "/api/download/annual_update_1707264000000.docx"
    },
    ...
  ]
}
```

### GET /api/download/:filename
Downloads a generated document

**Response**: Binary .docx file

## Frontend Component Structure

### App.jsx - Main Application

**State Management**:
- `templates`: List of available templates
- `selectedTemplates`: Array of selected template IDs
- `clientData`: Object mapping field keys to values
- `generatedFiles`: Array of generation results
- `currentStep`: 'select' | 'input' | 'generate' | 'complete'

**Workflow**:
1. **Step 1 - Template Selection**: User selects which templates to generate
2. **Step 2 - Data Input**: User enters client information
3. **Step 3 - Generation**: System generates documents (loading state)
4. **Step 4 - Download**: User downloads generated files

### Key Features

**Step Indicator**: Visual progress through the workflow
```jsx
<div className="steps">
  <div className={`step ${currentStep === 'select' ? 'active' : ''}`}>
    <div className="step-number">1</div>
    <div className="step-label">Select Templates</div>
  </div>
  ...
</div>
```

**Template Selection**: Multi-select with visual feedback
```jsx
<div className="templates-grid">
  {templates.map(template => (
    <div
      className={`template-card ${selected ? 'selected' : ''}`}
      onClick={() => handleTemplateToggle(template.id)}
    >
      <FileText className="template-icon" />
      <h3>{template.name}</h3>
    </div>
  ))}
</div>
```

**Dynamic Form Generation**:
```jsx
<div className="form-grid">
  {commonFields.map(field => (
    <div className="form-group">
      <label>{field.label}</label>
      <input
        type={field.type || 'text'}
        value={clientData[field.key] || ''}
        onChange={(e) => handleInputChange(field.key, e.target.value)}
      />
    </div>
  ))}
</div>
```

**File Download**: Direct browser download using Blob
```jsx
const downloadFile = async (downloadUrl, filename) => {
  const response = await axios.get(downloadUrl, {
    responseType: 'blob'
  });
  
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
```

## Performance Considerations

### Template Processing
- **Caching**: Templates are loaded once from disk
- **Streaming**: Large files use buffer streaming
- **Parallel Processing**: Batch generation uses async/await for concurrent processing

### Memory Management
- Generated files are cleaned up after download
- ZIP operations use buffers efficiently
- XML parsing is done in memory for speed

## Security Considerations

### Current Implementation (Development)
- No authentication
- No input validation
- No file size limits
- No virus scanning

### Production Requirements
1. **Authentication**: JWT or session-based auth
2. **Input Validation**: Sanitize all user inputs
3. **File Validation**: Check file types, sizes, and content
4. **Rate Limiting**: Prevent abuse
5. **Virus Scanning**: Scan uploaded files
6. **HTTPS**: Encrypt all traffic
7. **CORS**: Restrict origins
8. **SQL Injection Prevention**: Use parameterized queries if database is added

## Testing Strategy

### Unit Tests
- Template analyzer with various XML structures
- Replacement engine with edge cases
- XML escaping functions

### Integration Tests
- Full document generation workflow
- Batch processing
- Error handling

### End-to-End Tests
- Complete user workflow from selection to download
- Multiple template generation
- Edge cases (empty fields, special characters)

## Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
NODE_ENV=production npm start
```

### Environment Variables
```env
PORT=5000
NODE_ENV=production
TEMPLATES_DIR=/path/to/templates
OUTPUTS_DIR=/path/to/outputs
```

## Troubleshooting

### Common Issues

**Issue**: Generated document won't open
- **Cause**: Invalid XML structure
- **Solution**: Ensure all XML is properly escaped

**Issue**: Formatting is lost
- **Cause**: Replacing entire runs instead of just text
- **Solution**: Only replace content within `<w:t>` tags

**Issue**: Placeholders not being replaced
- **Cause**: Placeholder text doesn't exactly match
- **Solution**: Ensure exact text match including whitespace

## Future Enhancements

1. **Smart Content Generation**: Use LLM to generate contextual content
2. **Template Builder UI**: Visual template creation and editing
3. **Version Control**: Track template changes
4. **Audit Trail**: Log all document generations
5. **CRM Integration**: Pull client data from external systems
6. **Cloud Storage**: Store templates and outputs in S3/Azure
7. **Real-time Collaboration**: Multiple users editing simultaneously
8. **Advanced Formatting**: Support for conditional sections, loops, etc.

## References

- [Office Open XML Format](https://en.wikipedia.org/wiki/Office_Open_XML)
- [WordProcessingML](https://docs.microsoft.com/en-us/office/open-xml/word-processing)
- [PizZip Documentation](https://stuk.github.io/jszip/)
- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
