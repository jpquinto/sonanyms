export interface SynonymResult {
  word: string;
  score: number;
}

export interface CategorizedSynonyms {
  strongest: string[];
  strong: string[];
  weak: string[];
  all: string[];
}
