import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Download, Loader2, CheckCircle, AlertCircle, Sparkles, Upload, Zap } from 'lucide-react';
import './App.css';

function App() {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [clientData, setClientData] = useState({});
  const [loading, setLoading] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState([]);
  const [currentStep, setCurrentStep] = useState('select'); // select, input, generate, complete

  // AI Mode states
  const [mode, setMode] = useState('template'); // 'template' or 'ai'
  const [aiFiles, setAiFiles] = useState([]);
  const [aiClientName, setAiClientName] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  // Common client fields that match our standardized placeholders
  const commonFields = [
    { key: 'clientName', label: 'Client Name', placeholder: 'John Smith' },
    { key: 'title', label: 'Title', placeholder: 'Mr/Mrs/Ms' },
    { key: 'address', label: 'Address', placeholder: '123 High Street, London' },
    { key: 'advisorName', label: 'Advisor Name', placeholder: 'Your Name' },
    { key: 'date', label: 'Date', placeholder: '06/02/2024', type: 'date' },
    { key: 'amount', label: 'Amount (£)', placeholder: '100000', type: 'number' },
    { key: 'percentage', label: 'Percentage (%)', placeholder: '5', type: 'number' },
    { key: 'age', label: 'Age', placeholder: '45', type: 'number' },
    { key: 'workSchedule', label: 'Work Schedule', placeholder: '3 days a week' },
    { key: 'retirementInfo', label: 'Retirement Plans', placeholder: 'Planning to retire in 2025' },
    { key: 'investmentDetails', label: 'Investment Details', placeholder: 'Portfolio value £250,000' },
    { key: 'purchaseDetails', label: 'Purchase Plans', placeholder: 'Motorhome purchase planned' },
    { key: 'notes', label: 'Additional Notes', placeholder: 'Any specific client notes' },
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get('/api/templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleTemplateToggle = (templateId) => {
    setSelectedTemplates(prev => 
      prev.includes(templateId) 
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };

  const handleInputChange = (key, value) => {
    setClientData(prev => ({ ...prev, [key]: value }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setAiFiles(files);
    console.log('Files selected:', files.length);
  };

  // Create comprehensive replacement data from client input
  const buildReplacementData = (data) => {
    const replacements = {};
    
    // Map form fields to EXACT placeholders in templates
    // IMPORTANT: Keys must match EXACTLY what's in the converted templates
    
    if (data.clientName) {
      replacements['NAME'] = data.clientName;
      replacements['Client Name'] = data.clientName;
    }
    
    if (data.title) {
      replacements['TITLE'] = data.title;
    }
    
    if (data.address) {
      replacements['ADDRESS'] = data.address;
    }
    
    if (data.advisorName) {
      replacements['Advisor Name'] = data.advisorName;
    }
    
    if (data.date) {
      replacements['DATE'] = data.date;
    }
    
    if (data.amount) {
      replacements['AMOUNT'] = `£${data.amount}`;
      replacements['NUMBER'] = data.amount;
    }
    
    if (data.percentage) {
      replacements['PERCENTAGE'] = `${data.percentage}%`;
    }
    
    if (data.age) {
      replacements['AGE'] = data.age;
    }
    
    if (data.workSchedule) {
      replacements['WORK_SCHEDULE'] = data.workSchedule;
      replacements['WORK_DETAILS'] = data.workSchedule;
    }
    
    if (data.retirementInfo) {
      replacements['RETIREMENT_INFO'] = data.retirementInfo;
      replacements['RETIREMENT_DETAILS'] = data.retirementInfo;
    }
    
    if (data.investmentDetails) {
      replacements['INVESTMENT_DETAILS'] = data.investmentDetails;
    }
    
    if (data.purchaseDetails) {
      replacements['PURCHASE_DETAILS'] = data.purchaseDetails;
    }
    
    if (data.notes) {
      replacements['NOTES'] = data.notes;
      replacements['DETAILS'] = data.notes;
      replacements['INFO'] = data.notes;
      replacements['DETAILED_NOTES'] = data.notes;
      replacements['CLIENT_DETAILS'] = data.notes;
      replacements['VALUE'] = data.notes;
    }
    
    console.log('Built replacements:', Object.keys(replacements));
    
    return replacements;
  };

  const generateDocuments = async () => {
    if (selectedTemplates.length === 0) {
      alert('Please select at least one template');
      return;
    }

    setLoading(true);
    setCurrentStep('generate');

    try {
      // Build comprehensive replacement data
      const replacementData = buildReplacementData(clientData);
      
      console.log('Sending replacement data:', Object.keys(replacementData));

      const response = await axios.post('/api/generate-batch', {
        templates: selectedTemplates,
        clientData: replacementData
      });

      setGeneratedFiles(response.data.results);
      setCurrentStep('complete');
    } catch (error) {
      console.error('Error generating documents:', error);
      alert('Failed to generate documents. Please try again.');
      setCurrentStep('input');
    } finally {
      setLoading(false);
    }
  };

  const generateAIReport = async () => {
    if (aiFiles.length === 0) {
      alert('Please upload at least one document');
      return;
    }

    if (!aiClientName.trim()) {
      alert('Please enter client name');
      return;
    }

    setAiGenerating(true);

    try {
      const formData = new FormData();
      aiFiles.forEach(file => {
        formData.append('documents', file);
      });
      formData.append('clientName', aiClientName);

      console.log(`Uploading ${aiFiles.length} files for ${aiClientName}`);

      const response = await axios.post('/api/generate-ai-report', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 120000 // 2 minute timeout for AI processing
      });

      console.log('AI Report generated:', response.data);

      setGeneratedFiles([{
        templateId: 'ai_report',
        success: true,
        filename: response.data.filename,
        downloadUrl: response.data.downloadUrl
      }]);

      alert('✅ AI Report Generated Successfully!\n\nYour professionally formatted suitability report is ready to download.');

    } catch (error) {
      console.error('AI Report generation error:', error);
      const errorMsg = error.response?.data?.error || error.message;
      alert(`❌ Failed to generate AI report:\n\n${errorMsg}\n\nPlease check:\n- Documents are valid PDF/DOCX files\n- Client name is filled in\n- Server is running`);
    } finally {
      setAiGenerating(false);
    }
  };

  const downloadFile = async (downloadUrl, filename) => {
    try {
      // Use the full URL with localhost
      const fullUrl = `http://localhost:5000${downloadUrl}`;
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
    } catch (error) {
      console.error('Error downloading file:', error);
      alert(`Failed to download file: ${error.message}`);
    }
  };

  const downloadAll = async () => {
    for (const file of generatedFiles.filter(f => f.success)) {
      await downloadFile(file.downloadUrl, file.filename);
      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const resetFlow = () => {
    setCurrentStep('select');
    setSelectedTemplates([]);
    setClientData({});
    setGeneratedFiles([]);
    setAiFiles([]);
    setAiClientName('');
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <Sparkles className="logo-icon" />
            <h1>Template Intelligence Engine</h1>
          </div>
          <p className="subtitle">AI-Powered Financial Advisory Document Generation</p>
        </div>
      </header>

      <main className="main-content">
        {/* Mode Switcher */}
        <div className="mode-switcher">
          <button 
            className={`mode-btn ${mode === 'template' ? 'active' : ''}`}
            onClick={() => { setMode('template'); resetFlow(); }}
          >
            <FileText size={20} />
            Template Mode
          </button>
          <button 
            className={`mode-btn ${mode === 'ai' ? 'active' : ''}`}
            onClick={() => { setMode('ai'); resetFlow(); }}
          >
            <Zap size={20} />
            AI Report Generator
          </button>
        </div>

        {/* TEMPLATE MODE */}
        {mode === 'template' && (
          <>
            {/* Step Indicator */}
            <div className="steps">
              <div className={`step ${currentStep === 'select' ? 'active' : ''} ${['input', 'generate', 'complete'].includes(currentStep) ? 'completed' : ''}`}>
                <div className="step-number">1</div>
                <div className="step-label">Select Templates</div>
              </div>
              <div className="step-line"></div>
              <div className={`step ${currentStep === 'input' ? 'active' : ''} ${['generate', 'complete'].includes(currentStep) ? 'completed' : ''}`}>
                <div className="step-number">2</div>
                <div className="step-label">Enter Client Data</div>
              </div>
              <div className="step-line"></div>
              <div className={`step ${currentStep === 'generate' ? 'active' : ''} ${currentStep === 'complete' ? 'completed' : ''}`}>
                <div className="step-number">3</div>
                <div className="step-label">Generate & Download</div>
              </div>
            </div>

            {/* Step 1: Template Selection */}
            {currentStep === 'select' && (
              <div className="section">
                <h2>Select Templates</h2>
                <p className="section-description">Choose one or more templates to generate for your client</p>
                
                <div className="templates-grid">
                  {templates.map(template => (
                    <div
                      key={template.id}
                      className={`template-card ${selectedTemplates.includes(template.id) ? 'selected' : ''}`}
                      onClick={() => handleTemplateToggle(template.id)}
                    >
                      <FileText className="template-icon" />
                      <h3>{template.name}</h3>
                      <div className="template-checkbox">
                        {selectedTemplates.includes(template.id) && <CheckCircle size={20} />}
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  className="btn btn-primary"
                  onClick={() => setCurrentStep('input')}
                  disabled={selectedTemplates.length === 0}
                >
                  Continue to Client Data ({selectedTemplates.length} selected)
                </button>
              </div>
            )}

            {/* Step 2: Client Data Input */}
            {currentStep === 'input' && (
              <div className="section">
                <h2>Enter Client Information</h2>
                <p className="section-description">Fill in the client details that will replace highlighted fields in your templates</p>
                
                <div className="form-grid">
                  {commonFields.map(field => (
                    <div key={field.key} className="form-group">
                      <label htmlFor={field.key}>{field.label}</label>
                      <input
                        id={field.key}
                        type={field.type || 'text'}
                        placeholder={field.placeholder}
                        value={clientData[field.key] || ''}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                        className="form-input"
                      />
                    </div>
                  ))}
                </div>

                <div className="button-group">
                  <button className="btn btn-secondary" onClick={() => setCurrentStep('select')}>
                    Back
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={generateDocuments}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="spin" size={20} />
                        Generating...
                      </>
                    ) : (
                      'Generate Documents'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Generation Progress */}
            {currentStep === 'generate' && (
              <div className="section text-center">
                <Loader2 className="spin large-icon" size={64} />
                <h2>Generating Documents...</h2>
                <p>Processing {selectedTemplates.length} template{selectedTemplates.length > 1 ? 's' : ''}</p>
              </div>
            )}

            {/* Step 4: Download Results */}
            {currentStep === 'complete' && (
              <div className="section">
                <div className="success-header">
                  <CheckCircle className="success-icon" size={48} />
                  <h2>Documents Generated Successfully!</h2>
                  <p>Your personalized documents are ready to download</p>
                </div>

                <div className="results-grid">
                  {generatedFiles.map((file, index) => (
                    <div key={index} className={`result-card ${file.success ? 'success' : 'error'}`}>
                      <div className="result-info">
                        <FileText size={24} />
                        <div>
                          <h3>{templates.find(t => t.id === file.templateId)?.name || 'AI Report'}</h3>
                          {file.success ? (
                            <p className="success-text">Generated successfully</p>
                          ) : (
                            <p className="error-text">{file.error}</p>
                          )}
                        </div>
                      </div>
                      {file.success && (
                        <button
                          className="btn btn-sm"
                          onClick={() => downloadFile(file.downloadUrl, file.filename)}
                        >
                          <Download size={16} />
                          Download
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="button-group">
                  <button className="btn btn-secondary" onClick={resetFlow}>
                    Generate More Documents
                  </button>
                  {generatedFiles.some(f => f.success) && (
                    <button className="btn btn-primary" onClick={downloadAll}>
                      <Download size={20} />
                      Download All
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* AI MODE */}
        {mode === 'ai' && (
          <div className="section">
            <div className="ai-header">
              <Zap size={48} className="ai-icon" />
              <h2>AI-Powered Report Generation</h2>
              <p className="section-description">
                Upload client documents (Fact Find, Meeting Notes, Risk Questionnaire, etc.) 
                and our AI will generate a comprehensive, professionally formatted Suitability Report
              </p>
            </div>

            <div className="ai-form">
              <div className="form-group">
                <label htmlFor="aiClientName">Client Name *</label>
                <input
                  id="aiClientName"
                  type="text"
                  value={aiClientName}
                  onChange={(e) => setAiClientName(e.target.value)}
                  placeholder="Enter client name (e.g., Joe Bloggs)"
                  className="form-input"
                  disabled={aiGenerating}
                />
              </div>

              <div className="form-group">
                <label htmlFor="aiFiles">Upload Client Documents *</label>
                <div className="file-upload-area">
                  <input
                    id="aiFiles"
                    type="file"
                    multiple
                    accept=".pdf,.docx"
                    onChange={handleFileUpload}
                    className="file-input"
                    disabled={aiGenerating}
                  />
                  <div className="file-upload-label">
                    <Upload size={32} />
                    <p>Click to upload or drag and drop</p>
                    <p className="file-hint">PDF or DOCX files (multiple files supported)</p>
                  </div>
                </div>
                
                {aiFiles.length > 0 && (
                  <div className="uploaded-files">
                    <p className="files-count">✓ {aiFiles.length} file{aiFiles.length > 1 ? 's' : ''} selected:</p>
                    <ul className="files-list">
                      {aiFiles.map((file, idx) => (
                        <li key={idx}>{file.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <button
                className="btn btn-primary btn-large"
                onClick={generateAIReport}
                disabled={aiGenerating || aiFiles.length === 0 || !aiClientName.trim()}
              >
                {aiGenerating ? (
                  <>
                    <Loader2 className="spin" size={24} />
                    Generating AI Report... (This may take 1-2 minutes)
                  </>
                ) : (
                  <>
                    <Zap size={24} />
                    Generate AI Suitability Report
                  </>
                )}
              </button>

              {generatedFiles.length > 0 && generatedFiles[0].success && (
                <div className="ai-result">
                  <CheckCircle size={48} className="success-icon" />
                  <h3>AI Report Generated!</h3>
                  <button
                    className="btn btn-primary"
                    onClick={() => downloadFile(generatedFiles[0].downloadUrl, generatedFiles[0].filename)}
                  >
                    <Download size={20} />
                    Download Report
                  </button>
                  <button className="btn btn-secondary" onClick={resetFlow}>
                    Generate Another Report
                  </button>
                </div>
              )}
            </div>

            <div className="ai-info">
              <h3>How It Works:</h3>
              <ol>
                <li>Upload all relevant client documents (Fact Find, Meeting Notes, etc.)</li>
                <li>AI extracts and analyzes all information from your documents</li>
                <li>Generates a complete, professional Suitability Report</li>
                <li>Applies proper formatting, structure, and styling</li>
                <li>Download your ready-to-use report instantly!</li>
              </ol>
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Template Intelligence Engine v1.0 | Built for AdvisoryAI Hack-to-Hire Challenge</p>
      </footer>
    </div>
  );
}

export default App;