import React, { useEffect, useMemo, useReducer } from 'react';
import { RuleTutor } from '../tutor/RuleTutor';
import { loadPersistedState, savePersistedState } from '../storage/localStorage';
import { AppAction, AppState, Message, Mode, QuizAnswer, QuizAttempt, QuizQuestion } from '../types';
import { TabNav } from './TabNav';
import { ChatPanel } from './ChatPanel';
import { QuizPanel } from './QuizPanel';
import { ReviewPanel } from './ReviewPanel';
import { ProgressPanel } from './ProgressPanel';

const createInitialState = (): AppState => {
  const persisted = typeof window !== 'undefined' ? loadPersistedState() : undefined;
  const defaultMessage: Message = {
    id: 'welcome',
    sender: 'assistant',
    content: 'ようこそ！学習モードでは質問を投げかけてください。クイズモードでは4択問題を出題します。',
    timestamp: new Date().toISOString(),
  };

  return {
    mode: 'chat',
    messages: persisted?.messages?.length ? persisted.messages : [defaultMessage],
    reviewQueue: persisted?.reviewQueue ?? [],
    log: persisted?.log ?? [],
    quizStatus: 'idle',
    currentQuestion: undefined,
    lastAttempt: undefined,
  };
};

const countIncorrect = (log: QuizAttempt[]): Map<string, number> => {
  const counts = new Map<string, number>();
  log.forEach((attempt) => {
    if (!attempt.isCorrect) {
      counts.set(attempt.id, (counts.get(attempt.id) ?? 0) + 1);
    }
  });
  return counts;
};

const sortReviewQueue = (queue: QuizQuestion[], log: QuizAttempt[]): QuizQuestion[] => {
  const wrongCounts = countIncorrect(log);
  return [...queue].sort((a, b) => (wrongCounts.get(b.id) ?? 0) - (wrongCounts.get(a.id) ?? 0));
};

const reducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'setMode':
      return { ...state, mode: action.mode };
    case 'addMessage':
      return { ...state, messages: [...state.messages, action.message] };
    case 'setQuestion':
      return { ...state, currentQuestion: action.question, quizStatus: action.status };
    case 'recordAttempt': {
      const nextLog = [...state.log, action.attempt];
      let nextQueue = [...state.reviewQueue];
      if (action.addToReviewQueue) {
        const exists = nextQueue.some((q) => q.id === action.attempt.id);
        if (!exists) {
          nextQueue = [...nextQueue, action.attempt];
        }
      }
      nextQueue = sortReviewQueue(nextQueue, nextLog);
      return {
        ...state,
        lastAttempt: action.attempt,
        log: nextLog,
        reviewQueue: nextQueue,
        quizStatus: 'result',
      };
    }
    case 'replaceReviewQueue':
      return { ...state, reviewQueue: action.queue };
    default:
      return state;
  }
};

const tutor = new RuleTutor();

const addMessage = (dispatch: React.Dispatch<AppAction>, sender: 'user' | 'assistant', content: string) => {
  const message: Message = {
    id: `${sender}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    sender,
    content,
    timestamp: new Date().toISOString(),
  };
  dispatch({ type: 'addMessage', message });
};

export default function App(): JSX.Element {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  useEffect(() => {
    savePersistedState({
      messages: state.messages,
      log: state.log,
      reviewQueue: state.reviewQueue,
    });
  }, [state.messages, state.log, state.reviewQueue]);

  const modeLabel: Record<Mode, string> = useMemo(
    () => ({ chat: 'Chat', quiz: 'Quiz', review: 'Review', progress: 'Progress' }),
    []
  );

  const handleModeChange = (mode: Mode) => dispatch({ type: 'setMode', mode });

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return;
    addMessage(dispatch, 'user', content.trim());
    const reply = tutor.generateChatReply(content.trim());
    addMessage(dispatch, 'assistant', reply.message);
  };

  const handleStartQuiz = () => {
    const question = tutor.nextQuizQuestion(state.log);
    dispatch({ type: 'setQuestion', question, status: 'awaitingAnswer' });
  };

  const createAttempt = (question: QuizQuestion, userAnswer: QuizAnswer): QuizAttempt => {
    const evaluation = tutor.evaluateAnswer(question, userAnswer);
    return {
      ...question,
      userAnswer,
      isCorrect: evaluation.isCorrect,
      explanation: evaluation.explanation,
      askedAt: new Date().toISOString(),
    };
  };

  const handleSubmitAnswer = (answer: QuizAnswer, isReview = false) => {
    if (!state.currentQuestion) return;
    const attempt = createAttempt(state.currentQuestion, answer);
    const addToReview = !attempt.isCorrect && !isReview;
    dispatch({ type: 'recordAttempt', attempt, addToReviewQueue: addToReview });
  };

  const handleNextReviewQuestion = () => {
    if (!state.reviewQueue.length) {
      dispatch({ type: 'setQuestion', question: undefined, status: 'idle' });
      return;
    }
    const orderedQueue = sortReviewQueue(state.reviewQueue, state.log);
    const [next] = orderedQueue;
    dispatch({ type: 'setQuestion', question: next, status: 'awaitingAnswer' });
    dispatch({ type: 'replaceReviewQueue', queue: orderedQueue });
  };

  const handleReviewAnswer = (answer: QuizAnswer) => {
    if (!state.currentQuestion) return;
    const attempt = createAttempt(state.currentQuestion, answer);
    const queueWithoutCurrent = state.reviewQueue.filter((q) => q.id !== state.currentQuestion?.id);
    const nextQueue = attempt.isCorrect
      ? queueWithoutCurrent
      : [...queueWithoutCurrent, state.currentQuestion];
    const orderedQueue = sortReviewQueue(nextQueue, [...state.log, attempt]);
    dispatch({ type: 'recordAttempt', attempt, addToReviewQueue: false });
    dispatch({ type: 'replaceReviewQueue', queue: orderedQueue });
  };

  useEffect(() => {
    if (state.mode === 'review' && state.quizStatus === 'idle' && state.reviewQueue.length) {
      handleNextReviewQuestion();
    }
  }, [state.mode, state.reviewQueue.length]);

  return (
    <div className="app">
      <header className="app__header">
        <h1>Study Tutor</h1>
        <p className="app__tagline">会話しながら学べるローカル用ダッシュボード</p>
      </header>

      <TabNav active={state.mode} onChange={handleModeChange} labels={modeLabel} />

      <main className="app__main">
        {state.mode === 'chat' && (
          <ChatPanel messages={state.messages} onSendMessage={handleSendMessage} />
        )}

        {state.mode === 'quiz' && (
          <QuizPanel
            status={state.quizStatus}
            question={state.currentQuestion}
            lastAttempt={state.lastAttempt}
            onStartQuiz={handleStartQuiz}
            onSubmitAnswer={handleSubmitAnswer}
          />
        )}

        {state.mode === 'review' && (
          <ReviewPanel
            status={state.quizStatus}
            question={state.currentQuestion}
            lastAttempt={state.lastAttempt}
            queueLength={state.reviewQueue.length}
            onNext={handleNextReviewQuestion}
            onSubmitAnswer={handleReviewAnswer}
          />
        )}

        {state.mode === 'progress' && <ProgressPanel log={state.log} />}
      </main>
    </div>
  );
}
