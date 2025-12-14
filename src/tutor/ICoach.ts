import { QuizAttempt, QuizQuestion } from '../types';

export interface ChatReply {
  message: string;
}

export interface EvaluationResult {
  isCorrect: boolean;
  explanation: string;
}

export interface ICoach {
  readonly name: string;
  generateChatReply: (userMessage: string) => ChatReply;
  nextQuizQuestion: (log: QuizAttempt[]) => QuizQuestion;
  evaluateAnswer: (question: QuizQuestion, userAnswerIndex: number) => EvaluationResult;
}
