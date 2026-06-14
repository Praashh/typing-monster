export function ResultsOverlay({ wpm, acc, duration, onReset }: {
  wpm: number; acc: number; duration: number; onReset: () => void;
}) {
  return (
    <div className="mb-overlay">
      <div className="mb-card">
        <p className="mb-card-eyebrow">run complete</p>
        <div className="mb-result">
          <div className="mb-big">
            <strong>{wpm}</strong>
            <span>wpm</span>
          </div>
          <div className="mb-sub">
            <div>
              <strong>{acc}%</strong>
              <span>accuracy</span>
            </div>
            <div>
              <strong>{duration}s</strong>
              <span>time</span>
            </div>
          </div>
        </div>
        <button type="button" className="mb-restart" onClick={onReset}>
          next run ⏎
        </button>
      </div>
    </div>
  );
}
