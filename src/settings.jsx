function Settings({ open, onClose, pushEnabled, onTogglePush }) {
  if (!open) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <p className="section-heading">Settings</p>
          <button className="settings-close" onClick={onClose}>✕</button>
        </div>

        <div className="settings-row">
          <div>
            <p className="settings-label">Background flight alerts</p>
            <p className="settings-desc">Get notified about check-in, boarding, takeoff, and landing even when the app is closed.</p>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" checked={pushEnabled} onChange={onTogglePush} />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>
  );
}

export default Settings;