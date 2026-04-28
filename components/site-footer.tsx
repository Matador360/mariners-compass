"use client";

import { useEffect, useState } from "react";
import { quoteOfTheDay, type Quote } from "@/lib/quotes";

export function SiteFooter() {
  // SSR renders a stable shell; the QOTD is computed client-side so the
  // day-of-year stride uses the visitor's local date and stays identical
  // for every visitor on the same calendar day.
  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    setQuote(quoteOfTheDay(new Date()));
  }, []);

  return (
    <footer className="hidden md:block py-6 relative z-10">
      <div className="container-trident space-y-3">
        {/* Quote of the day */}
        <div className="text-center">
          {quote ? (
            <blockquote className="text-[12px] italic text-secondary/80 font-medium leading-snug max-w-2xl mx-auto">
              <span className="text-teal/60 mr-1">&ldquo;</span>
              {quote.text}
              <span className="text-teal/60 ml-1">&rdquo;</span>
              <footer className="not-italic text-[10px] text-muted/60 mt-1 tracking-wide">
                — {quote.attribution}
                <span className="text-muted/40">, {quote.year}</span>
                {quote.context && (
                  <span className="block text-[9px] text-muted/40 mt-0.5">
                    {quote.context}
                    {quote.source_url && (
                      <>
                        {" · "}
                        <a
                          href={quote.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal/60 hover:text-teal transition-colors underline-offset-2 hover:underline"
                        >
                          source
                        </a>
                      </>
                    )}
                  </span>
                )}
              </footer>
            </blockquote>
          ) : (
            <div className="h-[42px]" aria-hidden />
          )}
        </div>

        {/* Bottom row — disclaimer + brand mark */}
        <div className="flex items-center justify-between border-t border-white/[0.05] pt-3">
          <div className="flex items-center gap-2 text-muted/50">
            <span className="text-teal/40">⚓</span>
            <span className="text-[10px] tracking-[0.1em] uppercase font-medium">The Trident</span>
          </div>
          <p className="text-[10px] text-muted/40 text-center">
            Fan project · Data from{" "}
            <a
              href="https://statsapi.mlb.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal/60 hover:text-teal transition-colors"
            >
              MLB Stats API
            </a>
            {" "}· Not affiliated with MLB or the Mariners
          </p>
          <div className="text-[10px] text-muted/30 tracking-wider uppercase">
            SEA · {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </footer>
  );
}
