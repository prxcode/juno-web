import React from 'react';
import Editor from '@monaco-editor/react';

export default function CodeEditor({ code, onChange }) {
  return (
    <Editor
      height="100%"
      defaultLanguage="java"
      value={code}
      onChange={(v) => onChange(v ?? '')}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        automaticLayout: true,
        scrollbar: { verticalScrollbarSize: 12 },
        tabSize: 2,
        renderFinalNewline: true
      }}
      theme="vs-dark"
    />
  );
}
