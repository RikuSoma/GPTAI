import {
  BuilderInput,
  BuilderOutput,
  LearningSuggestion,
  QuizAnswer,
  QuizAttempt,
  QuizQuestion,
} from '../types';
import { ChatReply, EvaluationResult, ICoach } from './ICoach';
import { createChatCompletion } from '../llm/llmClient';

/**
 * LlmTutor は後から LLM 実装を差し替えるためのプレースホルダです。
 * 現状は RuleTutor と同じインターフェースを持ちますが、呼び出しは未実装です。
 */
export class LlmTutor implements ICoach {
  public readonly name = 'LlmTutor';

  generateChatReply(userMessage: string): ChatReply {
    // 実際の LLM 実装に差し替える際にここを拡張する
    const fallback: ChatReply = {
      message:
        'LLM クライアントが未設定のため、RuleTutor で代用してください。llm/llmClient.ts を実装すると LLM に切り替えられます。',
    };
    void createChatCompletion(userMessage); // 明示的に呼び出して型を固定
    return fallback;
  }

  nextQuizQuestion(_log: QuizAttempt[]): QuizQuestion {
    throw new Error('LlmTutor is not implemented yet. Provide llmClient implementation.');
  }

  evaluateAnswer(_question: QuizQuestion, _userAnswer: QuizAnswer): EvaluationResult {
    throw new Error('LlmTutor is not implemented yet.');
  }

  suggestNext(_log: QuizAttempt[]): LearningSuggestion {
    throw new Error('LlmTutor is not implemented yet.');
  }

  generateProject(_input: BuilderInput): BuilderOutput {
    throw new Error('LlmTutor is not implemented yet.');
  }
}
