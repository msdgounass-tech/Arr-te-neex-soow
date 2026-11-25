"use client";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";

/**
 * Ambiance sonore facultative, composée dans le navigateur (Web Audio) : aucun fichier téléchargé,
 * aucun démarrage automatique, désactivée par défaut à chaque visite.
 */
export function SoundToggle({ className = "" }: { className?: string }) {
  const [on, setOn] = useState(false);
  const ctx = useRef<AudioContext | null>(null);
  const stopFn = useRef<(() => void) | null>(null);

  useEffect(() => () => stopFn.current?.(), []);

  function start() {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ac = (ctx.current ??= new AC());
    void ac.resume();
    const master = ac.createGain();
    master.gain.value = 0;
    master.gain.linearRampToValueAtTime(0.06, ac.currentTime + 2.5);
    const filter = ac.createBiquadFilter();
    filter.type = "lowpass"; filter.frequency.value = 900;
    filter.connect(master).connect(ac.destination);
    // Accords doux en boucle (la mineur, fa, do, sol) — composition originale.
    const chords = [[220, 261.63, 329.63], [174.61, 220, 261.63], [196, 261.63, 329.63], [196, 246.94, 293.66]];
    const oscs: OscillatorNode[] = [];
    const voices = chords[0].map((f) => {
      const o = ac.createOscillator(); o.type = "triangle"; o.frequency.value = f;
      const g = ac.createGain(); g.gain.value = 0.33; o.connect(g).connect(filter); o.start(); oscs.push(o); return o;
    });
    let i = 0;
    const timer = window.setInterval(() => {
      i = (i + 1) % chords.length;
      voices.forEach((o, k) => o.frequency.setTargetAtTime(chords[i][k], ac.currentTime, 0.8));
    }, 4000);
    stopFn.current = () => {
      window.clearInterval(timer);
      master.gain.cancelScheduledValues(ac.currentTime);
      master.gain.setTargetAtTime(0, ac.currentTime, 0.3);
      window.setTimeout(() => oscs.forEach((o) => o.stop()), 1200);
      stopFn.current = null;
    };
  }

  function toggle() {
    if (on) { stopFn.current?.(); setOn(false); } else { start(); setOn(true); }
  }

  return (
    <button type="button" onClick={toggle} aria-pressed={on} className={`press inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm hover:bg-mist ${className}`}>
      <Icon name={on ? "volume-on" : "volume-off"} size={18} />
      <span>{on ? "Couper l'ambiance" : "Ambiance sonore"}</span>
    </button>
  );
}
