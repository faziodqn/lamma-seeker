import Lamma from './Lamma.jsx';

export default function Scene({ mood, message }) {
  return (
    <header className="scene">
      <div className="sun" />
      {[0, 1, 2].map((i) => <div key={i} className={`cloud c${i}`} />)}
      <div className="hill h1" /><div className="hill h2" />
      {['🌼', '🌸', '🌷', '🌼', '🌸'].map((f, i) => <span key={i} className={`flower f${i}`}>{f}</span>)}
      {mood === 'party' && Array.from({ length: 18 }).map((_, i) => <i key={i} className="confetti" style={{ '--i': i }} />)}
      <div className="lamma-wrap"><Lamma mood={mood} size={190} /></div>
      <div className="bubble"><b>Lamma Course Seeker</b><span>{message}</span></div>
    </header>
  );
}
