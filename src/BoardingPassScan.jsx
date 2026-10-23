import { useState } from "react";
import { parseBoardingPass } from "./bcbp";

function BoardingPassScan({ onPick, onClose }) {
  const [status, setStatus] = useState("");
  const [parsed, setParsed] = useState(null);
  const [busy, setBusy] = useState(false);
  const [pasted, setPasted] = useState("");

  async function handleFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setBusy(true);
    setStatus("");
    setParsed(null);
    try {
      const { readBarcodes } = await import("zxing-wasm/reader");
      const results = await readBarcodes(file);
      let found = null;
      for (const r of results) {
        const p = parseBoardingPass(r.text);
        if (p) {
          found = p;
          break;
        }
      }
      if (found) setParsed(found);
      else if (results.length === 0) setStatus("No barcode found. Try a sharper, well-lit photo, or a screenshot of the pass.");
      else setStatus("Found a barcode, but it isn't a boarding pass.");
    } catch (err) {
      setStatus("Couldn't read that image. Check you're online (the scanner loads on first use) and try again.");
    }
    setBusy(false);
    e.target.value = "";
  }

  function handlePaste() {
    const p = parseBoardingPass(pasted.trim());
    if (p) {
      setParsed(p);
      setStatus("");
    } else {
      setParsed(null);
      setStatus("That text doesn't look like a boarding pass barcode.");
    }
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel route-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <p className="section-heading">Scan Boarding Pass</p>
          <button className="settings-close" onClick={onClose}>✕</button>
        </div>

        <label className="search-button bp-file-button">
          {busy ? "Reading..." : "Take or choose a photo"}
          <input type="file" accept="image/*" onChange={handleFile} hidden />
        </label>

        <p className="bp-note">
          Read on your device only. Nothing is uploaded, and the app keeps just the flight number and date.
        </p>

        {status && <p className="error-msg">{status}</p>}

        {parsed && (
          <div className="bp-result">
            <p className="bp-line">{parsed.number} · {parsed.from} &rarr; {parsed.to}</p>
            <p className="bp-sub">{parsed.date}{parsed.seat ? " · Seat " + parsed.seat : ""}</p>
            <button className="search-button" onClick={() => onPick(parsed.number, parsed.date)}>
              Open flight
            </button>
            <p className="bp-note">The date is worked out from the day-of-year on the pass, so check it looks right.</p>
          </div>
        )}

        <details className="bp-paste">
          <summary>Or paste the barcode text</summary>
          <textarea
            className="search-input bp-textarea"
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            placeholder="M1SMITH/JOHN ..."
          />
          <button className="search-toggle" onClick={handlePaste}>Read text</button>
        </details>
      </div>
    </div>
  );
}

export default BoardingPassScan;