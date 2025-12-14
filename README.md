# Study Tutor (Vite + React + TypeScript)

ローカルで動作する学習支援アプリです。チャット・クイズ・復習・進捗の4タブで会話を通じた学習と練習問題を提供します。状態は `localStorage` に保存され、リロード後も履歴が残ります。

## セットアップ

```bash
npm install
npm run dev
```

`npm run dev` 実行後、コンソールに表示されるローカルホストの URL にアクセスしてください。

## プロジェクト構成

- `src/ui` … UI コンポーネント、スタイル、進捗ダッシュボード
- `src/types` … 型定義
- `src/storage` … localStorage への保存/復元
- `src/tutor` … チューター実装。`ICoach` インターフェースを実装した `RuleTutor` と、将来の LLM 用 `LlmTutor`
- `src/llm` … LLM クライアントのプレースホルダ

## 機能概要

- **Chat タブ**: `useReducer` で管理するチャット UI。ユーザー/アシスタントのメッセージと時刻を表示し、履歴を保存します。
- **Quiz タブ**: 4択に加え、`shortAnswer`（短文記述）、`codeFill`（コード補完）、`codeDebug`（デバッグ方針回答）を出題。採点には rubric（採点観点）と hints を表示し、間違えた問題は復習キューに登録されます。
- **Review タブ**: 復習キューに溜まった問題だけを再出題します。誤答回数の多い順に並び替え、正解するとキューから削除されます。
- **Progress タブ**: トピック別の正答率、総回答数/正答数、誤答が多いトピック上位を可視化します。
- **LLM 差し替え準備**: 現在はルールベースの `RuleTutor` が動作。`llm/llmClient.ts` を実装し、`LlmTutor` の `nextQuizQuestion` / `evaluateAnswer` を実装して差し替えるだけで LLM に移行できます。

## メモ

- 例外処理を含めて localStorage への読み書きを行っています。
- スタイルは `src/ui/styles.css` にまとめています。
- 既存の `ICoach` インターフェースと `RuleTutor` は変更せず拡張しているため、後方互換のまま LLM を差し替えできます。
