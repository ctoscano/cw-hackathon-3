/**
 * Generate a ChatGPT deep link URL with a pre-filled prompt
 *
 * ChatGPT URL format: https://chatgpt.com/?q=<encoded-prompt>
 * Or for new chat: https://chatgpt.com/?model=gpt-4&q=<encoded-prompt>
 */
export function generateChatGPTUrl(prompt: string): string {
  const encodedPrompt = encodeURIComponent(prompt);
  return `https://chatgpt.com/?q=${encodedPrompt}`;
}

/**
 * Create a ChatGPT prompt from an experiment description
 * This wraps the experiment in context that's useful for ChatGPT continuation
 */
export function createExperimentPrompt(experimentDescription: string): string {
  return `I'm exploring therapy and received this pre-therapy experiment suggestion:

${experimentDescription}

Can you help me think through this experiment? Specifically:
1. How might I adapt this to my specific situation?
2. What should I pay attention to or notice while trying this?
3. How could I bring what I learn into a first therapy session?

Please keep your guidance exploratory and non-prescriptive - I'm looking for ways to gather useful data about myself, not assignments to complete.`;
}
