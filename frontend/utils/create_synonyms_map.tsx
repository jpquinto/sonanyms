import { Word } from "@/types/word";


export const createSynonymsMap = (word: Word): Map<string, number> => {
    const synonymsMap = new Map<string, number>();

    for (const synonym of word.strongest_matches) {
        synonymsMap.set(synonym.toLowerCase(), 3);
    }
    for (const synonym of word.strong_matches) {
        synonymsMap.set(synonym.toLowerCase(), 2);
    }
    for (const synonym of word.weak_matches) {
        synonymsMap.set(synonym.toLowerCase(), 1);
    }

    return synonymsMap;
}