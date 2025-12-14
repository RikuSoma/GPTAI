import {
  QuizAttempt,
  QuizQuestion,
  QuestionType,
  CodeDebugQuestion,
  CodeFillQuestion,
  ShortAnswerQuestion,
  MultipleChoiceQuestion,
  LearningSuggestion,
} from '../types';
import { ChatReply, EvaluationResult, ICoach } from './ICoach';

const QUESTION_BANK: QuizQuestion[] = [
  {
    id: 'arrays-basics',
    prompt: '配列の要素数を得るプロパティはどれ？',
    choices: ['count', 'length', 'size', 'items'],
    correctIndex: 1,
    explanation: 'JavaScript では Array.length プロパティで要素数を取得します。',
    topic: 'javascript',
    difficulty: 1,
    hints: ['プロパティ名は一語で「長さ」を意味します。'],
    rubric: '正しいプロパティ名を選べていること',
  },
  {
    id: 'promise-state',
    prompt: 'Promise の状態として存在しないものはどれ？',
    choices: ['pending', 'rejected', 'fulfilled', 'cancelled'],
    correctIndex: 3,
    explanation: 'Promise は pending → fulfilled もしくは rejected の3状態をとります。cancelled はありません。',
    topic: 'javascript',
    difficulty: 2,
    hints: ['Promise のライフサイクルは3段階です。'],
    rubric: '存在しない状態を見分けられていること',
  },
  {
    id: 'ts-type-assertion',
    prompt: 'TypeScript の型アサーションについて正しい説明は？',
    choices: [
      'ランタイムで型チェックを強化する',
      'コンパイラに「この型として扱って良い」と伝える',
      '型推論を無効にする',
      '型定義ファイルを生成する',
    ],
    correctIndex: 1,
    explanation: '型アサーションは開発者がコンパイラに型を伝えるもので、実行時の動作は変わりません。',
    topic: 'typescript',
    difficulty: 2,
    hints: ['as キーワードで型を上書きします。'],
    rubric: '型アサーションの目的を説明できること',
  },
  {
    id: 'css-specificity',
    prompt: 'CSS の詳細度が最も高いのはどれ？',
    choices: ['タイプセレクタ', 'クラスセレクタ', 'ID セレクタ', '子孫セレクタ'],
    correctIndex: 2,
    explanation: '詳細度は ID > クラス > タグ です。子孫は組み合わせで加算されます。',
    topic: 'css',
    difficulty: 1,
    hints: ['# を使う指定が最も強いです。'],
    rubric: '詳細度の優先順位を理解していること',
  },
  {
    id: 'http-method',
    prompt: 'HTTP でリソースの部分更新に使われるメソッドは？',
    choices: ['GET', 'POST', 'PUT', 'PATCH'],
    correctIndex: 3,
    explanation: 'PATCH は部分的な更新に適しています。PUT は全体置き換えが前提です。',
    topic: 'web',
    difficulty: 1,
    hints: ['差分更新を行うメソッドを選びましょう。'],
    rubric: '適切な HTTP メソッドを選択できること',
  },
  {
    id: 'shortanswer-scope',
    type: 'shortAnswer',
    prompt: 'JavaScript のクロージャを一文で説明してください。',
    expectedAnswer: '関数が外側のスコープの変数へアクセスし続ける仕組み',
    acceptableAnswers: ['外側スコープへの参照を保持する関数', '関数とその外部環境をセットで保持する機能'],
    explanation: 'クロージャは関数が生成されたときのスコープを閉じ込め、後からも参照できるようにする仕組みです。',
    topic: 'javascript',
    difficulty: 3,
    hints: ['「スコープ」「保持」といったキーワードを含めましょう。'],
    rubric: 'スコープと保持の2点が含まれていること',
  },
  {
    id: 'codefill-map',
    type: 'codeFill',
    prompt: '配列 [1,2,3] を2倍にした新しい配列を作るコードを完成させてください。',
    codeTemplate: 'const nums = [1, 2, 3];\nconst doubled = nums._____(n => n * 2);',
    expectedAnswer: 'map',
    expectedOutput: '[2,4,6]',
    explanation: 'Array.prototype.map を使うと新しい配列を返し、元の配列を変更しません。',
    topic: 'javascript',
    difficulty: 2,
    hints: ['配列を加工して新しい配列を返すメソッドです。'],
    rubric: 'map を使った不変操作になっていること',
  },
  {
    id: 'codedebug-offbyone',
    type: 'codeDebug',
    prompt: 'for ループで off-by-one エラーがある箇所を修正してください。',
    buggySnippet: 'const arr = ["a", "b", "c"];\nfor (let i = 0; i <= arr.length; i++) {\n  console.log(arr[i]);\n}',
    expectedFix: 'i < arr.length にする',
    expectedOutput: 'a b c と表示される',
    explanation: '添字は 0 から length-1 までなので、条件は i < arr.length です。<= にすると undefined を参照します。',
    topic: 'javascript',
    difficulty: 2,
    hints: ['終端条件を見直しましょう。'],
    rubric: 'ループ条件を length-1 までに修正できていること',
  },
];

interface TopicAggregate {
  topic: string;
  total: number;
  correct: number;
  wrongCount: number;
  lastAsked: number;
}

const toTopic = (topic?: string): string => topic ?? 'general';

const buildTopicAggregates = (log: QuizAttempt[]): TopicAggregate[] => {
  const stats = new Map<string, TopicAggregate>();

  log.forEach((attempt) => {
    const topic = toTopic(attempt.topic);
    const existing = stats.get(topic) ?? { topic, total: 0, correct: 0, wrongCount: 0, lastAsked: 0 };
    const askedAt = new Date(attempt.askedAt).getTime();
    const updated: TopicAggregate = {
      topic,
      total: existing.total + 1,
      correct: existing.correct + (attempt.isCorrect ? 1 : 0),
      wrongCount: existing.wrongCount + (attempt.isCorrect ? 0 : 1),
      lastAsked: Math.max(existing.lastAsked, askedAt || 0),
    };
    stats.set(topic, updated);
  });

  return Array.from(stats.values());
};

export class RuleTutor implements ICoach {
  public readonly name = 'RuleTutor';

  generateChatReply(userMessage: string): ChatReply {
    const hint = '理解度チェック: 「JavaScript で配列の長さを調べるプロパティは？」と一言で答えてみてください。';
    const body =
      '要点: 学びたいトピックを具体的に書くほど、焦点を絞った解説ができます。短いコード例や前提知識も添えると効果的です。';

    const summary = userMessage.length < 20
      ? '少し詳しめに質問内容を書いてみましょう。'
      : '良い質問です。この調子で、気になる箇所をもう少し掘り下げてみましょう。';

    return {
      message: `${summary}\n${body}\n${hint}`,
    };
  }

  suggestNext(log: QuizAttempt[]): LearningSuggestion {
    if (!log.length) {
      return {
        topic: 'javascript',
        reason: 'まだ回答履歴がないため、まずは基礎的な JavaScript トピックから始めましょう。',
      };
    }

    const aggregates = buildTopicAggregates(log);
    const scored = aggregates
      .map((agg) => {
        const accuracy = agg.total ? Math.round((agg.correct / agg.total) * 100) : 0;
        return { ...agg, accuracy };
      })
      .sort((a, b) => {
        // 優先度: 誤答回数 → 低い正答率 → 最近の出題の新しさ（古いものを優先）
        const wrongDiff = b.wrongCount - a.wrongCount;
        if (wrongDiff !== 0) return wrongDiff;
        const accuracyDiff = a.accuracy - b.accuracy;
        if (accuracyDiff !== 0) return accuracyDiff;
        return a.lastAsked - b.lastAsked;
      });

    const pick = scored[0];
    const reasons: string[] = [];
    if (pick.wrongCount > 0) {
      reasons.push(`最近 ${pick.wrongCount} 回ミスしています`);
    }
    if (pick.accuracy < 70) {
      reasons.push(`正答率が ${pick.accuracy}% と低めです`);
    }
    if (!reasons.length) {
      reasons.push('理解を定着させるために短時間で復習しましょう');
    }

    return {
      topic: pick.topic,
      reason: reasons.join(' / '),
    };
  }

  nextQuizQuestion(log: QuizAttempt[]): QuizQuestion {
    // pick next question that was least recently asked
    const askedCounts = new Map<string, number>();
    log.forEach((attempt) => {
      askedCounts.set(attempt.id, (askedCounts.get(attempt.id) ?? 0) + 1);
    });
    const sorted = [...QUESTION_BANK].sort((a, b) => {
      const countA = askedCounts.get(a.id) ?? 0;
      const countB = askedCounts.get(b.id) ?? 0;
      return countA - countB;
    });
    return sorted[0];
  }

  evaluateAnswer(question: QuizQuestion, userAnswer: number | string): EvaluationResult {
    const type: QuestionType = question.type ?? 'multipleChoice';

    switch (type) {
      case 'multipleChoice': {
        const mc = question as MultipleChoiceQuestion;
        const isCorrect = mc.correctIndex === userAnswer;
        const baseExplanation = mc.explanation;
        const detail = isCorrect
          ? '正解です。根拠を自分の言葉で言えるとさらに定着します。'
          : `惜しい！正解は「${mc.choices[mc.correctIndex]}」です。`;
        return {
          isCorrect,
          explanation: `${detail} ${baseExplanation}`,
        };
      }
      case 'shortAnswer': {
        const shortQuestion = question as ShortAnswerQuestion;
        if (typeof userAnswer !== 'string') {
          return {
            isCorrect: false,
            explanation: '回答形式が想定と異なります。テキストで答えてみましょう。',
          };
        }
        const normalize = (value: string): string => value.trim().toLowerCase();
        const expectedList = [shortQuestion.expectedAnswer, ...(shortQuestion.acceptableAnswers ?? [])].map(normalize);
        const isCorrect = expectedList.some((expected) => normalize(userAnswer).includes(expected));
        const rubric = shortQuestion.rubric ? `採点観点: ${shortQuestion.rubric}` : '';
        const feedback = isCorrect
          ? 'キーワードが押さえられています。'
          : 'もう一度、スコープを保持する点を強調しましょう。';
        return {
          isCorrect,
          explanation: `${feedback} ${shortQuestion.explanation} ${rubric}`.trim(),
        };
      }
      case 'codeFill': {
        const fillQuestion = question as CodeFillQuestion;
        if (typeof userAnswer !== 'string') {
          return {
            isCorrect: false,
            explanation: '回答形式が想定と異なります。コード片をテキストで入力してください。',
          };
        }
        const normalize = (value: string): string => value.trim().toLowerCase();
        const isCorrect = normalize(userAnswer) === normalize(fillQuestion.expectedAnswer);
        const rubric = fillQuestion.rubric ? `採点観点: ${fillQuestion.rubric}` : '';
        const feedback = isCorrect
          ? '正しく補完できています。'
          : `期待するワードは「${fillQuestion.expectedAnswer}」です。`;
        return {
          isCorrect,
          explanation: `${feedback} ${fillQuestion.explanation} ${rubric}`.trim(),
        };
      }
      case 'codeDebug': {
        const debugQuestion = question as CodeDebugQuestion;
        if (typeof userAnswer !== 'string') {
          return {
            isCorrect: false,
            explanation: '修正内容をテキストで入力してください。',
          };
        }
        const normalize = (value: string): string => value.trim().toLowerCase();
        const isDebugCorrect = normalize(userAnswer).includes(normalize(debugQuestion.expectedFix));
        const rubric = debugQuestion.rubric ? `採点観点: ${debugQuestion.rubric}` : '';
        const feedback = isDebugCorrect ? '修正方針は合っています。' : 'ループ条件を見直してください。';
        return {
          isCorrect: isDebugCorrect,
          explanation: `${feedback} ${debugQuestion.explanation} ${rubric}`.trim(),
        };
      }
      default:
        return {
          isCorrect: false,
          explanation: 'この問題タイプにはまだ対応していません。',
        };
    }
  }
}
