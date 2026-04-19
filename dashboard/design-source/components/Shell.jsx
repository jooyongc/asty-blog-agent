// App shell: sidebar + topbar + router
const { useState: uS, useEffect: uE } = React;

const NAV = [
  { group:'워크스페이스', items:[
    { id:'overview',  label:'개요',          icon:'Home',   badge:null },
    { id:'direction', label:'디렉션',        icon:'Sparkle',badge:'new' },
    { id:'agents',    label:'에이전트', icon:'Flow',   badge:'live' },
    { id:'weekly',    label:'주간 실행',     icon:'Play',   badge:null },
  ]},
  { group:'콘텐츠', items:[
    { id:'drafts',    label:'초안',          icon:'Doc',    badge:'3' },
    { id:'queue',     label:'승인 대기열',   icon:'Check',  badge:'2' },
    { id:'publish',   label:'발행',          icon:'Send',   badge:null },
    { id:'topics',    label:'주제 큐',       icon:'Layers', badge:'6' },
    { id:'glossary',  label:'용어집',        icon:'Book',   badge:null },
  ]},
  { group:'인텔리전스', items:[
    { id:'graph',     label:'그래프',       icon:'Flow',   badge:'ph.8' },
    { id:'gsc',       label:'Search Console',icon:'Chart',  badge:null },
    { id:'portfolio', label:'포트폴리오',    icon:'Layers', badge:'ph.12' },
  ]},
  { group:'시스템', items:[
    { id:'analytics', label:'비용 · 토큰',   icon:'Chart',  badge:null },
    { id:'logs',      label:'실행 이력',     icon:'Clock',  badge:null },
    { id:'settings',  label:'설정',          icon:'Settings', badge:null },
  ]},
];

const ROUTE_TITLES = {
  overview:'개요', direction:'디렉션', agents:'에이전트 흐름', weekly:'주간 실행',
  drafts:'초안', queue:'승인 대기열', publish:'발행', topics:'주제 큐', glossary:'용어집',
  graph:'그래프 탐색', gsc:'Search Console', portfolio:'포트폴리오',
  analytics:'비용 · 토큰', logs:'실행 이력', settings:'설정',
};

function Sidebar({route, setRoute, open, setOpen}){
  return (
    <>
      {open && <div className="sidebar-overlay sidebar-overlay--on" onClick={()=>setOpen(false)}/>}
      <aside className={`sidebar ${open?'sidebar--open':''}`}>
        <div className="sidebar__brand">
          <div className="sidebar__mark">A</div>
          <div>
            <div className="sidebar__title">ASTY Blog Agent</div>
            <div className="sidebar__sub">Lean 프로파일 · Haiku 4.5</div>
          </div>
        </div>

        {NAV.map(g=>(
          <div key={g.group} className="sidebar__group">
            <div className="sidebar__group-label">{g.group}</div>
            {g.items.map(it=>{
              const I = Icons[it.icon];
              const active = route===it.id;
              return (
                <button key={it.id}
                  className={`sidebar__item ${active?'sidebar__item--active':''}`}
                  onClick={()=>{setRoute(it.id); setOpen(false);}}>
                  <I/>
                  <span>{it.label}</span>
                  {it.badge==='live' && <span className="sidebar__badge sidebar__badge--live">live</span>}
                  {it.badge==='new' && <span className="sidebar__badge sidebar__badge--new">new</span>}
                  {it.badge && it.badge!=='live' && it.badge!=='new' && <span className="sidebar__badge">{it.badge}</span>}
                </button>
              );
            })}
          </div>
        ))}

        <div className="sidebar__footer">
          <div className="sidebar__avatar">JC</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,fontWeight:500}} className="ellipsis">jooyongc</div>
            <div style={{fontSize:11,color:'var(--text-3)'}}>ASTY workspace</div>
          </div>
          <button className="btn btn--icon btn--ghost dot-notif" title="Notifications"><Icons.Bell size={15}/></button>
        </div>
      </aside>
    </>
  );
}

function Topbar({route, setSidebarOpen}){
  return (
    <div className="topbar">
      <button className="topbar__mobile-toggle show-mobile" onClick={()=>setSidebarOpen(s=>!s)}><Icons.Menu/></button>
      <div className="topbar__crumbs">
        <span className="topbar__crumb-parent">ASTY Cabin</span>
        <span className="topbar__crumb-parent"><Icons.Chevron size={12}/></span>
        <span>{ROUTE_TITLES[route]}</span>
      </div>
      <div className="topbar__right">
        <div className="topbar__search hide-mobile">
          <Icons.Search size={14}/>
          <input placeholder="초안, 주제, 로그 검색…"/>
          <span className="topbar__kbd">⌘K</span>
        </div>
        <button className="btn hide-mobile"><Icons.Refresh size={13}/> 동기화</button>
        <button className="btn btn--accent"><Icons.Play size={13}/> <span className="hide-mobile">주간 실행</span></button>
      </div>
    </div>
  );
}

Object.assign(window, { Sidebar, Topbar, NAV, ROUTE_TITLES });
