// Shared data — README-grounded (ASTY Cabin, Haiku 4.5, DeepL, etc.)
window.BLOG_DATA = (function(){
  const AGENTS = [
    { id:'director',  label:'director',  model:'Haiku 4.5', role:'Direction → 3 ranked topics' },
    { id:'seo',       label:'seo',       model:'Haiku 4.5', role:'Striking-distance keyword research' },
    { id:'writer',    label:'writer',    model:'Haiku 4.5', role:'Research + draft + self-edit' },
    { id:'verifier',  label:'verifier',  model:'Haiku 4.5', role:'Fact-check claims · blocks on contradiction' },
    { id:'translate', label:'translate', model:'DeepL',     role:'EN → JA / ZH-hans with glossary' },
    { id:'packager',  label:'packager',  model:'Haiku 4.5', role:'Multi-lang SEO metadata + schema' },
    { id:'linker',    label:'linker',    model:'Graph',     role:'CO_OCCURS internal links (3–5/article)' },
    { id:'publish',   label:'publish',   model:'HTTP',      role:'POST to site API + graph extraction' },
  ];

  const PIPELINE_STAGES = [
    { id:'director',  agent:'director',  title:'Direction → topic',  eta:'~15s' },
    { id:'seo',       agent:'seo',       title:'SEO research',       eta:'~20s' },
    { id:'writer',    agent:'writer',    title:'Research & draft',   eta:'~90s' },
    { id:'verifier',  agent:'verifier',  title:'Verify claims',      eta:'~25s' },
    { id:'translate', agent:'translate', title:'Translate JA / ZH',  eta:'~20s' },
    { id:'packager',  agent:'packager',  title:'SEO metadata + schema', eta:'~25s' },
    { id:'linker',    agent:'linker',    title:'Internal linking',   eta:'~5s'  },
  ];

  const DRAFTS = [
    {
      slug:'airbnb-korea-cabin-stay-etiquette',
      title:'Etiquette at a Korean Cabin Stay: What first-timers miss',
      ja:'初めての韓国キャビン滞在で押さえておくマナー',
      zh:'首次入住韩国小木屋不可错过的礼仪',
      category:'Travel tips',
      status:'ready',           // ready | drafting | failed
      languages:{ en:true, ja:true, zh:true },
      words:{ en:1420, ja:1180, zh:980 },
      readingMin:{ en:6, ja:5, zh:4 },
      cost:0.12,
      tokensIn:18400, tokensOut:3850,
      images:1,
      warnings:[],
      image:'pine',
      updatedAt:'2 min ago',
      stage:5,
      progress:1.0,
      scheduledFor:'Mon 09:00 KST',
      heroColor:'#2f6f4e',
    },
    {
      slug:'asty-cabin-winter-yangpyeong-guide',
      title:'Winter at Yangpyeong: A quiet cabin weekend guide',
      ja:'楊平の冬：静かなキャビンで過ごす週末ガイド',
      zh:'杨平的冬日：宁静小木屋周末指南',
      category:'Seasonal',
      status:'ready',
      languages:{ en:true, ja:true, zh:true },
      words:{ en:1680, ja:1390, zh:1150 },
      readingMin:{ en:7, ja:6, zh:5 },
      cost:0.14,
      tokensIn:19800, tokensOut:4210,
      images:1,
      warnings:['JA: 1 untranslated term flagged'],
      image:'snow',
      updatedAt:'5 min ago',
      stage:5,
      progress:1.0,
      scheduledFor:'Wed 09:00 KST',
      heroColor:'#4a6a82',
    },
    {
      slug:'cabin-cooking-local-ingredients',
      title:'Cooking at a cabin: local ingredients within 10 km of ASTY',
      ja:'キャビンで料理：ASTY から10km圏内のローカル食材',
      zh:'木屋烹饪：ASTY 10公里内的在地食材',
      category:'Food & culture',
      status:'drafting',
      languages:{ en:true, ja:false, zh:false },
      words:{ en:540, ja:0, zh:0 },
      readingMin:{ en:2, ja:0, zh:0 },
      cost:0.04,
      tokensIn:6200, tokensOut:1310,
      images:0,
      warnings:[],
      image:'harvest',
      updatedAt:'live',
      stage:1,
      progress:0.38,
      scheduledFor:'Fri 09:00 KST',
      heroColor:'#b66f1c',
    },
  ];

  const TOPIC_QUEUE = [
    { id:1, topic:'Stargazing from a Yangpyeong cabin deck (winter sky)', tags:['seasonal','outdoor'], priority:'high',  addedBy:'you',    addedAt:'Apr 14' },
    { id:2, topic:'Korean sauna (찜질방) vs cabin onsen-style bathing',   tags:['culture','comparison'], priority:'med',   addedBy:'you',    addedAt:'Apr 12' },
    { id:3, topic:'Packing list for a 2-night cabin stay with kids',     tags:['practical'], priority:'med',   addedBy:'import', addedAt:'Apr 10' },
    { id:4, topic:'ASTY Cabin pet policy — what JA guests always ask',   tags:['faq','pets'], priority:'low',   addedBy:'you',    addedAt:'Apr 08' },
    { id:5, topic:'A day trip from ASTY: Dumulmeori confluence',          tags:['itinerary'], priority:'low',   addedBy:'you',    addedAt:'Apr 06' },
    { id:6, topic:'Why cabin guests love slow breakfast',                 tags:['lifestyle'], priority:'low',   addedBy:'import', addedAt:'Apr 04' },
  ];

  const GLOSSARY_JA = [
    { src:'ASTY Cabin',     tgt:'ASTY キャビン',    locked:true  },
    { src:'Yangpyeong',     tgt:'楊平',              locked:true  },
    { src:'cabin stay',     tgt:'キャビン滞在',      locked:false },
    { src:'check-in',       tgt:'チェックイン',      locked:false },
    { src:'hanok',          tgt:'韓屋',              locked:true  },
    { src:'jjimjilbang',    tgt:'チムジルバン',      locked:true  },
  ];

  const GLOSSARY_ZH = [
    { src:'ASTY Cabin',     tgt:'ASTY 小木屋',      locked:true  },
    { src:'Yangpyeong',     tgt:'杨平',              locked:true  },
    { src:'cabin stay',     tgt:'小木屋住宿',        locked:false },
    { src:'hanok',          tgt:'韩屋',              locked:true  },
    { src:'jjimjilbang',    tgt:'汗蒸房',            locked:true  },
  ];

  // 14 weeks of cost history for chart, ending current week
  const COST_HISTORY = [
    {w:'W36',api:1.42,deepl:0,unsplash:0,polish:0},
    {w:'W37',api:1.38,deepl:0,unsplash:0,polish:0.3},
    {w:'W38',api:1.44,deepl:0,unsplash:0,polish:0},
    {w:'W39',api:1.56,deepl:0,unsplash:0,polish:0.3},
    {w:'W40',api:1.35,deepl:0,unsplash:0,polish:0},
    {w:'W41',api:1.48,deepl:0,unsplash:0,polish:0.6},
    {w:'W42',api:1.52,deepl:0,unsplash:0,polish:0},
    {w:'W43',api:1.40,deepl:0,unsplash:0,polish:0.3},
    {w:'W44',api:1.46,deepl:0,unsplash:0,polish:0},
    {w:'W45',api:1.58,deepl:0,unsplash:0,polish:0.3},
    {w:'W46',api:1.51,deepl:0,unsplash:0,polish:0},
    {w:'W47',api:1.49,deepl:0,unsplash:0,polish:0.6},
    {w:'W48',api:1.43,deepl:0,unsplash:0,polish:0},
    {w:'W49',api:0.30,deepl:0,unsplash:0,polish:0}, // current, in-progress
  ];

  const RECENT_RUNS = [
    { id:'run-049', date:'Apr 14, 21:00 KST',  articles:3, cost:1.48, duration:'14m 22s', status:'success' },
    { id:'run-048', date:'Apr 07, 21:00 KST',  articles:3, cost:1.52, duration:'12m 18s', status:'success' },
    { id:'run-047', date:'Mar 31, 21:00 KST',  articles:2, cost:0.96, duration:'9m 41s',  status:'partial' },
    { id:'run-046', date:'Mar 24, 21:00 KST',  articles:3, cost:1.40, duration:'13m 02s', status:'success' },
    { id:'run-045', date:'Mar 17, 21:00 KST',  articles:3, cost:1.46, duration:'11m 58s', status:'success' },
  ];

  return {
    AGENTS, PIPELINE_STAGES, DRAFTS, TOPIC_QUEUE,
    GLOSSARY_JA, GLOSSARY_ZH, COST_HISTORY, RECENT_RUNS,
    // Budget / month summary
    MONTH: {
      budget: 10.00,
      spent: 4.62,
      articles:{ done:9, target:12 },
      runs: 4,
      avgCostPerArticle: 0.12,
      tokensIn: 162400,
      tokensOut: 34210,
    }
  };
})();
