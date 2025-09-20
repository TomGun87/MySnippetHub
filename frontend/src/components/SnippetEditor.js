import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Editor } from '@monaco-editor/react';
import Split from '@uiw/react-split';
import { Highlight, themes } from 'prism-react-renderer';
import { debounce } from '../utils';

// Monaco supported languages
const MONACO_LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'csharp', 
  'php', 'ruby', 'go', 'rust', 'sql', 'json', 'xml', 'html', 'css', 
  'scss', 'markdown', 'yaml', 'dockerfile', 'bash', 'powershell', 'plaintext'
];

// Language mapping for Monaco vs display
const LANGUAGE_MAP = {
  'c++': 'cpp',
  'c#': 'csharp',
  'text': 'plaintext'
};

// Language mapping for Prism (preview)
const PRISM_LANGUAGE_MAP = {
  'javascript': 'javascript',
  'typescript': 'typescript', 
  'python': 'python',
  'java': 'java',
  'c': 'c',
  'cpp': 'cpp',
  'csharp': 'csharp',
  'php': 'php',
  'ruby': 'ruby',
  'go': 'go',
  'rust': 'rust',
  'sql': 'sql',
  'json': 'json',
  'xml': 'xml',
  'html': 'markup',
  'css': 'css',
  'scss': 'scss',
  'markdown': 'markdown',
  'yaml': 'yaml',
  'dockerfile': 'docker',
  'bash': 'bash',
  'powershell': 'powershell',
  'plaintext': 'text'
};

const SnippetEditor = ({ 
  initialCode = '', 
  language = 'javascript', 
  onChange, 
  height = '400px',
  theme = 'vs-dark',
  showPreview = true,
  showMinimap = false,
  readOnly = false 
}) => {
  const [code, setCode] = useState(initialCode);
  const [previewCode, setPreviewCode] = useState(initialCode);
  const [currentLanguage, setCurrentLanguage] = useState(language);
  const [isFormatting, setIsFormatting] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const editorRef = useRef();
  const monacoRef = useRef();

  // Debounced preview update
  const debouncedUpdatePreview = useCallback(
    debounce((newCode) => {
      setPreviewCode(newCode);
    }, 300),
    []
  );

  // Update preview when code changes
  useEffect(() => {
    debouncedUpdatePreview(code);
  }, [code, debouncedUpdatePreview]);

  // Sync initial code
  useEffect(() => {
    setCode(initialCode);
    setPreviewCode(initialCode);
  }, [initialCode]);

  // Sync language changes
  useEffect(() => {
    setCurrentLanguage(language);
    if (editorReady && editorRef.current && monacoRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        const monacoLanguage = LANGUAGE_MAP[language] || language;
        monacoRef.current.editor.setModelLanguage(model, monacoLanguage);
      }
    }
  }, [language, editorReady]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setEditorReady(true);

    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      lineHeight: 20,
      minimap: { enabled: showMinimap },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      wordWrap: 'on',
      formatOnPaste: true,
      formatOnType: true
    });

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
      formatCode();
    });

    // Set initial language
    const model = editor.getModel();
    if (model) {
      const monacoLanguage = LANGUAGE_MAP[currentLanguage] || currentLanguage;
      monaco.editor.setModelLanguage(model, monacoLanguage);
    }
  };

  const handleEditorChange = (newCode) => {
    setCode(newCode || '');
    if (onChange) {
      onChange(newCode || '');
    }
  };

  const formatCode = async () => {
    if (!editorRef.current || !monacoRef.current || isFormatting) return;

    setIsFormatting(true);
    try {
      // Use Monaco's built-in formatting
      await editorRef.current.getAction('editor.action.formatDocument').run();
    } catch (error) {
      console.warn('Formatting failed:', error);
    } finally {
      setIsFormatting(false);
    }
  };

  const getPrismLanguage = (lang) => {
    return PRISM_LANGUAGE_MAP[lang] || 'text';
  };

  const renderPreview = () => {
    const prismLang = getPrismLanguage(currentLanguage);
    
    return (
      <div className="snippet-preview">
        <div className="preview-header">
          <h4 className="text-sm font-medium text-muted mb-2">Live Preview</h4>
          <span className="badge badge-outline text-xs">
            {currentLanguage}
          </span>
        </div>
        <div className="preview-content">
          <Highlight
            theme={themes.vsDark}
            code={previewCode}
            language={prismLang}
          >
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
              <pre 
                className={`${className} preview-code`}
                style={{
                  ...style,
                  margin: 0,
                  padding: '16px',
                  fontSize: '14px',
                  lineHeight: '20px',
                  borderRadius: '8px',
                  overflow: 'auto',
                  maxHeight: 'calc(100% - 60px)',
                  backgroundColor: 'var(--bg-tertiary)'
                }}
              >
                {tokens.map((line, i) => (
                  <div key={i} {...getLineProps({ line, key: i })}>
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token, key })} />
                    ))}
                  </div>
                ))}
              </pre>
            )}
          </Highlight>
        </div>
      </div>
    );
  };

  const renderEditor = () => (
    <div className="snippet-editor">
      <div className="editor-header">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-muted">Code Editor</h4>
          <div className="editor-actions flex items-center gap-2">
            <button
              className={`btn btn-sm btn-outline ${isFormatting ? 'loading' : ''}`}
              onClick={formatCode}
              disabled={isFormatting || readOnly}
              title="Format Code (Ctrl+Shift+F)"
            >
              {isFormatting ? (
                <>
                  <div className="spinner mr-1"></div>
                  Formatting...
                </>
              ) : (
                <>🎨 Format</>
              )}
            </button>
          </div>
        </div>
      </div>
      <div className="editor-container" style={{ height: 'calc(100% - 50px)' }}>
        <Editor
          height="100%"
          language={LANGUAGE_MAP[currentLanguage] || currentLanguage}
          value={code}
          theme={theme}
          onMount={handleEditorDidMount}
          onChange={handleEditorChange}
          options={{
            readOnly,
            minimap: { enabled: showMinimap },
            fontSize: 14,
            lineHeight: 20,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            wordWrap: 'on',
            formatOnPaste: true,
            formatOnType: true,
            quickSuggestions: {
              other: true,
              comments: true,
              strings: true
            },
            parameterHints: {
              enabled: true
            },
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            acceptSuggestionOnCommitCharacter: true,
            snippetSuggestions: 'top'
          }}
          loading={
            <div className="loading-container text-center p-6">
              <div className="spinner mb-2"></div>
              <p className="text-muted text-sm">Loading editor...</p>
            </div>
          }
        />
      </div>
    </div>
  );

  if (!showPreview) {
    return (
      <div className="snippet-editor-wrapper" style={{ height }}>
        {renderEditor()}
      </div>
    );
  }

  return (
    <div className="snippet-editor-wrapper" style={{ height }}>
      <Split style={{ height: '100%' }}>
        <div style={{ minWidth: '300px' }}>
          {renderEditor()}
        </div>
        <div style={{ minWidth: '300px' }}>
          {renderPreview()}
        </div>
      </Split>
    </div>
  );
};

export default SnippetEditor;