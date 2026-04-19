// AgentFlow page — live node graph of writer→translate→glossary→packager→image→publish
const AgentFlow = () => {
  const D = window.BLOG_DATA;
  const [stageIdx, setStageIdx] = React.useState(2); // currently on glossary
  const [logs, setLogs] = React.useState([]);
  const [playing, setPlaying] = React.useState(true);
  const [streamText, setStreamText] = React.useState('');
  const logRef = React.useRef(null);

  // Node positions on a left-to-right canvas (responsive via % / viewBox)
  const NODES = [
    { id:'writer',    agent:'writer',    label:'writer',    sub:'Haiku 4.5',  x:60,  y:160 },
    { id:'translate', agent:'translate', label:'translate', sub:'DeepL',      x:280, y:80  },
    { id:'glossary',  agent:'glossary',  label:'glossary',  sub:'regex',      x:500, y:80  },
    { id:'packager',  agent:'packager',  label:'packager',  sub:'Haiku 4.5',  x:500, y:240 },
    { id:'image',     agent:'image',     label:'image',     sub:'Unsplash',   x:720, y:160 },
    { id:'publish',   agent:'publish',   label:'publish',   sub:'HTTP POST',  x:940, y:160 },
  ];
  const EDGES = [
    { from:'writer', to:'translate', stage:1 },
    { from:'writer', to:'packager',  stage:3 },
    { from:'translate', to:'glossary', stage:2 },
    { from:'glossary', to:'image',   stage:4 },
    { from:'packager', to:'image',   stage:4 },
    { from:'image', to:'publish',    stage:5 },
  ];

  // simulate stage advancement + streamed logs
  React.useEffect(()=>{
    if(!playing) return;
    const interval = setInterval(()=>{
      setStageIdx(i=> (i+1) % 6);
    }, 5200);
    return ()=>clearInterval(interval);
  },[playing]);

  const LOG_LINES = {
    0: [
      { agent:'writer',    msg:'POST /messages  model=claude-haiku-4-5  max_tokens=4096' },
      { agent:'writer',    msg:'web_search("Yangpyeong cabin winter guide 2026")  → 8 results' },
      { agent:'writer',    msg:'web_search("ASTY Cabin amenities onsen-style bath") → 5 results' },
      { agent:'writer',    msg:'drafting en.md  ~1,680 words · tokens_out=4,120' },
      { agent:'system',    msg:'saved content/drafts/asty-cabin-winter-yangpyeong-guide/en.md' },
    ],
    1: [
      { agent:'translate', msg:'deepl.translate(en.md → JA)  chars=8,420  glossary=DEEPL_GLOSSARY_JA_ID' },
      { agent:'translate', msg:'deepl.translate(en.md → ZH)  chars=8,420  glossary=DEEPL_GLOSSARY_ZH_ID' },
      { agent:'system',    msg:'monthly chars used: 186,420 / 500,000  · per-run: 16,840 / 40,000' },
    ],
    2: [
      { agent:'glossary',  msg:'enforce-glossary ja.md  → applied 4 rules, 0 warnings' },
      { agent:'glossary',  msg:'enforce-glossary zh.md  → applied 3 rules, 0 warnings' },
      { agent:'glossary',  msg:'scan for 한글 leak in ja.md … ok' },
      { agent:'glossary',  msg:'scan for 繁体 in zh.md … ok' },
    ],
    3: [
      { agent:'packager',  msg:'POST /messages  model=claude-haiku-4-5  (metadata pass)' },
      { agent:'packager',  msg:'generating seo title / description / og:image alt × 3 langs' },
      { agent:'system',    msg:'wrote meta.json  tokens_in=2,110  tokens_out=780' },
    ],
    4: [
      { agent:'image',     msg:'unsplash.search("korean cabin winter")  → 30 results, rate 2/50' },
      { agent:'image',     msg:'selected photographer=@jisuk_kim  id=Q3-19c2  orientation=landscape' },
    ],
    5: [
      { agent:'publish',   msg:'POST https://asty.cabin/api/agent/publish' },
      { agent:'publish',   msg:'Authorization: Bearer ASTY_AGENT_API_KEY ✓' },
      { agent:'system',    msg:'published slug=asty-cabin-winter-yangpyeong-guide status=200  3 locales live' },
    ],
  };

  // When stage changes, append logs with staggered delay
  React.useEffect(()=>{
    if(!playing) return;
    const ts = ()=>{
      const d = new Date();
      return d.toTimeString().slice(0,8);
    };
    const linesForStage = LOG_LINES[stageIdx] || [];
    let cancelled = false;
    linesForStage.forEach((line, i)=>{
      setTimeout(()=>{
        if(cancelled) return;
        setLogs(prev=>{
          const next = [...prev, { ...line, ts: ts(), key: Date.now()+'-'+i }];
          return next.slice(-60);
        });
        setTimeout(()=>{
          if(logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
        }, 10);
      }, i*500);
    });
    // Stream the last agent's output as text
    const streamStage = D.PIPELINE_STAGES[stageIdx] || D.PIPELINE_STAGES[0];
    const streamSamples = {
      writer:    'Yangpyeong in winter wears its silence honestly. The pines hold snow without boast, the valley hushes its own river, and the light between 3 and 5 p.m. turns amber against cabin windows. A weekend here is not a program — it is a decision to slow down long enough that the kettle earns its keep, the deck earns the blanket, the stars earn your quiet nod back…',
      translate: '楊平の冬は、その静けさを素直に身にまとっている。松は雪を誇らず受け止め、谷は川の音を自らにひそめ、午後3時から5時のあいだの光が、キャビンの窓を琥珀色に染める。ここでの週末は計画ではなく、決断だ。ケトルが湯を湧かすだけの時間をもつ。デッキが毛布を必要とする時間をもつ…',
      glossary:  '→ ASTY キャビン  (rule: "ASTY Cabin"→"ASTY キャビン")\n→ 楊平  (rule: "Yangpyeong"→"楊平")\n→ 韓屋  (rule: "hanok"→"韓屋")\n3 replacements · 0 warnings',
      packager:  '{\n  "en": { "title": "Winter at Yangpyeong: A quiet cabin weekend guide", "description": "A slow-weekend guide to staying at ASTY Cabin in Yangpyeong during winter…" },\n  "ja": { "title": "楊平の冬：静かなキャビンで過ごす週末ガイド", … },\n  "zh": { "title": "杨平的冬日：宁静小木屋周末指南", … }\n}',
      image:     'query: "korean cabin winter"\n→ https://images.unsplash.com/photo-1547036967-23d11aacaee0\n  by @jisuk_kim · landscape · 6048×4032\n  license: Unsplash, attribution optional',
      publish:   '← 200 OK\n  slug: asty-cabin-winter-yangpyeong-guide\n  locales: [en, ja, zh]\n  live at: https://asty.cabin/en/blog/asty-cabin-winter-yangpyeong-guide',
    };
    const full = streamSamples[streamStage.agent] || '';
    setStreamText('');
    let idx = 0;
    const streamTick = setInterval(()=>{
      idx += Math.floor(Math.random()*4)+2;
      if(idx >= full.length){
        setStreamText(full);
        clearInterval(streamTick);
        return;
      }
      setStreamText(full.slice(0,idx));
    }, 30);
    return ()=>{ cancelled=true; clearInterval(streamTick); };
  },[stageIdx, playing]);

  // Seed initial logs
  React.useEffect(()=>{
    setLogs([
      { agent:'system', ts:'21:00:03', msg:'/weekly command received · selecting 3 topics from manual-queue.md' },
      { agent:'system', ts:'21:00:05', msg:'→ "Etiquette at a Korean Cabin Stay"' },
      { agent:'system', ts:'21:00:05', msg:'→ "Winter at Yangpyeong: A quiet cabin weekend guide"' },
      { agent:'system', ts:'21:00:05', msg:'→ "Cooking at a cabin: local ingredients within 10 km of ASTY"' },
    ]);
  },[]);

  const currentNode = D.PIPELINE_STAGES[stageIdx];
  const currentAgent = currentNode?.agent;

  // Compute edge path between two points
  const nodePath = (from, to) => {
    const a = NODES.find(n=>n.id===from), b = NODES.find(n=>n.id===to);
    const x1=a.x+130, y1=a.y+28, x2=b.x, y2=b.y+28;
    const cx = (x1+x2)/2;
    return `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
  };

  return (
    <div className="page">
      <div className="page__header">
        <div className="page__header-row">
          <div>
            <h1 className="page__title">Agent flow <Chip kind="ok" dot style={{marginLeft:8,verticalAlign:'middle'}}>live</Chip></h1>
            <div className="page__sub">Writer → Translate → Glossary → Packager → Image → Publish · currently running <b>asty-cabin-winter-yangpyeong-guide</b></div>
          </div>
          <div className="row">
            <button className="btn" onClick={()=>setPlaying(p=>!p)}>
              {playing ? <><Icons.Pause size={12}/> Pause</> : <><Icons.Play size={12}/> Resume</>}
            </button>
            <button className="btn"><Icons.Refresh size={13}/> Rerun stage</button>
          </div>
        </div>
      </div>

      {/* Flow diagram */}
      <div className="flow" style={{marginBottom:14, padding:'20px 10px'}}>
        <svg className="flow__edges" viewBox="0 0 1080 340" preserveAspectRatio="xMidYMid meet">
          {EDGES.map(e=>{
            const cls = e.stage < stageIdx+1 ? 'flow__edge flow__edge--done'
                     : e.stage === stageIdx+1 ? 'flow__edge flow__edge--active'
                     : 'flow__edge';
            return <path key={e.from+e.to} d={nodePath(e.from,e.to)} className={cls}/>;
          })}
        </svg>
        <div style={{position:'relative',width:'100%',minWidth:1080,height:340}}>
          {NODES.map((n,i)=>{
            const done = i < stageIdx;
            const active = i === stageIdx;
            return (
              <div key={n.id}
                className={`flow__node ${active?'flow__node--active':''} ${done?'flow__node--done':''}`}
                style={{left:n.x, top:n.y, width:130}}>
                <div className="flow__node-head">
                  <AgentAvatar agent={n.agent} size={18}/>
                  <span>{n.label}</span>
                  {active && <span style={{marginLeft:'auto',width:6,height:6,borderRadius:'50%',background:'var(--accent)',animation:'pulse-dot 1.2s infinite'}}/>}
                  {done && <Icons.Check size={12} style={{marginLeft:'auto',color:'var(--ok)'}}/>}
                </div>
                <div className="flow__node-sub">{n.sub}</div>
                {active && (
                  <div style={{fontSize:10,color:'var(--text-3)',marginTop:4,display:'flex',alignItems:'center',gap:4}}>
                    <span style={{width:4,height:4,borderRadius:'50%',background:'var(--accent)',animation:'pulse-dot 1s infinite'}}/>
                    <span>{D.PIPELINE_STAGES[stageIdx]?.eta}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid--2" style={{gridTemplateColumns:'1fr 1fr'}}>
        {/* Streaming text panel */}
        <div className="card">
          <div className="card__head">
            <AgentAvatar agent={currentAgent} size={20}/>
            <div className="card__title">{currentNode?.title}</div>
            <Chip kind="ghost">{currentNode?.agent}</Chip>
            <div className="spacer"/>
            <span className="mono" style={{fontSize:11,color:'var(--text-3)'}}>stage {stageIdx+1}/6</span>
          </div>
          <div style={{padding:16,height:280,overflow:'auto',fontSize:13,lineHeight:1.55,fontFamily: currentAgent==='packager'||currentAgent==='glossary'||currentAgent==='image'?'var(--mono)':'var(--serif)',color:'var(--text-2)',whiteSpace:'pre-wrap'}}>
            {streamText}
            <span className="stream-cursor" style={{color:'var(--accent)'}}/>
          </div>
          <div className="card__foot">
            <span className="mono">{streamText.length}</span> chars streamed · tokens_out est. <span className="mono">{Math.floor(streamText.length/3.5)}</span>
          </div>
        </div>

        {/* Log stream */}
        <div className="card">
          <div className="card__head">
            <div className="card__title">Event log</div>
            <Chip kind="ghost">{logs.length} events</Chip>
            <div className="spacer"/>
            <button className="btn btn--ghost btn--sm"><Icons.Copy size={12}/> Copy</button>
          </div>
          <div className="logstream" ref={logRef} style={{margin:0,borderRadius:0,height:300}}>
            {logs.map(l=>(
              <div key={l.key || l.ts+l.msg} className="logstream__line">
                <span className="logstream__ts">{l.ts}</span>
                <span className={`logstream__agent log-${l.agent}`}>[{l.agent}]</span>
                <span className="logstream__msg">{l.msg}</span>
              </div>
            ))}
            <div className="logstream__line">
              <span className="logstream__ts">--:--:--</span>
              <span className="logstream__agent log-system">[{currentAgent}]</span>
              <span className="logstream__msg">
                <span className="stream-cursor" style={{color:'#7cc59e',width:6}}/>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
window.AgentFlow = AgentFlow;
