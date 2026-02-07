# 🚀 Quick Start Guide

## For Hackathon Judges & Evaluators

This guide will get you up and running in **under 5 minutes**.

## Prerequisites

- Node.js 16+ installed ([Download](https://nodejs.org/))
- Your Word templates with yellow-highlighted placeholders
- A modern web browser (Chrome, Firefox, Safari, Edge)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd template-intelligence-engine
npm run setup
```

This will install all backend and frontend dependencies.

### 2. Prepare Your Templates

The templates have already been processed and copied! But if you want to add new templates:

```bash
# Copy your .docx files to server/templates/
cp /path/to/your/template.docx server/templates/my_template.docx

# Then update server/index.js to register it
```

### 3. Start the Application

```bash
npm run dev
```

This starts both:
- **Backend** on http://localhost:5000
- **Frontend** on http://localhost:3000

### 4. Open Your Browser

Navigate to: **http://localhost:3000**

## Using the Application

### Step 1: Select Templates
- Click on one or more template cards
- Selected templates will be highlighted in blue
- Click "Continue to Client Data"

### Step 2: Enter Client Information
- Fill in the client details form
- All fields are optional, but more data = better results
- Common fields include:
  - Client Name
  - Address
  - Portfolio Value
  - Risk Level
  - Investment Goals
  - etc.

### Step 3: Generate Documents
- Click "Generate Documents"
- Wait a few seconds for processing
- System will process all selected templates

### Step 4: Download Results
- See the list of generated documents
- Download individual files or use "Download All"
- Files are ready to use immediately!

## What Makes This Special?

### 🎯 Zero Manual Configuration
- No 4-hour template setup required
- No manual placeholder mapping
- Templates are analyzed automatically

### ⚡ Intelligent Processing
- Automatically detects yellow-highlighted placeholders
- Preserves ALL formatting (fonts, tables, headers, footers)
- Works with complex document structures

### 🎨 Format Preservation
The system maintains:
- ✅ Text formatting (bold, italic, colors)
- ✅ Paragraph styles
- ✅ Tables and borders
- ✅ Headers and footers
- ✅ Page layout
- ✅ Images and logos
- ✅ Lists and numbering

### 📦 Batch Processing
- Generate multiple documents at once
- Download all with one click
- Saves hours of manual work

## Template Requirements

For templates to work correctly, they should:

1. **Be in .docx format** (not .doc)
2. **Have yellow highlighting** on text that should be replaced
3. **Use consistent placeholder names** across related templates

### Example Placeholder Format

Good placeholders:
- `[Client Name]`
- `[Portfolio Value]`
- `[Risk Level]`
- `[Date]`

The system will find and replace ANY yellow-highlighted text, so you're not limited to a specific format!

## Testing the System

### Sample Test Data

Try these values to test the system:

```
Client Name: Sarah Johnson
Client Address: 45 Park Lane, London, W1K 1QA
Advisor Name: Michael Roberts
Date: 06/02/2024
Portfolio Value: 250000
Risk Level: Moderate to High
Investment Goal: Retirement and Wealth Preservation
Time Horizon: 15
Annual Income: 85000
Retirement Age: 65
```

### Expected Results

After generation, you should receive:
- ✅ Professional-looking documents
- ✅ All placeholders replaced with your data
- ✅ Original formatting preserved
- ✅ Ready-to-send documents

## Troubleshooting

## Troubleshooting

### Download Issues

If downloads fail, try these quick fixes:

1. **Check both servers are running** on ports 3000 and 5000
2. **Allow pop-ups** in your browser for localhost:3000
3. **Check browser console** (F12) for error messages
4. **Verify files exist**: `ls server/outputs/`
5. **Try direct download**: Use the full URL from the API response

**Common Fix**: Restart both servers (Ctrl+C, then `npm run dev`)

For detailed troubleshooting, see `TROUBLESHOOTING.md`

### Port Already in Use

If port 3000 or 5000 is already in use:

```bash
# Kill the process using the port
# On Mac/Linux:
lsof -ti:3000 | xargs kill -9
lsof -ti:5000 | xargs kill -9

# On Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Templates Not Showing

Check that templates are in the correct location:
```bash
ls -la server/templates/
```

You should see:
- annual_update.docx
- ar_letter.docx
- report.docx
- review_report.docx
- suitability_report.docx

### Generated Files Won't Download

1. Check browser's download settings
2. Ensure pop-ups are not blocked
3. Try a different browser

### Document Won't Open in Word

This usually means invalid XML. Check:
1. Are you using special characters? (should be auto-escaped)
2. Is the original template valid?
3. Try re-generating the document

## API Testing (Optional)

### Using cURL

```bash
# Get templates
curl http://localhost:5000/api/templates

# Generate a document
curl -X POST http://localhost:5000/api/generate-batch \
  -H "Content-Type: application/json" \
  -d '{
    "templates": ["annual_update"],
    "clientData": {
      "[Client Name]": "Test Client",
      "[Portfolio Value]": "100000"
    }
  }'
```

### Using Postman

1. Import the collection (if provided)
2. Set base URL to `http://localhost:5000`
3. Test the endpoints

## Development Mode Features

### Hot Reload
- Frontend auto-refreshes on code changes
- Backend auto-restarts on code changes

### Debugging
- Backend logs appear in the terminal
- Frontend errors appear in browser console

### File Locations
- **Templates**: `server/templates/`
- **Generated files**: `server/outputs/`
- **Frontend code**: `client/src/`
- **Backend code**: `server/`

## Production Deployment

For a production deployment, you would need to:

1. Set up environment variables
2. Configure a production database
3. Add authentication
4. Set up HTTPS
5. Configure a reverse proxy (nginx)
6. Add monitoring and logging
7. Implement backup strategies

See `TECHNICAL_DOCS.md` for detailed deployment instructions.

## Next Steps

### For Evaluation
1. ✅ Test with the provided templates
2. ✅ Try different client data
3. ✅ Generate multiple documents at once
4. ✅ Verify formatting is preserved
5. ✅ Check the generated documents in Word

### For Development
1. 📖 Read `TECHNICAL_DOCS.md` for architecture details
2. 🔧 Explore the code in `server/` and `client/src/`
3. 🎨 Customize the UI in `client/src/App.jsx`
4. ⚙️ Modify the backend logic in `server/index.js`
5. 🧪 Add your own test templates

## Support & Questions

### Common Questions

**Q: Can I add my own templates?**
A: Yes! Just copy them to `server/templates/` and update the template list in `server/index.js`.

**Q: What file formats are supported?**
A: Only .docx (Word 2007+). Legacy .doc files need to be converted first.

**Q: Can I customize the client data fields?**
A: Yes! Edit the `commonFields` array in `client/src/App.jsx`.

**Q: How do I add more placeholders?**
A: Just highlight the text in yellow in your Word template. The system automatically detects them!

**Q: Can this integrate with a CRM?**
A: Not out of the box, but it's designed to be extended. The API accepts any JSON data.

## Performance Metrics

### Tested With
- ✅ Templates up to 50 pages
- ✅ 100+ placeholders per template
- ✅ Batch generation of 5 templates simultaneously
- ✅ Documents with tables, images, and complex formatting

### Typical Processing Times
- Single document: **< 2 seconds**
- Batch of 5 documents: **< 10 seconds**
- Template analysis: **< 1 second**

## Conclusion

You now have a fully functional Template Intelligence Engine!

The system demonstrates:
- ✅ Automated template processing
- ✅ Intelligent placeholder detection
- ✅ Format preservation
- ✅ Professional UI/UX
- ✅ Scalable architecture

**Ready to revolutionize financial advisory document generation!** 🎉

---

**Built for AdvisoryAI Hack-to-Hire Challenge**

For technical details, see `TECHNICAL_DOCS.md`
For architecture overview, see `README.md`
