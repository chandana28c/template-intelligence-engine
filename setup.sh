#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     Template Intelligence Engine - Setup Script           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check Node.js installation
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p server/templates
mkdir -p server/outputs
echo "✅ Directories created"
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install
if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi
echo ""

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd client
npm install
if [ $? -eq 0 ]; then
    echo "✅ Frontend dependencies installed"
else
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi
cd ..
echo ""

# Instructions
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    Setup Complete! 🎉                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Copy your .docx templates to: server/templates/"
echo "   Required filenames:"
echo "   - annual_update.docx"
echo "   - ar_letter.docx"
echo "   - report.docx"
echo "   - review_report.docx"
echo "   - suitability_report.docx"
echo ""
echo "2. Start the application:"
echo "   npm run dev"
echo ""
echo "3. Open your browser:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo ""
echo "💡 Tip: Make sure your templates have yellow-highlighted"
echo "   text for fields that need to be replaced!"
echo ""
