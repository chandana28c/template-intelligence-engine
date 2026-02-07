# 🔧 Troubleshooting Guide

## Download Issues

### Problem: "Failed to download files"

This is the most common issue. Here are the solutions:

#### Solution 1: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for errors when clicking download
4. Check Network tab to see if request succeeds

#### Solution 2: Verify Server is Running
```bash
# Check if backend is running on port 5000
curl http://localhost:5000/api/health

# Should return: {"status":"healthy","timestamp":"..."}
```

#### Solution 3: Check Generated Files
```bash
# List generated files
ls -la server/outputs/

# You should see .docx files with timestamps
# If folder is empty, generation failed
```

#### Solution 4: Browser Pop-up Blocker
- Some browsers block automatic downloads
- Allow pop-ups for localhost:3000
- Try clicking download again

#### Solution 5: CORS Issues
If you see CORS errors in console:

```javascript
// The server already has CORS enabled, but if issues persist:
// Check that both frontend (localhost:3000) and backend (localhost:5000) are running
```

#### Solution 6: Direct Download Test
Try downloading directly via URL:
```
http://localhost:5000/api/download/annual_update_1707264000000.docx
```
(Replace with actual filename from generation)

### Problem: Documents Won't Open in Word

#### Solution: Verify File Integrity
```bash
# Check file size (should be > 0 bytes)
ls -lh server/outputs/

# Check if file is valid ZIP (docx are ZIP files)
unzip -t server/outputs/your_file.docx
```

#### Solution: Re-generate the Document
- Sometimes the first generation fails
- Try generating again
- Check server console for errors

### Problem: Placeholders Not Replaced

#### Cause: Placeholder Mismatch
Yellow-highlighted text in template must EXACTLY match the keys in clientData

#### Solution: Check Placeholder Format
```javascript
// In the template, if highlighted text is: "[Client Name]"
// Then clientData should have:
clientData = {
  "[Client Name]": "John Smith"  // Exact match including brackets
}
```

#### Solution: Add Multiple Variations
```javascript
// Cover different placeholder formats
clientData = {
  "[Client Name]": "John Smith",
  "Client Name": "John Smith",
  "clientName": "John Smith",
  "[CLIENT NAME]": "John Smith"
}
```

### Problem: Port Already in Use

#### Solution: Kill Existing Process
```bash
# On Mac/Linux
lsof -ti:3000 | xargs kill -9
lsof -ti:5000 | xargs kill -9

# On Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Problem: npm install Fails

#### Solution 1: Clear Cache
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### Solution 2: Use Different Node Version
```bash
# Install Node 16 or 18
nvm install 16
nvm use 16
npm install
```

### Problem: Frontend Won't Start

#### Solution: Check Vite Configuration
```bash
cd client
npm install
npm run dev
```

If port 3000 is taken, edit `client/vite.config.js`:
```javascript
server: {
  port: 3001,  // Change to different port
}
```

### Problem: Templates Not Showing

#### Solution: Run Template Processor
```bash
python3 process_templates.py
```

This copies templates from uploads to server/templates/

#### Solution: Verify Template Location
```bash
# Templates should be here:
ls -la server/templates/

# You should see:
# annual_update.docx
# ar_letter.docx
# report.docx
# review_report.docx
# suitability_report.docx
```

## Common Error Messages

### "Template not found"
- Run `python3 process_templates.py`
- Check `server/templates/` directory
- Verify template filenames match exactly

### "Cannot connect to server"
- Start backend: `npm run server`
- Or start both: `npm run dev`
- Check port 5000 is not blocked

### "EADDRINUSE: address already in use"
- Another process is using the port
- Kill the process (see above)
- Or change the port in configuration

### "Module not found"
- Dependencies not installed
- Run `npm install` in root directory
- Run `npm install` in client directory

## Debug Mode

### Enable Verbose Logging

**Backend** - Edit `server/index.js`:
```javascript
// Add at the top
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
```

**Frontend** - Add console.logs:
```javascript
const downloadFile = async (downloadUrl, filename) => {
  console.log('Downloading:', downloadUrl, filename);
  // ... rest of code
};
```

### Test API Endpoints Manually

**Using curl:**
```bash
# Test health
curl http://localhost:5000/api/health

# Test templates
curl http://localhost:5000/api/templates

# Test generation
curl -X POST http://localhost:5000/api/generate-batch \
  -H "Content-Type: application/json" \
  -d '{
    "templates": ["annual_update"],
    "clientData": {
      "[Client Name]": "Test Client"
    }
  }'
```

**Using browser:**
```
http://localhost:5000/api/health
http://localhost:5000/api/templates
```

## Performance Issues

### Slow Document Generation
- Check file sizes of templates
- Large templates (50+ pages) take longer
- Batch generation processes sequentially

### High Memory Usage
- Generating many documents at once uses memory
- Files are kept in memory during processing
- Restart server if memory issues occur

## Still Having Issues?

### Checklist
- [ ] Node.js 16+ installed
- [ ] Dependencies installed (root and client)
- [ ] Both servers running (ports 3000 and 5000)
- [ ] Templates in correct location
- [ ] No console errors
- [ ] Browser allows downloads
- [ ] Correct placeholder format

### Get Help
1. Check server console for errors
2. Check browser console for errors
3. Verify file was created in `server/outputs/`
4. Test direct download URL
5. Review this troubleshooting guide

### Quick Reset
```bash
# Complete reset
rm -rf node_modules client/node_modules
npm run setup
python3 process_templates.py
npm run dev
```

## Advanced Debugging

### Inspect Generated File
```bash
# Unzip the docx to see XML
cd server/outputs
unzip -q your_file.docx -d test/
cat test/word/document.xml | grep -A 5 "Client Name"
```

### Check File Permissions
```bash
# Make sure output directory is writable
chmod 755 server/outputs
ls -la server/outputs
```

### Test with Simple Data
```javascript
// Use minimal test data
const testData = {
  "Test": "Value"
};
// If this works, add more fields gradually
```

---

**Most Common Fix**: Restart both servers and try again!

```bash
# Stop servers (Ctrl+C)
# Then restart
npm run dev
```
