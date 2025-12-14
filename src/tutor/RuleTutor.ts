import { QuizAttempt, QuizQuestion } from '../types';
import { ChatReply, EvaluationResult, ICoach } from './ICoach';

const QUESTION_BANK: QuizQuestion[] = [
  {
    id: 'arrays-basics',
    prompt: '配列の要素数を得るプロパティはどれ？',
    choices: ['count', 'length', 'size', 'items'],
    correctIndex: 1,
    explanation: 'JavaScript では Array.length プロパティで要素数を取得します。',
  },
  {
    id: 'promise-state',
    prompt: 'Promise の状態として存在しないものはどれ？',
    choices: ['pending', 'rejected', 'fulfilled', 'cancelled'],
    correctIndex: 3,
    explanation: 'Promise は pending → fulfilled もしくは rejected の3状態をとります。cancelled はありません。',
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
  },
  {
    id: 'css-specificity',
    prompt: 'CSS の詳細度が最も高いのはどれ？',
    choices: ['タイプセレクタ', 'クラスセレクタ', 'ID セレクタ', '子孫セレクタ'],
    correctIndex: 2,
    explanation: '詳細度は ID > クラス > タグ です。子孫は組み合わせで加算されます。',
  },
  {
    id: 'http-method',
    prompt: 'HTTP でリソースの部分更新に使われるメソッドは？',
    choices: ['GET', 'POST', 'PUT', 'PATCH'],
    correctIndex: 3,
    explanation: 'PATCH は部分的な更新に適しています。PUT は全体置き換えが前提です。',
  },
];

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

  evaluateAnswer(question: QuizQuestion, userAnswerIndex: number): EvaluationResult {
    const isCorrect = question.correctIndex === userAnswerIndex;
    const baseExplanation = question.explanation;
    const detail = isCorrect
      ? '正解です。根拠を自分の言葉で言えるとさらに定着します。'
      : `惜しい！正解は「${question.choices[question.correctIndex]}」です。`;
    return {
      isCorrect,
      explanation: `${detail} ${baseExplanation}`,
    };
  }
}
