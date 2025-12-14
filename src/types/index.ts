export type Mode = 'chat' | 'quiz' | 'review';

export type Sender = 'user' | 'assistant';

export interface Message {
  id: string;
  sender: Sender;
  content: string;
  timestamp: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizAttempt extends QuizQuestion {
  userAnswer: number;
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
}

export type AppAction =
  | { type: 'setMode'; mode: Mode }
  | { type: 'addMessage'; message: Message }
  | { type: 'setQuestion'; question?: QuizQuestion; status: AppState['quizStatus'] }
  | { type: 'recordAttempt'; attempt: QuizAttempt; addToReviewQueue: boolean }
  | { type: 'replaceReviewQueue'; queue: QuizQuestion[] };
