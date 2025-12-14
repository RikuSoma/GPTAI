import React, { useMemo, useState } from 'react';
import { LearningSuggestion, Message } from '../types';
import { MessageList } from './MessageList';

interface Props {
  messages: Message[];
  suggestion?: LearningSuggestion;
  onSendMessage: (content: string) => void;
}

export const ChatPanel: React.FC<Props> = ({ messages, suggestion, onSendMessage }) => {
  const [input, setInput] = useState('');

  const sorted = useMemo(
    () => [...messages].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    [messages]
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <section className="card">
      <header className="card__header">
        <div>
          <h2>Chat</h2>
          <p className="card__subtitle">学習モード: 質問を送ると、最後に理解度チェックが提示されます。</p>
        </div>
      </header>

      <div className="chat__messages">
        <MessageList messages={sorted} />
      </div>

      {suggestion && (
        <div className="chat__suggestion" aria-live="polite">
          <span className="chat__suggestion-label">次のおすすめ：</span>
          <span className="chat__suggestion-body">
            {suggestion.topic}（{suggestion.reason}）
          </span>
        </div>
      )}

      <form className="chat__form" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="chat-input">
          メッセージを入力
        </label>
        <textarea
          id="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="学びたい内容や疑問を入力してください"
          rows={3}
        />
        <button type="submit" className="primary">
          送信
        </button>
      </form>
    </section>
  );
};
