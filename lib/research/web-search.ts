import axios from 'axios';
import * as cheerio from 'cheerio';

interface SearchResult {
  title: string;
  snippet: string;
  link: string;
}

export async function searchWeb(query: string): Promise<SearchResult[]> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const results: SearchResult[] = [];

    $('.result').each((_, element) => {
      const titleElem = $(element).find('.result__a');
      const snippetElem = $(element).find('.result__snippet');

      if (titleElem.length) {
        results.push({
          title: titleElem.text().trim(),
          link: titleElem.attr('href') || '',
          snippet: snippetElem.text().trim() || '',
        });
      }
    });

    return results.slice(0, 10);
  } catch (error) {
    console.error('Web search error:', error);
    return [];
  }
}
