import React, { useState, useRef, useCallback } from 'react';
import { Upload, TreePine, Leaf, AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import { useTreeAnalysis } from '../hooks/useTreeAnalysis';

function finiteNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function optionalFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function percentageWidth(value: number, total: number): string {
  if (total <= 0) return '0%';
  return `${Math.min(100, Math.max(0, (value / total) * 100))}%`;
}

const TreeAnalyzer: React.FC = () => {
  const { result, state, error, analyze, reset } = useTreeAnalysis();
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [county, setCounty] = useState('');
  const [landAcres, setLandAcres] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeImage, setActiveImage] = useState<'original' | 'overlay'>('overlay');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.match(/image\/(jpeg|png|webp)/)) {
      alert('Please upload a JPEG, PNG, or WEBP image.');
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    await analyze(selectedFile, {
      county: county || undefined,
      landAcres: landAcres ? parseFloat(landAcres) : undefined,
      notes: notes || undefined,
    });
  };

  const handleReset = () => {
    reset();
    setPreview(null);
    setSelectedFile(null);
    setCounty('');
    setLandAcres('');
    setNotes('');
  };

  const totalTrees = finiteNumber(result?.total_tree_count);
  const treeDensity = optionalFiniteNumber(result?.tree_density_per_acre);
  const canopyCoverage = finiteNumber(result?.canopy_coverage_pct);
  const confidenceScore = finiteNumber(result?.confidence_score);
  const healthyTrees = finiteNumber(result?.tree_health?.healthy);
  const needsCareTrees = finiteNumber(result?.tree_health?.needs_care);
  const needsReplacementTrees = finiteNumber(result?.tree_health?.needs_replacement);
  const healthTotal = totalTrees || healthyTrees + needsCareTrees + needsReplacementTrees;
  const originalImageUrl = result?.original_image_url || '';
  const overlayImageUrl = result?.overlay_image_url || originalImageUrl;
  const activeImageUrl = activeImage === 'original' ? originalImageUrl : overlayImageUrl;
  const observations = result?.observations ?? [];
  const recommendations = result?.recommendations ?? [];

  return (
    <div className="section">
      <h2 className="section__title">Farm Canopy Analyzer</h2>
      <p className="section__subtitle">
        Upload a drone, aerial, or satellite image to count trees and assess canopy health
      </p>

      {!result && (
        <div className="analyzer">
          {/* Drop Zone */}
          <div
            className={`dropzone ${dragging ? 'dropzone--active' : ''} ${preview ? 'dropzone--has-image' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => !preview && fileRef.current?.click()}
          >
            {preview ? (
              <img src={preview} alt="Farm preview" className="dropzone__preview" />
            ) : (
              <div className="dropzone__placeholder">
                <Upload size={36} />
                <span>Drop farm image here or click to browse</span>
                <span className="dropzone__hint">JPEG · PNG · WEBP · max 20MB</span>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onInputChange}
              style={{ display: 'none' }}
            />
          </div>

          {preview && (
            <>
              <div className="analyzer__fields">
                <label className="field">
                  <span>County / Region</span>
                  <input
                    type="text"
                    placeholder="e.g. Bomet"
                    value={county}
                    onChange={(e) => setCounty(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Land Size (acres)</span>
                  <input
                    type="number"
                    placeholder="e.g. 2.5"
                    min="0"
                    step="0.1"
                    value={landAcres}
                    onChange={(e) => setLandAcres(e.target.value)}
                  />
                </label>
                <label className="field field--full">
                  <span>Notes for AI (optional)</span>
                  <input
                    type="text"
                    placeholder="e.g. Tea plantation, recently pruned"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </label>
              </div>

              <div className="analyzer__actions">
                <button className="btn btn--primary" onClick={handleAnalyze} disabled={state === 'loading'}>
                  {state === 'loading' ? (
                    <>
                      <Loader size={16} className="spin" />
                      Analyzing…
                    </>
                  ) : (
                    <>
                      <TreePine size={16} />
                      Analyze Farm
                    </>
                  )}
                </button>
                <button className="btn btn--ghost" onClick={handleReset}>
                  Clear
                </button>
              </div>
            </>
          )}

          {error && (
            <div className="error-box">
              <AlertTriangle size={16} />
              {error.message}
            </div>
          )}
        </div>
      )}

      {result && (
        <div className="analysis-result">
          {/* Header Stats */}
          <div className="result-stats">
            <div className="result-stat result-stat--primary">
              <TreePine size={28} />
              <span className="result-stat__value">{totalTrees}</span>
              <span className="result-stat__label">Total Trees</span>
            </div>
            {treeDensity !== null && (
              <div className="result-stat">
                <span className="result-stat__value">{treeDensity.toFixed(1)}</span>
                <span className="result-stat__label">Trees / Acre</span>
              </div>
            )}
            <div className="result-stat">
              <span className="result-stat__value">{canopyCoverage.toFixed(1)}%</span>
              <span className="result-stat__label">Canopy Cover</span>
            </div>
            <div className="result-stat">
              <span className="result-stat__value">{(confidenceScore * 100).toFixed(0)}%</span>
              <span className="result-stat__label">Confidence</span>
            </div>
          </div>

          {/* Health Breakdown */}
          <div className="health-bar-section">
            <h3>Canopy Health Breakdown</h3>
            <div className="health-bars">
              <div className="health-item health-item--healthy">
                <CheckCircle size={14} />
                <span>Healthy</span>
                <strong>{healthyTrees}</strong>
              </div>
              <div className="health-item health-item--care">
                <AlertTriangle size={14} />
                <span>Needs Care</span>
                <strong>{needsCareTrees}</strong>
              </div>
              <div className="health-item health-item--replace">
                <Leaf size={14} />
                <span>Replace</span>
                <strong>{needsReplacementTrees}</strong>
              </div>
            </div>
            <div className="health-visual-bar">
              <div
                className="health-visual-bar__healthy"
                style={{ width: percentageWidth(healthyTrees, healthTotal) }}
              />
              <div
                className="health-visual-bar__care"
                style={{ width: percentageWidth(needsCareTrees, healthTotal) }}
              />
              <div
                className="health-visual-bar__replace"
                style={{ width: percentageWidth(needsReplacementTrees, healthTotal) }}
              />
            </div>
          </div>

          {/* Image Toggle */}
          <div className="image-toggle-section">
            <div className="image-toggle">
              <button
                className={`image-toggle__btn ${activeImage === 'original' ? 'image-toggle__btn--active' : ''}`}
                onClick={() => setActiveImage('original')}
              >
                Original
              </button>
              <button
                className={`image-toggle__btn ${activeImage === 'overlay' ? 'image-toggle__btn--active' : ''}`}
                onClick={() => setActiveImage('overlay')}
              >
                Annotated Overlay
              </button>
            </div>
            {activeImageUrl && (
              <img
                src={activeImageUrl}
                alt={activeImage === 'original' ? 'Original farm image' : 'Annotated overlay'}
                className="result-image"
              />
            )}
          </div>

          {/* Species Guess */}
          {result.tree_species_guess && (
            <div className="species-chip">
              🌿 Detected species: <strong>{result.tree_species_guess}</strong>
            </div>
          )}

          {/* Observations */}
          {observations.length > 0 && (
            <div className="ai-insights">
              <h3>AI Observations</h3>
              <ul>
                {observations.map((obs, i) => (
                  <li key={i}>{obs}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="ai-insights ai-insights--recs">
              <h3>Recommendations</h3>
              <ul>
                {recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          <button className="btn btn--ghost" onClick={handleReset}>
            Analyze Another Image
          </button>
        </div>
      )}
    </div>
  );
};

export default TreeAnalyzer;
