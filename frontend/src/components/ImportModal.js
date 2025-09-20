import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import api from '../api';

const ImportModal = ({ isOpen, onClose, onImportSuccess }) => {
  const [file, setFile] = useState(null);
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('upload'); // 'upload', 'options', 'results'
  const [importOptions, setImportOptions] = useState({
    overwriteExisting: false,
    skipDuplicates: true,
    preserveIds: false
  });
  const [importResults, setImportResults] = useState(null);

  const onDrop = async (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      await validateFile(selectedFile);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const validateFile = async (file) => {
    try {
      setLoading(true);
      const validationResult = await api.snippets.validateImport(file);
      setValidation(validationResult);
      
      if (validationResult.valid) {
        setStep('options');
      }
    } catch (error) {
      console.error('Validation failed:', error);
      setValidation({
        valid: false,
        errors: [`Validation failed: ${error.message}`],
        warnings: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    try {
      setLoading(true);
      const results = await api.snippets.import(file, importOptions);
      setImportResults(results);
      setStep('results');
      
      // Notify parent component
      if (onImportSuccess) {
        onImportSuccess(results);
      }
    } catch (error) {
      console.error('Import failed:', error);
      setImportResults({
        results: { success: 0, errors: 1, details: [{ status: 'error', message: error.message }] }
      });
      setStep('results');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setValidation(null);
    setImportResults(null);
    setStep('upload');
    setImportOptions({
      overwriteExisting: false,
      skipDuplicates: true,
      preserveIds: false
    });
  };

  const handleClose = () => {
    if (!loading) {
      resetModal();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) {
        handleClose();
      }
    }}>
      <div className="modal import-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Import Snippets</h2>
          <button 
            className="btn btn-ghost btn-sm"
            onClick={handleClose}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Step 1: File Upload */}
          {step === 'upload' && (
            <div className="upload-step">
              <div 
                {...getRootProps()} 
                className={`dropzone ${isDragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
              >
                <input {...getInputProps()} />
                {file ? (
                  <div className="file-selected">
                    <div className="file-icon">📄</div>
                    <div className="file-info">
                      <div className="file-name">{file.name}</div>
                      <div className="file-size">{Math.round(file.size / 1024)} KB</div>
                    </div>
                    {validation && (
                      <div className={`validation-status ${validation.valid ? 'valid' : 'invalid'}`}>
                        {validation.valid ? '✓ Valid' : '✗ Invalid'}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="dropzone-content">
                    <div className="dropzone-icon">📁</div>
                    <div className="dropzone-text">
                      {isDragActive ? (
                        <p>Drop your JSON file here...</p>
                      ) : (
                        <>
                          <p>Drag & drop your MySnippetHub export file here</p>
                          <p className="text-muted">or click to browse</p>
                        </>
                      )}
                    </div>
                    <button type="button" className="btn btn-outline mt-3">
                      Choose File
                    </button>
                  </div>
                )}
              </div>

              {validation && !validation.valid && (
                <div className="validation-errors mt-4">
                  <h4 className="text-error">Validation Errors</h4>
                  <ul>
                    {validation.errors.map((error, index) => (
                      <li key={index} className="text-error text-sm">{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validation && validation.warnings.length > 0 && (
                <div className="validation-warnings mt-4">
                  <h4 className="text-warning">Warnings</h4>
                  <ul>
                    {validation.warnings.map((warning, index) => (
                      <li key={index} className="text-warning text-sm">{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {file && !validation && (
                <div className="text-center mt-4">
                  <button 
                    className={`btn btn-secondary ${loading ? 'loading' : ''}`}
                    onClick={() => validateFile(file)}
                    disabled={loading}
                  >
                    {loading && <div className="spinner mr-2"></div>}
                    {loading ? 'Validating...' : 'Validate File'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Import Options */}
          {step === 'options' && validation && (
            <div className="options-step">
              <div className="import-summary mb-4">
                <h3>File Summary</h3>
                <div className="summary-stats">
                  <div className="stat-item">
                    <span className="label">File:</span>
                    <span className="value">{file.name}</span>
                  </div>
                  <div className="stat-item">
                    <span className="label">Total snippets:</span>
                    <span className="value">{validation.stats.totalSnippets}</span>
                  </div>
                  <div className="stat-item">
                    <span className="label">Valid snippets:</span>
                    <span className="value text-success">{validation.stats.validSnippets}</span>
                  </div>
                  {validation.stats.invalidSnippets > 0 && (
                    <div className="stat-item">
                      <span className="label">Invalid snippets:</span>
                      <span className="value text-error">{validation.stats.invalidSnippets}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="import-options">
                <h3>Import Options</h3>
                <div className="form-group">
                  <label className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={importOptions.overwriteExisting}
                      onChange={(e) => setImportOptions(prev => ({
                        ...prev,
                        overwriteExisting: e.target.checked
                      }))}
                    />
                    <span>Overwrite existing snippets</span>
                    <small className="text-muted">
                      Update snippets that already exist (matched by title and content)
                    </small>
                  </label>

                  <label className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={importOptions.skipDuplicates}
                      onChange={(e) => setImportOptions(prev => ({
                        ...prev,
                        skipDuplicates: e.target.checked
                      }))}
                    />
                    <span>Skip duplicate snippets</span>
                    <small className="text-muted">
                      Don't import snippets that already exist
                    </small>
                  </label>

                  <label className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={importOptions.preserveIds}
                      onChange={(e) => setImportOptions(prev => ({
                        ...prev,
                        preserveIds: e.target.checked
                      }))}
                    />
                    <span>Preserve original IDs</span>
                    <small className="text-muted">
                      Attempt to keep original snippet IDs (may cause conflicts)
                    </small>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Results */}
          {step === 'results' && importResults && (
            <div className="results-step">
              <div className="import-results">
                <h3>Import Complete</h3>
                <div className="results-summary">
                  <div className="result-item success">
                    <span className="icon">✓</span>
                    <span className="count">{importResults.results.success}</span>
                    <span className="label">Imported successfully</span>
                  </div>
                  {importResults.results.errors > 0 && (
                    <div className="result-item error">
                      <span className="icon">✗</span>
                      <span className="count">{importResults.results.errors}</span>
                      <span className="label">Failed to import</span>
                    </div>
                  )}
                  {importResults.results.skipped > 0 && (
                    <div className="result-item skipped">
                      <span className="icon">-</span>
                      <span className="count">{importResults.results.skipped}</span>
                      <span className="label">Skipped</span>
                    </div>
                  )}
                </div>

                {importResults.results.details && importResults.results.details.length > 0 && (
                  <div className="results-details">
                    <h4>Details</h4>
                    <div className="details-list">
                      {importResults.results.details.slice(0, 10).map((detail, index) => (
                        <div key={index} className={`detail-item ${detail.status}`}>
                          <span className="title">{detail.title}</span>
                          <span className="message">{detail.message}</span>
                        </div>
                      ))}
                      {importResults.results.details.length > 10 && (
                        <p className="text-muted">
                          ... and {importResults.results.details.length - 10} more
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions">
          {step === 'upload' && (
            <button 
              className="btn btn-ghost"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
          )}

          {step === 'options' && (
            <>
              <button 
                className="btn btn-ghost"
                onClick={() => setStep('upload')}
                disabled={loading}
              >
                Back
              </button>
              <button 
                className={`btn btn-primary ${loading ? 'loading' : ''}`}
                onClick={handleImport}
                disabled={loading}
              >
                {loading && <div className="spinner mr-2"></div>}
                {loading ? 'Importing...' : 'Import Snippets'}
              </button>
            </>
          )}

          {step === 'results' && (
            <>
              <button 
                className="btn btn-ghost"
                onClick={() => setStep('upload')}
              >
                Import More
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleClose}
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportModal;