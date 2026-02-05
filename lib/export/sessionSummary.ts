/**
 * Session Summary PDF Generator
 * Generates 1-page summary for free users, full detailed report for Pro users
 */

export interface SessionData {
  id: string;
  title: string;
  industry: string | null;
  selected_niche: string | null;
  selected_uvz: string | null;
  phase: string;
  created_at: string;
  messages: Array<{
    role: string;
    content: string;
    tool_calls?: any;
    tool_results?: any;
  }>;
}

export interface SummaryOptions {
  isPro: boolean;
  includeWatermark?: boolean;
}

// Extract key insights from messages
function extractInsights(messages: SessionData['messages']): {
  keyFindings: string[];
  marketSize: string | null;
  competition: string | null;
  opportunities: string[];
  recommendations: string[];
  sources: string[];
} {
  const keyFindings: string[] = [];
  const opportunities: string[] = [];
  const recommendations: string[] = [];
  const sources: string[] = [];
  let marketSize: string | null = null;
  let competition: string | null = null;

  for (const msg of messages) {
    if (msg.role === 'assistant' && msg.content) {
      const content = msg.content;
      
      // Extract market size mentions
      const marketMatch = content.match(/market\s*(?:size|worth|valued?)\s*(?:is|at|of)?\s*\$?([\d.]+\s*(?:billion|million|B|M))/i);
      if (marketMatch && !marketSize) {
        marketSize = marketMatch[0];
      }
      
      // Extract competition level
      const compMatch = content.match(/(low|medium|moderate|high)\s*competition/i);
      if (compMatch && !competition) {
        competition = compMatch[1];
      }
      
      // Extract bullet points as findings (limit to significant ones)
      const bulletPoints = content.match(/^[-•*]\s+(.+)$/gm);
      if (bulletPoints) {
        bulletPoints.slice(0, 5).forEach(point => {
          const cleaned = point.replace(/^[-•*]\s+/, '').trim();
          if (cleaned.length > 20 && cleaned.length < 200) {
            if (cleaned.toLowerCase().includes('opportunity') || cleaned.toLowerCase().includes('potential')) {
              opportunities.push(cleaned);
            } else if (cleaned.toLowerCase().includes('recommend') || cleaned.toLowerCase().includes('should') || cleaned.toLowerCase().includes('suggest')) {
              recommendations.push(cleaned);
            } else {
              keyFindings.push(cleaned);
            }
          }
        });
      }

      // Extract URLs as sources
      const urls = content.match(/https?:\/\/[^\s\)]+/g);
      if (urls) {
        urls.forEach(url => {
          if (!sources.includes(url)) {
            sources.push(url);
          }
        });
      }
    }
  }

  return {
    keyFindings: keyFindings.slice(0, 5),
    marketSize,
    competition,
    opportunities: opportunities.slice(0, 3),
    recommendations: recommendations.slice(0, 3),
    sources: sources.slice(0, 10),
  };
}

// Generate HTML for the summary
export function generateSessionSummaryHTML(session: SessionData, options: SummaryOptions): string {
  const { isPro, includeWatermark = false } = options;
  const insights = extractInsights(session.messages);
  const createdDate = new Date(session.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const watermarkStyles = includeWatermark ? `
    .watermark {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, #ff6b35 0%, #f7c331 100%);
      color: white;
      padding: 8px 16px;
      font-size: 11px;
      font-family: sans-serif;
      border-radius: 20px;
      opacity: 0.9;
      z-index: 1000;
    }
    @media print {
      .watermark { display: block !important; }
    }
  ` : '';

  const freeUserNotice = !isPro ? `
    <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); border: 2px solid #f59e0b; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 13px; color: #92400e;">
        <strong>📋 Summary Report</strong> - This is a condensed version. 
        <a href="https://manymarkets.co/upgrade" style="color: #d97706; font-weight: bold;">Upgrade to Pro</a> 
        for the full detailed report with all sources and complete analysis.
      </p>
    </div>
  ` : '';

  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Research Summary: ${session.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6; 
      color: #333; 
      max-width: 800px; 
      margin: 0 auto; 
      padding: 40px 30px;
      background: #fff;
    }
    .header {
      text-align: center;
      padding-bottom: 24px;
      border-bottom: 3px solid #ff6b35;
      margin-bottom: 24px;
    }
    .logo { 
      font-size: 14px; 
      color: #ff6b35; 
      font-weight: bold;
      letter-spacing: 1px;
      margin-bottom: 16px;
    }
    h1 { 
      font-size: 28px; 
      color: #1a1a1a; 
      margin-bottom: 8px;
    }
    .meta { 
      color: #666; 
      font-size: 14px; 
    }
    .section {
      margin-bottom: 24px;
    }
    .section-title {
      font-size: 16px;
      font-weight: bold;
      color: #ff6b35;
      border-bottom: 2px solid #f0f0f0;
      padding-bottom: 8px;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .highlight-box {
      background: linear-gradient(135deg, #fff7ed, #ffedd5);
      border-left: 4px solid #ff6b35;
      padding: 16px;
      border-radius: 0 8px 8px 0;
      margin-bottom: 16px;
    }
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 20px;
    }
    .stat-box {
      background: #f9fafb;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px;
      text-align: center;
    }
    .stat-value {
      font-size: 18px;
      font-weight: bold;
      color: #ff6b35;
    }
    .stat-label {
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
    }
    ul {
      list-style: none;
      padding: 0;
    }
    li {
      padding: 8px 0 8px 24px;
      position: relative;
      border-bottom: 1px solid #f0f0f0;
    }
    li:last-child { border-bottom: none; }
    li::before {
      content: "→";
      position: absolute;
      left: 0;
      color: #ff6b35;
      font-weight: bold;
    }
    .opportunities li::before { content: "✦"; color: #10b981; }
    .recommendations li::before { content: "💡"; }
    .sources {
      font-size: 12px;
      color: #666;
    }
    .sources a {
      color: #3b82f6;
      word-break: break-all;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #f0f0f0;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    .cta {
      background: linear-gradient(135deg, #ff6b35, #f59e0b);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      display: inline-block;
      font-weight: bold;
      margin-top: 12px;
    }
    ${watermarkStyles}
    @media print {
      body { padding: 20px; }
      .cta { display: none; }
    }
  </style>
</head>
<body>
  ${includeWatermark ? '<div class="watermark">📚 Made with ManyMarkets.co</div>' : ''}
  
  <div class="header">
    <div class="logo">🔬 MANYMARKETS RESEARCH</div>
    <h1>${session.title}</h1>
    <p class="meta">
      ${session.industry ? `Industry: ${session.industry} • ` : ''}
      ${session.selected_niche ? `Niche: ${session.selected_niche} • ` : ''}
      Generated on ${createdDate}
    </p>
  </div>

  ${freeUserNotice}

  ${session.selected_uvz ? `
  <div class="highlight-box">
    <strong>🎯 Unique Value Zone Identified:</strong><br>
    ${session.selected_uvz}
  </div>
  ` : ''}

  <div class="stat-grid">
    <div class="stat-box">
      <div class="stat-value">${insights.marketSize || 'N/A'}</div>
      <div class="stat-label">Market Size</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${insights.competition || 'N/A'}</div>
      <div class="stat-label">Competition</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${session.messages.length}</div>
      <div class="stat-label">Messages</div>
    </div>
  </div>

  ${insights.keyFindings.length > 0 ? `
  <div class="section">
    <div class="section-title">📊 Key Findings</div>
    <ul>
      ${insights.keyFindings.map(f => `<li>${f}</li>`).join('')}
    </ul>
  </div>
  ` : ''}

  ${insights.opportunities.length > 0 ? `
  <div class="section opportunities">
    <div class="section-title">✨ Opportunities</div>
    <ul>
      ${insights.opportunities.map(o => `<li>${o}</li>`).join('')}
    </ul>
  </div>
  ` : ''}

  ${insights.recommendations.length > 0 ? `
  <div class="section recommendations">
    <div class="section-title">💡 Recommendations</div>
    <ul>
      ${insights.recommendations.map(r => `<li>${r}</li>`).join('')}
    </ul>
  </div>
  ` : ''}
`;

  // Pro users get sources
  if (isPro && insights.sources.length > 0) {
    html += `
  <div class="section sources">
    <div class="section-title">🔗 Sources & References</div>
    <ul>
      ${insights.sources.map(s => `<li><a href="${s}" target="_blank">${s}</a></li>`).join('')}
    </ul>
  </div>
`;
  }

  html += `
  <div class="footer">
    <p>Research powered by ManyMarkets AI</p>
    ${!isPro ? '<a href="https://manymarkets.co/upgrade" class="cta">Upgrade for Full Reports →</a>' : ''}
  </div>
</body>
</html>`;

  return html;
}

// Generate Markdown summary
export function generateSessionSummaryMarkdown(session: SessionData, options: SummaryOptions): string {
  const { isPro, includeWatermark = false } = options;
  const insights = extractInsights(session.messages);
  const createdDate = new Date(session.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let md = '';
  
  if (includeWatermark) {
    md += `> *Made with ManyMarkets.co - Get full reports at manymarkets.co/upgrade*\n\n`;
  }

  md += `# 🔬 Research Summary: ${session.title}\n\n`;
  md += `**Date:** ${createdDate}\n`;
  if (session.industry) md += `**Industry:** ${session.industry}\n`;
  if (session.selected_niche) md += `**Niche:** ${session.selected_niche}\n`;
  md += `\n---\n\n`;

  if (session.selected_uvz) {
    md += `## 🎯 Unique Value Zone\n\n${session.selected_uvz}\n\n`;
  }

  md += `## 📈 Quick Stats\n\n`;
  md += `| Metric | Value |\n|--------|-------|\n`;
  md += `| Market Size | ${insights.marketSize || 'N/A'} |\n`;
  md += `| Competition | ${insights.competition || 'N/A'} |\n`;
  md += `| Research Depth | ${session.messages.length} messages |\n\n`;

  if (insights.keyFindings.length > 0) {
    md += `## 📊 Key Findings\n\n`;
    insights.keyFindings.forEach(f => {
      md += `- ${f}\n`;
    });
    md += `\n`;
  }

  if (insights.opportunities.length > 0) {
    md += `## ✨ Opportunities\n\n`;
    insights.opportunities.forEach(o => {
      md += `- ${o}\n`;
    });
    md += `\n`;
  }

  if (insights.recommendations.length > 0) {
    md += `## 💡 Recommendations\n\n`;
    insights.recommendations.forEach(r => {
      md += `- ${r}\n`;
    });
    md += `\n`;
  }

  if (isPro && insights.sources.length > 0) {
    md += `## 🔗 Sources\n\n`;
    insights.sources.forEach(s => {
      md += `- ${s}\n`;
    });
    md += `\n`;
  }

  md += `---\n\n*Research powered by ManyMarkets AI*\n`;

  if (!isPro) {
    md += `\n[Upgrade to Pro for full detailed reports →](https://manymarkets.co/upgrade)\n`;
  }

  return md;
}
