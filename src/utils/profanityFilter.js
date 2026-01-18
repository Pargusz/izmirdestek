/**
 * Profanity Filter Utility
 * Handles censorship of offensive words in Turkish and English.
 */

const BAD_WORDS = [
    // Turkish
    "amk", "aq", "sik", "sikim", "sikerim", "yarrak", "yarak", "oç", "pic", "piç",
    "göt", "orosbu", "orospu", "kahpe", "yavşak", "amcık", "ananı", "bacını", "sürtük",
    "ibne", "gavat", "kaltak", "kaşar", "skm", "amq", "sie",

    // English
    "fuck", "shit", "bitch", "asshole", "cunt", "dick", "bastard", "whore", "slut",
    "fucking", "motherfucker", "cock", "pussy"
];

// Helper to check if a word matches a bad word (including varying suffixes/cases)
const isBadWord = (word) => {
    const cleanWord = word.toLowerCase().replace(/[^a-zğüşıöç]/g, ''); // Remove punctuation
    return BAD_WORDS.some(bad => cleanWord.includes(bad));
};

// Ciphers the word: keep first, keep last (if > 2 chars), mask middle
const maskWord = (word) => {
    if (word.length <= 1) return word;
    if (word.length === 2) return word[0] + '*';

    // Keep first and last, mask middle
    const first = word[0];
    const last = word[word.length - 1];
    const middle = '*'.repeat(word.length - 2);
    return `${first}${middle}${last}`;
};

export const censorText = (text) => {
    if (!text) return text;

    return text.split(/\s+/).map(word => {
        // preserve punctuation checks
        const cleanWord = word.toLowerCase().replace(/[^a-zğüşıöç]/g, '');

        // Direct match check or contains bad word (careful with 'analiz' containing 'anal' etc, but simple includes is risky)
        // For now, let's strictly check if the clean word STARTS with or IS a bad word to catch "sikerim" from "sik"
        // But "sikka" is currency. "analiz" is analysis. 
        // Let's rely on the explicit list including conjugated forms or just exact matches for short words

        // Better strategy: Check if the word is in the bad words list
        if (BAD_WORDS.includes(cleanWord)) {
            return maskWord(word);
        }

        // Check for "starting with" for common stems like "sik", "yarrak"?
        // Risky. Let's stick to the comprehensive BAD_WORDS list and maybe partials if length is high.
        // For "ananı" (user example), it's in the list.

        // Check if ANY bad word is a substring of this word (e.g. 'anasını' contains 'ana' - wait ana is mother)
        // 'oç' -> match exact.

        // Let's refine strict match for short words, partial for long.
        const foundBad = BAD_WORDS.find(bad => {
            if (bad.length < 4) return cleanWord === bad; // strict for short tokens
            return cleanWord.includes(bad); // partial for longer (e.g. motherfucker)
        });

        if (foundBad) {
            return maskWord(word);
        }

        return word;
    }).join(' ');
};
