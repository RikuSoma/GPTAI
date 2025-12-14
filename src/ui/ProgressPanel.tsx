import React, { useMemo } from 'react';
import { QuizAttempt } from '../types';

interface Props {
  log: QuizAttempt[];
}

interface TopicStat {
  topic: string;
  total: number;
  correct: number;
  accuracy: number;
}

const DEFAULT_TOPIC = 'general';

const toTopic = (topic?: string): string => topic || DEFAULT_TOPIC;

export const ProgressPanel: React.FC<Props> = ({ log }) => {
  const overall = useMemo(() => {
    const total = log.length;
    const correct = log.filter((entry) => entry.isCorrect).length;
    return { total, correct, accuracy: total ? Math.round((correct / total) * 100) : 0 };
  }, [log]);

  const topicStats = useMemo(() => {
    const counts = new Map<string, TopicStat>();
    log.forEach((attempt) => {
      const topic = toTopic(attempt.topic);
      const current = counts.get(topic) ?? { topic, total: 0, correct: 0, accuracy: 0 };
      const updated: TopicStat = {
        ...current,
        total: current.total + 1,
        correct: current.correct + (attempt.isCorrect ? 1 : 0),
        accuracy: 0,
      };
      counts.set(topic, updated);
    });

    return Array.from(counts.values())
      .map((stat) => ({ ...stat, accuracy: stat.total ? Math.round((stat.correct / stat.total) * 100) : 0 }))
      .sort((a, b) => b.total - a.total || b.accuracy - a.accuracy);
  }, [log]);

  const topMistakes = useMemo(() => {
    const mistakes = new Map<string, number>();
    log.forEach((attempt) => {
      if (!attempt.isCorrect) {
        const topic = toTopic(attempt.topic);
        mistakes.set(topic, (mistakes.get(topic) ?? 0) + 1);
      }
    });
    return Array.from(mistakes.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [log]);

  return (
    <section className="card">
      <header className="card__header">
        <div>
          <h2>Progress</h2>
          <p className="card__subtitle">トピック別の進捗と弱点を確認しましょう。</p>
        </div>
      </header>

      <div className="progress__grid">
        <div className="progress__summary">
          <h3>全体の成績</h3>
          <p className="progress__metric">回答数: {overall.total}</p>
          <p className="progress__metric">正答数: {overall.correct}</p>
          <p className="progress__metric">正答率: {overall.accuracy}%</p>
          <p className="progress__hint">※ 過去のログから自動計算します。</p>
        </div>

        <div className="progress__topics">
          <h3>トピック別 正答率</h3>
          {topicStats.length === 0 && <p>まだ回答履歴がありません。</p>}
          {topicStats.length > 0 && (
            <table className="progress__table">
              <thead>
                <tr>
                  <th>Topic</th>
                  <th>正答率</th>
                  <th>回答数</th>
                </tr>
              </thead>
              <tbody>
                {topicStats.map((stat) => (
                  <tr key={stat.topic}>
                    <td>{stat.topic}</td>
                    <td>{stat.accuracy}%</td>
                    <td>{stat.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="progress__mistakes">
          <h3>復習優先トピック</h3>
          {topMistakes.length === 0 && <p>誤答データがまだありません。</p>}
          {topMistakes.length > 0 && (
            <ol>
              {topMistakes.map((item) => (
                <li key={item.topic}>
                  {item.topic}: {item.count} 回誤答
                </li>
              ))}
            </ol>
          )}
          <p className="progress__hint">誤答回数が多い順で表示しています。</p>
        </div>
      </div>
    </section>
  );
};
