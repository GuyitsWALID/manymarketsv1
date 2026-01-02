import { Document, Packer, Paragraph, HeadingLevel, TextRun, ImageRun, PageBreak, Table, TableRow, TableCell, BorderStyle, WidthType, AlignmentType } from 'docx';

export type ProductLike = {
  name: string;
  tagline?: string;
  description?: string;
  raw_analysis?: any;
};

// Helper to fetch image as base64
async function fetchImageAsBase64(url: string): Promise<{ data: ArrayBuffer; width: number; height: number } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    
    // Default dimensions - in EMUs (914400 EMUs = 1 inch)
    // We'll use 500px width as default, which is about 5.2 inches
    const width = 4500000; // ~4.7 inches in EMUs
    const height = 3375000; // 3:4 aspect ratio
    
    return { data: arrayBuffer, width, height };
  } catch (error) {
    console.error('Failed to fetch image:', url, error);
    return null;
  }
}

export async function generateDocxBuffer(product: ProductLike): Promise<Uint8Array> {
  const children: any[] = [];

  // Title page
  children.push(new Paragraph({ 
    text: product.name || 'Untitled', 
    heading: HeadingLevel.TITLE,
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 }
  }));
  
  if (product.tagline) {
    children.push(new Paragraph({ 
      text: product.tagline,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: product.tagline, italics: true, size: 28 })]
    }));
  }
  
  children.push(new Paragraph({ 
    text: 'Created with ManyMarkets',
    alignment: AlignmentType.CENTER,
    spacing: { after: 800 }
  }));
  
  // Page break after title
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // Overview section
  if (product.raw_analysis?.overview) {
    children.push(new Paragraph({ text: 'Overview', heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ text: product.raw_analysis.overview, spacing: { after: 200 } }));
    children.push(new Paragraph({ children: [new PageBreak()] }));
  }

  // Table of Contents
  const chapters = product.raw_analysis?.outline?.chapters || [];
  if (chapters.length > 0) {
    children.push(new Paragraph({ text: 'Table of Contents', heading: HeadingLevel.HEADING_1 }));
    chapters.forEach((ch: any, i: number) => {
      children.push(new Paragraph({ 
        text: `Chapter ${ch.number || i + 1}: ${ch.title}`,
        spacing: { after: 100 },
        bullet: { level: 0 }
      }));
    });
    children.push(new Paragraph({ children: [new PageBreak()] }));
  }

  // Chapters with content and images
  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    
    // Chapter header
    children.push(new Paragraph({ 
      text: `Chapter ${ch.number || i + 1}`, 
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400 }
    }));
    children.push(new Paragraph({ 
      text: ch.title, 
      heading: HeadingLevel.HEADING_2,
      spacing: { after: 200 }
    }));
    
    // Chapter content
    if (ch.content) {
      // Split content into paragraphs
      const paragraphs = ch.content.split(/\n\n+/);
      for (const para of paragraphs) {
        if (para.trim()) {
          // Check if it's a heading
          if (para.startsWith('## ')) {
            children.push(new Paragraph({ 
              text: para.replace('## ', ''), 
              heading: HeadingLevel.HEADING_3 
            }));
          } else if (para.startsWith('### ')) {
            children.push(new Paragraph({ 
              text: para.replace('### ', ''), 
              heading: HeadingLevel.HEADING_4 
            }));
          } else {
            // Regular paragraph - clean markdown
            const cleanText = para
              .replace(/\*\*(.*?)\*\*/g, '$1')
              .replace(/\*(.*?)\*/g, '$1')
              .replace(/^- /gm, '• ')
              .trim();
            children.push(new Paragraph({ text: cleanText, spacing: { after: 200 } }));
          }
        }
      }
    } else if (ch.description) {
      children.push(new Paragraph({ text: ch.description, spacing: { after: 200 } }));
    }
    
    // Include chapter assets (images)
    if (ch.assets && ch.assets.length > 0) {
      for (const asset of ch.assets) {
        const imageUrl = asset.fullUrl || asset.url || asset.thumbnailUrl;
        if (imageUrl) {
          const imageData = await fetchImageAsBase64(imageUrl);
          if (imageData) {
            children.push(new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 200, after: 200 },
              children: [
                new ImageRun({
                  data: imageData.data,
                  transformation: {
                    width: 450, // pixels
                    height: 338, // 4:3 aspect ratio
                  },
                  type: 'png',
                }),
              ],
            }));
            // Image caption
            if (asset.name) {
              children.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
                children: [new TextRun({ text: asset.name, italics: true, size: 20 })]
              }));
            }
          }
        }
      }
    }
    
    // Key takeaways
    if (ch.keyTakeaways && ch.keyTakeaways.length > 0) {
      children.push(new Paragraph({ 
        text: '💡 Key Takeaways', 
        heading: HeadingLevel.HEADING_4,
        spacing: { before: 200 } 
      }));
      for (const takeaway of ch.keyTakeaways) {
        children.push(new Paragraph({ 
          text: takeaway, 
          bullet: { level: 0 },
          spacing: { after: 100 }
        }));
      }
    }
    
    // Subparts/sections
    if (ch.parts) {
      for (let j = 0; j < ch.parts.length; j++) {
        const p = ch.parts[j];
        children.push(new Paragraph({ 
          text: `${ch.number || i + 1}.${j + 1} ${p.title}`, 
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200 }
        }));
        if (p.content) {
          const paragraphs = p.content.split(/\n\n+/);
          for (const para of paragraphs) {
            if (para.trim()) {
              const cleanText = para
                .replace(/\*\*(.*?)\*\*/g, '$1')
                .replace(/\*(.*?)\*/g, '$1')
                .replace(/^- /gm, '• ')
                .trim();
              children.push(new Paragraph({ text: cleanText, spacing: { after: 200 } }));
            }
          }
        }
      }
    }
    
    // Page break after each chapter (except the last)
    if (i < chapters.length - 1) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }
  }

  // Bonus content section
  const bonusContent = product.raw_analysis?.outline?.bonus_content;
  if (bonusContent && bonusContent.length > 0) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(new Paragraph({ text: '🎁 Bonus Materials', heading: HeadingLevel.HEADING_1 }));
    for (const bonus of bonusContent) {
      children.push(new Paragraph({ 
        text: `${bonus.title} - ${bonus.type}`,
        bullet: { level: 0 },
        spacing: { after: 100 }
      }));
    }
  }

  // Footer
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(new Paragraph({ 
    text: 'Thank you for reading!',
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 200 }
  }));
  children.push(new Paragraph({ 
    text: 'Created with ❤️ using ManyMarkets',
    alignment: AlignmentType.CENTER
  }));

  const doc = new Document({ 
    sections: [{ 
      properties: {},
      children 
    }] 
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

export async function generateDocxBlob(product: ProductLike): Promise<Blob> {
  const buffer = await generateDocxBuffer(product);
  // Ensure we pass a plain ArrayBuffer (not SharedArrayBuffer) to satisfy BlobPart typing
  const arrayBuffer = new Uint8Array(buffer).buffer;
  return new Blob([arrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}
