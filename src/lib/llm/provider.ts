export interface LLMProvider {
  generateText(systemPrompt: string, userPrompt: string): Promise<string>;
  generateStream(
    systemPrompt: string,
    userPrompt: string
  ): AsyncIterable<string>;
}
