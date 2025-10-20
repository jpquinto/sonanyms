interface ChainWordResult {
  word: string;
  score: number;
}

export interface ChainWordWithScore {
  word: string;
  score: number;
}

// Words to filter out (common prepositions, punctuation, articles, etc.)
const FILTER_WORDS = new Set([
  ".",
  ",",
  "!",
  "?",
  ";",
  ":",
  "-",
  "'",
  '"',
  "and",
  "or",
  "but",
  "the",
  "a",
  "an",
  "to",
  "of",
  "in",
  "on",
  "at",
  "for",
  "with",
  "by",
  "from",
  "as",
  "is",
  "was",
  "are",
  "be",
  "been",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "must",
  "can",
  "that",
  "this",
  "these",
  "those",
  "i",
  "you",
  "he",
  "she",
  "it",
  "we",
  "they",
  "me",
  "him",
  "her",
  "us",
  "them",
  "my",
  "your",
  "his",
  "its",
  "our",
  "their",
  "which",
  "who",
  "what",
  "where",
  "when",
  "why",
  "how",
  "if",
  "than",
  "then",
  "so",
  "very",
  "too",
  "more",
  "most",
]);

// Minimum score threshold
const MIN_SCORE = 4000;

// Minimum number of valid results required
const MIN_RESULTS = 20;

/**
 * Normalizes a word by removing trailing 's' to handle plurals
 * @param word - The word to normalize
 * @returns Normalized word
 */
const normalizeWord = (word: string): string => {
  // Remove trailing 's' for basic plural handling
  // Only if word is longer than 2 characters to avoid issues with words like "is", "as"
  if (word.length > 2 && word.endsWith("s")) {
    return word.slice(0, -1);
  }
  return word;
};

/**
 * Fetches the top words that commonly follow a given word
 * @param word - The word to find following words for
 * @returns Array of up to 10 most common following words with their scores
 */
export const getChainWords = async (
  word: string
): Promise<ChainWordWithScore[]> => {
  try {
    const response = await fetch(
      `https://api.datamuse.com/words?lc=${encodeURIComponent(word)}&sp=*`
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data: ChainWordResult[] = await response.json();

    // Filter results
    const validWords: ChainWordWithScore[] = [];
    const seenNormalized = new Set<string>();

    for (const item of data) {
      // Skip if score is too low
      if (item.score < MIN_SCORE) {
        continue;
      }

      const lowercaseWord = item.word.toLowerCase();

      // Skip filtered words (punctuation, prepositions, etc.)
      if (FILTER_WORDS.has(lowercaseWord)) {
        continue;
      }

      // Skip multi-word phrases
      if (item.word.includes(" ")) {
        continue;
      }

      // Handle duplicates/plurals
      const normalized = normalizeWord(lowercaseWord);

      // Skip if we've already seen this word or its normalized form
      if (seenNormalized.has(normalized)) {
        continue;
      }

      seenNormalized.add(normalized);
      validWords.push({
        word: item.word,
        score: item.score,
      });

      // Stop once we have 20 valid words
      if (validWords.length >= 20) {
        break;
      }
    }

    // Only return results if we have at least MIN_RESULTS valid matches
    if (validWords.length < MIN_RESULTS) {
      return [];
    }

    return validWords.slice(0, 20);
  } catch (error) {
    console.error("Error fetching chain words:", error);
    return [];
  }
};
