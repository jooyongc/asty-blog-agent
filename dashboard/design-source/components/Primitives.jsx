// Reusable primitives: Chip, Metric, Sparkline, ProgressBar, AgentAvatar, Toggle, Avatar placeholder
const { useState, useEffect, useMemo, useRef } = React;

const AgentAvatar = ({ agent, size=22 }) => {
  const letter = ({director:'D',seo:'S',writer:'W',verifier:'V',translate:'T',glossary:'G',packager:'P',linker:'L',image:'I',publish:'P'})[agent] || '?';
  return <div className={`agent-avatar agent-avatar--${agent}`} style={{width:size,height:size,fontSize:size*0.48}}>{letter}</div>;
};

const Chip = ({children, kind='ghost', dot=false, ...p}) => (
  <span className={`chip chip--${kind}`} {...p}>
    {dot && <span className="chip__dot"/>}
    {children}
  </span>
);

const LangChip = ({lang, on=true, small=false}) => {
  const label = {en:'EN', ja:'JA', zh:'ZH'}[lang];
  return <Chip kind={on?lang:'ghost'} style={small?{fontSize:10,padding:'1px 6px'}:null}>{label}</Chip>;
};

const Toggle = ({on, onChange}) => (
  <div className={`toggle ${on?'toggle--on':''}`} onClick={()=>onChange&&onChange(!on)} role="switch" aria-checked={on}/>
);

const Metric = ({label, value, unit, delta, deltaKind, icon, bar}) => (
  <div className="metric">
    <div className="metric__label">{icon}{label}</div>
    <div className="metric__value">{value}{unit && <small> {unit}</small>}</div>
    {delta && <div className={`metric__delta ${deltaKind==='ok'?'metric__delta--ok':deltaKind==='warn'?'metric__delta--warn':''}`}>{delta}</div>}
    {bar !== undefined && (
      <div className="metric__bar"><div className="metric__bar-fill" style={{width:`${Math.min(100,bar*100)}%`}}/></div>
    )}
  </div>
);

// Sparkline — simple polyline
const Sparkline = ({data, color='var(--accent)', height=48, fill=true}) => {
  if(!data || !data.length) return null;
  const max = Math.max(...data, 0.1);
  const min = Math.min(...data, 0);
  const W = 200, H = height;
  const range = max - min || 1;
  const pts = data.map((v,i)=>{
    const x = (i/(data.length-1))*W;
    const y = H - ((v-min)/range)*(H-6) - 3;
    return [x,y];
  });
  const path = pts.map((p,i)=> (i===0?'M':'L')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  const area = path + ` L ${W} ${H} L 0 ${H} Z`;
  return (
    <svg className="sparkline" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      {fill && <path d={area} fill={color} opacity="0.1"/>}
      <path d={path} fill="none" stroke={color} strokeWidth="1.5"/>
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="2.5" fill={color}/>
    </svg>
  );
};

// Multi-segment progress bar — accepts [{value, color}]
const ProgressBar = ({segments, total, height=6}) => {
  return (
    <div className="progress" style={{height}}>
      {segments.map((s,i)=>(
        <div key={i} className="progress__seg" style={{width:`${(s.value/total)*100}%`,background:s.color}}/>
      ))}
    </div>
  );
};

// Segmented control
const Segmented = ({options, value, onChange}) => (
  <div className="seg">
    {options.map(o=>(
      <button key={o.value} className={value===o.value?'active':''} onClick={()=>onChange(o.value)}>{o.label}</button>
    ))}
  </div>
);

// Tabs
const Tabs = ({tabs, value, onChange}) => (
  <div className="tabs">
    {tabs.map(t=>(
      <button key={t.value} className={value===t.value?'active':''} onClick={()=>onChange(t.value)}>
        {t.label}{t.count!==undefined && <span className="muted" style={{marginLeft:6,fontVariantNumeric:'tabular-nums'}}>{t.count}</span>}
      </button>
    ))}
  </div>
);

// Simple hero placeholder — abstract cabin/nature scene (no illustrations from scratch, just color blocks)
const HeroPlaceholder = ({kind='pine', label, height=120}) => {
  const palettes = {
    pine:   ['#2f6f4e','#4c8466','#8fa598'],
    snow:   ['#a6bacc','#d6dee6','#f0f3f7'],
    harvest:['#b66f1c','#d89a55','#eac58b'],
  };
  const [c1,c2,c3] = palettes[kind] || palettes.pine;
  return (
    <div style={{
      height: typeof height==='number'?height:'100%',
      minHeight: 60,
      borderRadius:'10px',
      background:`linear-gradient(160deg, ${c1} 0%, ${c2} 55%, ${c3} 100%)`,
      position:'relative',overflow:'hidden',
      display:'flex',alignItems:'flex-end',padding:'10px 12px',
    }}>
      {/* Abstract mountain silhouettes */}
      <svg viewBox="0 0 200 80" style={{position:'absolute',bottom:0,left:0,width:'100%',height:'70%',opacity:.35}} preserveAspectRatio="none">
        <path d="M0 80 L30 40 L55 60 L85 25 L120 55 L150 30 L180 50 L200 35 L200 80 Z" fill={c1}/>
        <path d="M0 80 L25 60 L55 70 L90 50 L120 72 L155 55 L190 70 L200 65 L200 80 Z" fill="rgba(0,0,0,0.25)"/>
      </svg>
      {label && <div style={{position:'relative',color:'#fff',fontSize:11,fontWeight:500,opacity:.9,textShadow:'0 1px 2px rgba(0,0,0,0.2)'}}>{label}</div>}
    </div>
  );
};

// Cost donut — budget used
const CostDonut = ({spent, budget, size=140}) => {
  const pct = Math.min(1, spent/budget);
  const R = size/2 - 10;
  const C = 2*Math.PI*R;
  const color = pct < 0.7 ? 'var(--ok)' : pct < 0.9 ? 'var(--warn)' : 'var(--err)';
  return (
    <div style={{position:'relative',width:size,height:size}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={R} fill="none" stroke="var(--line)" strokeWidth="10"/>
        <circle cx={size/2} cy={size/2} r={R} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${C*pct} ${C}`}
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{transition:'stroke-dasharray .6s ease'}}/>
      </svg>
      <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
        <div style={{fontSize:22,fontWeight:600,letterSpacing:'-0.02em',fontVariantNumeric:'tabular-nums'}}>${spent.toFixed(2)}</div>
        <div style={{fontSize:11,color:'var(--text-3)'}}>of ${budget.toFixed(2)}</div>
      </div>
    </div>
  );
};

Object.assign(window, { AgentAvatar, Chip, LangChip, Toggle, Metric, Sparkline, ProgressBar, Segmented, Tabs, HeroPlaceholder, CostDonut });
