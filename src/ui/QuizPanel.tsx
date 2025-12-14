import React, { useEffect, useState } from 'react';
import { QuizAttempt, QuizQuestion } from '../types';

interface Props {
  status: 'idle' | 'awaitingAnswer' | 'result';
  question?: QuizQuestion;
  lastAttempt?: QuizAttempt;
  onStartQuiz: () => void;
  onSubmitAnswer: (answerIndex: number, isReview?: boolean) => void;
}

export const QuizPanel: React.FC<Props> = ({ status, question, lastAttempt, onStartQuiz, onSubmitAnswer }) => {
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
          <h2>Quiz</h2>
          <p className="card__subtitle">クイズモード: 4択問題を解いて即採点します。</p>
        </div>
        <button type="button" onClick={onStartQuiz} className="secondary">
          新しい問題
        </button>
      </header>

      {status === 'idle' && <p>「新しい問題」ボタンで出題を開始してください。</p>}

      {question && (
        <div className="question">
          <p className="question__prompt">{question.prompt}</p>
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
          <div className="question__actions">
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
