import { useState } from "react";
import { sendTestPush } from "./push";

function Settings({ open, onClose, pushEnabled, onTogglePush }) {
  const [testState, setTestState] = useState("");

  if (!open) return null;

  async function handleTest() {
    setTestState("Sending…");
    const result = await sendTestPush();
    setTestState(
      result.ok
        ? "Sent. It should arrive in about 8 seconds. Close the app now to test properly."
        : result.reason || "Couldn't send a test alert."
    );
  }

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
            <p className="settings-desc">Get notified about check-in, boarding, takeoff and landing even when the app is closed.</p>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" checked={pushEnabled} onChange={onTogglePush} />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {pushEnabled && (
          <div className="settings-section">
            <button className="search-toggle" onClick={handleTest}>Send test alert</button>
            {testState && <p className="settings-desc settings-test-note">{testState}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default Settings;