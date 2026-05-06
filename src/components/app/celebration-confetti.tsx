"use client";

import { type CSSProperties, useEffect, useMemo, useState } from "react";

type CelebrationKind = "course-completed" | "quiz-completed" | "quiz-created";

type CelebrationConfig = {
  badge: string;
  message: string;
  title: string;
};

const celebrationCopy: Record<CelebrationKind, CelebrationConfig> = {
  "course-completed": {
    badge: "Progression",
    message: "Belle avance, le prochain jalon est prêt.",
    title: "Cours terminé",
  },
  "quiz-completed": {
    badge: "Quiz",
    message: "Réponses envoyées, le résultat est disponible.",
    title: "Quiz envoyé",
  },
  "quiz-created": {
    badge: "Coach",
    message: "Le quiz est prêt à être enrichi et assigné.",
    title: "Quiz créé",
  },
};

const confettiColors = [
  "#7c3aed",
  "#06b6d4",
  "#22c55e",
  "#f97316",
  "#facc15",
  "#ec4899",
  "#2563eb",
  "#14b8a6",
];

function isCelebrationKind(value: string | null): value is CelebrationKind {
  return value === "course-completed" || value === "quiz-completed" || value === "quiz-created";
}

function prefersReducedMotion() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function CelebrationConfetti() {
  const [activeCelebration, setActiveCelebration] = useState<{
    id: number;
    kind: CelebrationKind;
    reducedMotion: boolean;
  } | null>(null);

  useEffect(() => {
    const triggerFromUrl = () => {
      const url = new URL(window.location.href);
      const celebrationParam = url.searchParams.get("celebrate");

      if (!isCelebrationKind(celebrationParam)) {
        return;
      }

      setActiveCelebration({
        id: Date.now(),
        kind: celebrationParam,
        reducedMotion: prefersReducedMotion(),
      });

      url.searchParams.delete("celebrate");
      window.history.replaceState(
        window.history.state,
        "",
        `${url.pathname}${url.search}${url.hash}`,
      );
    };

    window.setTimeout(triggerFromUrl, 0);
    const interval = window.setInterval(triggerFromUrl, 250);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!activeCelebration) {
      return;
    }

    const timeout = window.setTimeout(
      () => setActiveCelebration(null),
      activeCelebration.reducedMotion ? 2200 : 3600,
    );

    return () => window.clearTimeout(timeout);
  }, [activeCelebration]);

  const particles = useMemo(() => {
    if (!activeCelebration || activeCelebration.reducedMotion) {
      return [];
    }

    return Array.from({ length: 110 }, (_, index) => {
      const column = index % 22;
      const row = Math.floor(index / 22);
      const size = 7 + ((index * 5) % 13);
      const drift = ((index * 29) % 80) - 40;

      return {
        color: confettiColors[index % confettiColors.length],
        delay: (column * 42 + row * 95) % 760,
        drift,
        duration: 2300 + ((index * 73) % 1300),
        radius: index % 5 === 0 ? 999 : index % 3 === 0 ? 3 : 1,
        rotate: ((index * 47) % 320) - 160,
        shape: index % 4 === 0 ? "celebration-confetti-ribbon" : "",
        size,
        x: 2 + column * 4.5 + ((row * 7) % 5),
      };
    });
  }, [activeCelebration]);

  if (!activeCelebration) {
    return null;
  }

  const copy = celebrationCopy[activeCelebration.kind];

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-0 z-[90] overflow-hidden"
      role="status"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgb(255_255_255_/_0.9),rgb(255_255_255_/_0.28)_28%,transparent_58%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_26%,rgb(125_92_255_/_0.22),transparent_28%),radial-gradient(circle_at_78%_18%,rgb(45_212_191_/_0.22),transparent_26%),radial-gradient(circle_at_52%_72%,rgb(250_204_21_/_0.2),transparent_30%)]" />

      {!activeCelebration.reducedMotion &&
        particles.map((particle, index) => (
          <span
            aria-hidden="true"
            className={`celebration-confetti-particle ${particle.shape}`}
            key={`${activeCelebration.id}-${index}`}
            style={
              {
                "--confetti-color": particle.color,
                "--confetti-delay": `${particle.delay}ms`,
                "--confetti-drift": `${particle.drift}vw`,
                "--confetti-duration": `${particle.duration}ms`,
                "--confetti-radius": `${particle.radius}px`,
                "--confetti-rotate": `${particle.rotate}deg`,
                "--confetti-size": `${particle.size}px`,
                "--confetti-x": `${particle.x}vw`,
              } as CSSProperties
            }
          />
        ))}

      <div className="absolute inset-x-4 top-1/2 mx-auto flex max-w-sm -translate-y-1/2 justify-center sm:max-w-md">
        <div className="celebration-confetti-card w-full rounded-[2rem] border border-white/70 bg-white/82 px-6 py-6 text-center shadow-[0_28px_90px_rgb(79_70_229_/_0.24)] backdrop-blur-xl sm:px-8 sm:py-7">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 via-indigo-400 to-amber-300 text-3xl shadow-lg shadow-sky-900/15">
            <span aria-hidden="true">★</span>
          </div>
          <p className="mx-auto mb-2 w-fit rounded-full bg-sky-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-sky-700">
            {copy.badge}
          </p>
          <p className="text-3xl font-black text-slate-950 sm:text-4xl">{copy.title}</p>
          <p className="mx-auto mt-3 max-w-xs text-sm font-semibold leading-6 text-slate-600">
            {copy.message}
          </p>
        </div>
      </div>
    </div>
  );
}
