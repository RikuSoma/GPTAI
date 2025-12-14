import React, { useEffect, useMemo, useState } from 'react';
import { QuizAttempt, QuizQuestion, QuestionType } from '../types';

interface Props {
  status: 'idle' | 'awaitingAnswer' | 'result';
  question?: QuizQuestion;
  lastAttempt?: QuizAttempt;
  queueLength: number;
  onNext: () => void;
  onSubmitAnswer: (answer: number | string) => void;
}

export const ReviewPanel: React.FC<Props> = ({ status, question, lastAttempt, queueLength, onNext, onSubmitAnswer }) => {
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

  const renderInput = () => {
    if (!question) return null;
    if (questionType === 'multipleChoice' && question.choices) {
      return (
        <div className="question__choices">
          {question.choices.map((choice, index) => (
            <label key={choice} className={`choice ${selected === index ? 'choice--selected' : ''}`}>
              <input
                type="radio"
                name="review-choice"
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

    return (
      <div className="question__text-answer">
        <textarea
          value={textAnswer}
          onChange={(event) => setTextAnswer(event.target.value)}
          placeholder="復習用の回答を入力してください"
          disabled={status !== 'awaitingAnswer'}
        />
      </div>
    );
  };

  const renderResult = () => {
    if (status !== 'result' || !lastAttempt) return null;
    const type: QuestionType = lastAttempt.type ?? 'multipleChoice';
    const correctAnswer =
      type === 'multipleChoice'
        ? lastAttempt.choices?.[lastAttempt.correctIndex]
        : type === 'codeDebug'
        ? lastAttempt.expectedFix
        : lastAttempt.expectedAnswer;
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
        {lastAttempt.rubric && <p className="result__meta">採点観点: {lastAttempt.rubric}</p>}
        <p className="result__explanation">{lastAttempt.explanation}</p>
      </div>
    );
  };

  return (
    <section className="card">
      <header className="card__header">
        <div>
          <h2>Review</h2>
          <p className="card__subtitle">復習モード: 間違えた問題だけを再挑戦しましょう。</p>
        </div>
        <div className="review__meta">復習キュー: {queueLength} 件</div>
      </header>

      {queueLength === 0 && <p>復習する問題はありません。クイズで間違えた問題が追加されます。</p>}

      {question && (
        <div className="question">
          <div className="question__meta">
            <span className="pill">Topic: {question.topic ?? 'general'}</span>
            <span className="pill">Difficulty: {question.difficulty ?? '-'}</span>
          </div>
          <p className="question__prompt">{question.prompt}</p>
          {questionType === 'codeFill' && question.codeTemplate && (
            <pre className="code-block">{question.codeTemplate}</pre>
          )}
          {questionType === 'codeDebug' && question.buggySnippet && (
            <pre className="code-block code-block--buggy">{question.buggySnippet}</pre>
          )}
          {renderInput()}
          <div className="question__actions">
            <button type="button" className="secondary" onClick={onNext}>
              次の問題
            </button>
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
