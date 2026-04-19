// Topics, Glossary, Analytics, Logs, Settings — simpler pages bundled together

// --- Topic queue ---
const Topics = () => {
  const D = window.BLOG_DATA;
  const [queue, setQueue] = React.useState(D.TOPIC_QUEUE);
  const [input, setInput] = React.useState('');

  const add = () => {
    if(!input.trim()) return;
    setQueue([{ id:Date.now(), topic:input, tags:['new'], priority:'med', addedBy:'you', addedAt:'just now' }, ...queue]);
    setInput('');
  };

  const prioColor = {high:'err', med:'warn', low:'ghost'};

  return (
    <div className="page" style={{maxWidth:1100}}>
      <div className="page__header">
        <div className="page__header-row">
          <div>
            <h1 className="page__title">Topic queue</h1>
            <div className="page__sub">topics/manual-queue.md · The <code className="mono" style={{padding:'1px 5px',background:'var(--bg-muted)',borderRadius:3}}>/weekly</code> command picks the top 3 every Sunday.</div>
          </div>
          <button className="btn"><Icons.External size={12}/> Open in GitHub</button>
        </div>
      </div>

      <div className="card" style={{marginBottom:14}}>
        <div style={{padding:'14px 18px',display:'flex',gap:10,alignItems:'center'}}>
          <Icons.Plus size={16} style={{color:'var(--text-3)'}}/>
          <input placeholder="Add a topic… e.g. 'Best hiking trails within 20 min of ASTY'"
            value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&add()}
            style={{flex:1,background:'transparent',border:'none',outline:'none',fontSize:14}}/>
          <button className="btn btn--accent btn--sm" onClick={add}>Add</button>
        </div>
      </div>

      <div className="card">
        <div className="card__head">
          <div className="card__title">Queue</div>
          <Chip kind="ghost">{queue.length}</Chip>
          <div className="spacer"/>
          <span style={{fontSize:12,color:'var(--text-3)'}}>drag to reorder · top 3 run this Sunday</span>
        </div>
        {queue.map((t,i)=>(
          <div key={t.id} style={{padding:'12px 18px',borderTop:i?'1px solid var(--line)':'none',display:'flex',gap:10,alignItems:'center'}}>
            <Icons.Grip size={14} style={{color:'var(--text-4)',cursor:'grab'}}/>
            <div style={{width:24,height:24,borderRadius:6,background:i<3?'var(--accent)':'var(--bg-muted)',color:i<3?'#fff':'var(--text-3)',fontSize:11,fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}} className="mono">{i+1}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13.5,fontWeight:500}}>{t.topic}</div>
              <div style={{display:'flex',gap:5,marginTop:4,alignItems:'center'}}>
                {t.tags.map(g=><Chip key={g} kind="ghost">#{g}</Chip>)}
                <span style={{fontSize:11,color:'var(--text-4)'}}>· added {t.addedAt}</span>
              </div>
            </div>
            <Chip kind={prioColor[t.priority]} dot>{t.priority}</Chip>
            <button className="btn btn--icon btn--ghost"><Icons.X size={12}/></button>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Glossary ---
const Glossary = () => {
  const D = window.BLOG_DATA;
  const [tab, setTab] = React.useState('ja');
  const list = tab==='ja' ? D.GLOSSARY_JA : D.GLOSSARY_ZH;
  return (
    <div className="page" style={{maxWidth:1000}}>
      <div className="page__header">
        <div className="page__header-row">
          <div>
            <h1 className="page__title">Glossary</h1>
            <div className="page__sub">DeepL glossaries + <code className="mono" style={{padding:'1px 5px',background:'var(--bg-muted)',borderRadius:3}}>enforce-glossary.ts</code>. Locked terms are always replaced.</div>
          </div>
          <button className="btn btn--accent"><Icons.Plus size={13}/> Add term</button>
        </div>
      </div>
      <div className="grid grid--3" style={{marginBottom:14}}>
        <Metric label="JA terms" value={D.GLOSSARY_JA.length} delta={`${D.GLOSSARY_JA.filter(g=>g.locked).length} locked`}/>
        <Metric label="ZH terms" value={D.GLOSSARY_ZH.length} delta={`${D.GLOSSARY_ZH.filter(g=>g.locked).length} locked`}/>
        <Metric label="Flagged this month" value="1" delta="1 JA warning — last week" deltaKind="warn"/>
      </div>

      <div className="card">
        <div style={{padding:'10px 18px',borderBottom:'1px solid var(--line)'}}>
          <Segmented value={tab} onChange={setTab} options={[
            {value:'ja',label:`🇯🇵 JA (${D.GLOSSARY_JA.length})`},
            {value:'zh',label:`🇨🇳 ZH (${D.GLOSSARY_ZH.length})`},
          ]}/>
        </div>
        <table className="table">
          <thead><tr><th>Source (EN)</th><th>Target ({tab.toUpperCase()})</th><th>Type</th><th style={{width:60}}></th></tr></thead>
          <tbody>
            {list.map((g,i)=>(
              <tr key={i}>
                <td className="mono" style={{fontSize:13}}>{g.src}</td>
                <td style={{fontSize:14,fontFamily:"'Noto Sans JP', 'Noto Sans SC', sans-serif"}}>{g.tgt}</td>
                <td>{g.locked ? <Chip kind="ok" dot>locked</Chip> : <Chip kind="ghost">soft</Chip>}</td>
                <td><button className="btn btn--icon btn--ghost"><Icons.Edit size={12}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Analytics ---
const Analytics = () => {
  const D = window.BLOG_DATA;
  const weeks = D.COST_HISTORY;
  const maxWeek = Math.max(...weeks.map(w=>w.api+w.polish));
  return (
    <div className="page" style={{maxWidth:1200}}>
      <div className="page__header">
        <h1 className="page__title">Cost & tokens</h1>
        <div className="page__sub">Last 14 weeks · budget cap $10/mo · projected on track</div>
      </div>

      <div className="grid grid--4" style={{marginBottom:14}}>
        <Metric label="This month" value="$4.62" unit="/ $10" bar={0.462} deltaKind="ok" delta="46% used"/>
        <Metric label="Last month" value="$5.18" delta="−11% mom" deltaKind="ok"/>
        <Metric label="Avg cost / article" value="$0.12" delta="Haiku 4.5 + /polish"/>
        <Metric label="Total tokens (mo)" value="196.6k" delta="162k in · 34k out"/>
      </div>

      {/* Weekly cost chart */}
      <div className="card" style={{marginBottom:14}}>
        <div className="card__head">
          <div className="card__title">Weekly spend — API + /polish</div>
          <div className="spacer"/>
          <Segmented value="14w" onChange={()=>{}} options={[{value:'4w',label:'4w'},{value:'14w',label:'14w'},{value:'all',label:'All'}]}/>
        </div>
        <div style={{padding:'24px 18px 12px',display:'flex',alignItems:'flex-end',gap:6,height:220}}>
          {weeks.map(w=>{
            const tot = w.api+w.polish;
            const apiH = (w.api/maxWeek)*160;
            const polishH = (w.polish/maxWeek)*160;
            return (
              <div key={w.w} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4,minWidth:0}}>
                <div style={{fontSize:10,color:'var(--text-3)',fontFamily:'var(--mono)'}}>${tot.toFixed(2)}</div>
                <div style={{display:'flex',flexDirection:'column',width:'70%',maxWidth:28}}>
                  {polishH>0 && <div style={{height:polishH,background:'var(--agent-packager)',borderRadius:'3px 3px 0 0'}}/>}
                  <div style={{height:apiH,background:'var(--agent-writer)',borderRadius:polishH>0?0:'3px 3px 0 0'}}/>
                </div>
                <div style={{fontSize:10,color:'var(--text-4)'}} className="mono">{w.w}</div>
              </div>
            );
          })}
        </div>
        <div className="card__foot" style={{display:'flex',gap:14}}>
          <div style={{display:'flex',gap:6,alignItems:'center',fontSize:11}}><span style={{width:10,height:10,borderRadius:2,background:'var(--agent-writer)'}}/> Haiku API</div>
          <div style={{display:'flex',gap:6,alignItems:'center',fontSize:11}}><span style={{width:10,height:10,borderRadius:2,background:'var(--agent-packager)'}}/> /polish (Sonnet)</div>
          <div className="spacer"/>
          <span>14-week total <span className="mono" style={{color:'var(--text-2)'}}>$20.18</span></span>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid--2">
        <div className="card">
          <div className="card__head"><div className="card__title">Cost breakdown — month to date</div></div>
          <div className="card__body">
            {[
              {label:'Claude API (Haiku 4.5)', value:1.44, color:'var(--agent-writer)', note:'9 articles × ~$0.10'},
              {label:'/polish (Sonnet 4.6)',    value:0.90, color:'var(--agent-packager)', note:'3 uses this month'},
              {label:'DeepL',                   value:0,    color:'var(--agent-translate)', note:'186k / 500k chars · free'},
              {label:'Unsplash',                value:0,    color:'var(--agent-image)',     note:'27 fetches · free'},
              {label:'Supabase / CF Workers',   value:0,    color:'var(--text-3)',           note:'free tier'},
            ].map(r=>(
              <div key={r.label} style={{display:'flex',gap:10,alignItems:'center',padding:'8px 0',borderBottom:'1px solid var(--line)'}}>
                <span style={{width:10,height:10,borderRadius:3,background:r.color,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:500}}>{r.label}</div>
                  <div style={{fontSize:11,color:'var(--text-3)'}}>{r.note}</div>
                </div>
                <div className="mono" style={{fontWeight:500}}>${r.value.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card__head"><div className="card__title">Token volume — per agent (MTD)</div></div>
          <div className="card__body" style={{display:'flex',flexDirection:'column',gap:10}}>
            {[
              {a:'writer', inK:132, outK:28, calls:9},
              {a:'packager', inK:18, outK:5.2, calls:9},
              {a:'glossary', inK:0, outK:0, calls:9, note:'regex · no LLM'},
            ].map(r=>(
              <div key={r.a}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                  <AgentAvatar agent={r.a} size={18}/>
                  <div style={{fontSize:13,fontWeight:500}}>{r.a}</div>
                  <div className="spacer"/>
                  <span className="mono" style={{fontSize:11.5,color:'var(--text-3)'}}>{r.calls} calls</span>
                </div>
                <div style={{display:'flex',gap:4,fontSize:11,color:'var(--text-3)'}}>
                  <div style={{flex:r.inK||0.1,background:`var(--agent-${r.a}-soft)`,color:`var(--agent-${r.a})`,padding:'3px 6px',borderRadius:4,fontFamily:'var(--mono)'}}>in {r.inK}k</div>
                  <div style={{flex:r.outK||0.1,background:`var(--agent-${r.a})`,color:'#fff',padding:'3px 6px',borderRadius:4,fontFamily:'var(--mono)'}}>out {r.outK}k</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Logs / run history ---
const Logs = () => {
  const D = window.BLOG_DATA;
  const runs = D.RECENT_RUNS;
  const statusColor = {success:'ok', partial:'warn', failed:'err'};
  return (
    <div className="page" style={{maxWidth:1100}}>
      <div className="page__header">
        <h1 className="page__title">Run history</h1>
        <div className="page__sub">All <code className="mono" style={{padding:'1px 5px',background:'var(--bg-muted)',borderRadius:3}}>/weekly</code> executions, newest first.</div>
      </div>
      <div className="card">
        <table className="table">
          <thead><tr><th>Run</th><th>When</th><th>Articles</th><th>Duration</th><th>Cost</th><th>Status</th><th></th></tr></thead>
          <tbody>
            <tr style={{background:'var(--accent-soft)'}}>
              <td className="mono" style={{fontWeight:500}}>run-050</td>
              <td>Apr 19, 21:00 KST</td>
              <td>2 of 3 <span className="muted">· 1 drafting</span></td>
              <td className="mono">2m 42s <span className="muted">(ongoing)</span></td>
              <td className="mono">$0.30</td>
              <td><Chip kind="warn" dot>running</Chip></td>
              <td><button className="btn btn--ghost btn--sm">Open</button></td>
            </tr>
            {runs.map(r=>(
              <tr key={r.id}>
                <td className="mono" style={{fontWeight:500}}>{r.id}</td>
                <td>{r.date}</td>
                <td>{r.articles}</td>
                <td className="mono">{r.duration}</td>
                <td className="mono">${r.cost.toFixed(2)}</td>
                <td><Chip kind={statusColor[r.status]} dot>{r.status}</Chip></td>
                <td><button className="btn btn--ghost btn--sm">Open</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Settings ---
const Settings = () => {
  const [cfg, setCfg] = React.useState({
    model:'haiku-4-5',
    budget:10,
    polish:true,
    schedule:'Sun 21:00 KST',
    articles:3,
    en:true, ja:true, zh:true,
    autoPublish:false,
  });
  const set = (p)=>setCfg({...cfg,...p});
  return (
    <div className="page" style={{maxWidth:820}}>
      <div className="page__header">
        <h1 className="page__title">Settings</h1>
        <div className="page__sub">Writes through to <code className="mono" style={{padding:'1px 5px',background:'var(--bg-muted)',borderRadius:3}}>CLAUDE.md</code>, <code className="mono" style={{padding:'1px 5px',background:'var(--bg-muted)',borderRadius:3}}>.env</code>, and the GitHub Actions workflow.</div>
      </div>

      <div className="card" style={{marginBottom:14}}>
        <div className="card__head"><div className="card__title">Model & budget</div></div>
        <div className="card__body" style={{display:'flex',flexDirection:'column',gap:14}}>
          <div>
            <div style={{fontSize:12.5,fontWeight:500,marginBottom:6}}>Writer model</div>
            <div style={{display:'flex',gap:8}}>
              {[
                {v:'haiku-4-5',label:'Haiku 4.5',cost:'~$0.10/article'},
                {v:'sonnet-4-6',label:'Sonnet 4.6',cost:'~$0.30/article'},
              ].map(o=>(
                <button key={o.v} onClick={()=>set({model:o.v})} className="btn" style={{
                  flex:1,padding:'10px 12px',textAlign:'left',flexDirection:'column',alignItems:'flex-start',
                  borderColor:cfg.model===o.v?'var(--accent)':'var(--line-2)',
                  background:cfg.model===o.v?'var(--accent-soft)':'var(--bg-elev)',
                  color:cfg.model===o.v?'var(--accent-ink)':'var(--text)',
                }}>
                  <div style={{fontSize:13.5,fontWeight:600}}>{o.label}</div>
                  <div style={{fontSize:11,color:'var(--text-3)',fontFamily:'var(--mono)'}}>{o.cost}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:12.5,fontWeight:500,marginBottom:6}}>
              <span>Monthly budget cap</span>
              <span className="mono" style={{color:'var(--accent)'}}>${cfg.budget}</span>
            </div>
            <input type="range" min="5" max="30" value={cfg.budget} onChange={e=>set({budget:+e.target.value})} style={{width:'100%',accentColor:'var(--accent)'}}/>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--text-3)',fontFamily:'var(--mono)'}}>
              <span>$5</span><span>$10</span><span>$30</span>
            </div>
          </div>
          <label style={{display:'flex',gap:10,alignItems:'center'}}>
            <Toggle on={cfg.polish} onChange={on=>set({polish:on})}/>
            <div>
              <div style={{fontSize:13,fontWeight:500}}>Allow /polish (Sonnet upgrade)</div>
              <div style={{fontSize:11.5,color:'var(--text-3)'}}>Adds ~$0.30 per use · disabled = hard-cap to Haiku only</div>
            </div>
          </label>
        </div>
      </div>

      <div className="card" style={{marginBottom:14}}>
        <div className="card__head"><div className="card__title">Schedule & languages</div></div>
        <div className="card__body" style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div>
              <div style={{fontSize:12.5,fontWeight:500,marginBottom:5}}>Weekly run</div>
              <div className="btn" style={{width:'100%',justifyContent:'space-between'}}>
                <span><Icons.Calendar size={13}/> {cfg.schedule}</span>
                <Icons.ChevronD size={12}/>
              </div>
            </div>
            <div>
              <div style={{fontSize:12.5,fontWeight:500,marginBottom:5}}>Articles per run</div>
              <div className="btn" style={{width:'100%',justifyContent:'space-between'}}>
                <span>{cfg.articles} articles</span>
                <Icons.ChevronD size={12}/>
              </div>
            </div>
          </div>
          <div>
            <div style={{fontSize:12.5,fontWeight:500,marginBottom:6}}>Target languages</div>
            <div style={{display:'flex',gap:8}}>
              {[{k:'en',f:'🇬🇧',n:'English'},{k:'ja',f:'🇯🇵',n:'日本語'},{k:'zh',f:'🇨🇳',n:'简体中文'}].map(l=>(
                <button key={l.k} onClick={()=>set({[l.k]:!cfg[l.k]})} className="btn" style={{
                  flex:1,padding:'8px 10px',
                  borderColor:cfg[l.k]?`var(--lang-${l.k})`:'var(--line-2)',
                  background:cfg[l.k]?`var(--lang-${l.k}-soft)`:'var(--bg-elev)',
                  color:cfg[l.k]?`var(--lang-${l.k})`:'var(--text-3)',
                }}>
                  <span style={{fontSize:15,marginRight:6}}>{l.f}</span>{l.n}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card__head"><div className="card__title">Automation</div></div>
        <div className="card__body" style={{display:'flex',flexDirection:'column',gap:12}}>
          <label style={{display:'flex',gap:10,alignItems:'center'}}>
            <Toggle on={cfg.autoPublish} onChange={on=>set({autoPublish:on})}/>
            <div>
              <div style={{fontSize:13,fontWeight:500}}>Auto-publish after review window</div>
              <div style={{fontSize:11.5,color:'var(--text-3)'}}>If you don't publish within 24h, drafts ship on Monday at 09:00 KST.</div>
            </div>
          </label>
          <div style={{display:'flex',gap:8,paddingTop:10,borderTop:'1px solid var(--line)'}}>
            <button className="btn">Discard changes</button>
            <div className="spacer"/>
            <button className="btn btn--accent">Save settings</button>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { Topics, Glossary, Analytics, Logs, Settings });
