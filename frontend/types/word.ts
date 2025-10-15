
export interface GetWordsResponse {
    success: boolean;
    words?: Word[];
    count?: number;
    error?: string;
    statusCode?: number;
}

export interface Word {
    word_id: number;
    word: string;
    strong_matches: string[];
    strongest_matches: string[];
    weak_matches: string[];
}