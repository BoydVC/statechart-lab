export function posterArt(scene: string): string {
  if (scene === "play-clock") return playClock();
  if (scene === "replay") return replay();
  if (scene === "bus") return bus();
  if (scene === "booster") return booster();
  return assignment();
}

function playClock(): string {
  return `<svg class="art" viewBox="0 0 360 220" role="img" aria-label="A football field at night with a play clock">
    <rect width="360" height="220" fill="#10233f"/>
    <circle cx="300" cy="36" r="18" fill="#f2d48a"/>
    <rect x="20" y="78" width="320" height="120" rx="8" fill="#1f7a45"/>
    <g stroke="#e7f6e4" stroke-width="2" opacity="0.85">
      <line x1="20" y1="98" x2="340" y2="98"/>
      <line x1="20" y1="138" x2="340" y2="138"/>
      <line x1="20" y1="178" x2="340" y2="178"/>
      <line x1="70" y1="78" x2="70" y2="198"/>
      <line x1="180" y1="78" x2="180" y2="198"/>
      <line x1="290" y1="78" x2="290" y2="198"/>
    </g>
    <ellipse cx="168" cy="138" rx="16" ry="10" fill="#8b4518" transform="rotate(-20 168 138)"/>
    <circle cx="286" cy="46" r="28" fill="#0d1b30" stroke="#f0c14a" stroke-width="4"/>
    <text x="286" y="52" text-anchor="middle" font-size="16" font-family="Georgia, serif" fill="#f0c14a">:12</text>
  </svg>`;
}

function replay(): string {
  return `<svg class="art" viewBox="0 0 360 220" role="img" aria-label="A baseball diamond and one challenge flag">
    <rect width="360" height="220" fill="#d7eccf"/>
    <polygon points="180,36 300,150 180,200 60,150" fill="#2f8f4e"/>
    <polygon points="180,78 250,150 180,186 110,150" fill="#c4a574"/>
    <circle cx="180" cy="168" r="7" fill="#f7f1e4"/>
    <circle cx="180" cy="96" r="6" fill="#f7f1e4"/>
    <circle cx="128" cy="140" r="6" fill="#f7f1e4"/>
    <circle cx="232" cy="140" r="6" fill="#f7f1e4"/>
    <line x1="250" y1="150" x2="250" y2="48" stroke="#241c14" stroke-width="3"/>
    <polygon points="250,48 302,62 250,78" fill="#c44536"/>
    <text x="40" y="40" font-size="14" font-family="Georgia, serif" fill="#241c14">one flag</text>
  </svg>`;
}

function bus(): string {
  return `<svg class="art" viewBox="0 0 360 220" role="img" aria-label="A yellow school bus on a morning street">
    <rect width="360" height="220" fill="#f6e2b3"/>
    <circle cx="64" cy="48" r="22" fill="#f2b544"/>
    <rect x="0" y="168" width="360" height="52" fill="#6d7278"/>
    <rect x="0" y="164" width="360" height="6" fill="#d7d2c8"/>
    <g>
      <rect x="78" y="92" width="190" height="70" rx="10" fill="#f2c200" stroke="#241c14" stroke-width="3"/>
      <rect x="92" y="104" width="36" height="24" fill="#d6f3ff" stroke="#241c14"/>
      <rect x="136" y="104" width="36" height="24" fill="#d6f3ff" stroke="#241c14"/>
      <rect x="180" y="104" width="36" height="24" fill="#d6f3ff" stroke="#241c14"/>
      <rect x="224" y="104" width="28" height="40" fill="#efe6c8" stroke="#241c14"/>
      <circle cx="120" cy="166" r="14" fill="#241c14"/>
      <circle cx="220" cy="166" r="14" fill="#241c14"/>
      <circle cx="120" cy="166" r="6" fill="#c9c2b6"/>
      <circle cx="220" cy="166" r="6" fill="#c9c2b6"/>
    </g>
    <polygon points="300,150 324,150 336,126 312,110 300,126" fill="#c44536" stroke="#241c14" stroke-width="2"/>
    <text x="318" y="142" text-anchor="middle" font-size="8" font-family="ui-sans-serif, sans-serif" fill="#fffaf1">STOP</text>
  </svg>`;
}

function booster(): string {
  return `<svg class="art" viewBox="0 0 360 220" role="img" aria-label="A tower with open arms and a booster">
    <rect width="360" height="220" fill="#1b2438"/>
    <rect x="0" y="188" width="360" height="32" fill="#2a2118"/>
    <rect x="168" y="40" width="24" height="150" fill="#8d97a8"/>
    <rect x="70" y="78" width="90" height="14" rx="4" fill="#d7deea"/>
    <rect x="200" y="78" width="90" height="14" rx="4" fill="#d7deea"/>
    <rect x="150" y="118" width="16" height="62" rx="6" fill="#f4f7fb" stroke="#9aa3b2"/>
    <polygon points="150,118 166,118 158,104" fill="#e15a3a"/>
    <polygon points="154,180 162,180 166,198 150,198" fill="#f0c14a"/>
    <circle cx="48" cy="36" r="2" fill="#f7f1e4"/>
    <circle cx="300" cy="28" r="2" fill="#f7f1e4"/>
    <circle cx="320" cy="70" r="1.6" fill="#f7f1e4"/>
  </svg>`;
}

function assignment(): string {
  return `<svg class="art" viewBox="0 0 360 220" role="img" aria-label="Three homework pages stamped missing, turned in, and graded">
    <rect width="360" height="220" fill="#f3e6cf"/>
    <g transform="rotate(-8 90 120)">
      <rect x="36" y="48" width="86" height="112" rx="4" fill="#fffaf1" stroke="#241c14"/>
      <text x="79" y="108" text-anchor="middle" font-size="11" font-family="ui-sans-serif, sans-serif" fill="#a33b32">MISSING</text>
    </g>
    <g transform="rotate(3 180 120)">
      <rect x="136" y="42" width="86" height="112" rx="4" fill="#fffaf1" stroke="#241c14"/>
      <text x="179" y="102" text-anchor="middle" font-size="11" font-family="ui-sans-serif, sans-serif" fill="#3d5a45">TURNED IN</text>
    </g>
    <g transform="rotate(7 270 120)">
      <rect x="230" y="50" width="86" height="112" rx="4" fill="#fffaf1" stroke="#241c14"/>
      <text x="273" y="110" text-anchor="middle" font-size="12" font-family="ui-sans-serif, sans-serif" fill="#c47b2b">GRADED</text>
    </g>
  </svg>`;
}
