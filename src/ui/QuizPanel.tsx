import React, { useEffect, useMemo, useState } from 'react';
import { QuizAttempt, QuizQuestion, QuestionType } from '../types';

interface Props {
  status: 'idle' | 'awaitingAnswer' | 'result';
  question?: QuizQuestion;
  lastAttempt?: QuizAttempt;
  onStartQuiz: () => void;
  onSubmitAnswer: (answer: number | string, isReview?: boolean) => void;
}

export const QuizPanel: React.FC<Props> = ({ status, question, lastAttempt, onStartQuiz, onSubmitAnswer }) => {
  const [selected, setSelected] = useState<number | undefined>(undefined);
  const [textAnswer, setTextAnswer] = useState<string>('');

  const questionType: QuestionType = useMemo(() => question?.type ?? 'multipleChoice', [question]);

  useEffect(() => {
    setSelected(undefined);
    setTextAnswer('');
  }, [question?.id]);

  const handleSubmit = () => {
    if (status !== 'awaitingAnswer' || !question) return;
    if (questionType === 'multipleChoice') {
      if (selected === undefined) return;
      onSubmitAnswer(selected);
      return;
    }
    if (!textAnswer.trim()) return;
    onSubmitAnswer(textAnswer.trim());
  };

  const renderMeta = () => (
    <div className="question__meta">
      <span className="pill">Topic: {question?.topic ?? 'general'}</span>
      <span className="pill">Difficulty: {question?.difficulty ?? '-'}</span>
    </div>
  );

  const renderHints = () =>
    question?.hints?.length ? (
      <ul className="hint-list">
        {question.hints.map((hint) => (
          <li key={hint}>{hint}</li>
        ))}
      </ul>
    ) : null;

  const renderInput = () => {
    if (!question) return null;
    if (questionType === 'multipleChoice' && question.choices) {
      return (
        <div className="question__choices">
          {question.choices.map((choice, index) => (
            <label key={choice} className={`choice ${selected === index ? 'choice--selected' : ''}`}>
              <input
                type="radio"
                name="quiz-choice"
                value={index}
                checked={selected === index}
                onChange={() => setSelected(index)}
                disabled={status !== 'awaitingAnswer'}
              />
              <span>{choice}</span>
            </label>
          ))}
        </div>
      );
    }

    const placeholder =
      questionType === 'codeFill'
        ? '欠けているコードを入力してください'
        : questionType === 'codeDebug'
        ? '修正案を具体的に入力してください'
        : '自由記述で回答してください';

    return (
      <div className="question__text-answer">
        <textarea
          value={textAnswer}
          onChange={(event) => setTextAnswer(event.target.value)}
          placeholder={placeholder}
          disabled={status !== 'awaitingAnswer'}
        />
      </div>
    );
  };

  const renderResult = () => {
    if (status !== 'result' || !lastAttempt) return null;
    const correctAnswer = (() => {
      const type: QuestionType = lastAttempt.type ?? 'multipleChoice';
      switch (type) {
        case 'multipleChoice':
          return lastAttempt.choices?.[lastAttempt.correctIndex];
        case 'shortAnswer':
          return lastAttempt.expectedAnswer;
        case 'codeFill':
          return lastAttempt.expectedAnswer;
        case 'codeDebug':
          return lastAttempt.expectedFix;
        default:
          return '';
      }
    })();

    const userAnswer =
      typeof lastAttempt.userAnswer === 'number'
        ? lastAttempt.choices?.[lastAttempt.userAnswer] ?? `${lastAttempt.userAnswer}`
        : lastAttempt.userAnswer;

    return (
      <div className={`result ${lastAttempt.isCorrect ? 'result--correct' : 'result--incorrect'}`}>
        <p className="result__title">{lastAttempt.isCorrect ? '正解！' : '不正解'}</p>
        <p>
          あなたの回答: {userAnswer} / 正解: {correctAnswer}
        </p>
        {lastAttempt.expectedOutput && <p className="result__meta">期待される出力: {lastAttempt.expectedOutput}</p>}
        {lastAttempt.rubric && <p className="result__meta">採点観点: {lastAttempt.rubric}</p>}
        <p className="result__explanation">{lastAttempt.explanation}</p>
      </div>
    );
  };

  return (
    <section className="card">
      <header className="card__header">
        <div>
          <h2>Quiz</h2>
          <p className="card__subtitle">クイズモード: 4択・記述・コード補完に対応しました。</p>
        </div>
        <button type="button" onClick={onStartQuiz} className="secondary">
          新しい問題
        </button>
      </header>

      {status === 'idle' && <p>「新しい問題」ボタンで出題を開始してください。</p>}

      {question && (
        <div className="question">
          {renderMeta()}
          <p className="question__prompt">{question.prompt}</p>

          {questionType === 'codeFill' && question.codeTemplate && (
            <pre className="code-block">{question.codeTemplate}</pre>
          )}

          {questionType === 'codeDebug' && question.buggySnippet && (
            <pre className="code-block code-block--buggy">{question.buggySnippet}</pre>
          )}

          {renderInput()}

          {renderHints()}

          <div className="question__actions">
            <button
              type="button"
              className="primary"
              onClick={handleSubmit}
              disabled={status !== 'awaitingAnswer' || (questionType === 'multipleChoice' ? selected === undefined : !textAnswer.trim())}
            >
              回答する
            </button>
          </div>
        </div>
      )}

      {renderResult()}
    </section>
  );
};
