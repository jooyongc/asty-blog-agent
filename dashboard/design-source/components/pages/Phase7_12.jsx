// Phase 7-12 pages: Direction, PublishQueue (1-click approve), Graph, Portfolio, GSC

// --- Direction (Phase 9/11) — free-text -> 3 topic proposals ---
const Direction = () => {
  const [input, setInput] = React.useState('This week, I want to focus on quiet winter stays at ASTY Cabin — the kind of post that helps a first-time JA or ZH guest feel confident about booking a 2-night trip.');
  const [loading, setLoading] = React.useState(false);
  const [proposals, setProposals] = React.useState([
    { id:1, topic:'Winter at Yangpyeong: A quiet cabin weekend guide',     why:'Matches "quiet winter" + first-timer confidence. striking-distance kw: "yangpyeong cabin winter" (pos 12)', score:92, feedback:null },
    { id:2, topic:'First-night checklist: arriving at ASTY Cabin after dark', why:'Addresses "confidence about booking". High intent for JA guests arriving via last ITX.', score:86, feedback:null },
    { id:3, topic:'Onsen-style bathing at a Korean cabin: what ZH guests ask', why:'Covers cross-cultural amenity concern. CO_OCCURS with "jjimjilbang" graph cluster.', score:81, feedback:null },
  ]);

  const vote = (id, v) => setProposals(p=>p.map(x=>x.id===id?{...x,feedback:v}:x));

  return (
    <div className="page" style={{maxWidth:1100}}>
      <div className="page__header">
        <div className="page__header-row">
          <div>
            <h1 className="page__title">디렉션 <Chip kind="ok" dot style={{marginLeft:6,verticalAlign:'middle'}}>Phase 9</Chip></h1>
            <div className="page__sub">이번 주 방향을 한 문장으로 작성하면, Director가 GSC·그래프 맥락에 맞춰 3개 주제를 제안합니다.</div>
          </div>
        </div>
      </div>

      <div className="card" style={{marginBottom:14}}>
        <div className="card__head"><AgentAvatar agent="director" size={20}/><div className="card__title">이번 주의 방향</div><div className="spacer"/><span style={{fontSize:11,color:'var(--text-3)'}}>{input.length}/500</span></div>
        <div style={{padding:14}}>
          <textarea value={input} onChange={e=>setInput(e.target.value)}
            style={{width:'100%',minHeight:90,border:'1px solid var(--line-2)',borderRadius:8,padding:12,resize:'vertical',outline:'none',fontSize:14,fontFamily:'var(--sans)'}}/>
          <div style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}}>
            <button className="btn btn--accent" onClick={()=>{setLoading(true);setTimeout(()=>setLoading(false),900);}}>
              <Icons.Sparkle size={13}/> {loading?'제안 생성 중…':'주제 제안 생성'}
            </button>
            <button className="btn"><Icons.Refresh size={12}/> 다시 섞기</button>
            <div className="spacer"/>
            <Chip kind="ghost">최근 피드백 5개를 few-shot으로 반영</Chip>
          </div>
        </div>
      </div>

      <div style={{display:'flex',alignItems:'center',gap:8,margin:'18px 0 10px'}}>
        <div style={{fontSize:13,fontWeight:600}}>제안</div>
        <Chip kind="ghost">{proposals.length}</Chip>
        <div className="spacer"/>
        <button className="btn btn--accent btn--sm"><Icons.Play size={12}/> 1순위 실행</button>
      </div>

      <div className="grid grid--3">
        {proposals.map((p,i)=>(
          <div key={p.id} className="card" style={{display:'flex',flexDirection:'column'}}>
            <div style={{padding:'12px 14px 8px',borderBottom:'1px solid var(--line)'}}>
              <div style={{display:'flex',gap:6,alignItems:'center'}}>
                <div style={{width:20,height:20,borderRadius:5,background:i===0?'var(--accent)':'var(--bg-muted)',color:i===0?'#fff':'var(--text-3)',fontSize:11,fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center'}} className="mono">{i+1}</div>
                <Chip kind={p.score>=90?'ok':p.score>=85?'warn':'ghost'} dot>score {p.score}</Chip>
              </div>
              <div style={{fontSize:14,fontWeight:600,marginTop:8,lineHeight:1.35}}>{p.topic}</div>
            </div>
            <div style={{padding:'10px 14px',fontSize:12,color:'var(--text-3)',lineHeight:1.5,flex:1}}>
              <div style={{fontSize:10.5,textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-4)',marginBottom:4}}>제안 이유</div>
              {p.why}
            </div>
            <div style={{padding:10,borderTop:'1px solid var(--line)',display:'flex',gap:6,alignItems:'center'}}>
              <button className={`btn btn--sm ${p.feedback==='up'?'btn--accent':''}`} onClick={()=>vote(p.id,'up')}>👍 채택</button>
              <button className={`btn btn--sm ${p.feedback==='down'?'':''}`} style={p.feedback==='down'?{background:'var(--err-soft)',color:'var(--err)',borderColor:'transparent'}:{}} onClick={()=>vote(p.id,'down')}>👎 제외</button>
              <div className="spacer"/>
              <button className="btn btn--sm"><Icons.Edit size={11}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- PublishQueue (Phase 9) — 1-click Approve per item ---
const PublishQueue = () => {
  const D = window.BLOG_DATA;
  const [items, setItems] = React.useState([
    { slug:D.DRAFTS[0].slug, title:D.DRAFTS[0].title, ja:D.DRAFTS[0].ja, zh:D.DRAFTS[0].zh, image:D.DRAFTS[0].image,
      verification:'verified', quality:92, unsupported:0, contradicted:0, links:4, approved:false, blocked:false },
    { slug:D.DRAFTS[1].slug, title:D.DRAFTS[1].title, ja:D.DRAFTS[1].ja, zh:D.DRAFTS[1].zh, image:D.DRAFTS[1].image,
      verification:'partial', quality:84, unsupported:1, contradicted:0, links:3, approved:false, blocked:false, note:'미검증 주장 1건 · Writer가 자동으로 완화 표현으로 재작성' },
    { slug:D.DRAFTS[2].slug, title:D.DRAFTS[2].title, ja:D.DRAFTS[2].ja, zh:D.DRAFTS[2].zh, image:D.DRAFTS[2].image,
      verification:'blocked', quality:61, unsupported:2, contradicted:1, links:0, approved:false, blocked:true, note:'모순되는 주장 1건 — 사람 검토 필요' },
  ]);
  const approve = (slug) => setItems(p=>p.map(i=>i.slug===slug?{...i,approved:true}:i));
  const unblock = (slug) => setItems(p=>p.map(i=>i.slug===slug?{...i,blocked:false,verification:'partial'}:i));

  const vKind = {verified:'ok', partial:'warn', blocked:'err', skipped:'ghost'};

  return (
    <div className="page" style={{maxWidth:1200}}>
      <div className="page__header">
        <div className="page__header-row">
          <div>
            <h1 className="page__title">승인 대기열 <Chip kind="ok" dot style={{marginLeft:6,verticalAlign:'middle'}}>원클릭 승인</Chip></h1>
            <div className="page__sub">Writer → Verifier → Translate → Packager → Linker 까지 완료. 승인 1회로 3개 언어 발행 + 그래프 추출이 동시에 진행됩니다.</div>
          </div>
          <div className="row">
            <Chip kind="ghost">{items.filter(i=>!i.approved&&!i.blocked).length}건 대기</Chip>
            <button className="btn btn--accent"><Icons.Check size={13}/> 대기중 전체 승인</button>
          </div>
        </div>
      </div>

      <div className="grid grid--4" style={{marginBottom:14}}>
        <Metric label="승인 대기" value={items.filter(i=>!i.blocked&&!i.approved).length} deltaKind="ok"/>
        <Metric label="차단" value={items.filter(i=>i.blocked).length} delta="모순 주장 발견" deltaKind="warn"/>
        <Metric label="평균 품질" value={Math.round(items.reduce((s,i)=>s+i.quality,0)/items.length)} unit="/100"/>
        <Metric label="사이클 비용" value="$4.21" unit="/ $5.00" bar={4.21/5} deltaKind="ok" delta="Lean 프로파일"/>
      </div>

      {items.map(it=>(
        <div key={it.slug} className="card" style={{marginBottom:12, borderColor: it.blocked?'var(--err)':it.approved?'var(--ok)':'var(--line)'}}>
          <div style={{display:'grid',gridTemplateColumns:'100px 1fr auto',gap:0,alignItems:'stretch'}}>
            <div style={{overflow:'hidden'}}><HeroPlaceholder kind={it.image} height="100%"/></div>
            <div style={{padding:'14px 16px',minWidth:0}}>
              <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:6,flexWrap:'wrap'}}>
                <Chip kind={vKind[it.verification]} dot>{it.verification}</Chip>
                <Chip kind="ghost">품질 {it.quality}/100</Chip>
                <Chip kind="ghost">내부링크 {it.links}개</Chip>
                {it.unsupported>0 && <Chip kind="warn">미검증: {it.unsupported}</Chip>}
                {it.contradicted>0 && <Chip kind="err">모순: {it.contradicted}</Chip>}
              </div>
              <div style={{fontSize:14.5,fontWeight:600,marginBottom:4}} className="ellipsis">{it.title}</div>
              <div style={{display:'flex',gap:14,fontSize:12,color:'var(--text-3)',flexWrap:'wrap'}}>
                <span>🇬🇧 {it.title.slice(0,40)}…</span>
                <span>🇯🇵 {it.ja.slice(0,24)}…</span>
                <span>🇨🇳 {it.zh.slice(0,24)}…</span>
              </div>
              {it.note && (
                <div style={{marginTop:8,padding:'6px 10px',background:it.blocked?'var(--err-soft)':'var(--warn-soft)',color:it.blocked?'var(--err)':'var(--warn)',borderRadius:6,fontSize:12,display:'flex',gap:6,alignItems:'center'}}>
                  <Icons.Warn size={12}/> {it.note}
                </div>
              )}
              {/* Pipeline stage dots */}
              <div style={{display:'flex',gap:6,marginTop:10,alignItems:'center',fontSize:11,color:'var(--text-3)'}}>
                {['writer','verifier','translate','packager','linker'].map((a,i)=>(
                  <React.Fragment key={a}>
                    <div style={{display:'flex',alignItems:'center',gap:4}}>
                      <AgentAvatar agent={a} size={16}/>
                      <Icons.Check size={11} style={{color: it.blocked && a==='verifier' ? 'var(--err)' : 'var(--ok)'}}/>
                    </div>
                    {i<4 && <span style={{color:'var(--line-3)'}}>→</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div style={{padding:14,display:'flex',flexDirection:'column',gap:6,minWidth:180,borderLeft:'1px solid var(--line)',justifyContent:'center'}}>
              {it.approved ? (
                <Chip kind="ok" dot>발행 완료</Chip>
              ) : it.blocked ? (
                <>
                  <button className="btn btn--sm"><Icons.Eye size={12}/> 주장 검토</button>
                  <button className="btn btn--sm" onClick={()=>unblock(it.slug)}>차단 해제</button>
                  <button className="btn btn--sm" style={{color:'var(--err)'}}>반려</button>
                </>
              ) : (
                <>
                  <button className="btn btn--accent" onClick={()=>approve(it.slug)}><Icons.Check size={13}/> 승인</button>
                  <button className="btn btn--sm"><Icons.Eye size={12}/> 미리보기</button>
                  <button className="btn btn--sm">반려</button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// --- Graph Explorer (Phase 8/11) ---
const GraphExplorer = () => {
  const entities = [
    { id:'asty', label:'ASTY Cabin',   type:'brand',    x:50, y:50, size:30, global:false },
    { id:'yang', label:'Yangpyeong',   type:'place',    x:25, y:30, size:22, global:true },
    { id:'pine', label:'Korean pine',  type:'thing',    x:72, y:25, size:16, global:true },
    { id:'kett', label:'Kettle ritual',type:'concept',  x:75, y:60, size:14, global:false },
    { id:'hanok',label:'Hanok',        type:'thing',    x:18, y:70, size:18, global:true },
    { id:'jjim', label:'Jjimjilbang',  type:'thing',    x:42, y:78, size:16, global:true },
    { id:'dum',  label:'Dumulmeori',   type:'place',    x:15, y:50, size:14, global:true },
    { id:'itx',  label:'ITX Cheongchun',type:'thing',   x:58, y:20, size:13, global:true },
  ];
  const edges = [
    ['asty','yang'],['asty','pine'],['asty','kett'],['asty','hanok'],['asty','jjim'],
    ['yang','dum'],['yang','itx'],['hanok','jjim'],['pine','yang'],
  ];
  const typeColor = {brand:'var(--accent)', place:'var(--blue)', thing:'var(--amber)', concept:'var(--violet)'};

  return (
    <div className="page" style={{maxWidth:1400}}>
      <div className="page__header">
        <div className="page__header-row">
          <div>
            <h1 className="page__title">그래프 탐색 <Chip kind="ghost" style={{marginLeft:6,verticalAlign:'middle'}}>Phase 8</Chip></h1>
            <div className="page__sub">엔티티 127개 · 관계 284개 · <b>ASTY Cabin</b> 기준 2-hop 서브그래프</div>
          </div>
          <div className="row">
            <div className="topbar__search" style={{display:'flex'}}><Icons.Search size={14}/><input placeholder="엔티티 검색…" defaultValue="ASTY Cabin"/></div>
            <button className="btn"><Icons.External size={12}/> JSON 내보내기</button>
          </div>
        </div>
      </div>

      <div className="grid grid--4" style={{marginBottom:14}}>
        <Metric label="엔티티" value="127" delta="글로벌 68 · 로컬 59"/>
        <Metric label="관계" value="284" delta="COVERS, CO_OCCURS, MENTIONS"/>
        <Metric label="이번 달 추출" value="9편" delta="격주 모드 · Lean"/>
        <Metric label="API p95" value="218" unit="ms" delta="목표 < 300ms" deltaKind="ok"/>
      </div>

      <div className="grid grid--2" style={{gridTemplateColumns:'2fr 1fr'}}>
        <div className="card">
          <div className="card__head"><div className="card__title">2-hop 서브그래프</div><div className="spacer"/>
            <div className="row" style={{gap:10,fontSize:11,color:'var(--text-3)'}}>
              {Object.entries(typeColor).map(([t,c])=>(
                <div key={t} style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:8,height:8,borderRadius:'50%',background:c}}/>{t}</div>
              ))}
            </div>
          </div>
          <div style={{background:'var(--bg-subtle)',height:420,position:'relative',backgroundImage:'radial-gradient(circle at 1px 1px, var(--line-2) 1px, transparent 0)',backgroundSize:'20px 20px'}}>
            <svg style={{position:'absolute',inset:0,width:'100%',height:'100%'}} viewBox="0 0 100 100" preserveAspectRatio="none">
              {edges.map(([a,b],i)=>{
                const A=entities.find(e=>e.id===a), B=entities.find(e=>e.id===b);
                return <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="var(--line-3)" strokeWidth="0.3" strokeDasharray="1 1"/>;
              })}
            </svg>
            {entities.map(e=>(
              <div key={e.id} style={{
                position:'absolute', left:`${e.x}%`, top:`${e.y}%`,
                transform:'translate(-50%,-50%)',
                background:'#fff', border:`2px solid ${typeColor[e.type]}`,
                borderRadius:'50%', width:e.size+18, height:e.size+18,
                display:'flex',alignItems:'center',justifyContent:'center',
                cursor:'pointer',boxShadow:'var(--shadow-sm)',
              }}>
                <div style={{fontSize:10,fontWeight:500,textAlign:'center',padding:4,lineHeight:1.1}}>{e.label}</div>
                {e.global && <div style={{position:'absolute',top:-2,right:-2,width:8,height:8,borderRadius:'50%',background:'var(--accent)',border:'2px solid #fff'}} title="global"/>}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card__head"><div className="card__title">ASTY Cabin</div><Chip kind="ok">brand</Chip></div>
          <div className="card__body">
            <div style={{fontSize:12,color:'var(--text-3)',marginBottom:10}}>직접 관계 5개 · 2-hop 내 12개</div>
            <div style={{fontSize:11,textTransform:'uppercase',color:'var(--text-4)',letterSpacing:'0.05em',marginBottom:6}}>COVERS</div>
            {['Yangpyeong','Kettle ritual','Hanok'].map(e=>(
              <div key={e} style={{padding:'6px 0',fontSize:13,display:'flex',alignItems:'center',gap:8,borderBottom:'1px solid var(--line)'}}>
                <span style={{width:8,height:8,borderRadius:'50%',background:'var(--accent)'}}/> {e}
                <div className="spacer"/>
                <span className="mono" style={{fontSize:11,color:'var(--text-3)'}}>포스트 3</span>
              </div>
            ))}
            <div style={{fontSize:11,textTransform:'uppercase',color:'var(--text-4)',letterSpacing:'0.05em',margin:'14px 0 6px'}}>CO_OCCURS</div>
            {['Jjimjilbang','ITX Cheongchun','Korean pine'].map(e=>(
              <div key={e} style={{padding:'6px 0',fontSize:13,display:'flex',alignItems:'center',gap:8,borderBottom:'1px solid var(--line)'}}>
                <span style={{width:8,height:8,borderRadius:'50%',background:'var(--blue)'}}/> {e}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Portfolio (Phase 12) ---
const Portfolio = () => {
  const sites = [
    { id:'asty-cabin', name:'ASTY Cabin',   profile:'Lean',    spent:4.21, budget:5, posts:9,  halt:false },
    { id:'site-b',     name:'site-b',       profile:'Standard',spent:5.18, budget:5, posts:11, halt:true },
    { id:'site-c',     name:'site-c',       profile:'Lean',    spent:3.12, budget:5, posts:7,  halt:false },
  ];
  const matrix = [
    { entity:'Cabin stays',   asty:9, b:2, c:0 },
    { entity:'Korean cuisine',asty:1, b:7, c:0 },
    { entity:'Weekend trips', asty:6, b:4, c:3 },
    { entity:'Outdoor gear',  asty:0, b:0, c:7 },
    { entity:'Yangpyeong',    asty:5, b:0, c:0 },
  ];
  return (
    <div className="page" style={{maxWidth:1300}}>
      <div className="page__header">
        <div className="page__header-row">
          <div>
            <h1 className="page__title">포트폴리오 <Chip kind="ghost" style={{marginLeft:6,verticalAlign:'middle'}}>Phase 12</Chip></h1>
            <div className="page__sub">사이트 3개 · Strategist가 사이트 간 주제 충돌을 방지하고 고성과 패턴을 전파합니다.</div>
          </div>
          <button className="btn btn--accent"><Icons.Plus size={13}/> 사이트 추가</button>
        </div>
      </div>

      <div className="grid grid--3" style={{marginBottom:14}}>
        {sites.map(s=>(
          <div key={s.id} className="card">
            <div style={{padding:14}}>
              <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
                <div style={{width:32,height:32,borderRadius:7,background:'var(--bg-muted)',color:'var(--text-2)',fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center'}}>{s.name[0].toUpperCase()}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:600}} className="ellipsis">{s.name}</div>
                  <div className="mono" style={{fontSize:11,color:'var(--text-3)'}}>{s.id}</div>
                </div>
                <Chip kind={s.profile==='Lean'?'ok':s.profile==='Standard'?'warn':'err'}>{s.profile}</Chip>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}>
                <span className="muted">지출</span>
                <span className="mono" style={{fontWeight:500,color:s.halt?'var(--err)':'var(--text)'}}>${s.spent.toFixed(2)} / ${s.budget}</span>
              </div>
              <ProgressBar segments={[{value:s.spent, color:s.halt?'var(--err)':'var(--accent)'}]} total={s.budget}/>
              {s.halt && <div style={{marginTop:8,padding:'6px 10px',background:'var(--err-soft)',color:'var(--err)',borderRadius:6,fontSize:11.5,display:'flex',gap:6,alignItems:'center'}}><Icons.Warn size={11}/> budget-guard가 사이클을 중단함</div>}
              <div style={{display:'flex',gap:10,marginTop:10,paddingTop:10,borderTop:'1px solid var(--line)',fontSize:12}}>
                <div><div className="muted" style={{fontSize:10.5}}>이번 달 포스트</div><div style={{fontWeight:500}}>{s.posts}</div></div>
                <div><div className="muted" style={{fontSize:10.5}}>편당 평균</div><div className="mono" style={{fontWeight:500}}>${(s.spent/s.posts).toFixed(2)}</div></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card__head"><div className="card__title">주제 × 사이트 매트릭스</div><Chip kind="ghost">중복 없음</Chip><div className="spacer"/><span style={{fontSize:11,color:'var(--text-3)'}}>Strategist가 주간 단위로 재조정</span></div>
        <table className="table">
          <thead><tr><th>엔티티 / 클러스터</th>{sites.map(s=><th key={s.id} style={{textAlign:'center'}}>{s.name}</th>)}<th style={{textAlign:'center'}}>주담당</th></tr></thead>
          <tbody>
            {matrix.map(r=>{
              const vals=[r.asty,r.b,r.c]; const max=Math.max(...vals); const leadIdx=vals.indexOf(max);
              return (
                <tr key={r.entity}>
                  <td style={{fontWeight:500}}>{r.entity}</td>
                  {vals.map((v,i)=>(
                    <td key={i} style={{textAlign:'center'}}>
                      <div style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:32,height:24,borderRadius:5,background:v===0?'transparent':`rgba(47,111,78,${Math.min(1,0.15+v*0.08)})`,color:v===0?'var(--text-4)':'var(--accent-ink)',fontWeight:500,fontSize:12}} className="mono">{v}</div>
                    </td>
                  ))}
                  <td style={{textAlign:'center'}}><Chip kind="ok">{sites[leadIdx].name}</Chip></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- GSC (Phase 10) ---
const GSC = () => {
  const rows = [
    {kw:'yangpyeong cabin winter', pos:12, clicks:42, impr:1240, ctr:3.4, status:'striking'},
    {kw:'korean cabin stay',       pos:8,  clicks:118,impr:2310, ctr:5.1, status:'striking'},
    {kw:'asty cabin jjimjilbang',  pos:4,  clicks:204,impr:1890, ctr:10.8,status:'top'},
    {kw:'hanok vs cabin',          pos:18, clicks:12, impr:980,  ctr:1.2, status:'striking'},
    {kw:'dumulmeori day trip',     pos:24, clicks:3,  impr:410,  ctr:0.7, status:'opportunity'},
  ];
  return (
    <div className="page" style={{maxWidth:1200}}>
      <div className="page__header">
        <h1 className="page__title">Search Console <Chip kind="ghost" style={{marginLeft:6,verticalAlign:'middle'}}>Phase 10</Chip></h1>
        <div className="page__sub">striking-distance 키워드(순위 8–20)는 다음 사이클에서 seo-researcher에게 자동 전달됩니다.</div>
      </div>
      <div className="grid grid--4" style={{marginBottom:14}}>
        <Metric label="총 클릭 (28일)" value="1,284" delta="+18% 전월 대비" deltaKind="ok"/>
        <Metric label="노출" value="24.6k"/>
        <Metric label="평균 순위" value="14.2" delta="전주 대비 −2.1" deltaKind="ok"/>
        <Metric label="Striking 키워드" value="38" delta="다음 작성에 반영"/>
      </div>
      <div className="card">
        <div className="card__head"><div className="card__title">상위 기회</div><div className="spacer"/><Segmented value="all" onChange={()=>{}} options={[{value:'all',label:'전체'},{value:'str',label:'Striking'},{value:'top',label:'Top 10'}]}/></div>
        <table className="table">
          <thead><tr><th>키워드</th><th>순위</th><th>클릭</th><th>노출</th><th>CTR</th><th>상태</th><th></th></tr></thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.kw}>
                <td className="mono" style={{fontWeight:500}}>{r.kw}</td>
                <td className="mono">{r.pos}</td>
                <td className="mono">{r.clicks}</td>
                <td className="mono">{r.impr.toLocaleString()}</td>
                <td className="mono">{r.ctr}%</td>
                <td><Chip kind={r.status==='top'?'ok':r.status==='striking'?'warn':'ghost'} dot>{r.status}</Chip></td>
                <td><button className="btn btn--sm"><Icons.Plus size={11}/> 큐에 추가</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

Object.assign(window, { Direction, PublishQueue, GraphExplorer, Portfolio, GSC });
