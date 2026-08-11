import { useEffect, useRef } from "react";

export default function BorderGlow({
  children,
  edgeSensitivity = 34,
  borderRadius = 28,
  glowRadius = 34,
  glowIntensity = 0.42,
  coneSpread = 24,
  backgroundColor = "#FFFFFF",
  glowColor = "207 90% 78%",
  colors = ["#EAF4FF", "#D8EBFA", "#F4EFE6"],
  className = "",
}) {
  const cardRef = useRef(null);
  const frameRef = useRef(0);
  const pointerRef = useRef(null);

  const applyGlow = () => {
    frameRef.current = 0;
    const card = cardRef.current;
    const pointer = pointerRef.current;
    if (!card || !pointer) return;

    const rect = card.getBoundingClientRect();
    const x = pointer.clientX - rect.left;
    const y = pointer.clientY - rect.top;
    const edgeDistance = Math.min(x, y, rect.width - x, rect.height - y);
    const edgeProximity = Math.max(0, 1 - edgeDistance / edgeSensitivity);
    const glowOpacity = (edgeProximity ** 0.7 * glowIntensity).toFixed(3);
    const angle = Math.atan2(y - rect.height / 2, x - rect.width / 2) * (180 / Math.PI);

    card.style.setProperty("--border-glow-x", `${x}px`);
    card.style.setProperty("--border-glow-y", `${y}px`);
    card.style.setProperty("--border-glow-angle", `${angle}deg`);
    card.style.setProperty("--border-glow-opacity", glowOpacity);
  };

  const updateGlow = (event) => {
    if (event.pointerType === "touch") return;

    pointerRef.current = {
      clientX: event.clientX,
      clientY: event.clientY,
    };

    if (!frameRef.current) {
      frameRef.current = requestAnimationFrame(applyGlow);
    }
  };

  const clearGlow = () => {
    pointerRef.current = null;
    cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
    cardRef.current?.style.setProperty("--border-glow-opacity", "0");
  };

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  return (
    <div
      className={`border-glow-shell ${className}`.trim()}
      onPointerLeave={clearGlow}
      onPointerMove={updateGlow}
      ref={cardRef}
      style={{
        "--border-glow-radius": `${borderRadius}px`,
        "--border-glow-size": `${glowRadius + coneSpread}px`,
        "--border-glow-bg": backgroundColor,
        "--border-glow-hsl": glowColor,
        "--border-glow-color-1": colors[0],
        "--border-glow-color-2": colors[1],
        "--border-glow-color-3": colors[2],
      }}
    >
      {children}
    </div>
  );
}
