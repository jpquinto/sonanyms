
export interface GetFirstChainResponse {
    success: boolean;
    words?: FirstChain[];
    count?: number;
    error?: string;
    statusCode?: number;
}

export interface FirstChain {
    first_chain: string;
    links: { word: string; }[];
}