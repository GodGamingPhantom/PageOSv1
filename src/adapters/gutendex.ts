

type GutenbergBook = {
  id: number;
  title: string;
  authors: { name: string }[];
  formats: Record<string, string>;
};

type GutenbergAPIResponse = {
  results: GutenbergBook[];
};

export type MappedGutenbergBook = {
  id: string;
  title: string;
  authors: string;
  formats: Record<string, string>;
  source: 'gutendex';
};

/**
 * This file is the specific adapter for the Gutendex API (gutenberg.org).
 * It handles fetching lists of books and the content of a single book.
 */

export async function fetchGutenbergBooks(query?: string, page = 1): Promise<MappedGutenbergBook[]> {
  const params = new URLSearchParams();
  if (query) {
    params.set('search', query);
  } else {
    // If no query is provided, we fetch the most popular books.
    params.set('sort', 'popular');
  }
  params.set('page', String(page));
  
  const apiUrl = `https://gutendex.com/books?${params.toString()}`;
  
  // We use our own API proxy to avoid CORS issues that can occur
  // when a browser tries to fetch directly from a third-party API.
  const res = await fetch(`/api/proxy?url=${encodeURIComponent(apiUrl)}`);
  if (!res.ok) {
    console.error('Failed to fetch from Gutendex:', res.statusText);
    return [];
  }
  const data: GutenbergAPIResponse = await res.json();
  // We map the raw API response to our standardized `MappedGutenbergBook` format.
  // This ensures that data from all sources has a consistent shape within our app.
  return data.results.map(book => ({
    id: String(book.id),
    title: book.title,
    authors: book.authors.map(a => a.name).join(', '),
    formats: book.formats,
    source: 'gutendex'
  }));
}

/**
 * Fetches the actual text content of a single book from Gutendex.
 * @param formats A record of available formats for the book (e.g., 'text/plain', 'application/epub+zip').
 * @returns A promise that resolves to the book's content as a single string.
 */
export async function fetchGutenbergBookContent(formats: Record<string, string>): Promise<string | Blob> {
  const formatEntries = Object.entries(formats);

  // STEP 1: Find a suitable plain text format.
  // We prioritize plain text because it's the easiest to parse and display.
  // We specifically exclude .zip files, as they would require an extra decompression step.
  const plainTextEntry = formatEntries.find(([key, url]) => 
    key.startsWith('text/plain') && !url.endsWith('.zip')
  );

  if (plainTextEntry) {
    // STEP 2: If a plain text URL is found, fetch its content.
    const plainTextUrl = plainTextEntry[1];
    // Again, we use our API proxy for the fetch.
    const res = await fetch(`/api/proxy?url=${encodeURIComponent(plainTextUrl)}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch book content from ${plainTextUrl}`);
    }
    // STEP 3: Return the content as a raw text string.
    return await res.text();
  }

  // If we find an EPUB, throw a specific error because the reader doesn't support it.
  const epubUrl = formats['application/epub+zip'];
  if (epubUrl) {
    throw new Error('EPUB format is not supported by the PageOS reader at this time.');
  }

  // If no compatible format is found, throw a general error.
  throw new Error('No compatible book format found for this Gutendex book (epub or txt).');
}
