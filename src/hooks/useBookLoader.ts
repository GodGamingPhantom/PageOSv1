
'use client';

import { useEffect, useMemo, useState } from 'react';
import type { SearchResult } from '@/adapters/sourceManager';
import { fetchBookContent } from '@/adapters/sourceManager';
import { fetchWebBookContent } from '@/adapters/web';
import { getLibraryBook } from '@/services/userData';
import { useAuth } from '@/context/auth-provider';
import { generateBookId } from '@/services/userData';


export default function useBookLoader(searchParams: URLSearchParams) {
  const { user } = useAuth();
  const [book, setBook] = useState<SearchResult | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSector, setActiveSector] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const loadBookData = async () => {
      setIsLoading(true);
      setError(null);

      const source = searchParams.get('source');
      const id = searchParams.get('id');
      const title = searchParams.get('title');

      if (!source || !id || !title) {
        setError('Essential book information is missing from the request.');
        setIsLoading(false);
        return;
      }

      try {
        let loadedContent: string | Blob | null = null;
        let parsedBook: SearchResult;

        if (source === 'web') {
          const url = searchParams.get('url')!;
          parsedBook = {
            id: url,
            title: searchParams.get('title')!,
            source: 'web' as 'gutendex',
            authors: 'Web Source',
            formats: {},
          };
          loadedContent = await fetchWebBookContent(url);
          if (!loadedContent) {
            throw new Error("Could not extract readable text from the web page.");
          }
        } else {
          parsedBook = {
            id: id,
            title: title,
            source: source as 'gutendex',
            authors: searchParams.get('authors') || 'Unknown',
            formats: JSON.parse(searchParams.get('formats') || '{}'),
          };
          loadedContent = await fetchBookContent(parsedBook);
        }

        setBook(parsedBook);
        setContent(typeof loadedContent === 'string' ? loadedContent : null);

        if (user && parsedBook) {
          const bookId = generateBookId(parsedBook);
          const libraryBook = await getLibraryBook(user.uid, bookId);
          if (libraryBook && typeof libraryBook.lastReadSector === 'number') {
             setActiveSector(libraryBook.lastReadSector);
          }
        }

      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred while loading the book.';
        setError(errorMessage);
        console.error("Book loading error:", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadBookData();
  }, [searchParams, user]);
  
  const { sectors, toc } = useMemo(() => {
    if (!content) return { sectors: [], toc: [] };

    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim() !== '');
    const sectors: string[][] = [];
    const toc: { title: string; sectorIndex: number }[] = [];
    const SECTOR_SIZE = 4;

    const chapterRegex = /^(chapter|part)\s+[\divxclmk]+\.?/i;
    const allCapsTitle = /^[A-Z][A-Z\s]{5,}[A-Z]$/;

    for (let i = 0; i < paragraphs.length; i += SECTOR_SIZE) {
      const sectorContent = paragraphs.slice(i, i + SECTOR_SIZE);
      const sectorIndex = sectors.length;
      const heading = sectorContent.find(p => chapterRegex.test(p.trim()) || allCapsTitle.test(p.trim()));
      
      if (heading) {
        toc.push({ title: heading.trim(), sectorIndex: sectorIndex });
      }

      sectors.push(sectorContent);
    }
    
    if(toc.length === 0 && sectors.length > 10) {
        for(let i = 0; i < sectors.length; i += 10) {
            toc.push({title: `Sector ${i+1}`, sectorIndex: i});
        }
    }

    return { sectors, toc };
  }, [content]);

  return {
    book,
    isLoading,
    error,
    toc,
    sectors,
    currentSector: sectors[activeSector],
    activeSector,
    setActiveSector,
    direction,
    setDirection,
  };
}
