import React, { useEffect, useMemo, useState } from 'react';
import JSZip from 'jszip';
import { BuilderDifficulty, BuilderInput, BuilderOutput, BuilderTemplate } from '../types';

interface Props {
  output?: BuilderOutput;
  onGenerate: (input: BuilderInput) => void;
}

const templateOptions: { value: BuilderTemplate; label: string }[] = [
  { value: 'react-mini', label: 'Reactミニアプリ (Vite + TS)' },
  { value: 'node-api', label: 'Node API (Express + TS)' },
  { value: 'unity-csharp', label: 'Unity C# クラスライブラリ' },
];

const difficultyOptions: { value: BuilderDifficulty; label: string }[] = [
  { value: 'easy', label: 'easy (最小限)' },
  { value: 'normal', label: 'normal (標準的)' },
];

export const BuilderPanel: React.FC<Props> = ({ output, onGenerate }) => {
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState<BuilderTemplate>('react-mini');
  const [difficulty, setDifficulty] = useState<BuilderDifficulty>('easy');
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [copyMessage, setCopyMessage] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (output?.files?.length) {
      setSelectedPath(output.files[0].path);
    }
  }, [output?.files]);

  const selectedFile = useMemo(() => output?.files.find((file) => file.path === selectedPath), [
    output?.files,
    selectedPath,
  ]);

  const handleGenerate = (event: React.FormEvent) => {
    event.preventDefault();
    if (!description.trim()) return;
    onGenerate({ description: description.trim(), template, difficulty });
  };

  const handleCopy = async () => {
    if (!selectedFile) return;
    try {
      await navigator.clipboard.writeText(selectedFile.content);
      setCopyMessage('Copied!');
      setTimeout(() => setCopyMessage(''), 1500);
    } catch (error) {
      setCopyMessage('コピーに失敗しました');
      console.error('Failed to copy file content', error);
    }
  };

  const ensureReadme = (files: BuilderOutput['files']): BuilderOutput['files'] => {
    const hasReadme = files.some((file) => file.path.toLowerCase() === 'readme.md');
    if (hasReadme) return files;
    // README が欠けている場合でも ZIP 仕様を守るため簡易 README を補完
    return [
      { path: 'README.md', content: '# Generated project\n\nBuilder により補完された README です。' },
      ...files,
    ];
  };

  const handleDownload = async () => {
    if (!output) return;
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      ensureReadme(output.files).forEach((file) => {
        zip.file(file.path, file.content);
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const now = new Date();
      const filename = `project-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
        now.getDate()
      ).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(
        now.getSeconds()
      ).padStart(2, '0')}.zip`;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Failed to generate zip', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <section className="card">
      <header className="card__header">
        <div>
          <h2>Builder</h2>
          <p className="card__subtitle">テンプレから学習用プロジェクトをまとめて生成します。</p>
        </div>
      </header>

      <form className="builder__form" onSubmit={handleGenerate}>
        <label htmlFor="builder-description">作りたいものの説明</label>
        <textarea
          id="builder-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="例: React でカレンダー付きの ToDo ミニアプリを作りたい"
          required
        />

        <div className="builder__form-row">
          <label>
            テンプレ種別
            <select value={template} onChange={(e) => setTemplate(e.target.value as BuilderTemplate)}>
              {templateOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            難易度
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as BuilderDifficulty)}>
              {difficultyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="builder__actions">
          <button type="submit" className="primary">
            Generate
          </button>
          <button type="button" onClick={handleDownload} disabled={!output || isDownloading}>
            {isDownloading ? 'Generating ZIP...' : 'Download ZIP'}
          </button>
        </div>
      </form>

      {output && (
        <div className="builder__result" aria-live="polite">
          <section className="builder__summary">
            <h3>生成結果</h3>
            <p>{output.summary}</p>
            <div className="builder__meta">
              <div>
                <h4>前提・補足</h4>
                <ul>
                  {output.assumptions.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>実行手順</h4>
                <ol>
                  {output.runSteps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          </section>

          <section className="builder__files">
            <div className="builder__files-sidebar">
              <h4>ファイル一覧</h4>
              <ul>
                {output.files.map((file) => (
                  <li key={file.path}>
                    <button
                      type="button"
                      className={`builder__file-button ${selectedPath === file.path ? 'is-active' : ''}`}
                      onClick={() => setSelectedPath(file.path)}
                    >
                      {file.path}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="builder__viewer">
              <div className="builder__viewer-header">
                <div>
                  <h4>プレビュー</h4>
                  <p className="builder__viewer-path">{selectedPath || 'ファイルを選択'}</p>
                </div>
                <div className="builder__viewer-actions">
                  <button type="button" onClick={handleCopy} disabled={!selectedFile}>
                    Copy
                  </button>
                  {copyMessage && <span className="builder__copy-toast">{copyMessage}</span>}
                </div>
              </div>
              <pre className="builder__code" aria-live="polite">
                <code>{selectedFile?.content ?? '生成されたファイルを選択してください。'}</code>
              </pre>
            </div>
          </section>
        </div>
      )}
    </section>
  );
};
