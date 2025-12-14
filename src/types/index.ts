// 表示モード。新しい Builder タブを追加しても後方互換を維持するため、既存のラベルは残す。
export type Mode = 'chat' | 'quiz' | 'review' | 'progress' | 'builder';

export type Sender = 'user' | 'assistant';

// クイズの種類。デフォルトは multipleChoice で、既存データとの互換性を確保する。
export type QuestionType = 'multipleChoice' | 'shortAnswer' | 'codeFill' | 'codeDebug';

export type QuizAnswer = number | string;

export interface LearningSuggestion {
  topic: string;
  reason: string;
}

export type BuilderDifficulty = 'easy' | 'normal';

export type BuilderTemplate = 'react-mini' | 'node-api' | 'unity-csharp';

export interface BuilderInput {
  description: string;
  template: BuilderTemplate;
  difficulty: BuilderDifficulty;
}

export interface BuilderFile {
  path: string;
  content: string;
}

// Builder 出力は LLM 置き換えを想定した固定フォーマット。
export interface BuilderOutput {
  summary: string;
  assumptions: string[];
  runSteps: string[];
  files: BuilderFile[];
}

export interface Message {
  id: string;
  sender: Sender;
  content: string;
  timestamp: string;
}

export interface BaseQuestion {
  id: string;
  prompt: string;
  explanation: string;
  type?: QuestionType;
  topic?: string;
  difficulty?: 1 | 2 | 3 | 4 | 5;
  hints?: string[];
  rubric?: string;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type?: 'multipleChoice';
  choices: string[];
  correctIndex: number;
}

export interface ShortAnswerQuestion extends BaseQuestion {
  type: 'shortAnswer';
  expectedAnswer: string;
  acceptableAnswers?: string[];
}

export interface CodeFillQuestion extends BaseQuestion {
  type: 'codeFill';
  codeTemplate: string;
  expectedAnswer: string;
  expectedOutput?: string;
}

export interface CodeDebugQuestion extends BaseQuestion {
  type: 'codeDebug';
  buggySnippet: string;
  expectedFix: string;
  expectedOutput?: string;
}

export type QuizQuestion =
  | MultipleChoiceQuestion
  | ShortAnswerQuestion
  | CodeFillQuestion
  | CodeDebugQuestion;

export interface QuizAttempt extends QuizQuestion {
  userAnswer: QuizAnswer;
  isCorrect: boolean;
  askedAt: string;
}

export interface AppState {
  mode: Mode;
  messages: Message[];
  currentQuestion?: QuizQuestion;
  lastAttempt?: QuizAttempt;
  reviewQueue: QuizQuestion[];
  log: QuizAttempt[];
  quizStatus: 'idle' | 'awaitingAnswer' | 'result';
  builderOutput?: BuilderOutput;
}

export type AppAction =
  | { type: 'setMode'; mode: Mode }
  | { type: 'addMessage'; message: Message }
  | { type: 'setQuestion'; question?: QuizQuestion; status: AppState['quizStatus'] }
  | { type: 'recordAttempt'; attempt: QuizAttempt; addToReviewQueue: boolean }
  | { type: 'replaceReviewQueue'; queue: QuizQuestion[] }
  | { type: 'setBuilderOutput'; output?: BuilderOutput };
