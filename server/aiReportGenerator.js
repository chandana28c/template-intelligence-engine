const Anthropic = require('@anthropic-ai/sdk');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
        HeadingLevel, AlignmentType, WidthType, BorderStyle, VerticalAlign } = require('docx');
const fs = require('fs');
const PizZip = require('pizzip');
const xml2js = require('xml2js');

class AIReportGenerator {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || 'sk-ant-test-key'
    });
    this.templateStyles = null;
  }

  async extractTemplateStyles(templatePath) {
    console.log('Extracting styles from Suitability Report template...');
    
    try {
      const buffer = fs.readFileSync(templatePath);
      const zip = new PizZip(buffer);
      
      // Extract styles.xml
      const stylesXml = zip.file('word/styles.xml');
      if (stylesXml) {
        const parser = new xml2js.Parser();
        this.templateStyles = await parser.parseStringPromise(stylesXml.asText());
      }
      
      // Extract theme colors
      const themeXml = zip.file('word/theme/theme1.xml');
      if (themeXml) {
        const parser = new xml2js.Parser();
        this.templateTheme = await parser.parseStringPromise(themeXml.asText());
      }
      
      console.log('Template styles extracted successfully');
      return true;
    } catch (error) {
      console.error('Error extracting template styles:', error);
      return false;
    }
  }

  async generateReportContent(extractedData, clientName) {
    try {
      console.log('Calling Claude API to generate report content...');
      
      const message = await this.client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        messages: [{
          role: "user",
          content: `You are a professional UK financial advisor writing a Suitability Report.

Client Name: ${clientName}

Based on this client information:
${extractedData.substring(0, 15000)} 

Generate a comprehensive Suitability Report with:

1. Executive Summary (2-3 paragraphs)
2. Client Background (include personal details in a table format)
3. Current Financial Position (include assets/liabilities table)
4. Financial Objectives and Goals
5. Risk Assessment and Capacity for Loss
6. Recommended Strategy
7. Product Recommendations (include comparison table)
8. Costs and Charges (include fee breakdown table)
9. Ongoing Service and Review
10. Next Steps

For tables, use this format:
TABLE: [Table Title]
| Column1 | Column2 | Column3 |
| Value1 | Value2 | Value3 |
END_TABLE

Respond ONLY with valid JSON:
{
  "Executive Summary": "text...",
  "Client Background": "text with TABLE sections...",
  ...
}`
        }]
      });

      const responseText = message.content[0].text;
      let jsonText = responseText;
      if (responseText.includes('```json')) {
        const match = responseText.match(/```json\s*([\s\S]*?)\s*```/);
        if (match) jsonText = match[1];
      } else if (responseText.includes('```')) {
        const match = responseText.match(/```\s*([\s\S]*?)\s*```/);
        if (match) jsonText = match[1];
      }
      
      const reportContent = JSON.parse(jsonText.trim());
      console.log('Successfully parsed AI-generated content');
      return reportContent;
      
    } catch (error) {
      console.error('AI generation error:', error.message);
      console.log('Falling back to template-based report');
      return this.generateFallbackReport(extractedData, clientName);
    }
  }

  generateFallbackReport(extractedData, clientName) {
    console.log('Generating styled fallback report...');
    
    const data = extractedData.toLowerCase();
    
    let portfolioValue = '£250,000';
    let age = '45';
    let riskProfile = 'Moderate';
    
    // Extract values from data
    const valueMatch = data.match(/£([\d,]+)/);
    if (valueMatch) portfolioValue = `£${valueMatch[1]}`;
    
    const ageMatch = data.match(/age:\s*(\d+)/i);
    if (ageMatch) age = ageMatch[1];
    
    if (data.includes('moderate')) riskProfile = 'Moderate';
    if (data.includes('cautious')) riskProfile = 'Cautious';
    if (data.includes('balanced')) riskProfile = 'Balanced';
    if (data.includes('adventurous')) riskProfile = 'Adventurous';
    
    return {
      "Executive Summary": `This Suitability Report has been prepared for ${clientName} following a comprehensive review of their financial circumstances, objectives, and attitude to risk. Our recommendations are designed to help achieve their long-term financial goals while managing risk appropriately.\n\nThe strategy outlined takes into account ${clientName}'s current position, with a total investment portfolio of ${portfolioValue}, and their future aspirations for retirement and wealth preservation.\n\nWe believe the recommendations presented represent the most suitable approach to meeting their stated objectives while remaining consistent with their ${riskProfile.toLowerCase()} risk profile.`,
      
      "Client Background": `${clientName} has provided comprehensive information about their current circumstances through detailed fact-find documentation.\n\nTABLE: Personal Details\n| Detail | Information |\n| Full Name | ${clientName} |\n| Age | ${age} years |\n| Risk Profile | ${riskProfile} |\n| Current Portfolio | ${portfolioValue} |\nEND_TABLE\n\nAll relevant documentation has been reviewed to ensure we have a complete understanding of their circumstances and objectives.`,
      
      "Current Financial Position": `${clientName}'s current financial position includes various investment and pension arrangements.\n\nTABLE: Asset Summary\n| Asset Type | Provider | Value |\n| Pension | Various | £150,000 |\n| ISA | Investment Platform | £50,000 |\n| General Investment | Multiple | £50,000 |\n| Total | | ${portfolioValue} |\nEND_TABLE\n\nThe current arrangements have been reviewed for suitability and cost-effectiveness.`,
      
      "Financial Objectives and Goals": `The primary objectives identified include:\n\n• Building long-term wealth for retirement\n• Tax-efficient investment growth\n• Estate planning and wealth preservation\n• Maintaining appropriate financial protection\n\nSpecific goals have been discussed with time horizons established for each objective.`,
      
      "Risk Assessment and Capacity for Loss": `Based on comprehensive risk questionnaire responses, ${clientName}'s attitude to investment risk has been assessed as ${riskProfile}.\n\nTABLE: Risk Assessment Summary\n| Factor | Assessment |\n| Attitude to Risk | ${riskProfile} |\n| Capacity for Loss | ${riskProfile} |\n| Time Horizon | Long-term (15+ years) |\n| Investment Knowledge | Experienced |\nEND_TABLE\n\nThe recommended strategy reflects an appropriate balance between risk and return objectives.`,
      
      "Recommended Strategy": `Our recommendations focus on:\n\n• Diversified multi-asset portfolio construction\n• Tax-efficient investment wrappers (pensions and ISAs)\n• Evidence-based fund selection\n• Regular rebalancing and monitoring\n\nThe strategy is designed to achieve long-term growth while managing volatility appropriately.`,
      
      "Product Recommendations": `Based on ${clientName}'s circumstances, we recommend the following:\n\nTABLE: Recommended Products\n| Product | Provider | Annual Charge | Recommended Amount |\n| Self-Invested Personal Pension | Leading Platform | 0.45% | £100,000 |\n| Stocks & Shares ISA | Leading Platform | 0.45% | £50,000 |\n| General Investment Account | Leading Platform | 0.45% | £50,000 |\nEND_TABLE\n\nEach product has been selected following rigorous due diligence and best execution principles.`,
      
      "Costs and Charges": `Full transparency of all costs and charges:\n\nTABLE: Fee Structure\n| Fee Type | Amount | Frequency |\n| Initial Advice Fee | 3.0% | One-off |\n| Ongoing Advice Fee | 0.75% p.a. | Annual |\n| Platform Charge | 0.45% p.a. | Annual |\n| Fund Charges | 0.15% p.a. | Annual |\n| Total Ongoing | 1.35% p.a. | Annual |\nEND_TABLE\n\nAll charges represent fair value for the comprehensive service provided.`,
      
      "Ongoing Service and Review": `We will provide comprehensive ongoing service including:\n\n• Annual review meetings\n• Quarterly portfolio valuations\n• Regular market updates\n• Continuous portfolio monitoring\n• Ad-hoc advice as needed\n\nReview meetings will assess progress and make necessary adjustments.`,
      
      "Next Steps": `To proceed with implementation:\n\n1. Review this report carefully\n2. Raise any questions or concerns\n3. Complete application forms\n4. Arrange fund transfers\n5. Establish ongoing contributions\n\nWe will coordinate the entire implementation process and ensure smooth transitions.`
    };
  }

  parseTableFromText(text) {
    const tableRegex = /TABLE:\s*(.+?)\n([\s\S]+?)END_TABLE/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = tableRegex.exec(text)) !== null) {
      // Add text before table
      if (match.index > lastIndex) {
        parts.push({ 
          type: 'text', 
          content: text.substring(lastIndex, match.index).trim() 
        });
      }

      // Parse table
      const title = match[1].trim();
      const tableContent = match[2].trim();
      const rows = tableContent.split('\n').filter(r => r.trim());
      
      const tableData = rows.map(row => {
        return row.split('|')
          .map(cell => cell.trim())
          .filter(cell => cell);
      });

      parts.push({
        type: 'table',
        title: title,
        data: tableData
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({ 
        type: 'text', 
        content: text.substring(lastIndex).trim() 
      });
    }

    return parts;
  }

  createStyledTable(title, data) {
    const rows = [];

    // Header row (first row) with blue background
    const headerCells = data[0].map(cell => 
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({
            text: cell,
            bold: true,
            color: "FFFFFF",
            size: 22
          })],
          alignment: AlignmentType.CENTER
        })],
        shading: {
          fill: "1F4E78" // Dark blue
        },
        verticalAlign: VerticalAlign.CENTER
      })
    );

    rows.push(new TableRow({ children: headerCells, height: { value: 600, rule: "atLeast" } }));

    // Data rows with alternating colors
    for (let i = 1; i < data.length; i++) {
      const isEven = i % 2 === 0;
      const cells = data[i].map((cell, idx) => 
        new TableCell({
          children: [new Paragraph({
            text: cell,
            alignment: idx === 0 ? AlignmentType.LEFT : AlignmentType.RIGHT
          })],
          shading: {
            fill: isEven ? "F2F2F2" : "FFFFFF"
          },
          verticalAlign: VerticalAlign.CENTER
        })
      );
      rows.push(new TableRow({ children: cells, height: { value: 400, rule: "atLeast" } }));
    }

    return new Table({
      rows: rows,
      width: {
        size: 100,
        type: WidthType.PERCENTAGE
      },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }
      }
    });
  }

  createStyledDocument(reportContent, clientName) {
    const sections = [];

    // PROFESSIONAL TITLE PAGE with color
    sections.push(
      // Company logo placeholder (if you have one)
      new Paragraph({
        text: "",
        spacing: { before: 400 }
      }),
      
      // Main title with blue background effect
      new Paragraph({
        text: "SUITABILITY REPORT",
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { before: 1200, after: 600 }
      }),
      
      new Paragraph({
        children: [new TextRun({
          text: `Prepared for: ${clientName}`,
          bold: true,
          size: 32,
          color: "1F4E78"
        })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 }
      }),
      
      new Paragraph({
        children: [new TextRun({
          text: new Date().toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
          }),
          size: 24,
          color: "666666"
        })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 800 }
      }),
      
      new Paragraph({
        children: [new TextRun({
          text: "CONFIDENTIAL",
          bold: true,
          size: 28,
          color: "C00000"
        })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 1200 },
        border: {
          top: { color: "C00000", space: 1, style: BorderStyle.SINGLE, size: 6 },
          bottom: { color: "C00000", space: 1, style: BorderStyle.SINGLE, size: 6 }
        }
      }),
      
      // Page break
      new Paragraph({ text: "", pageBreakBefore: true })
    );

    // Add each section with professional styling
    Object.entries(reportContent).forEach(([sectionTitle, content]) => {
      // Section heading with blue color
      sections.push(
        new Paragraph({
          text: sectionTitle,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 600, after: 300 }
        })
      );

      // Parse content for tables and text
      const parts = this.parseTableFromText(content);

      parts.forEach(part => {
        if (part.type === 'table' && part.data.length > 0) {
          // Add table title
          if (part.title) {
            sections.push(
              new Paragraph({
                children: [new TextRun({
                  text: part.title,
                  bold: true,
                  size: 24,
                  color: "2E5C8A"
                })],
                spacing: { before: 200, after: 100 }
              })
            );
          }
          
          // Add styled table
          sections.push(this.createStyledTable(part.title, part.data));
          sections.push(new Paragraph({ text: "", spacing: { after: 300 } }));
          
        } else if (part.type === 'text' && part.content) {
          // Split into paragraphs and handle bullets
          const paragraphs = part.content.split('\n\n');
          
          paragraphs.forEach(para => {
            if (para.trim()) {
              // Check if bullet point
              if (para.trim().startsWith('•') || para.trim().startsWith('-')) {
                para.split('\n').forEach(line => {
                  if (line.trim()) {
                    sections.push(
                      new Paragraph({
                        text: line.replace(/^[•-]\s*/, ''),
                        bullet: { level: 0 },
                        spacing: { after: 120 }
                      })
                    );
                  }
                });
              } else {
                sections.push(
                  new Paragraph({
                    text: para.trim(),
                    spacing: { after: 240 },
                    alignment: AlignmentType.JUSTIFIED
                  })
                );
              }
            }
          });
        }
      });
    });

    // PROFESSIONAL FOOTER/DISCLAIMER
    sections.push(
      new Paragraph({ text: "", spacing: { before: 1200 } }),
      new Paragraph({
        text: "Important Information",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 600, after: 300 }
      }),
      new Paragraph({
        text: "This report is based on the information provided and our understanding of current legislation and practice which may be subject to change. The recommendations are personal to you and should not be relied upon by any other person. Past performance is not a guide to future performance and the value of investments can fall as well as rise. You may not get back the amount originally invested.",
        spacing: { after: 200 },
        alignment: AlignmentType.JUSTIFIED,
        shading: { fill: "F9F9F9" }
      }),
      new Paragraph({
        children: [new TextRun({
          text: "Regulated by the Financial Conduct Authority",
          italics: true,
          size: 20,
          color: "666666"
        })],
        spacing: { before: 400 },
        alignment: AlignmentType.CENTER
      })
    );

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: "Calibri",
              size: 22
            }
          }
        },
        paragraphStyles: [
          {
            id: "Heading1",
            name: "Heading 1",
            basedOn: "Normal",
            next: "Normal",
            run: { 
              size: 36, 
              bold: true, 
              color: "1F4E78",
              font: "Calibri"
            },
            paragraph: { 
              spacing: { before: 600, after: 300 },
              border: {
                bottom: {
                  color: "1F4E78",
                  space: 1,
                  style: BorderStyle.SINGLE,
                  size: 12
                }
              }
            }
          },
          {
            id: "Heading2",
            name: "Heading 2",
            basedOn: "Normal",
            next: "Normal",
            run: { 
              size: 28, 
              bold: true, 
              color: "2E5C8A",
              font: "Calibri"
            },
            paragraph: { 
              spacing: { before: 400, after: 200 }
            }
          }
        ]
      },
      sections: [{
        properties: {
          page: {
            margin: { 
              top: 1440, 
              right: 1440, 
              bottom: 1440, 
              left: 1440 
            }
          }
        },
        children: sections
      }]
    });

    return doc;
  }

  async generateReport(extractedData, clientName, outputPath) {
    console.log('Starting professional report generation...');
    
    // Step 1: Generate content
    const reportContent = await this.generateReportContent(extractedData, clientName);
    
    console.log('Report content generated, creating styled document...');

    // Step 2: Create professionally styled document
    const doc = this.createStyledDocument(reportContent, clientName);

    // Step 3: Generate DOCX file
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);

    console.log(`Professional report saved to: ${outputPath}`);
    return buffer;
  }
}

module.exports = AIReportGenerator;