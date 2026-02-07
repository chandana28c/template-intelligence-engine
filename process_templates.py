#!/usr/bin/env python3
"""
Template Processor - Analyzes and prepares Word templates for the Template Intelligence Engine
"""

import zipfile
import xml.etree.ElementTree as ET
import shutil
import os
from pathlib import Path

def analyze_template(docx_path):
    """Extract yellow highlighted placeholders from a docx file"""
    placeholders = []
    
    try:
        with zipfile.ZipFile(docx_path, 'r') as zip_ref:
            # Read document.xml
            doc_xml = zip_ref.read('word/document.xml').decode('utf-8')
            
            # Parse XML with namespace
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            root = ET.fromstring(doc_xml)
            
            # Find all runs with yellow highlighting
            for r in root.findall('.//w:r', ns):
                rpr = r.find('w:rPr', ns)
                if rpr is not None:
                    highlight = rpr.find('w:highlight', ns)
                    if highlight is not None:
                        val = highlight.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val')
                        if val == 'yellow':
                            # Get the text content
                            t = r.find('w:t', ns)
                            if t is not None and t.text:
                                placeholders.append(t.text.strip())
    
    except Exception as e:
        print(f"Error analyzing {docx_path}: {e}")
        return []
    
    return list(set(placeholders))  # Remove duplicates

def setup_templates():
    """Copy templates from uploads to server/templates directory"""
    
    # Define paths
    uploads_dir = Path('/mnt/user-data/uploads')
    templates_dir = Path('/home/claude/template-intelligence-engine/server/templates')
    
    # Create templates directory if it doesn't exist
    templates_dir.mkdir(parents=True, exist_ok=True)
    
    # Template mapping: source filename -> target filename
    template_mapping = {
        'Annual_Update.docx': 'annual_update.docx',
        'AR_Letter_New.docx': 'ar_letter.docx',
        'Report.docx': 'report.docx',
        'Review_report.docx': 'review_report.docx',
        'suitability_report.docx': 'suitability_report.docx'
    }
    
    print("=" * 70)
    print("Template Intelligence Engine - Template Processor")
    print("=" * 70)
    print()
    
    results = {}
    
    for source_name, target_name in template_mapping.items():
        source_path = uploads_dir / source_name
        target_path = templates_dir / target_name
        
        if not source_path.exists():
            print(f"❌ {source_name} not found")
            continue
        
        # Copy template
        shutil.copy2(source_path, target_path)
        print(f"✅ Copied: {source_name} → {target_name}")
        
        # Analyze template
        placeholders = analyze_template(source_path)
        results[target_name] = placeholders
        
        print(f"   📋 Found {len(placeholders)} unique placeholders")
        
        # Show first 5 placeholders as examples
        if placeholders:
            print("   Examples:")
            for placeholder in sorted(placeholders)[:5]:
                display_text = placeholder[:60] + "..." if len(placeholder) > 60 else placeholder
                print(f"      • {display_text}")
        print()
    
    print("=" * 70)
    print("✨ Template setup complete!")
    print("=" * 70)
    print()
    print("Next steps:")
    print("1. Run: npm run dev")
    print("2. Open: http://localhost:3000")
    print()
    
    return results

if __name__ == '__main__':
    setup_templates()
