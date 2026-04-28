"use client";

import { useEffect, useState } from "react";
import { captionForBullpen } from "@/lib/captions";
import { loadTone, subscribeTone, type Tone } from "@/lib/tone";

interface Props {
  era: number;
  seed: number;
}

export function BullpenHeroCaption({ era, seed }: Props) {
  const [tone, setTone] = useState<Tone>("spicy");

  useEffect(() => {
    setTone(loadTone());
    return subscribeTone(setTone);
  }, []);

  const cap = captionForBullpen(era, seed, tone)[0];
  if (!cap) return null;

  return (
    <p className="text-sm text-muted max-w-md">
      {cap.emoji && <span className="mr-1">{cap.emoji}</span>}
      {cap.text}
    </p>
  );
}
