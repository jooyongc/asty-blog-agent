// Publish page — card-based checklist with EN/JA/ZH toggles per article
const Publish = () => {
  const D = window.BLOG_DATA;
  const [cards, setCards] = React.useState(
    D.DRAFTS.filter(d=>d.status==='ready').map(d=>({
      slug:d.slug,
      title:d.title, ja:d.ja, zh:d.zh,
      image:d.image,
      langs:{ en:true, ja:true, zh:true },
      schedule: d.scheduledFor,
      category: d.category,
      noindex:false,
      hero:true,
    }))
  );

  const setCard = (slug, patch) => setCards(prev=>prev.map(c=>c.slug===slug?{...c,...patch}:c));
  const setLang = (slug, lang, on) => setCards(prev=>prev.map(c=>c.slug===slug?{...c,langs:{...c.langs,[lang]:on}}:c));

  const totalLangs = cards.reduce((n,c)=>n+Object.values(c.langs).filter(Boolean).length,0);
  const readyCount = cards.filter(c=>Object.values(c.langs).some(Boolean)).length;

  return (
    <div className="page" style={{maxWidth:1200}}>
      <div className="page__header">
        <div className="page__header-row">
          <div>
            <h1 className="page__title">Publish</h1>
            <div className="page__sub">Toggle locales per article, confirm schedule, then ship. You can skip a locale and publish it later from the same card.</div>
          </div>
          <div className="row">
            <Chip kind="ok" dot>{totalLangs} locales queued</Chip>
            <button className="btn btn--accent"><Icons.Send size={13}/> Publish all ({readyCount})</button>
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div className="card" style={{marginBottom:14,padding:'14px 18px',display:'flex',alignItems:'center',gap:18,flexWrap:'wrap'}}>
        <div style={{display:'flex',gap:18}}>
          <div><div className="muted" style={{fontSize:11}}>Articles</div><div style={{fontSize:18,fontWeight:600}} className="mono">{cards.length}</div></div>
          <div><div className="muted" style={{fontSize:11}}>Locales</div><div style={{fontSize:18,fontWeight:600}} className="mono">{totalLangs}</div></div>
          <div><div className="muted" style={{fontSize:11}}>Est. API calls</div><div style={{fontSize:18,fontWeight:600}} className="mono">{totalLangs}</div></div>
          <div><div className="muted" style={{fontSize:11}}>Cost</div><div style={{fontSize:18,fontWeight:600}} className="mono">$0.00</div></div>
        </div>
        <div className="spacer"/>
        <div style={{display:'flex',gap:8,alignItems:'center',fontSize:12,color:'var(--text-3)'}}>
          <Icons.Globe size={14}/> asty.cabin/[locale]/blog/[slug]
        </div>
      </div>

      {cards.map(card=>(
        <div key={card.slug} className="card" style={{marginBottom:14}}>
          <div style={{display:'grid',gridTemplateColumns:'120px 1fr',gap:0}}>
            <div style={{overflow:'hidden'}}><HeroPlaceholder kind={card.image} height="100%"/></div>
            <div style={{padding:'16px 18px',display:'flex',flexDirection:'column',gap:12,minWidth:0}}>
              <div>
                <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:4}}>
                  <Chip kind="ghost">{card.category}</Chip>
                  <span style={{fontSize:11,color:'var(--text-3)',fontFamily:'var(--mono)'}}>{card.slug}</span>
                </div>
                <div style={{fontSize:15,fontWeight:600,letterSpacing:'-0.01em'}}>{card.title}</div>
              </div>

              <div className="checklist">
                {[
                  {k:'en', flag:'🇬🇧', name:'English',    title:card.title, url:`asty.cabin/en/blog/${card.slug}`},
                  {k:'ja', flag:'🇯🇵', name:'日本語',       title:card.ja,     url:`asty.cabin/ja/blog/${card.slug}`},
                  {k:'zh', flag:'🇨🇳', name:'简体中文',     title:card.zh,     url:`asty.cabin/zh/blog/${card.slug}`},
                ].map(l=>(
                  <div key={l.k} className={`checklist__row ${card.langs[l.k]?'checklist__row--on':''}`}>
                    <div className="checklist__check">
                      {card.langs[l.k] && <Icons.Check size={12}/>}
                    </div>
                    <div className="checklist__main" style={{minWidth:0}}>
                      <div style={{display:'flex',gap:6,alignItems:'center'}}>
                        <span style={{fontSize:15}}>{l.flag}</span>
                        <span>{l.name}</span>
                        <Chip kind={l.k} style={{fontSize:10}}>{l.k.toUpperCase()}</Chip>
                      </div>
                      <div className="ellipsis" style={{fontSize:12,color:'var(--text-3)',fontWeight:400,marginTop:2}}>{l.title}</div>
                      <div className="mono ellipsis" style={{fontSize:11,color:'var(--text-4)',marginTop:2}}>{l.url}</div>
                    </div>
                    <Toggle on={card.langs[l.k]} onChange={on=>setLang(card.slug,l.k,on)}/>
                  </div>
                ))}
              </div>

              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10,paddingTop:10,borderTop:'1px dashed var(--line)'}}>
                <div>
                  <div className="muted" style={{fontSize:11,marginBottom:3}}>Schedule</div>
                  <div style={{display:'flex',gap:6,alignItems:'center',padding:'5px 8px',border:'1px solid var(--line-2)',borderRadius:6,fontSize:13}}>
                    <Icons.Calendar size={12}/> <span>{card.schedule}</span>
                  </div>
                </div>
                <div>
                  <div className="muted" style={{fontSize:11,marginBottom:3}}>Visibility</div>
                  <div style={{display:'flex',gap:12,alignItems:'center',padding:'6px 0'}}>
                    <label style={{display:'flex',gap:5,alignItems:'center',fontSize:12.5}}><Toggle on={!card.noindex} onChange={on=>setCard(card.slug,{noindex:!on})}/>Index</label>
                    <label style={{display:'flex',gap:5,alignItems:'center',fontSize:12.5}}><Toggle on={card.hero} onChange={on=>setCard(card.slug,{hero:on})}/>Hero</label>
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'flex-end',gap:8,justifyContent:'flex-end',gridColumn:'auto / -1'}}>
                  <button className="btn btn--sm"><Icons.Eye size={12}/> Preview</button>
                  <button className="btn btn--sm"><Icons.Edit size={12}/> Edit</button>
                  <button className="btn btn--accent btn--sm"><Icons.Send size={12}/> Publish this</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
window.Publish = Publish;
