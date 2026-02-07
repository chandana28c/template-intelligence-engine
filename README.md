# Template Intelligence Engine

> AI-Powered Financial Advisory Document Generation System

Built for the AdvisoryAI Hack-to-Hire Challenge - A sophisticated solution to automate the generation of personalized financial advisory documents from Word templates.

## 🎯 Problem Statement

Financial advisory firms use dozens of different report templates (suitability reports, annual reviews, etc.). Each template contains highlighted placeholders that need to be replaced with client-specific information. Currently, this process takes 4+ hours per template to set up and requires manual intervention for each client.

This solution automates the entire process using intelligent template parsing and dynamic content replacement.

## ✨ Features

- **🔍 Intelligent Template Analysis**: Automatically identifies yellow-highlighted placeholders in Word documents
- **⚡ Batch Processing**: Generate multiple documents for a client simultaneously
- **🎨 Format Preservation**: Maintains original document formatting, styles, and structure
- **📦 Browser Downloads**: Download generated documents directly in the browser
- **🚀 Fast Setup**: No 4-hour template configuration needed
- **💼 Professional UI**: Clean, intuitive interface for financial advisors

## 🏗️ Architecture

### Backend (Node.js + Express)
- Template analysis engine using XML parsing
- Document generation with PizZip/JSZip
- RESTful API for template operations
- File management and download endpoints

### Frontend (React + Vite)
- Modern, responsive UI with step-by-step workflow
- Real-time form validation
- Batch document generation
- Direct browser downloads

## 📋 Prerequisites

- Node.js 16+ and npm
- Templates in `.docx` format with yellow-highlighted placeholders

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Install dependencies
npm run setup
```

### 2. Add Your Templates

Copy your `.docx` templates to `server/templates/` and name them:
- `annual_update.docx` → Annual Update
- `ar_letter.docx` → Annual Review Letter
- `report.docx` → Report
- `review_report.docx` → Review Report
- `suitability_report.docx` → Suitability Report

**Important**: Templates must have yellow-highlighted text for placeholders that will be replaced.

### 3. Run the Application

```bash
# Start both server and client in development mode
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📖 How It Works

### Step 1: Template Preparation
Templates should have **yellow-highlighted text** for any fields that need to be replaced with client data. For example:
- `[Client Name]` → highlighted in yellow
- `[Portfolio Value]` → highlighted in yellow
- `[Risk Level]` → highlighted in yellow

### Step 2: Template Selection
Users select which templates they want to generate for a specific client.

### Step 3: Client Data Input
Users enter client information into a form with fields like:
- Client Name
- Address
- Portfolio Value
- Risk Level
- Investment Goals
- etc.

### Step 4: Generation & Download
The system:
1. Parses the Word document XML structure
2. Identifies all yellow-highlighted placeholders
3. Replaces placeholders with client data
4. Preserves all formatting (fonts, tables, styles, headers, footers)
5. Generates downloadable `.docx` files

## 🔧 API Endpoints

### GET /api/templates
Returns list of available templates

### POST /api/generate-batch
Generates multiple documents at once
```json
{
  "templates": ["annual_update", "report"],
  "clientData": {
    "clientName": "John Smith",
    "portfolioValue": "100000",
    ...
  }
}
```

### GET /api/download/:filename
Downloads a generated document

## 📁 Project Structure

```
template-intelligence-engine/
├── server/
│   ├── index.js              # Express server & template engine
│   ├── templates/            # Input templates (.docx)
│   └── outputs/              # Generated documents
├── client/
│   ├── src/
│   │   ├── App.jsx           # Main React component
│   │   ├── App.css           # Styling
│   │   └── main.jsx          # React entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── package.json
└── README.md
```

## 🛠️ Technology Stack

**Backend:**
- Express.js - Web framework
- PizZip - ZIP file manipulation
- xml2js - XML parsing
- Multer - File uploads

**Frontend:**
- React 18 - UI framework
- Vite - Build tool
- Axios - HTTP client
- Lucide React - Icons

## 🎨 Key Implementation Details

### Template Analysis
The system uses XML parsing to:
1. Unzip the `.docx` file (which is actually a ZIP archive)
2. Parse `word/document.xml`
3. Traverse the XML tree to find `<w:highlight w:val="yellow"/>` tags
4. Extract the text content from these highlighted runs

### Content Replacement
Replacement preserves formatting by:
1. Working directly with the XML structure
2. Replacing only text content within `<w:t>` tags
3. Keeping all formatting properties (`<w:rPr>`) intact
4. Maintaining document structure (paragraphs, tables, etc.)

### XML Safety
All replacements:
- Escape XML special characters (`&`, `<`, `>`, `"`, `'`)
- Preserve the document schema
- Maintain valid WordML structure

## 🔐 Security Considerations

For production deployment:
- Add authentication/authorization
- Implement rate limiting
- Validate file uploads
- Sanitize all inputs
- Use HTTPS
- Add file size limits
- Implement virus scanning for uploads

## 🚧 Future Enhancements

- [ ] Template upload via UI
- [ ] Custom field mapping interface
- [ ] Template versioning
- [ ] Client data import from CSV/Excel
- [ ] Document preview before download
- [ ] Integration with CRM systems
- [ ] Multi-user support with roles
- [ ] Document storage and retrieval
- [ ] Audit trail for compliance
- [ ] LLM integration for smart content generation

## 📝 Development Notes

### Adding New Templates

1. Add template file to `server/templates/`
2. Update template list in `server/index.js`:
```javascript
const templates = [
  { id: 'your_template', name: 'Your Template', file: 'your_template.docx' }
];
```

### Customizing Client Fields

Edit the `commonFields` array in `client/src/App.jsx`:
```javascript
const commonFields = [
  { key: 'fieldName', label: 'Field Label', placeholder: 'Placeholder' },
  ...
];
```

## 🤝 Contributing

This is a hackathon project. Suggestions and improvements are welcome!

## 📄 License

MIT License - See LICENSE file for details

## 👥 Author

Built for AdvisoryAI Hack-to-Hire Challenge

---

**Note**: This is a proof-of-concept built in one week. For production use, additional security, testing, and compliance features should be added.
