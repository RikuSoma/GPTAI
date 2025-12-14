# Study Tutor (Vite + React + TypeScript)

ローカルで動作する学習支援アプリです。チャット・クイズ・復習の3タブで会話を通じた学習と練習問題を提供します。状態は `localStorage` に保存され、リロード後も履歴が残ります。

## セットアップ

```bash
npm install
npm run dev
```

`npm run dev` 実行後、コンソールに表示されるローカルホストの URL にアクセスしてください。

## プロジェクト構成

- `src/ui` … UI コンポーネント、スタイル
- `src/types` … 型定義
- `src/storage` … localStorage への保存/復元
- `src/tutor` … チューター実装。`ICoach` インターフェースを実装した `RuleTutor` と、将来の LLM 用 `LlmTutor`
- `src/llm` … LLM クライアントのプレースホルダ

## 機能概要

- **Chat タブ**: `useReducer` で管理するチャット UI。ユーザー/アシスタントのメッセージと時刻を表示し、履歴を保存します。
- **Quiz タブ**: 4択クイズを出題し、即時採点・解説を表示。間違えた問題は復習キューに登録されます。
- **Review タブ**: 復習キューに溜まった問題だけを再出題します。正解するとキューから削除されます。
- **LLM 差し替え準備**: 現在はルールベースの `RuleTutor` が動作。`llm/llmClient.ts` を実装し、`LlmTutor` を組み込むことで LLM に差し替えられます。

## メモ

- 例外処理を含めて localStorage への読み書きを行っています。
- スタイルは `src/ui/styles.css` にまとめています。
