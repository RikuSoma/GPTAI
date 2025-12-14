/**
 * LLM を差し替えるためのプレースホルダ。環境変数や API キーをここで扱う想定です。
 * 実際に LLM を組み込む場合は createChatCompletion を適切に実装してください。
 */
export const createChatCompletion = async (_prompt: string): Promise<string> => {
  // 現状はダミー実装
  return 'LLM client is not configured.';
};
