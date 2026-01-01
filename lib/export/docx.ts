import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx';

export type ProductLike = {
  name: string;
  raw_analysis?: any;
};

export async function generateDocxBuffer(product: ProductLike): Promise<Uint8Array> {
  const children: any[] = [];

  children.push(new Paragraph({ text: product.name || 'Untitled', heading: HeadingLevel.TITLE }));

  if (product.raw_analysis?.overview) {
    children.push(new Paragraph({ text: 'Overview', heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ text: product.raw_analysis.overview }));
  }

  const chapters = product.raw_analysis?.outline?.chapters || [];
  chapters.forEach((ch: any, i: number) => {
    children.push(new Paragraph({ text: `${i + 1}. ${ch.title}`, heading: HeadingLevel.HEADING_2 }));
    if (ch.content) children.push(new Paragraph({ text: ch.content }));
    if (ch.assets && ch.assets.length) {
      children.push(new Paragraph({ text: 'Assets:' }));
      ch.assets.forEach((a: any) => {
        children.push(new Paragraph({ text: a.fullUrl || a.url || a.id }));
      });
    }
    if (ch.parts) {
      ch.parts.forEach((p: any, j: number) => {
        children.push(new Paragraph({ text: `${i + 1}.${j + 1} ${p.title}`, heading: HeadingLevel.HEADING_3 }));
        if (p.content) children.push(new Paragraph({ text: p.content }));
      });
    }
  });

  const doc = new Document({ sections: [{ children }] });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

export async function generateDocxBlob(product: ProductLike): Promise<Blob> {
  const buffer = await generateDocxBuffer(product);
  // Ensure we pass a plain ArrayBuffer (not SharedArrayBuffer) to satisfy BlobPart typing
  const arrayBuffer = new Uint8Array(buffer).buffer;
  return new Blob([arrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}
