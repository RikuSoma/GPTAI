import {
  BuilderInput,
  BuilderOutput,
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

  generateProject(input: BuilderInput): BuilderOutput {
    // ユーザー入力を安全に扱うため、簡易フィルタで危険なキーワードを除外する。
    const safeInput = sanitizeBuilderInput(input);

    switch (safeInput.template) {
      case 'react-mini':
        return buildReactMiniProject(safeInput);
      case 'node-api':
        return buildNodeApiProject(safeInput);
      case 'unity-csharp':
      default:
        return buildUnityCSharpProject(safeInput);
    }
  }
}

const sanitizeBuilderInput = (input: BuilderInput): BuilderInput => {
  const blocked = [/secret/i, /password/i, /token/i, /rm -rf/i, /DROP TABLE/i];
  const filteredDescription = blocked.reduce((text, pattern) => text.replace(pattern, '[filtered]'), input.description);
  const normalized = filteredDescription.replace(/\s+/g, ' ').trim();
  const safeDescription = normalized.slice(0, 240) || '学習用サンプルプロジェクト';
  return { ...input, description: safeDescription };
};

const limitFiles = (files: BuilderOutput['files']): BuilderOutput['files'] => {
  const MAX_FILES = 20;
  const MAX_LINES = 400;
  return files.slice(0, MAX_FILES).map((file) => {
    const lines = file.content.split('\n');
    if (lines.length <= MAX_LINES) return file;
    const truncated = [...lines.slice(0, MAX_LINES), '// ... truncated for brevity'];
    return { ...file, content: truncated.join('\n') };
  });
};

const buildReactMiniProject = (input: BuilderInput): BuilderOutput => {
  const title = input.description || 'React Mini App';
  const packageName = title.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '') || 'react-mini-app';
  const summary = `React ミニアプリ「${title}」を ${input.difficulty === 'easy' ? 'やさしく' : '標準的に'} 作るための雛形です。`;

  const files = limitFiles([
    {
      path: 'README.md',
      content: `# ${title}\n\n${summary}\n\n## 使い方\n1. npm install\n2. npm run dev\n3. ブラウザで UI とカウンター/ToDo を確認\n\n## 機能\n- カウンターと簡易 Todo\n- ${input.description}\n`,
    },
    {
      path: 'package.json',
      content: `{"name": "${packageName}", "version": "0.1.0", "scripts": {"dev": "vite", "build": "tsc && vite build"}}`,
    },
    {
      path: 'index.html',
      content: '<!doctype html>\n<html>\n  <head><meta charset="utf-8"><title>React Mini</title></head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>',
    },
    {
      path: 'src/main.tsx',
      content:
        "import React from 'react';\nimport { createRoot } from 'react-dom/client';\nimport App from './App';\nimport './styles.css';\n\ncreateRoot(document.getElementById('root')!).render(<App />);\n",
    },
    {
      path: 'src/App.tsx',
      content: `import React, { useState } from 'react';\n\nconst title = '${title}';\n\nexport default function App(): JSX.Element {\n  const [count, setCount] = useState(0);\n  const [todos, setTodos] = useState<string[]>([]);\n  const [draft, setDraft] = useState('');\n\n  return (\n    <main style={{ padding: '1rem', fontFamily: 'sans-serif' }}>\n      <h1>{title}</h1>\n      <p>${input.description}</p>\n      <section>\n        <h2>Counter</h2>\n        <button onClick={() => setCount((n) => n + 1)}>+1</button>\n        <span style={{ marginLeft: 8 }}>{count}</span>\n      </section>\n      <section>\n        <h2>Todo</h2>\n        <input value={draft} onChange={(e) => setDraft(e.target.value)} />\n        <button onClick={() => { if (!draft.trim()) return; setTodos([...todos, draft]); setDraft(''); }}>追加</button>\n        <ul>{todos.map((t, i) => <li key={i}>{t}</li>)}</ul>\n      </section>\n    </main>\n  );\n}\n`,
    },
    {
      path: 'src/styles.css',
      content: 'body { background: #f7f7f9; margin: 0; } button { margin-left: 4px; }',
    },
  ]);

  return {
    summary,
    assumptions: ['ローカルで Vite が動作すること', '説明文: ' + input.description],
    runSteps: ['npm install', 'npm run dev'],
    files,
  };
};

const buildNodeApiProject = (input: BuilderInput): BuilderOutput => {
  const title = input.description || 'Node API';
  const summary = `Express + TypeScript で ${title} を構成する API 雛形です。`;

  const files = limitFiles([
    {
      path: 'README.md',
      content: `# ${title} API\n\n${summary}\n\n## エンドポイント\n- GET /health\n- GET /todos\n- POST /todos\n\n## 実行\n1. npm install\n2. npm run dev\n`,
    },
    {
      path: 'package.json',
      content:
        `{"name": "${title.toLowerCase().replace(/[^a-z0-9-]+/g, '-') || 'node-api'}", "version": "0.1.0", "scripts": {"dev": "ts-node-dev src/server.ts", "start": "node dist/server.js"}, "dependencies": {"express": "^4.19.2"}, "devDependencies": {"typescript": "^5.6.2"}}`,
    },
    {
      path: 'tsconfig.json',
      content: '{"compilerOptions": {"target": "ES2020", "module": "CommonJS", "outDir": "dist", "esModuleInterop": true}, "include": ["src"]}',
    },
    {
      path: 'src/server.ts',
      content: `import express from 'express';\n\nconst app = express();\napp.use(express.json());\n\napp.get('/health', (_req, res) => {\n  res.json({ status: 'ok', project: '${title}' });\n});\n\nconst todos: { id: number; title: string; done: boolean }[] = [\n  { id: 1, title: '${input.description} サンプル', done: false },\n];\n\napp.get('/todos', (_req, res) => {\n  res.json(todos);\n});\n\napp.post('/todos', (req, res) => {\n  const title = String(req.body?.title ?? '').trim();\n  if (!title) {\n    return res.status(400).json({ error: 'title is required' });\n  }\n  const next = { id: todos.length + 1, title, done: false };\n  todos.push(next);\n  res.status(201).json(next);\n});\n\nconst port = process.env.PORT || 3000;\napp.listen(port, () => {\n  console.log('API listening on', port);\n});\n`,
    },
  ]);

  return {
    summary,
    assumptions: ['Express を使った基本 API', '入力説明: ' + input.description],
    runSteps: ['npm install', 'npm run dev'],
    files,
  };
};

const buildUnityCSharpProject = (input: BuilderInput): BuilderOutput => {
  const title = input.description || 'Unity Tooling';
  const summary = `Unity EditorWindow と ScriptableObject を使った ${title} の雛形です。`;

  const files = limitFiles([
    {
      path: 'README.md',
      content: `# ${title} (Unity C#)\n\n${summary}\n\n## 使い方\n- Assets/Editor に配置して Unity を再起動\n- Window > Generated/${title} からツールを開く\n\n## 期待する動作\n- ScriptableObject の保存/読み込み\n- ${input.description}\n`,
    },
    {
      path: 'Editor/GeneratedToolWindow.cs',
      content: `using UnityEditor;\nusing UnityEngine;\n\npublic class GeneratedToolWindow : EditorWindow\n{\n    private SampleData data;\n    private Vector2 scroll;\n\n    [MenuItem("Window/Generated/${title}")]\n    public static void ShowWindow()\n    {\n        GetWindow<GeneratedToolWindow>("${title}");\n    }\n\n    private void OnEnable()\n    {\n        data = AssetDatabase.LoadAssetAtPath<SampleData>("Assets/GeneratedData.asset");\n        if (data == null)\n        {\n            data = ScriptableObject.CreateInstance<SampleData>();\n            AssetDatabase.CreateAsset(data, "Assets/GeneratedData.asset");\n        }\n    }\n\n    private void OnGUI()\n    {\n        scroll = EditorGUILayout.BeginScrollView(scroll);\n        EditorGUILayout.LabelField("概要", "${input.description}");\n        data.title = EditorGUILayout.TextField("タイトル", data.title);\n        data.note = EditorGUILayout.TextField("メモ", data.note);\n        if (GUILayout.Button("保存"))\n        {\n            EditorUtility.SetDirty(data);\n            AssetDatabase.SaveAssets();\n        }\n        EditorGUILayout.EndScrollView();\n    }\n}\n`,
    },
    {
      path: 'Runtime/SampleData.cs',
      content: `using UnityEngine;\n\n[CreateAssetMenu(fileName = "GeneratedData", menuName = "Generated/${title}")]\npublic class SampleData : ScriptableObject\n{\n    public string title = "${title}";\n    public string note = "${input.description}";\n}\n`,
    },
    {
      path: 'Runtime/SampleProcessor.cs',
      content: `using UnityEngine;\n\npublic static class SampleProcessor\n{\n    public static void Run(SampleData data)\n    {\n        Debug.Log($"Processing: {data.title} - {data.note}");\n    }\n}\n`,
    },
  ]);

  return {
    summary,
    assumptions: ['Unity 2021+ を想定', '説明文: ' + input.description],
    runSteps: ['Unity プロジェクトの Assets 以下に配置', 'Window メニューからツールを開く'],
    files,
  };
};
