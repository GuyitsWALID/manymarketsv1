import { describe, it, expect } from 'vitest';
import { generateDocxBuffer } from './docx';

describe('generateDocxBuffer', () => {
  it('creates a non-empty buffer for a simple product', async () => {
    const product = {
      name: 'Test Book',
      raw_analysis: {
        overview: 'An overview',
        outline: { chapters: [{ title: 'Intro', content: 'Welcome' }] }
      }
    };

    const buf = await generateDocxBuffer(product as any);
    expect(buf).toBeDefined();
    expect((buf as Uint8Array).length).toBeGreaterThan(0);
  });
});
