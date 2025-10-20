import { CategorizedSynonyms, SynonymResult } from "../types";

// Maximum number of synonyms to fetch from Datamuse API
const MAX_SYNONYMS = 150;

/**
 * Fetches synonyms for a given word using the Datamuse API
 * @param word - The word to find synonyms for
 * @returns Array of synonym strings (single words only)
 */
export const getSynonyms = async (word: string): Promise<string[]> => {
  try {
    const response = await fetch(
      `https://api.datamuse.com/words?ml=${encodeURIComponent(
        word
      )}&max=${MAX_SYNONYMS}`
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data: SynonymResult[] = await response.json();
    // Filter out multi-word synonyms
    return data
      .filter((item) => !item.word.includes(" "))
      .map((item) => item.word);
  } catch (error) {
    console.error("Error fetching synonyms:", error);
    return [];
  }
};

/**
 * Fetches synonyms categorized by match strength
 * @param word - The word to find synonyms for
 * @returns Object containing synonyms categorized by strength
 */
export const getCategorizedSynonyms = async (
  word: string
): Promise<CategorizedSynonyms> => {
  try {
    const response = await fetch(
      `https://api.datamuse.com/words?ml=${encodeURIComponent(
        word
      )}&max=${MAX_SYNONYMS}`
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data: SynonymResult[] = await response.json();

    // Filter out multi-word synonyms
    const singleWordSynonyms = data.filter((item) => !item.word.includes(" "));

    if (singleWordSynonyms.length === 0) {
      return { strongest: [], strong: [], weak: [], all: [] };
    }

    // Get the max score to calculate relative thresholds
    const maxScore = Math.max(...singleWordSynonyms.map((item) => item.score));

    // Use percentage-based thresholds relative to the max score
    // Top 75% or higher of max score = strongest
    // 55-75% of max score = strong
    // Below 55% of max score = weak
    const strongestThreshold = maxScore * 0.75;
    const strongThreshold = maxScore * 0.55;

    const strongest = singleWordSynonyms
      .filter((item) => item.score >= strongestThreshold)
      .map((item) => item.word);

    const strong = singleWordSynonyms
      .filter(
        (item) =>
          item.score >= strongThreshold && item.score < strongestThreshold
      )
      .map((item) => item.word);

    const weak = singleWordSynonyms
      .filter((item) => item.score < strongThreshold)
      .map((item) => item.word);

    return {
      strongest,
      strong,
      weak,
      all: singleWordSynonyms.map((item) => item.word),
    };
  } catch (error) {
    console.error("Error fetching categorized synonyms:", error);
    return {
      strongest: [],
      strong: [],
      weak: [],
      all: [],
    };
  }
};

/**
 * Fetches synonyms with their scores for custom filtering
 * @param word - The word to find synonyms for
 * @returns Array of objects containing words and their relevance scores (single words only)
 */
export const getSynonymsWithScores = async (
  word: string
): Promise<SynonymResult[]> => {
  try {
    const response = await fetch(
      `https://api.datamuse.com/words?rel_syn=${encodeURIComponent(
        word
      )}&max=${MAX_SYNONYMS}`
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data: SynonymResult[] = await response.json();
    // Filter out multi-word synonyms
    return data.filter((item) => !item.word.includes(" "));
  } catch (error) {
    console.error("Error fetching synonyms with scores:", error);
    return [];
  }
};
