"use client";

import { type CSSProperties, useEffect, useMemo, useState } from "react";

type CelebrationKind = "course-completed" | "quiz-completed" | "quiz-created";
type CelebrationVariant =
  | "aurora-ribbons"
  | "confetti"
  | "fireworks"
  | "floating-shapes"
  | "success-burst";

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

const celebrationVariants: CelebrationVariant[] = [
  "confetti",
  "fireworks",
  "aurora-ribbons",
  "success-burst",
  "floating-shapes",
];

const fireworks = [
  { x: 18, y: 22 },
  { x: 76, y: 18 },
  { x: 52, y: 28 },
  { x: 25, y: 68 },
  { x: 82, y: 64 },
];

const auroraRibbons = [
  { color: "rgba(124, 58, 237, 0.38)", delay: 0, rotate: -18, y: 12 },
  { color: "rgba(6, 182, 212, 0.34)", delay: 150, rotate: 14, y: 24 },
  { color: "rgba(34, 197, 94, 0.3)", delay: 280, rotate: -8, y: 44 },
  { color: "rgba(236, 72, 153, 0.3)", delay: 420, rotate: 20, y: 62 },
  { color: "rgba(250, 204, 21, 0.28)", delay: 560, rotate: -24, y: 78 },
];

const successSparkShapes = ["", "celebration-success-star", "celebration-success-dot"];

function isCelebrationKind(value: string | null): value is CelebrationKind {
  return value === "course-completed" || value === "quiz-completed" || value === "quiz-created";
}

function pickCelebrationVariant(): CelebrationVariant {
  return celebrationVariants[Math.floor(Math.random() * celebrationVariants.length)] ?? "confetti";
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
    variant: CelebrationVariant;
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
        variant: pickCelebrationVariant(),
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

  const fireworkSparks = useMemo(() => {
    if (
      !activeCelebration ||
      activeCelebration.reducedMotion ||
      activeCelebration.variant !== "fireworks"
    ) {
      return [];
    }

    return fireworks.flatMap((firework, fireworkIndex) =>
      Array.from({ length: 18 }, (_, sparkIndex) => ({
        angle: sparkIndex * 20,
        color: confettiColors[(sparkIndex + fireworkIndex * 2) % confettiColors.length],
        delay: fireworkIndex * 190 + (sparkIndex % 3) * 34,
        distance: 54 + ((sparkIndex * 9) % 52),
        key: `${activeCelebration.id}-firework-${fireworkIndex}-${sparkIndex}`,
        size: 4 + ((sparkIndex + fireworkIndex) % 5),
        x: firework.x,
        y: firework.y,
      })),
    );
  }, [activeCelebration]);

  const successSparks = useMemo(() => {
    if (
      !activeCelebration ||
      activeCelebration.reducedMotion ||
      activeCelebration.variant !== "success-burst"
    ) {
      return [];
    }

    return Array.from({ length: 54 }, (_, index) => ({
      angle: index * 17,
      color: confettiColors[index % confettiColors.length],
      delay: (index * 19) % 520,
      distance: 22 + ((index * 11) % 54),
      shape: successSparkShapes[index % successSparkShapes.length],
      size: 5 + ((index * 3) % 9),
    }));
  }, [activeCelebration]);

  const floatingShapes = useMemo(() => {
    if (
      !activeCelebration ||
      activeCelebration.reducedMotion ||
      activeCelebration.variant !== "floating-shapes"
    ) {
      return [];
    }

    return Array.from({ length: 46 }, (_, index) => ({
      color: confettiColors[(index * 3) % confettiColors.length],
      delay: (index * 61) % 980,
      duration: 2600 + ((index * 89) % 1500),
      radius: index % 4 === 0 ? 999 : 12,
      rotate: ((index * 41) % 260) - 130,
      size: 22 + ((index * 7) % 42),
      x: 4 + ((index * 17) % 92),
      y: 96 + ((index * 13) % 26),
    }));
  }, [activeCelebration]);

  if (!activeCelebration) {
    return null;
  }

  const copy = celebrationCopy[activeCelebration.kind];
  const showConfetti =
    !activeCelebration.reducedMotion && activeCelebration.variant === "confetti";

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-0 z-[90] overflow-hidden"
      data-celebration-variant={activeCelebration.variant}
      role="status"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgb(255_255_255_/_0.9),rgb(255_255_255_/_0.28)_28%,transparent_58%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_26%,rgb(125_92_255_/_0.22),transparent_28%),radial-gradient(circle_at_78%_18%,rgb(45_212_191_/_0.22),transparent_26%),radial-gradient(circle_at_52%_72%,rgb(250_204_21_/_0.2),transparent_30%)]" />

      {showConfetti &&
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

      {!activeCelebration.reducedMotion &&
        activeCelebration.variant === "fireworks" &&
        fireworkSparks.map((spark) => (
          <span
            aria-hidden="true"
            className="celebration-firework-spark"
            key={spark.key}
            style={
              {
                "--firework-angle": `${spark.angle}deg`,
                "--firework-color": spark.color,
                "--firework-delay": `${spark.delay}ms`,
                "--firework-distance": `${spark.distance}px`,
                "--firework-size": `${spark.size}px`,
                "--firework-x": `${spark.x}vw`,
                "--firework-y": `${spark.y}vh`,
              } as CSSProperties
            }
          />
        ))}

      {!activeCelebration.reducedMotion &&
        activeCelebration.variant === "aurora-ribbons" &&
        auroraRibbons.map((ribbon, index) => (
          <span
            aria-hidden="true"
            className="celebration-aurora-ribbon"
            key={`${activeCelebration.id}-aurora-${index}`}
            style={
              {
                "--aurora-color": ribbon.color,
                "--aurora-delay": `${ribbon.delay}ms`,
                "--aurora-rotate": `${ribbon.rotate}deg`,
                "--aurora-y": `${ribbon.y}vh`,
              } as CSSProperties
            }
          />
        ))}

      {!activeCelebration.reducedMotion && activeCelebration.variant === "success-burst" && (
        <div aria-hidden="true" className="absolute inset-0">
          <span className="celebration-success-ring celebration-success-ring-primary" />
          <span className="celebration-success-ring celebration-success-ring-secondary" />
          {successSparks.map((spark, index) => (
            <span
              className={`celebration-success-spark ${spark.shape}`}
              key={`${activeCelebration.id}-success-${index}`}
              style={
                {
                  "--success-angle": `${spark.angle}deg`,
                  "--success-color": spark.color,
                  "--success-delay": `${spark.delay}ms`,
                  "--success-distance": `${spark.distance}vw`,
                  "--success-size": `${spark.size}px`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}

      {!activeCelebration.reducedMotion &&
        activeCelebration.variant === "floating-shapes" &&
        floatingShapes.map((shape, index) => (
          <span
            aria-hidden="true"
            className="celebration-floating-shape"
            key={`${activeCelebration.id}-shape-${index}`}
            style={
              {
                "--shape-color": shape.color,
                "--shape-delay": `${shape.delay}ms`,
                "--shape-duration": `${shape.duration}ms`,
                "--shape-radius": `${shape.radius}px`,
                "--shape-rotate": `${shape.rotate}deg`,
                "--shape-size": `${shape.size}px`,
                "--shape-x": `${shape.x}vw`,
                "--shape-y": `${shape.y}vh`,
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
