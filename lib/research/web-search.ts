import axios from 'axios';
import * as cheerio from 'cheerio';

interface SearchResult {
  title: string;
  snippet: string;
  link: string;
}

export async function searchWeb(query: string): Promise<SearchResult[]> {
  // Try multiple search engines with fallback
  const engines = [
    () => searchWithDuckDuckGo(query),
    () => searchWithBrave(query),
  ];
  
  for (const engine of engines) {
    try {
      const results = await engine();
      if (results.length > 0) {
        return results;
      }
    } catch (error) {
      console.log('Search engine failed, trying next...', error);
    }
  }
  
  // Return empty if all engines fail - the AI can still generate ideas
  console.log('All search engines failed, proceeding without web data');
  return [];
}

async function searchWithDuckDuckGo(query: string): Promise<SearchResult[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
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
}

async function searchWithBrave(query: string): Promise<SearchResult[]> {
  // Brave Search has a more lenient API
  const url = `https://search.brave.com/search?q=${encodeURIComponent(query)}&source=web`;
  
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
    timeout: 15000,
  });

  const $ = cheerio.load(response.data);
  const results: SearchResult[] = [];

  // Brave uses different selectors
  $('[data-type="web"]').each((_, element) => {
    const titleElem = $(element).find('a[href]').first();
    const snippetElem = $(element).find('.snippet-description');

    if (titleElem.length && titleElem.attr('href')?.startsWith('http')) {
      results.push({
        title: titleElem.text().trim(),
        link: titleElem.attr('href') || '',
        snippet: snippetElem.text().trim() || '',
      });
    }
  });

  return results.slice(0, 10);
}
