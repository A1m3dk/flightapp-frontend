function Hero({ flight }) {
  if (!flight) return null;

  const dep = flight.departure;
  const arr = flight.arrival;
  const info = computeHeroInfo(flight);

  return (
    <div className={"hero-panel hero-" + info.colorClass}>
      <p className="hero-flight-tag">{flight.airline?.name} {flight.number}</p>
      <p className="hero-big-text">{info.bigText}</p>
      {info.subText && <p className="hero-sub-text">{info.subText}</p>}
      <div className="hero-meta">
        {dep?.gate && <span className="hero-meta-item">Gate {dep.gate}</span>}
        {dep?.terminal && <span className="hero-meta-item">Terminal {dep.terminal}</span>}
        {info.delayText && <span className="hero-meta-item hero-delay">{info.delayText}</span>}
      </div>
    </div>
  );
}

function getStatusPhase(status) {
  const s = (status || "").toLowerCase();
  if (s.includes("enroute") || s.includes("approach") || s.includes("diverted")) return "AIRBORNE";
  if (s.includes("landed") || s.includes("arrived")) return "ARRIVED";
  if (s.includes("cancel")) return "CANCELLED";
  return "NOT DEPARTED";
}

function getDelayMinutes(leg) {
  if (!leg) return 0;
  const scheduled = leg.scheduledTime?.local;
  const actual = leg.actualTime?.local || leg.predictedTime?.local;
  if (!scheduled || !actual) return 0;
  const diffMs = new Date(actual) - new Date(scheduled);
  const diffMin = Math.round(diffMs / 60000);
  return diffMin > 0 ? diffMin : 0;
}

function computeHeroInfo(flight) {
  const dep = flight.departure;
  const arr = flight.arrival;
  const statusPhase = getStatusPhase(flight.status);
  const depDelay = getDelayMinutes(dep);
  const arrDelay = getDelayMinutes(arr);
  const delayText = depDelay > 15 || arrDelay > 15 ? "Delayed" : null;

  if (statusPhase === "ARRIVED") {
    return { bigText: "Landed", subText: arr?.airport?.name || "", colorClass: "arrived", delayText };
  }
  if (statusPhase === "CANCELLED") {
    return { bigText: "Cancelled", subText: "", colorClass: "cancelled", delayText: null };
  }
  if (statusPhase === "AIRBORNE") {
    const arrTime = arr?.predictedTime?.local || arr?.scheduledTime?.local;
    const remaining = arrTime ? formatRemaining(new Date(arrTime) - new Date()) : null;
    return {
      bigText: "In the air",
      subText: remaining ? "Lands in " + remaining : "Heading to " + (arr?.airport?.name || ""),
      colorClass: "airborne",
      delayText,
    };
  }

  const target = dep?.scheduledTime?.local ? new Date(dep.scheduledTime.local) : null;
  if (!target) return { bigText: "Not departed", subText: "", colorClass: "notdeparted", delayText };

  const diffMs = target - new Date();
  const minsRemaining = diffMs / 60000;

  if (diffMs <= 0 && minsRemaining > -60) {
    return { bigText: "Boarding", subText: "Head to the gate", colorClass: "boarding", delayText };
  }
  if (minsRemaining <= 45 && minsRemaining > 0) {
    return { bigText: "Boarding soon", subText: "Departs in " + formatRemaining(diffMs), colorClass: "boarding", delayText };
  }

  return {
    bigText: "Departs in " + formatRemaining(diffMs),
    subText: minsRemaining <= 24 * 60 ? "Check-in open" : "",
    colorClass: "notdeparted",
    delayText,
  };
}

function formatRemaining(diffMs) {
  if (diffMs <= 0) return "0m";
  const totalMin = Math.round(diffMs / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? h + "h " + m + "m" : m + "m";
}

export default Hero;