import React, { useEffect, useState } from 'react';
import { QuizAttempt, QuizQuestion } from '../types';

interface Props {
  status: 'idle' | 'awaitingAnswer' | 'result';
  question?: QuizQuestion;
  lastAttempt?: QuizAttempt;
  queueLength: number;
  onNext: () => void;
  onSubmitAnswer: (answerIndex: number) => void;
}

export const ReviewPanel: React.FC<Props> = ({ status, question, lastAttempt, queueLength, onNext, onSubmitAnswer }) => {
  const [selected, setSelected] = useState<number | undefined>(undefined);

  useEffect(() => {
    setSelected(undefined);
  }, [question?.id]);

  const handleSubmit = () => {
    if (selected === undefined || status !== 'awaitingAnswer' || !question) return;
    onSubmitAnswer(selected);
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
          <p className="question__prompt">{question.prompt}</p>
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
          <div className="question__actions">
            <button type="button" className="secondary" onClick={onNext}>
              次の問題
            </button>
            <button type="button" className="primary" onClick={handleSubmit} disabled={selected === undefined || status !== 'awaitingAnswer'}>
              回答する
            </button>
          </div>
        </div>
      )}

      {status === 'result' && lastAttempt && (
        <div className={`result ${lastAttempt.isCorrect ? 'result--correct' : 'result--incorrect'}`}>
          <p className="result__title">{lastAttempt.isCorrect ? '正解！' : '不正解'}</p>
          <p>
            あなたの回答: {lastAttempt.choices[lastAttempt.userAnswer]} / 正解: {lastAttempt.choices[lastAttempt.correctIndex]}
          </p>
          <p className="result__explanation">{lastAttempt.explanation}</p>
        </div>
      )}
    </section>
  );
};
