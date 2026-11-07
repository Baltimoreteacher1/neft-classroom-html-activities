export interface WidaScore {
  lexicalComplexity: number;
  syntacticVariety: number;
  discourseLevel: number; // 1 to 6 WIDA Scale
}

export class DiscourseArchitect {
  private cognateMap: Map<string, string> = new Map([
    ['ratio', 'razón'],
    ['fraction', 'fracción'],
    ['denominator', 'denominador'],
    ['numerator', 'numerador'],
    ['proportional', 'proporcional'],
    ['equivalent', 'equivalente']
  ]);

  public analyzeText(input: string): WidaScore {
    const words = input.trim().split(/\s+/).filter(Boolean);
    const sentences = input.split(/[.!?]+/).filter(Boolean);

    const avgSentenceLength = words.length / (sentences.length || 1);
    const wordLengths = words.map(w => w.length);
    const avgWordLength = wordLengths.reduce((a, b) => a + b, 0) / (words.length || 1);

    const lexicalComplexity = Math.min(10, avgWordLength * 1.5);
    const syntacticVariety = Math.min(10, avgSentenceLength * 0.8);

    let level = 1;
    if (avgSentenceLength > 4 && lexicalComplexity > 4) level = 2;
    if (avgSentenceLength > 8 && lexicalComplexity > 6) level = 3;
    if (avgSentenceLength > 12 && lexicalComplexity > 7) level = 4;
    if (avgSentenceLength > 15 && lexicalComplexity > 8) level = 5;

    return {
      lexicalComplexity: parseFloat(lexicalComplexity.toFixed(2)),
      syntacticVariety: parseFloat(syntacticVariety.toFixed(2)),
      discourseLevel: level
    };
  }

  public injectCognateScaffolds(htmlText: string, targetLang: string = 'es'): string {
    if (targetLang !== 'es') return htmlText;

    let processed = htmlText;
    this.cognateMap.forEach((spanishCognate, englishTerm) => {
      const regex = new RegExp(`\\b(${englishTerm})\\b`, 'gi');
      processed = processed.replace(regex, `<span class="cognate-highlight" data-cognate="${spanishCognate}">$1</span>`);
    });

    return processed;
  }
}
