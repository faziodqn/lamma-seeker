// mood: 'idle' | 'search' | 'party' | 'sad'
export default function Lamma({ mood = 'idle', size = 200 }) {
  return (
    <svg className={`lamma ${mood}`} width={size} height={size * 1.15} viewBox="0 0 200 230" role="img" aria-label="Lamma the llama">
      <ellipse className="shadow" cx="100" cy="222" rx="55" ry="7" fill="#000" opacity=".12" />
      <g className="body-bob">
        {/* tail */}
        <path className="tail" d="M150 150 q22 -6 20 -26 q-14 6 -22 16z" fill="#f4e3c8" />
        {/* legs */}
        <rect x="68" y="170" width="14" height="46" rx="7" fill="#f4e3c8" />
        <rect x="92" y="172" width="14" height="44" rx="7" fill="#ead2ab" />
        <rect x="116" y="170" width="14" height="46" rx="7" fill="#f4e3c8" />
        {/* body */}
        <ellipse cx="100" cy="150" rx="58" ry="40" fill="#fbeed9" />
        <g fill="#f4e3c8"><circle cx="70" cy="138" r="16" /><circle cx="96" cy="128" r="18" /><circle cx="126" cy="138" r="16" /><circle cx="82" cy="160" r="14" /><circle cx="116" cy="160" r="14" /></g>
        {/* blanket */}
        <path d="M60 130 q40 -22 80 0 l-4 20 q-36 -16 -72 0z" fill="#ff8fb1" />
        <path d="M60 130 q40 -22 80 0" stroke="#ffd166" strokeWidth="4" fill="none" strokeDasharray="6 5" />
        {/* neck */}
        <g className="head-move">
          <rect x="62" y="64" width="34" height="84" rx="17" fill="#fbeed9" />
          {/* ears */}
          <g className="ear-l"><path d="M58 40 q-8 -26 6 -30 q10 6 8 30z" fill="#fbeed9" /><path d="M62 36 q-4 -16 3 -20 q5 5 4 20z" fill="#ffb3c7" /></g>
          <g className="ear-r"><path d="M92 40 q8 -26 -6 -30 q-10 6 -8 30z" fill="#fbeed9" /><path d="M88 36 q4 -16 -3 -20 q-5 5 -4 20z" fill="#ffb3c7" /></g>
          {/* head */}
          <ellipse cx="76" cy="62" rx="32" ry="30" fill="#fbeed9" />
          <path d="M52 44 q24 -22 48 0 q-10 -4 -24 -4 q-14 0 -24 4z" fill="#f4e3c8" />
          {/* muzzle */}
          <ellipse cx="82" cy="74" rx="18" ry="13" fill="#fff6e8" />
          <ellipse cx="86" cy="69" rx="4" ry="3" fill="#c98a6b" />
          <path className="mouth" d="M78 78 q6 6 12 0" stroke="#c98a6b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* eyes */}
          <g className="eye"><ellipse cx="66" cy="58" rx="6" ry="7" fill="#3b2a2a" /><circle cx="68" cy="55" r="2.4" fill="#fff" /></g>
          <g className="eye"><ellipse cx="90" cy="58" rx="6" ry="7" fill="#3b2a2a" /><circle cx="92" cy="55" r="2.4" fill="#fff" /></g>
          <ellipse cx="58" cy="70" rx="6" ry="4" fill="#ff9db9" opacity=".6" />
          <ellipse cx="98" cy="70" rx="6" ry="4" fill="#ff9db9" opacity=".6" />
          {/* flower crown */}
          <g className="crown"><circle cx="58" cy="36" r="5" fill="#ffd166" /><circle cx="76" cy="31" r="6" fill="#ff8fb1" /><circle cx="94" cy="36" r="5" fill="#a0e7e5" /></g>
          {mood === 'search' && <g className="grass"><path d="M96 82 q4 -12 8 -2 M102 84 q5 -12 8 -1 M92 84 q2 -10 6 -1" stroke="#6bbf59" strokeWidth="3" fill="none" strokeLinecap="round" /></g>}
          {mood === 'sad' && <path className="tear" d="M62 66 q-3 6 0 8 q3 -2 0 -8z" fill="#7ac7ff" />}
        </g>
      </g>
    </svg>
  );
}
