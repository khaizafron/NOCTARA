import { AgentId } from '@noctara/shared';

export interface FormattedVoiceResponse {
  fullText: string;
  spokenText: string;
  wordCount: number;
  isTruncatedForSpeech: boolean;
}

export class VoiceResponseFormatter {
  /**
   * Sanitizes text for TTS playback by removing markdown, code blocks, tables,
   * URLs, bracketed telemetry, and excess punctuation.
   */
  public static sanitizeForSpeech(text: string): string {
    if (!text) return '';

    let cleaned = text;

    // 1. Remove fenced code blocks (```lang ... ```)
    cleaned = cleaned.replace(/```[\s\S]*?```/g, '');

    // 2. Remove inline code (`...`)
    cleaned = cleaned.replace(/`([^`]+)`/g, '$1');

    // 3. Remove markdown tables (lines starting with |)
    cleaned = cleaned.replace(/^\s*\|.*\|.*$/gm, '');

    // 4. Remove image tags (![alt](url)) and markdown links ([text](url) -> text)
    cleaned = cleaned.replace(/!\[.*?\]\(.*?\)/g, '');
    cleaned = cleaned.replace(/\[(.*?)\]\(.*?\)/g, '$1');

    // 5. Remove raw URLs
    cleaned = cleaned.replace(/https?:\/\/\S+/g, '');

    // 6. Remove agent/system brackets like [NOX], [ARIA], [NOCTARA CORE], [CRITICAL]
    cleaned = cleaned.replace(/\[(?:NOX|ARIA|ROOT|SYSTEM|NOCTARA|POLICY|CRITICAL|WARNING|ALERT)[^\]]*\]:?\s*/gi, '');

    // 7. Remove markdown headers, bold, italics, strikethrough
    cleaned = cleaned.replace(/^[#]{1,6}\s+/gm, '');
    cleaned = cleaned.replace(/[*_~]{1,3}(.*?)[*_~]{1,3}/g, '$1');

    // 8. Remove bullet points and blockquotes
    cleaned = cleaned.replace(/^\s*[-*+]\s+/gm, '');
    cleaned = cleaned.replace(/^\s*>\s+/gm, '');

    // 9. Remove numbered list prefixes
    cleaned = cleaned.replace(/^\s*\d+\.\s+/gm, '');

    // 10. Collapse multiple spaces and linebreaks
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned;
  }

  /**
   * Generates a natural spoken summary (targeting 2-4 sentences, approx 20-75 words)
   * providing articulate conversational depth while strictly preserving the full response for text transcripts.
   */
  public static formatSpokenResponse(
    fullText: string,
    agentId?: AgentId,
    maxWords: number = 75,
    maxSentences: number = 4
  ): FormattedVoiceResponse {
    const rawSanitized = this.sanitizeForSpeech(fullText);

    if (!rawSanitized) {
      const fallback = agentId === 'NOX'
        ? 'Understood. Operational status acknowledged.'
        : 'Understood, Khai. System standing by.';
      return {
        fullText,
        spokenText: fallback,
        wordCount: fallback.split(/\s+/).length,
        isTruncatedForSpeech: false
      };
    }

    // Split into sentences using punctuation boundaries (. ! ?)
    const sentenceRegex = /[^.!?]+[.!?]+(?:\s+|$)/g;
    const matches = rawSanitized.match(sentenceRegex);

    let spokenCandidate = '';
    let isTruncated = false;

    if (matches && matches.length > 0) {
      // Accumulate sentences up to maxSentences and maxWords
      const accumulated: string[] = [];
      let currentWordCount = 0;

      for (let i = 0; i < matches.length && i < maxSentences; i++) {
        const sentence = matches[i].trim();
        const sentenceWords = sentence.split(/\s+/).filter(Boolean).length;

        if (currentWordCount + sentenceWords <= maxWords) {
          accumulated.push(sentence);
          currentWordCount += sentenceWords;
        } else {
          // If no sentence has been added yet, truncate the first sentence to maxWords
          if (accumulated.length === 0) {
            const firstWords = sentence.split(/\s+/).filter(Boolean);
            accumulated.push(firstWords.slice(0, maxWords).join(' ') + '.');
            currentWordCount = maxWords;
          }
          isTruncated = true;
          break;
        }
      }

      spokenCandidate = accumulated.join(' ');
      if (matches.length > accumulated.length) {
        isTruncated = true;
      }
    } else {
      // No sentence terminator found, truncate by words
      const words = rawSanitized.split(/\s+/).filter(Boolean);
      if (words.length > maxWords) {
        spokenCandidate = words.slice(0, maxWords).join(' ') + '.';
        isTruncated = true;
      } else {
        spokenCandidate = rawSanitized;
        isTruncated = false;
      }
    }

    // Clean up trailing punctuation anomalies
    spokenCandidate = spokenCandidate.replace(/\.\.+$/, '.').trim();

    return {
      fullText,
      spokenText: spokenCandidate,
      wordCount: spokenCandidate.split(/\s+/).filter(Boolean).length,
      isTruncatedForSpeech: isTruncated
    };
  }
}
