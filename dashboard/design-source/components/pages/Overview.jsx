// Overview page — this-week progress, budget gauge, pipeline status, recent drafts
const Overview = ({goto}) => {
  const D = window.BLOG_DATA;
  const drafting = D.DRAFTS.find(d=>d.status==='drafting');
  const ready = D.DRAFTS.filter(d=>d.status==='ready');
  const costSeries = D.COST_HISTORY.map(c=>c.api+c.polish);

  return (
    <div className="page">
      <div className="page__header">
        <div className="page__header-row">
          <div>
            <h1 className="page__title">Good morning, jooyongc</h1>
            <div className="page__sub">Week 49 · 2 drafts ready to publish · weekly run last completed 3h ago</div>
          </div>
          <div className="row">
            <Chip kind="ok" dot>All systems nominal</Chip>
            <button className="btn"><Icons.Calendar size={13}/> Apr 14 – Apr 20</button>
          </div>
        </div>
      </div>

      {/* Top metrics */}
      <div className="grid grid--4" style={{marginBottom:14}}>
        <Metric label={<><Icons.Doc size={13}/> Articles this month</>}
          value={<>{D.MONTH.articles.done}<small>/{D.MONTH.articles.target}</small></>}
          delta="on track · 3 left"
          deltaKind="ok"
          bar={D.MONTH.articles.done/D.MONTH.articles.target}/>
        <Metric label={<><Icons.Dollar size={13}/> Spend this month</>}
          value={<>$<span>{D.MONTH.spent.toFixed(2)}</span></>}
          delta={`of $${D.MONTH.budget.toFixed(2)} budget`}
          deltaKind="ok"
          bar={D.MONTH.spent/D.MONTH.budget}/>
        <Metric label={<><Icons.Bolt size={13}/> Avg cost / article</>}
          value={<>$<span>{D.MONTH.avgCostPerArticle.toFixed(2)}</span></>}
          delta="vs $0.15 target"
          deltaKind="ok"/>
        <Metric label={<><Icons.Globe size={13}/> Languages shipped</>}
          value="27"
          delta={<>9 × <span style={{color:'var(--lang-en)'}}>EN</span> · 9 × <span style={{color:'var(--lang-ja)'}}>JA</span> · 9 × <span style={{color:'var(--lang-zh)'}}>ZH</span></>}/>
      </div>

      {/* Main row: live run + budget */}
      <div className="grid grid--2" style={{marginBottom:14, gridTemplateColumns:'2fr 1fr'}}>
        <div className="card">
          <div className="card__head">
            <Chip kind="ok" dot>Live</Chip>
            <div className="card__title">Weekly pipeline — Sun 21:00 KST</div>
            <div className="spacer"/>
            <button className="btn btn--ghost btn--sm" onClick={()=>goto('weekly')}>Open run <Icons.Chevron size={12}/></button>
          </div>
          <div className="card__body" style={{display:'flex',flexDirection:'column',gap:14}}>
            {D.DRAFTS.map(d=>(
              <div key={d.slug} style={{display:'flex',gap:12,alignItems:'center'}}>
                <div style={{width:32,height:32,borderRadius:7,overflow:'hidden',flexShrink:0}}>
                  <HeroPlaceholder kind={d.image} height={32}/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                    <div className="ellipsis" style={{fontSize:13.5,fontWeight:500}}>{d.title}</div>
                    {d.status==='ready' && <Chip kind="ok" dot>ready</Chip>}
                    {d.status==='drafting' && <Chip kind="warn" dot>drafting</Chip>}
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <ProgressBar segments={[
                      {value: d.progress*D.PIPELINE_STAGES.length, color:d.status==='ready'?'var(--ok)':'var(--accent)'}
                    ]} total={D.PIPELINE_STAGES.length} height={5}/>
                    <span className="mono" style={{fontSize:11,color:'var(--text-3)',flexShrink:0,minWidth:62,textAlign:'right'}}>
                      stage {d.stage}/{D.PIPELINE_STAGES.length}
                    </span>
                  </div>
                </div>
                <div className="avatars hide-mobile">
                  {D.PIPELINE_STAGES.slice(0,d.stage).map(s=>(
                    <AgentAvatar key={s.id} agent={s.agent} size={20}/>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card__head">
            <div className="card__title">Monthly budget</div>
            <div className="spacer"/>
            <Chip kind="ghost">$10 cap</Chip>
          </div>
          <div className="card__body" style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
            <CostDonut spent={D.MONTH.spent} budget={D.MONTH.budget}/>
            <div style={{display:'flex',gap:18,fontSize:12,color:'var(--text-3)'}}>
              <div><span style={{display:'inline-block',width:8,height:8,borderRadius:2,background:'var(--agent-writer)',marginRight:5}}/>Haiku API</div>
              <div><span style={{display:'inline-block',width:8,height:8,borderRadius:2,background:'var(--agent-packager)',marginRight:5}}/>/polish</div>
            </div>
            <div style={{width:'100%',borderTop:'1px solid var(--line)',paddingTop:12,display:'flex',justifyContent:'space-between',fontSize:12}}>
              <div><div className="muted" style={{fontSize:11}}>Projected</div><div className="mono" style={{fontWeight:500}}>$6.15</div></div>
              <div><div className="muted" style={{fontSize:11}}>Saved vs 5-agent</div><div className="mono" style={{fontWeight:500,color:'var(--ok)'}}>−67%</div></div>
            </div>
          </div>
        </div>
      </div>

      {/* Agent status strip */}
      <div className="card" style={{marginBottom:14}}>
        <div className="card__head">
          <div className="card__title">Agents</div>
          <div className="spacer"/>
          <button className="btn btn--ghost btn--sm" onClick={()=>goto('agents')}>Live flow <Icons.Chevron size={12}/></button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))',gap:0}}>
          {D.AGENTS.map((a,i)=>{
            const active = a.id===drafting?.stage ? true : false;
            const busy = drafting && D.PIPELINE_STAGES[drafting.stage-1]?.agent===a.id;
            return (
              <div key={a.id} style={{padding:'14px 18px',borderLeft:i?'1px solid var(--line)':'none',display:'flex',flexDirection:'column',gap:6,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <AgentAvatar agent={a.id}/>
                  <div style={{fontSize:13,fontWeight:500}}>{a.label}</div>
                  {busy && <span style={{marginLeft:'auto',width:6,height:6,borderRadius:'50%',background:'var(--accent)',animation:'pulse-dot 1.2s infinite'}}/>}
                </div>
                <div style={{fontSize:11.5,color:'var(--text-3)',lineHeight:1.35}} className="ellipsis">{a.role}</div>
                <div style={{fontSize:11,color:'var(--text-4)'}} className="mono">{a.model}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom: recent drafts preview */}
      <div className="grid grid--2" style={{gridTemplateColumns:'1fr 1fr'}}>
        <div className="card">
          <div className="card__head">
            <div className="card__title">Ready to publish</div>
            <Chip kind="ok">{ready.length}</Chip>
            <div className="spacer"/>
            <button className="btn btn--ghost btn--sm" onClick={()=>goto('drafts')}>All drafts</button>
          </div>
          <div style={{padding:'4px 6px'}}>
            {ready.map(d=>(
              <button key={d.slug} onClick={()=>goto('drafts')} style={{
                width:'100%',textAlign:'left',padding:'10px 12px',borderRadius:8,
                display:'flex',gap:10,alignItems:'center',transition:'background .1s',
              }} onMouseEnter={e=>e.currentTarget.style.background='var(--bg-subtle)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div style={{width:40,height:40,borderRadius:6,overflow:'hidden',flexShrink:0}}><HeroPlaceholder kind={d.image} height={40}/></div>
                <div style={{flex:1,minWidth:0}}>
                  <div className="ellipsis" style={{fontSize:13.5,fontWeight:500}}>{d.title}</div>
                  <div style={{display:'flex',gap:5,marginTop:4,alignItems:'center'}}>
                    <LangChip lang="en" small/>
                    <LangChip lang="ja" small/>
                    <LangChip lang="zh" small/>
                    <span style={{fontSize:11,color:'var(--text-3)',marginLeft:4}}>· {d.scheduledFor}</span>
                  </div>
                </div>
                <Icons.Chevron size={14} style={{color:'var(--text-3)'}}/>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card__head">
            <div className="card__title">Cost — last 14 weeks</div>
            <div className="spacer"/>
            <button className="btn btn--ghost btn--sm" onClick={()=>goto('analytics')}>Analytics</button>
          </div>
          <div className="card__body">
            <div style={{display:'flex',alignItems:'baseline',gap:10,marginBottom:8}}>
              <div style={{fontSize:22,fontWeight:600,letterSpacing:'-0.02em'}} className="mono">$20.18</div>
              <Chip kind="ok" dot>−12% vs prev</Chip>
            </div>
            <Sparkline data={costSeries} height={60} color="var(--accent)"/>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--text-3)',marginTop:4}}>
              <span>W36</span><span>W42</span><span>W49 (now)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
window.Overview = Overview;
