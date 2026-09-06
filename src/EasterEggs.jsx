import { useEffect, useState, useRef } from "react";

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

function EasterEggs() {
  const [flying, setFlying] = useState(false);
  const progressRef = useRef([]);

  useEffect(() => {
    function handleKey(e) {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      progressRef.current = [...progressRef.current, key].slice(-KONAMI.length);
      if (progressRef.current.join(",") === KONAMI.join(",")) {
        setFlying(true);
        setTimeout(() => setFlying(false), 2600);
        progressRef.current = [];
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  if (!flying) return null;

  return (
    <div className="easter-egg-overlay">
      <div className="easter-egg-plane">✈</div>
      <p className="easter-egg-text">Cleared for takeoff</p>
    </div>
  );
}

export default EasterEggs;