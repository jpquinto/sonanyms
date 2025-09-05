export const targetWords = {
  'destroy': ['demolish', 'ruin', 'annihilate'],
  'happy': ['joyful', 'cheerful', 'content'],
  'sad': ['unhappy', 'sorrowful', 'dejected'],
  'fast': ['quick', 'swift', 'rapid'],
  'slow': ['lethargic', 'sluggish', 'unhurried'],
  // Add more words and their synonyms as needed
}
export const getRandomScore = () => {
  return Math.floor(Math.random() * 100) + 1; // Random score between 1 and 100
}

