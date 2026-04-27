export interface H2HTeamMeta {
  id: number;
  abbrev: string;
  name: string;
  league: "AL" | "NL";
  division: "East" | "Central" | "West";
}

export const FRANCHISE_OPPONENTS: H2HTeamMeta[] = [
  { id: 117, abbrev: "HOU", name: "Astros", league: "AL", division: "West" },
  { id: 140, abbrev: "TEX", name: "Rangers", league: "AL", division: "West" },
  { id: 108, abbrev: "LAA", name: "Angels", league: "AL", division: "West" },
  { id: 133, abbrev: "ATH", name: "Athletics", league: "AL", division: "West" },
  { id: 110, abbrev: "BAL", name: "Orioles", league: "AL", division: "East" },
  { id: 111, abbrev: "BOS", name: "Red Sox", league: "AL", division: "East" },
  { id: 147, abbrev: "NYY", name: "Yankees", league: "AL", division: "East" },
  { id: 139, abbrev: "TB", name: "Rays", league: "AL", division: "East" },
  { id: 141, abbrev: "TOR", name: "Blue Jays", league: "AL", division: "East" },
  { id: 145, abbrev: "CWS", name: "White Sox", league: "AL", division: "Central" },
  { id: 114, abbrev: "CLE", name: "Guardians", league: "AL", division: "Central" },
  { id: 116, abbrev: "DET", name: "Tigers", league: "AL", division: "Central" },
  { id: 118, abbrev: "KC", name: "Royals", league: "AL", division: "Central" },
  { id: 142, abbrev: "MIN", name: "Twins", league: "AL", division: "Central" },
  { id: 109, abbrev: "ARI", name: "D-backs", league: "NL", division: "West" },
  { id: 115, abbrev: "COL", name: "Rockies", league: "NL", division: "West" },
  { id: 119, abbrev: "LAD", name: "Dodgers", league: "NL", division: "West" },
  { id: 135, abbrev: "SD", name: "Padres", league: "NL", division: "West" },
  { id: 137, abbrev: "SF", name: "Giants", league: "NL", division: "West" },
  { id: 144, abbrev: "ATL", name: "Braves", league: "NL", division: "East" },
  { id: 146, abbrev: "MIA", name: "Marlins", league: "NL", division: "East" },
  { id: 121, abbrev: "NYM", name: "Mets", league: "NL", division: "East" },
  { id: 143, abbrev: "PHI", name: "Phillies", league: "NL", division: "East" },
  { id: 120, abbrev: "WSH", name: "Nationals", league: "NL", division: "East" },
  { id: 112, abbrev: "CHC", name: "Cubs", league: "NL", division: "Central" },
  { id: 113, abbrev: "CIN", name: "Reds", league: "NL", division: "Central" },
  { id: 158, abbrev: "MIL", name: "Brewers", league: "NL", division: "Central" },
  { id: 134, abbrev: "PIT", name: "Pirates", league: "NL", division: "Central" },
  { id: 138, abbrev: "STL", name: "Cardinals", league: "NL", division: "Central" },
];
