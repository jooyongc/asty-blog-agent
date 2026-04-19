// Drafts page — list + review with EN/JA/ZH tabs
const Drafts = () => {
  const D = window.BLOG_DATA;
  const [selected, setSelected] = React.useState(D.DRAFTS[0].slug);
  const [lang, setLang] = React.useState('en');
  const [filter, setFilter] = React.useState('all');
  const [mobilePanelOpen, setMobilePanelOpen] = React.useState(false);

  const filtered = D.DRAFTS.filter(d=>{
    if(filter==='all') return true;
    return d.status===filter;
  });
  const draft = D.DRAFTS.find(d=>d.slug===selected);

  const ARTICLE_BODIES = {
    en: {
      title: draft.title,
      lede: 'A slow-weekend guide to staying at ASTY Cabin in Yangpyeong during winter — when silence is the amenity.',
      body: [
        {h:'What first-timers miss', p:'Most guides will tell you what to pack for a winter cabin weekend. The better question is what to unpack: your schedule, your inbox, your own idea of how a day should go. Yangpyeong in January rewards stillness more than planning — the pines hold snow without boast, and the valley hushes its own river by mid-afternoon.'},
        {h:'Arrive before 3 p.m.', p:'The amber window — roughly 3:00 to 5:00 p.m. — is the light most ASTY guests talk about later. It lands low and soft against the cedar decking and makes the first hour of your stay feel like you\'ve been there all week. Missing it is the one real cost of a late check-in.'},
        {h:'The kettle, not the Wi-Fi', p:'The single amenity that will matter most is the one you\'ll barely notice: the kettle. Plan the weekend around when water boils, not when posts upload. Korean cabin stays have a rhythm of tea, then walk, then tea again. The mountain is patient about this.'},
      ],
    },
    ja: {
      title: draft.ja,
      lede: '冬の楊平、ASTY キャビンでの静かな週末ガイド — 静けさがそのまま設備になる時間。',
      body: [
        {h:'初めての方が見落とすもの', p:'たいていのガイドは、冬のキャビン週末に何を持っていくかを教えてくれる。でも、より良い問いは「何を置いていくか」だ。予定、受信箱、そして「1日はこうあるべき」という自分の思い込み。1月の楊平は、計画よりも静けさに報いてくれる。松は雪を誇らず受け止め、谷は午後なかばには自ら川の音をひそめる。'},
        {h:'午後3時までに到着する', p:'午後3時から5時ごろの琥珀色の光は、ASTY の宿泊客があとになって語り合う景色だ。低く柔らかな光が杉のデッキに差し込み、滞在の最初の1時間を、もう1週間そこにいたような感覚にしてくれる。この光を逃すことだけが、チェックインが遅れる唯一の本当の代償だ。'},
        {h:'Wi-Fiではなく、ケトルを', p:'いちばん大事なのに、ほとんど気に留めない設備 — それがケトルだ。投稿のアップロード時間ではなく、湯が沸く時間で週末を組み立てる。韓国のキャビン滞在は、お茶、散歩、またお茶、というリズムを持っている。山はそれを急がない。'},
      ],
    },
    zh: {
      title: draft.zh,
      lede: '冬日杨平的慢周末指南 —— 在 ASTY 小木屋里，安静本身就是一种设施。',
      body: [
        {h:'初访者最容易忽略的', p:'大多数指南都会告诉你冬季木屋周末该带什么。更好的问题是：该放下什么——你的日程、你的邮件、你自己对「一天应该怎样过」的预设。一月的杨平，奖赏的不是计划，而是安静。松树从容地承接积雪，山谷在午后便自行压低了河声。'},
        {h:'下午三点前抵达', p:'下午3点到5点的那段琥珀色光线，是许多 ASTY 客人日后仍会提起的景致。柔和低斜的光落在雪松地板上，会让你入住的第一个小时，仿佛已经在这里度过了一整周。错过它，才是迟到入住的唯一真正代价。'},
        {h:'留意水壶，而非 Wi-Fi', p:'最不起眼却最重要的设施，是水壶。请用「水烧开」而非「上传完成」来安排周末。韩式小木屋住宿有一种节奏：茶、散步、再一杯茶。山，对此从不催促。'},
      ],
    },
  };
  const article = ARTICLE_BODIES[lang];

  return (
    <div className="page drafts-page" style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:14,alignItems:'flex-start',maxWidth:1600}}>
      {/* Sidebar list */}
      <div className={`card ${mobilePanelOpen?'':''}`} style={{position:'sticky',top:72}}>
        <div className="card__head">
          <div className="card__title">Drafts</div>
          <Chip kind="ghost">{filtered.length}</Chip>
          <div className="spacer"/>
          <button className="btn btn--icon btn--ghost"><Icons.Filter size={13}/></button>
        </div>
        <div style={{padding:'10px 12px',borderBottom:'1px solid var(--line)'}}>
          <Segmented value={filter} onChange={setFilter} options={[
            {value:'all',label:'All'},{value:'ready',label:'Ready'},{value:'drafting',label:'Drafting'},
          ]}/>
        </div>
        <div style={{padding:'6px 6px 10px',maxHeight:'calc(100vh - 240px)',overflowY:'auto'}}>
          {filtered.map(d=>(
            <button key={d.slug} onClick={()=>setSelected(d.slug)}
              style={{
                width:'100%',textAlign:'left',padding:'10px',borderRadius:8,
                background: selected===d.slug ? 'var(--bg-hover)' : 'transparent',
                display:'flex',flexDirection:'column',gap:5,
              }}>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <div style={{width:20,height:20,borderRadius:4,overflow:'hidden',flexShrink:0}}><HeroPlaceholder kind={d.image} height={20}/></div>
                <div className="ellipsis" style={{fontSize:13,fontWeight:500,flex:1}}>{d.title}</div>
              </div>
              <div style={{display:'flex',gap:5,alignItems:'center'}}>
                {d.status==='ready' ? <Chip kind="ok" dot>ready</Chip> : <Chip kind="warn" dot>drafting</Chip>}
                <LangChip lang="en" on={d.languages.en} small/>
                <LangChip lang="ja" on={d.languages.ja} small/>
                <LangChip lang="zh" on={d.languages.zh} small/>
              </div>
              <div style={{fontSize:11,color:'var(--text-4)'}}>{d.updatedAt}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Review panel */}
      <div className="card">
        <div className="card__head" style={{flexWrap:'wrap',gap:8}}>
          <div style={{minWidth:0,flex:1}}>
            <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:3}}>
              {draft.status==='ready' ? <Chip kind="ok" dot>ready</Chip> : <Chip kind="warn" dot>drafting</Chip>}
              <Chip kind="ghost">{draft.category}</Chip>
            </div>
            <div className="card__title ellipsis">{draft.title}</div>
            <div className="mono" style={{fontSize:11,color:'var(--text-3)'}}>content/drafts/{draft.slug}/</div>
          </div>
          <div className="row">
            <button className="btn btn--sm"><Icons.Sparkle size={12}/> /polish</button>
            <button className="btn btn--sm"><Icons.Edit size={12}/> Edit</button>
            <button className="btn btn--accent btn--sm"><Icons.Send size={12}/> Publish</button>
          </div>
        </div>

        {/* Metadata strip */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(120px,1fr))',padding:'10px 18px',borderBottom:'1px solid var(--line)',background:'var(--bg-subtle)'}}>
          {[
            {l:'Words (EN)', v:draft.words.en.toLocaleString()},
            {l:'Reading', v:`${draft.readingMin.en} min`},
            {l:'Cost', v:`$${draft.cost.toFixed(2)}`},
            {l:'Tokens I/O', v:`${(draft.tokensIn/1000).toFixed(1)}k / ${(draft.tokensOut/1000).toFixed(1)}k`},
            {l:'Image', v:draft.images? '1 × Unsplash' : '—'},
            {l:'Scheduled', v:draft.scheduledFor},
          ].map(m=>(
            <div key={m.l} style={{padding:'4px 0'}}>
              <div style={{fontSize:10.5,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.04em'}}>{m.l}</div>
              <div style={{fontSize:13,fontWeight:500}} className="mono">{m.v}</div>
            </div>
          ))}
        </div>

        {/* Lang tabs */}
        <div style={{padding:'0 18px'}}>
          <Tabs value={lang} onChange={setLang} tabs={[
            {value:'en', label:<>🇬🇧 English</>, count:draft.words.en},
            {value:'ja', label:<>🇯🇵 日本語</>, count:draft.words.ja||'—'},
            {value:'zh', label:<>🇨🇳 简体中文</>, count:draft.words.zh||'—'},
          ]}/>
        </div>

        {/* Article body */}
        <div style={{padding:'8px 32px 32px',maxHeight:'calc(100vh - 280px)',overflowY:'auto'}}>
          <HeroPlaceholder kind={draft.image} height={180}/>
          <div style={{marginTop:18}}>
            <article className={`article-body ${lang==='ja'?'ja':lang==='zh'?'zh':''}`}>
              <h1>{article.title}</h1>
              <p className="lede">{article.lede}</p>
              {article.body.map((s,i)=>(
                <React.Fragment key={i}>
                  <h2>{s.h}</h2>
                  <p>{s.p}</p>
                </React.Fragment>
              ))}
            </article>
          </div>

          {draft.warnings.length>0 && (
            <div style={{marginTop:20,padding:12,background:'var(--warn-soft)',borderRadius:8,display:'flex',gap:10,alignItems:'flex-start'}}>
              <Icons.Warn size={14} style={{color:'var(--warn)',marginTop:2}}/>
              <div>
                <div style={{fontSize:13,fontWeight:500,color:'var(--warn-ink,var(--warn))'}}>Review warnings</div>
                <ul style={{margin:'4px 0 0',paddingLeft:18,fontSize:12.5,color:'var(--text-2)'}}>
                  {draft.warnings.map((w,i)=><li key={i}>{w}</li>)}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
window.Drafts = Drafts;
