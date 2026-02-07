#!/usr/bin/env python3
"""
Demo Script - Tests the Template Intelligence Engine with sample data
"""

import requests
import json
import time
from pathlib import Path

BASE_URL = "http://localhost:5000/api"

def test_health():
    """Test if the server is running"""
    print("🔍 Testing server health...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Server is healthy!")
            return True
        else:
            print(f"❌ Server returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to server: {e}")
        print("   Make sure to run 'npm run dev' first!")
        return False

def get_templates():
    """Get list of available templates"""
    print("\n📋 Fetching available templates...")
    try:
        response = requests.get(f"{BASE_URL}/templates")
        templates = response.json()
        print(f"✅ Found {len(templates)} templates:")
        for template in templates:
            print(f"   • {template['name']} (id: {template['id']})")
        return templates
    except Exception as e:
        print(f"❌ Error fetching templates: {e}")
        return []

def generate_sample_document():
    """Generate a sample document with test data"""
    print("\n🎨 Generating sample document...")
    
    # Sample client data
    client_data = {
        "[Client Name]": "Sarah Johnson",
        "Client Name": "Sarah Johnson",
        "[Client Address]": "45 Park Lane, London, W1K 1QA",
        "[Advisor Name]": "Michael Roberts",
        "[Date]": "06/02/2024",
        "[Portfolio Value]": "£250,000",
        "Portfolio Value": "£250,000",
        "[Risk Level]": "Moderate to High",
        "Risk Level": "Moderate to High",
        "[Investment Goal]": "Retirement and Wealth Preservation",
        "[Time Horizon]": "15 years",
        "[Annual Income]": "£85,000",
        "[Retirement Age]": "65",
        # Additional common placeholders
        "clientName": "Sarah Johnson",
        "advisorName": "Michael Roberts",
        "date": "06/02/2024",
        "portfolioValue": "250000",
        "riskLevel": "Moderate to High",
        "investmentGoal": "Retirement and Wealth Preservation",
        "timeHorizon": "15",
        "annualIncome": "85000",
        "retirementAge": "65"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/generate-batch",
            json={
                "templates": ["annual_update"],
                "clientData": client_data
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Document generated successfully!")
            
            if result['results']:
                for doc in result['results']:
                    if doc.get('success'):
                        print(f"   📄 {doc['filename']}")
                        print(f"   🔗 Download: {BASE_URL.replace('/api', '')}{doc['downloadUrl']}")
                        return doc['downloadUrl']
            return None
        else:
            print(f"❌ Generation failed with status {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error generating document: {e}")
        return None

def generate_batch_documents():
    """Generate multiple documents at once"""
    print("\n🚀 Generating batch of documents...")
    
    client_data = {
        "[Client Name]": "John Smith",
        "Client Name": "John Smith",
        "[Portfolio Value]": "£150,000",
        "Portfolio Value": "£150,000",
        "[Risk Level]": "Moderate",
        "Risk Level": "Moderate",
        "[Date]": "06/02/2024",
        "clientName": "John Smith",
        "portfolioValue": "150000",
        "riskLevel": "Moderate",
        "date": "06/02/2024"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/generate-batch",
            json={
                "templates": ["annual_update", "review_report"],
                "clientData": client_data
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Generated {len(result['results'])} documents!")
            
            for doc in result['results']:
                if doc.get('success'):
                    print(f"   ✅ {doc['templateId']}: {doc['filename']}")
                else:
                    print(f"   ❌ {doc['templateId']}: {doc.get('error', 'Unknown error')}")
            
            return True
        else:
            print(f"❌ Batch generation failed with status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error in batch generation: {e}")
        return False

def run_demo():
    """Run the complete demo"""
    print("=" * 70)
    print("Template Intelligence Engine - Demo Script")
    print("=" * 70)
    
    # Test 1: Health check
    if not test_health():
        print("\n⚠️  Please start the server first:")
        print("   npm run dev")
        return
    
    # Test 2: Get templates
    templates = get_templates()
    if not templates:
        print("\n⚠️  No templates found. Please run:")
        print("   python3 process_templates.py")
        return
    
    # Test 3: Generate single document
    generate_sample_document()
    
    # Wait a bit
    time.sleep(2)
    
    # Test 4: Generate batch
    generate_batch_documents()
    
    print("\n" + "=" * 70)
    print("✨ Demo complete!")
    print("=" * 70)
    print("\nNext steps:")
    print("1. Open http://localhost:3000 in your browser")
    print("2. Try the web interface")
    print("3. Generate your own documents!")
    print()

if __name__ == '__main__':
    run_demo()
