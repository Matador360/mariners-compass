"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CountingNumber } from "@/components/counting-number";
import { TridentDivider } from "@/components/trident-logo";
import { HISTORY_HEADLINE_STATS } from "@/lib/history-constants";

function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function RevealSection({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        className
      )}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

const BIG_STATS = HISTORY_HEADLINE_STATS;

type Vibe = "legendary" | "good" | "bad" | "cursed" | "neutral";

const TIMELINE: Array<{
  year: string;
  era: string;
  vibe: Vibe;
  text: string;
  icon: string;
  playerId?: number;
}> = [
  {
    year: "1969",
    era: "The Pilots Disaster",
    vibe: "bad",
    icon: "✈️",
    text: "Seattle gets the expansion Pilots. They are immediately terrible. After one season, owner Dewey Soriano declares bankruptcy and sells the team to Bud Selig, who moves them to Milwaukee and calls them the Brewers. Seattle gets absolutely robbed.",
  },
  {
    year: "1977",
    era: "Born From a Lawsuit",
    vibe: "neutral",
    icon: "⚖️",
    text: "After the Pilots fiasco, Seattle sues Major League Baseball for breaking a stadium-lease agreement. MLB's solution: fine, here's an expansion team, stop yelling. The Mariners begin play. We literally exist because of a legal settlement. Inspiring origin story.",
  },
  {
    year: "1979",
    era: "The Early Pain",
    vibe: "bad",
    icon: "📉",
    text: "67–95. Dead last in the AL West. The beginning of a long relationship with mediocrity. At least we had Ruppert Jones. Nobody remembers Ruppert Jones.",
  },
  {
    year: "1982",
    era: "Gaylord Perry Wins #300",
    vibe: "neutral",
    icon: "🏛️",
    text: "Gaylord Perry — universally understood to be cheating with a spitball for his entire career — becomes the only Hall of Famer to wear a Mariners cap for the next 17 years. Our franchise cornerstone was a guy everyone knew was doctoring baseballs. Perfect.",
  },
  {
    year: "1989",
    era: "The Kid Arrives",
    vibe: "legendary",
    icon: "👑",
    text: "Ken Griffey Jr. is the #1 overall pick and immediately the most electrifying player in baseball. He's 19 years old, his hat is always backwards, and the game looks embarrassingly easy for him. The Kingdome finally has a reason to exist.",
  },
  {
    year: "1990",
    era: "Father & Son Make History",
    vibe: "legendary",
    icon: "👨‍👦",
    text: "August 31st. Ken Griffey Sr. and Ken Griffey Jr. play in the same outfield. Then they hit back-to-back home runs in the same inning — the first and only father-son tandem in baseball history. Nothing like it has happened since. Nothing ever will.",
  },
  {
    year: "1993",
    era: "The Big Unit Takes Over",
    vibe: "good",
    icon: "🔥",
    text: "Randy Johnson — 6'10\", mean as hell, fastball at 100 mph with a side-arm slider that starts at your head and ends at your ankles — strikes out 308 batters. Hitters literally stepped out of the box to reconsider their life choices.",
  },
  {
    year: "1995",
    era: "The Miracle. The Double.",
    vibe: "legendary",
    icon: "🎯",
    text: "Down 13 games in August, they came all the way back. Game 5 ALDS vs the Yankees, 11th inning, two on, two out. Edgar Martinez absolutely scalds a double down the left field line. Joey Cora scores. Griffey — still running at full speed — rounds third. He scores. The Kingdome shakes. Baseball is saved in Seattle.",
  },
  {
    year: "1996",
    era: "Randy Johnson Leaves",
    vibe: "bad",
    icon: "✈️",
    text: "Randy Johnson is traded to Houston mid-season. The Big Unit goes on to win the 2001 World Series with Arizona. He wins 4 Cy Youngs after leaving. We got Sterling Hitchcock vibes in return. Classic Mariners.",
  },
  {
    year: "2000",
    era: "They Traded Griffey",
    vibe: "bad",
    icon: "💔",
    text: "Junior, wanting to play in his hometown Cincinnati, requests a trade. He could've stayed. There were options. The Mariners send the greatest player in franchise history to the Reds for Mike Cameron and a couple of prospects. The city never fully healed.",
  },
  {
    year: "2001",
    era: "116 Wins and Nothing to Show For It",
    vibe: "legendary",
    icon: "😤",
    text: "Ichiro arrives. The team wins 116 games — tying the all-time MLB record. They're the best team in baseball. By miles. They go to the ALCS and lose to the Yankees 4-1. It is the most Mariners thing to ever happen. History books remember 116 wins. Our hearts remember the Yankees.",
  },
  {
    year: "2004",
    era: "Ichiro's 262",
    vibe: "legendary",
    icon: "📝",
    text: "Ichiro shatters George Sisler's 84-year-old hits record, finishing the season with 262. The team around him goes 63-99 — a masterpiece of individual greatness surrounded by rubble. Ichiro treated losing seasons like inconveniences, not facts of life.",
  },
  {
    year: "2009",
    era: "The Kid Comes Home",
    vibe: "neutral",
    icon: "🎪",
    text: "Griffey, age 39, returns for one last run. He's slow. He's not the same. There are unconfirmed reports he fell asleep in the clubhouse during games. Nobody cared. We love him unconditionally. He retired that July. We cried.",
  },
  {
    year: "2010",
    era: "King Felix Wins the Cy Young",
    vibe: "legendary",
    icon: "👑",
    text: "Felix Hernández wins the AL Cy Young Award. His record: 13-12. The worst W-L for any Cy Young winner in history. The voters finally realize wins are a garbage stat and ERA is 2.27. The King carries this franchise on his back. Nobody around him is worthy of the name.",
  },
  {
    year: "2012",
    era: "The Perfect Game",
    vibe: "legendary",
    icon: "✨",
    text: "August 15th. A Wednesday afternoon crowd fills T-Mobile Park. Felix throws 27 up, 27 down. The King's Court — a section of fans in yellow, waving K signs — goes berserk on every strikeout. Mike Zunino throws the final out back to Felix. He falls to his knees. Perfection. The team went 75-87.",
  },
  {
    year: "2013–2021",
    era: "The Drought",
    vibe: "cursed",
    icon: "🏜️",
    text: "21 consecutive years without a playoff appearance. There is no elegant way to describe it. Some years brought hope — only for September to crush it. Robinson Canó collected his $240 million. The team stayed mediocre on a rotating cast of almost-good players. The drought was its own personality.",
  },
  {
    year: "2022",
    era: "Cal Raleigh Ends It",
    vibe: "legendary",
    icon: "🎆",
    text: "September 2nd, 2022. Cal 'Big Dumper' Raleigh hits a walk-off homer in the 9th inning to clinch a playoff spot, ending 21 years of suffering. Julio Rodríguez — 21 years old, drafted only in 2019 — is sprinting out of the dugout. The fans haven't breathed like this in a generation.",
  },
  {
    year: "2023",
    era: "Back-to-Back",
    vibe: "good",
    icon: "📈",
    playerId: 677594,
    text: "Playoffs again. Julio Rodríguez is a generational talent. The rotation is elite. They lose in the Wild Card round to the eventual World Series champion Rangers. Swept. It still stings. It also still counts.",
  },
  {
    year: "2024–25",
    era: "The Build Continues",
    vibe: "good",
    icon: "🔨",
    playerId: 677594,
    text: "Emerson Hancock, Bryan Woo, Bryce Miller, Logan Gilbert — a rotation building into something real. Julio is in his prime and just getting started. The payroll is still frustratingly modest. But the bones are there. Probably. We think.",
  },
];

const LEGENDS = [
  {
    id: 116338,
    name: "Ken Griffey Jr.",
    nickname: "The Kid",
    years: "1989–1999, 2009",
    stat: "630 career HR",
    hof: "2016 · 99.3%",
    blurb:
      "The sweetest swing in the history of the game. He made it look like play. He made the game look like it was invented for him. And then the front office couldn't hold onto him. He came back anyway for one last year at 39. He's our guy forever.",
  },
  {
    id: 118800,
    name: "Edgar Martinez",
    nickname: "Señor Octubre",
    years: "1987–2004",
    stat: ".312 career AVG",
    hof: "2019 · 85.4%",
    blurb:
      "The greatest designated hitter in baseball history — so great they named the DH award after him. 'The Double' in 1995 is the defining play in franchise history. He played his entire 18-year career as a Mariner. That kind of loyalty is essentially extinct.",
  },
  {
    id: 400085,
    name: "Ichiro Suzuki",
    nickname: "The Machine",
    years: "2001–2012, 2018–2019",
    stat: "262 hits in 2004",
    hof: "2025 · 99.7%",
    blurb:
      "The most precise baseball player who has ever lived. He had a ritual — adjusting his batting gloves, tugging his sleeve, the exact same way, every single time — and it looked like a samurai preparing for battle. Add his Japanese stats and it's 4,300+ hits. He is not human.",
  },
  {
    id: 122493,
    name: "Randy Johnson",
    nickname: "The Big Unit",
    years: "1989–1998",
    stat: "308 K in 1993",
    hof: "2015 · 97.3%",
    blurb:
      "6'10\" of pure, barely-controlled chaos. He once accidentally killed a bird with a fastball. KILLED. A. BIRD. He figured out command around 1993 and became unhittable. Then we traded him. He won a World Series and multiple Cy Youngs after leaving. Nailed it.",
  },
  {
    id: 433587,
    name: "Félix Hernández",
    nickname: "King Felix",
    years: "2005–2019",
    stat: "Perfect game (2012)",
    hof: "Eligible 2025",
    blurb:
      "Gave the best years of his prime to teams that never deserved him. Could've left for a contender a dozen times. Didn't. Threw a perfect game for a team that went 75-87. Won a Cy Young at 13-12. He deserved a World Series ring and got mediocrity in return. We owe him a debt we can't repay.",
  },
];

const MOMENTS = [
  {
    year: "1990",
    title: "Father & Son Back-to-Back",
    icon: "👨‍👦",
    desc: "Ken Griffey Sr. and Ken Griffey Jr. hit back-to-back home runs in the same inning on August 31st. The first and only father-son tandem in MLB history. Sr. hit his, then Jr. stepped up and immediately matched him. An absurd moment in a season of absurd moments.",
  },
  {
    year: "1995",
    title: "The Double",
    icon: "🎯",
    desc: "Game 5. ALDS. 11th inning. Yankees lead the series 2-2. Edgar rips it down the left field line. Cora scores. Griffey rounds third — they're waving him home — he scores standing up. Thousands of Seattleites watched from outside the Kingdome on a Jumbotron. Grown men wept.",
  },
  {
    year: "2001",
    title: "Ichiro's Opening Day Throw",
    icon: "🎯",
    desc: "April 11th, 2001 — Ichiro's first Opening Day. Terrence Long tries to go first-to-third on a single to right. Ichiro catches the ball, plants, and fires a laser to third base from the warning track. Long is out by ten feet. Everyone watching has the same reaction: what the hell was that?",
  },
  {
    year: "2004",
    title: "Ichiro Breaks the Record",
    icon: "📝",
    desc: "Ichiro singles in the first inning against Texas on October 1st for hit #258, tying George Sisler's record. He breaks it in the 3rd with hit #259. He finishes the season with 262. The stadium gives him a standing ovation. The opponent's dugout gives him a standing ovation. Baseball was in awe.",
  },
  {
    year: "2012",
    title: "Felix's Perfect Game",
    icon: "✨",
    desc: "August 15th, 2012. Wednesday afternoon. Felix goes 27 up, 27 down against the Tampa Bay Rays. The King's Court — 3,000 fans in yellow — stands on every pitch. After the final out, Felix collapses to his knees. It is, simply put, one of the greatest individual athletic performances in baseball history.",
  },
  {
    year: "2022",
    title: "Big Dumper Ends the Drought",
    icon: "🎆",
    desc: "September 2nd, 2022. Bottom of the 9th. Tie game. Cal Raleigh works a full count and sends an oak-tree blast to left field. Walk-off. Playoff spot clinched. Twenty-one years of suffering, erased in one swing. Julio Rodriguez is already sprinting toward home plate before the ball lands.",
  },
];

const BAD_TRADES = [
  {
    pain: 10,
    year: "1997",
    title: "The Slocumb Disaster",
    gave: "Derek Lowe + Jason Varitek",
    got: "Heathcliff Slocumb",
    consequence:
      "Derek Lowe won Game 7 of the 2004 World Series for Boston. Jason Varitek captained that dynasty for a decade. Heathcliff Slocumb had a 5.32 ERA as a Mariner. This is widely considered one of the worst trades in baseball history and nothing will convince me otherwise.",
  },
  {
    pain: 10,
    year: "2000",
    title: "Trading The Kid",
    gave: "Ken Griffey Jr.",
    got: "Mike Cameron + 3 prospects",
    consequence:
      "Griffey wanted out. There were ways to keep him. The M's sent the greatest player in franchise history — the player who SAVED baseball in Seattle in 1995 — for Mike Cameron and prospects. We could have kept him. We didn't. We live with that.",
  },
  {
    pain: 8,
    year: "1995",
    title: "Tino to the Yankees",
    gave: "Tino Martinez",
    got: "Sterling Hitchcock + Russ Davis",
    consequence:
      "Tino went on to help the Yankees win four World Series titles. Russ Davis hit .237. Sterling Hitchcock was fine. The Yankees used our guy to build a dynasty while we watched from home every October for 21 years.",
  },
  {
    pain: 8,
    year: "1998",
    title: "Dumping Randy Johnson",
    gave: "Randy Johnson",
    got: "Freddy Garcia + Carlos Guillen + John Halama",
    consequence:
      "Randy went to Houston, then Arizona, where he won the World Series and another Cy Young. Garcia was genuinely good — maybe this one's not as bad. Still, trading a future Hall of Famer is never ideal. Freddy Garcia wasn't Randy Johnson. Nobody was.",
  },
  {
    pain: 7,
    year: "2004",
    title: "Carlos Guillen for Ramon Santiago",
    gave: "Carlos Guillen",
    got: "Ramon Santiago",
    consequence:
      "Guillen became a perennial All-Star in Detroit. Santiago was... a backup infielder. At the time it seemed like cap flexibility. In retrospect, another guy who got better after we let him go.",
  },
];

const WTF_FACTS = [
  "The Seattle Pilots lasted exactly ONE season (1969) before the owner declared bankruptcy and sold them to Bud Selig, who moved them to Milwaukee overnight.",
  "The Mariners' name was chosen from 15,000 fan submissions in 1976. The runner-up was 'Studs.' We narrowly avoided being the Seattle Studs.",
  "In 1990, Griffey Sr. and Jr. hit back-to-back home runs in the same inning — the first and only time in MLB history. Junior was 20.",
  "Felix Hernández won the 2010 Cy Young Award with a 13-12 record — still the worst winning percentage for any Cy Young winner in history. The BBWAA finally admitted ERA mattered more than wins.",
  "The Mariners traded Jason Varitek and Derek Lowe for Heathcliff Slocumb. Varitek's career OPS: .757. Slocumb's ERA as a Mariner: 5.32.",
  "Ichiro's 262 hits in 2004 broke a record set by George Sisler in 1920 — 84 years earlier. The team around him lost 99 games that year.",
  "The 2001 Mariners won 116 games — tying the 1906 Cubs for the all-time record. They still didn't make the World Series. The Yankees beat them. Classic.",
  "Randy Johnson killed a bird mid-pitch during a spring training game in 2001. The bird vaporized on contact. The pitch was ruled a ball.",
  "Julio Rodríguez was less than a year old the last time the Mariners made the playoffs before 2022 — which was in 2001. The entire drought is essentially his conscious lifetime.",
  "Felix Hernández threw his perfect game for a team that went 75-87. The King's Court section wore yellow in the bleachers and held up a giant 'K' card for every strikeout. It remains one of the most iconic baseball atmospheres ever filmed.",
  "The Mariners have never appeared in a World Series in 49 years of existence — the only current MLB franchise that has never played in one. The Rockies at least made it in 2007.",
  "Griffey's signature 'Ken Griffey Jr. Presents Major League Baseball' on Sega was the #1 selling sports game of 1994. The man was a franchise within a franchise.",
];

const VIBECONFIG: Record<Vibe, { dot: string; card: string; label: string }> = {
  legendary: {
    dot: "bg-yellow-400",
    card: "border-yellow-400/30 bg-yellow-400/5",
    label: "LEGENDARY",
  },
  good: {
    dot: "bg-green-400",
    card: "border-green-400/20 bg-green-400/5",
    label: "GOOD TIMES",
  },
  bad: {
    dot: "bg-red-400",
    card: "border-red-400/20 bg-red-400/5",
    label: "PAIN",
  },
  cursed: {
    dot: "bg-purple-400",
    card: "border-purple-400/20 bg-purple-400/5",
    label: "CURSED",
  },
  neutral: {
    dot: "bg-blue-400",
    card: "border-blue-400/20 bg-blue-400/5",
    label: "HAPPENED",
  },
};

function PainMeter({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-2 w-2 rounded-full transition-colors",
            i < level ? "bg-red-500" : "bg-surface-2"
          )}
        />
      ))}
      <span className="text-[10px] text-red-400 ml-1 font-bold">{level}/10</span>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-black text-primary tracking-tight">{title}</h2>
      {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
    </div>
  );
}

interface HistoryStaticContentProps {
  chaseBarsSlot: React.ReactNode;
  onThisDaySlot: React.ReactNode;
  droughtRibbonSlot: React.ReactNode;
  h2hMatrixSlot: React.ReactNode;
}

export function HistoryStaticContent({
  chaseBarsSlot,
  onThisDaySlot,
  droughtRibbonSlot,
  h2hMatrixSlot,
}: HistoryStaticContentProps) {
  const heroReveal = useReveal(0.05);
  const statsReveal = useReveal(0.1);

  return (
    <div className="space-y-24 pb-16">
      <div
        ref={heroReveal.ref}
        className={cn(
          "relative -mx-4 sm:-mx-6 px-4 sm:px-6 py-16 sm:py-24 overflow-hidden transition-all duration-1000",
          heroReveal.visible ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-teal/10 via-bg-deep to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,163,163,0.15),transparent_70%)] pointer-events-none" />

        <div className="relative text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-teal border border-teal/30 rounded-full bg-teal/5 mb-4">
            Est. 1977 · Seattle, WA
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-primary leading-none tracking-tighter">
            49 Years.
            <br />
            <span className="text-teal">0 World Series.</span>
            <br />
            Still Here.
          </h1>
          <p className="text-lg text-secondary max-w-xl mx-auto leading-relaxed">
            The complete, unfiltered, deeply therapeutic history of the Seattle Mariners — told the way you&apos;d tell it to your buddies at the bar after your third beer.
          </p>
          <p className="text-xs text-muted italic">
            (Warning: may contain adult language, unresolved trauma, and a lot of Griffey)
          </p>
        </div>
      </div>

      {/* ── NEW: Chase Bars ──────────────────────────────────────────────── */}
      <div>
        <RevealSection>
          <SectionHeader
            title="Chasing the Records"
            subtitle="Every line on the franchise leaderboard, and the active Mariner closest to it"
          />
        </RevealSection>
        <RevealSection delay={80}>{chaseBarsSlot}</RevealSection>
      </div>

      <div ref={statsReveal.ref}>
        <RevealSection>
          <SectionHeader title="By The Numbers" subtitle="The facts, presented without mercy" />
        </RevealSection>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {BIG_STATS.map((s, i) => (
            <RevealSection key={s.label} delay={i * 60}>
              <div className="trident-card p-5 text-center group hover:border-teal/30 transition-colors">
                <div className="text-3xl font-black stat-number text-teal">
                  {statsReveal.visible ? (
                    <CountingNumber
                      value={s.value}
                      suffix={s.suffix}
                      decimals={s.decimals}
                      duration={1200}
                    />
                  ) : (
                    <span>0{s.suffix}</span>
                  )}
                </div>
                <p className="text-[10px] uppercase tracking-widest text-muted mt-1 font-semibold">
                  {s.label}
                </p>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>

      {/* ── NEW: On This Day ─────────────────────────────────────────────── */}
      <div>
        <RevealSection>{onThisDaySlot}</RevealSection>
      </div>

      <div>
        <RevealSection>
          <SectionHeader title="The Legends" subtitle="Five players. One franchise. No World Series rings." />
        </RevealSection>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {LEGENDS.map((legend, i) => (
            <RevealSection key={legend.id} delay={i * 80}>
              <div className="trident-card p-5 h-full border-gold/10 hover:border-gold/25 transition-all duration-200">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-surface-2 border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${legend.id}/headshot/67/current`}
                      alt={legend.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-primary text-sm leading-tight">{legend.name}</p>
                    <p className="text-[10px] text-teal font-bold uppercase tracking-widest mt-0.5">
                      {legend.nickname}
                    </p>
                    <p className="text-[10px] text-muted mt-1">{legend.years}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border/50">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-lg font-black stat-number text-gold">{legend.stat}</span>
                  </div>
                  <p className="text-xs text-secondary leading-relaxed">{legend.blurb}</p>
                  {legend.hof && (
                    <div className="mt-2 inline-block text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-gold/10 border border-gold/30 text-gold">
                      HOF {legend.hof}
                    </div>
                  )}
                </div>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>

      <TridentDivider />

      <div>
        <RevealSection>
          <SectionHeader
            title="The Full Timeline"
            subtitle="From lawsuit baby to legitimate contender — the complete journey"
          />
        </RevealSection>

        <div className="relative">
          <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-px bg-border sm:-translate-x-px" />

          <div className="space-y-8">
            {TIMELINE.map((item, i) => {
              const vc = VIBECONFIG[item.vibe];
              const isRight = i % 2 === 0;
              return (
                <RevealSection key={`${item.year}-${i}`} delay={0}>
                  <div
                    className={cn(
                      "relative flex items-start gap-6 sm:gap-0",
                      isRight ? "sm:flex-row" : "sm:flex-row-reverse"
                    )}
                  >
                    <div
                      className="absolute left-4 sm:left-1/2 top-3 w-3 h-3 rounded-full border-2 border-bg-deep sm:-translate-x-1.5 -translate-x-1.5 z-10 flex-shrink-0"
                    >
                      <div className={cn("w-full h-full rounded-full", vc.dot)} />
                    </div>

                    <div
                      className={cn(
                        "ml-10 sm:ml-0 sm:w-[calc(50%-2rem)]",
                        isRight ? "sm:pr-8 sm:text-right" : "sm:pl-8 sm:text-left"
                      )}
                    >
                      <div className={cn("trident-card p-4 border transition-colors", vc.card)}>
                        <div
                          className={cn(
                            "flex items-center gap-2 mb-2",
                            isRight ? "sm:flex-row-reverse sm:justify-start" : ""
                          )}
                        >
                          <span className="text-xl">{item.icon}</span>
                          <div>
                            <span className="text-xs font-black text-teal">{item.year}</span>
                            <span className="text-[9px] text-muted ml-2 uppercase tracking-widest font-bold">
                              {vc.label}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs font-black text-primary mb-1">{item.era}</p>
                        <p className="text-xs text-secondary leading-relaxed">{item.text}</p>
                        {item.playerId && (
                          <Link
                            href={`/players/${item.playerId}`}
                            className="inline-block mt-2 text-[10px] text-teal hover:text-teal/70 font-bold underline underline-offset-2 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View Player →
                          </Link>
                        )}
                      </div>
                    </div>

                    <div className="hidden sm:block sm:w-[calc(50%-2rem)]" />
                  </div>
                </RevealSection>
              );
            })}
          </div>
        </div>
      </div>

      <TridentDivider />

      <div>
        <RevealSection>
          <SectionHeader title="The Moments" subtitle="The plays you still see when you close your eyes" />
        </RevealSection>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {MOMENTS.map((moment, i) => (
            <RevealSection key={moment.title} delay={i * 60}>
              <div className="trident-card p-5 h-full hover:border-gold/30 transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-3xl">{moment.icon}</span>
                  <div>
                    <p className="text-[10px] font-bold text-gold uppercase tracking-widest">{moment.year}</p>
                    <p className="font-black text-primary text-sm leading-tight">{moment.title}</p>
                  </div>
                </div>
                <p className="text-xs text-secondary leading-relaxed">{moment.desc}</p>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>

      {/* ── NEW: Drought Ribbon ──────────────────────────────────────────── */}
      <div>
        <RevealSection>
          <SectionHeader
            title="The Drought, Visualized"
            subtitle="2001 to 2022. Eight World Series winners we watched from the couch."
          />
        </RevealSection>
        <RevealSection delay={80}>
          <div className="trident-card p-6 border-purple-500/20 bg-purple-500/[0.03]">
            {droughtRibbonSlot}
          </div>
        </RevealSection>
      </div>

      <RevealSection>
        <div className="trident-card p-8 border-purple-500/30 bg-purple-500/5 text-center space-y-4">
          <div className="text-5xl mb-2">🏜️</div>
          <h2 className="text-2xl font-black text-primary">The Drought</h2>
          <p className="text-4xl font-black text-purple-400">2001 – 2022</p>
          <p className="text-base text-secondary max-w-2xl mx-auto leading-relaxed">
            Twenty-one years. No postseason. While the Red Sox ended their 86-year curse, while the Cubs ended their 108-year curse, the Mariners quietly set a different kind of record: the longest active playoff drought in North American professional sports.
          </p>
          <p className="text-sm text-muted max-w-xl mx-auto italic">
            Some seasons were good. Several were genuinely exciting. All of them ended the same way. September baseball meant watching someone else go to the playoffs while we went home and watched the leaves change.
          </p>
          <div className="inline-block px-4 py-2 rounded-xl bg-surface border border-purple-400/20 text-purple-300 text-sm font-bold">
            Ended September 2nd, 2022 · Cal Raleigh Walk-Off HR
          </div>
        </div>
      </RevealSection>

      <div>
        <RevealSection>
          <SectionHeader
            title="Front Office Hall of Shame"
            subtitle="The trades that haunt our dreams. Presented with love, regret, and pain ratings."
          />
        </RevealSection>
        <div className="space-y-4">
          {BAD_TRADES.map((trade, i) => (
            <RevealSection key={trade.title} delay={i * 60}>
              <div className="trident-card p-5 border-red-500/20 hover:border-red-500/30 transition-colors">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                  <div>
                    <span className="text-[10px] text-muted font-bold uppercase tracking-widest">{trade.year}</span>
                    <h3 className="font-black text-primary text-sm">{trade.title}</h3>
                  </div>
                  <PainMeter level={trade.pain} />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="p-3 bg-red-500/5 rounded-lg border border-red-500/20">
                    <p className="text-[9px] text-red-400 uppercase tracking-widest font-bold mb-1">We Gave</p>
                    <p className="text-xs font-bold text-primary">{trade.gave}</p>
                  </div>
                  <div className="p-3 bg-surface-2/60 rounded-lg border border-border">
                    <p className="text-[9px] text-muted uppercase tracking-widest font-bold mb-1">We Got</p>
                    <p className="text-xs font-bold text-secondary">{trade.got}</p>
                  </div>
                </div>
                <p className="text-xs text-muted leading-relaxed italic">{trade.consequence}</p>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>

      <TridentDivider />

      {/* ── NEW: H2H Matrix ──────────────────────────────────────────────── */}
      <div>
        <RevealSection>
          <SectionHeader
            title="Franchise Head-to-Head"
            subtitle="Mariners vs every other franchise. Hover-zoom on the ones you have a problem with."
          />
        </RevealSection>
        <RevealSection delay={80}>{h2hMatrixSlot}</RevealSection>
      </div>

      <div>
        <RevealSection>
          <SectionHeader title="Wait, What?" subtitle="Facts so absurd they feel made up. They are not." />
        </RevealSection>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {WTF_FACTS.map((fact, i) => (
            <RevealSection key={i} delay={i * 40}>
              <div className="trident-card p-4 hover:border-teal/20 transition-colors flex items-start gap-3">
                <span className="text-teal font-black text-lg flex-shrink-0 mt-0.5 leading-none">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-xs text-secondary leading-relaxed">{fact}</p>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>

      <div>
        <RevealSection>
          <SectionHeader
            title="Hall of Famers"
            subtitle="The men who wore a Mariners uniform and made it to Cooperstown"
          />
        </RevealSection>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { imgId: 116338, name: "Ken Griffey Jr.", inducted: 2016, pct: "99.3%" },
            { imgId: 118800, name: "Edgar Martinez", inducted: 2019, pct: "85.4%" },
            { imgId: 400085, name: "Ichiro Suzuki", inducted: 2025, pct: "99.7%" },
            { imgId: 122493, name: "Randy Johnson", inducted: 2015, pct: "97.3%" },
            { imgId: null, name: "Gaylord Perry", inducted: 1991, pct: "77.2%", note: "Won 300th game as a Mariner" },
          ].map((hof, i) => (
            <RevealSection key={hof.name} delay={i * 70}>
              <div className="trident-card p-4 text-center border-gold/20 bg-gold/5 h-full">
                {hof.imgId ? (
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-surface-2 border-2 border-gold/30 mx-auto mb-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${hof.imgId}/headshot/67/current`}
                      alt={hof.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-full bg-surface-2 border-2 border-gold/30 mx-auto mb-3 flex items-center justify-center">
                    <span className="text-gold text-xl">🏛️</span>
                  </div>
                )}
                <p className="font-black text-primary text-xs leading-tight">{hof.name}</p>
                <p className="text-[9px] text-gold font-bold mt-1">Class of {hof.inducted}</p>
                <p className="text-[9px] text-muted mt-0.5">{hof.pct} of vote</p>
                {"note" in hof && hof.note && (
                  <p className="text-[8px] text-muted/70 mt-1 italic leading-snug">{hof.note}</p>
                )}
              </div>
            </RevealSection>
          ))}
        </div>
      </div>

      <RevealSection>
        <div className="trident-card p-8 text-center space-y-4 border-teal/20 bg-teal/5">
          <div className="text-4xl">🔱</div>
          <h2 className="text-xl font-black text-primary">The Next Chapter</h2>
          <p className="text-sm text-secondary max-w-xl mx-auto leading-relaxed">
            Julio Rodríguez is 24 years old. The rotation is one of the best in baseball. T-Mobile Park is loud again. The drought is over. We&apos;ve been hurt before — many, many times — but the Mariners are building something real. Probably. We&apos;re cautiously optimistic. Don&apos;t push us.
          </p>
          <Link
            href="/roster"
            className="inline-block px-6 py-2.5 bg-teal text-white text-sm font-bold rounded-xl hover:bg-teal/80 transition-colors"
          >
            Meet the Current Roster →
          </Link>
        </div>
      </RevealSection>

      <TridentDivider />

      <p className="text-[11px] text-muted text-center">
        Seattle Mariners franchise history, 1977–2025 · Stats from MLB Stats API · No World Series appearances on record
      </p>
    </div>
  );
}
