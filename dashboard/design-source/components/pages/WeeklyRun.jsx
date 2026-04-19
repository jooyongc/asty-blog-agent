// Weekly run page — gantt-like view of 3 articles × pipeline stages
const WeeklyRun = () => {
  const D = window.BLOG_DATA;
  const stages = D.PIPELINE_STAGES;

  // Simulated timing per article (in seconds from run start)
  const runs = [
    { slug: D.DRAFTS[0].slug, title: D.DRAFTS[0].title, start: 0,   stageEnds:[92,112,114,140,146], image:D.DRAFTS[0].image, done:true },
    { slug: D.DRAFTS[1].slug, title: D.DRAFTS[1].title, start: 10,  stageEnds:[105,128,130,158,164], image:D.DRAFTS[1].image, done:true },
    { slug: D.DRAFTS[2].slug, title: D.DRAFTS[2].title, start: 20,  stageEnds:[112,null,null,null,null], image:D.DRAFTS[2].image, done:false, currentStage:0, currentProgress:0.38 },
  ];

  const totalSec = 200;
  const pxPerSec = 4;

  const stageColor = (agent) => `var(--agent-${agent})`;

  return (
    <div className="page">
      <div className="page__header">
        <div className="page__header-row">
          <div>
            <h1 className="page__title">Weekly run <span className="mono" style={{fontSize:14,color:'var(--text-3)',marginLeft:8}}>run-050</span></h1>
            <div className="page__sub">Started Sun Apr 19 · 21:00:03 KST · 3 topics from manual-queue.md</div>
          </div>
          <div className="row">
            <Chip kind="warn" dot>in progress · 2m 42s elapsed</Chip>
            <button className="btn"><Icons.Stop size={11}/> Abort</button>
          </div>
        </div>
      </div>

      {/* Top summary */}
      <div className="grid grid--4" style={{marginBottom:14}}>
        <Metric label="Articles" value="2/3" delta="1 in progress" deltaKind="warn" bar={2/3}/>
        <Metric label="Elapsed" value="2:42" unit="min" delta="budget 20:00" deltaKind="ok"/>
        <Metric label="Cost so far" value="$0.30" delta="est. $1.50 total" deltaKind="ok"/>
        <Metric label="Tokens out" value="9.2k" delta="8,180 en · 1,020 meta"/>
      </div>

      {/* Gantt / swimlane */}
      <div className="card" style={{marginBottom:14}}>
        <div className="card__head">
          <div className="card__title">Pipeline timeline</div>
          <div className="spacer"/>
          <div className="row" style={{gap:12,fontSize:11,color:'var(--text-3)'}}>
            {stages.map(s=>(
              <div key={s.id} style={{display:'flex',alignItems:'center',gap:5}}>
                <span style={{width:10,height:10,borderRadius:3,background:stageColor(s.agent)}}/>
                <span>{s.agent}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{padding:'14px 18px',overflowX:'auto'}}>
          <div style={{minWidth: totalSec*pxPerSec + 240}}>
            {/* Time axis */}
            <div style={{display:'flex',marginBottom:8,paddingLeft:240}}>
              {[0,30,60,90,120,150,180].map(t=>(
                <div key={t} style={{width:30*pxPerSec,fontSize:10,color:'var(--text-3)',flexShrink:0}} className="mono">
                  {Math.floor(t/60)}:{String(t%60).padStart(2,'0')}
                </div>
              ))}
            </div>
            {/* Rows */}
            {runs.map((r,ri)=>(
              <div key={r.slug} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderTop:ri?'1px dashed var(--line)':'none'}}>
                <div style={{width:230,display:'flex',gap:8,alignItems:'center',flexShrink:0}}>
                  <div style={{width:26,height:26,borderRadius:5,overflow:'hidden',flexShrink:0}}>
                    <HeroPlaceholder kind={r.image} height={26}/>
                  </div>
                  <div style={{minWidth:0,flex:1}}>
                    <div className="ellipsis" style={{fontSize:12.5,fontWeight:500}}>{r.title}</div>
                    <div style={{fontSize:10.5,color:'var(--text-3)'}} className="mono ellipsis">{r.slug}</div>
                  </div>
                </div>
                <div style={{flex:1,position:'relative',height:26}}>
                  {/* Background track */}
                  <div style={{position:'absolute',inset:'10px 0',background:'var(--bg-muted)',borderRadius:3}}/>
                  {/* Stage bars */}
                  {stages.map((s,si)=>{
                    const prevEnd = si===0 ? r.start : r.stageEnds[si-1];
                    const end = r.stageEnds[si];
                    if(prevEnd==null) return null;
                    const inProgress = end==null;
                    const barEnd = inProgress ? (prevEnd + 40 * (r.currentProgress||0.5)) : end;
                    const left = prevEnd * pxPerSec;
                    const width = (barEnd - prevEnd) * pxPerSec;
                    return (
                      <div key={s.id} style={{
                        position:'absolute',left,top:6,height:14,width,
                        background: stageColor(s.agent),
                        borderRadius: 3,
                        opacity: inProgress ? 0.7 : 1,
                        display:'flex',alignItems:'center',justifyContent:'center',
                        fontSize:10,color:'#fff',fontWeight:500,
                        overflow:'hidden',whiteSpace:'nowrap',
                      }}>
                        {width>40 && s.agent}
                        {inProgress && <span style={{marginLeft:4,width:4,height:4,borderRadius:'50%',background:'#fff',animation:'pulse-dot 1s infinite'}}/>}
                      </div>
                    );
                  })}
                </div>
                <div style={{width:100,flexShrink:0,fontSize:11,color:'var(--text-3)',textAlign:'right'}}>
                  {r.done ? <Chip kind="ok" dot>done</Chip> : <Chip kind="warn" dot>stage {(r.currentStage||0)+1}</Chip>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Per-article breakdown */}
      <div className="grid grid--3">
        {D.DRAFTS.map(d=>(
          <div key={d.slug} className="card">
            <HeroPlaceholder kind={d.image} height={80}/>
            <div style={{padding:14}}>
              <div style={{display:'flex',alignItems:'flex-start',gap:8,marginBottom:8}}>
                <div style={{flex:1,fontSize:13,fontWeight:500,lineHeight:1.35}}>{d.title}</div>
                {d.status==='ready' ? <Chip kind="ok" dot>ready</Chip> : <Chip kind="warn" dot>stage {d.stage}</Chip>}
              </div>
              <div style={{display:'flex',gap:5,marginBottom:12}}>
                <LangChip lang="en" on={d.languages.en} small/>
                <LangChip lang="ja" on={d.languages.ja} small/>
                <LangChip lang="zh" on={d.languages.zh} small/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:11.5}}>
                <div><div className="muted">Words (EN)</div><div className="mono" style={{fontWeight:500,fontSize:13}}>{d.words.en.toLocaleString()}</div></div>
                <div><div className="muted">Cost</div><div className="mono" style={{fontWeight:500,fontSize:13}}>${d.cost.toFixed(2)}</div></div>
                <div><div className="muted">Tokens in/out</div><div className="mono" style={{fontSize:12}}>{(d.tokensIn/1000).toFixed(1)}k / {(d.tokensOut/1000).toFixed(1)}k</div></div>
                <div><div className="muted">Scheduled</div><div style={{fontSize:12,fontWeight:500}}>{d.scheduledFor}</div></div>
              </div>
              {d.warnings.length>0 && (
                <div style={{marginTop:10,padding:'6px 10px',background:'var(--warn-soft)',borderRadius:6,fontSize:11.5,color:'var(--warn)',display:'flex',gap:6,alignItems:'center'}}>
                  <Icons.Warn size={12}/> {d.warnings[0]}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
window.WeeklyRun = WeeklyRun;
