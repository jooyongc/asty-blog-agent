// Minimal icon set — hand-tuned 16px strokes in the Notion/Supabase vein
const Ico = ({children, size=16, ...p}) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
    stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" {...p}>
    {children}
  </svg>
);

const Icons = {
  Home:     (p)=><Ico {...p}><path d="M2.5 7L8 2.5 13.5 7V13a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5V7Z"/><path d="M6.5 13.5V9h3v4.5"/></Ico>,
  Flow:     (p)=><Ico {...p}><circle cx="3" cy="4" r="1.6"/><circle cx="13" cy="4" r="1.6"/><circle cx="3" cy="12" r="1.6"/><circle cx="13" cy="12" r="1.6"/><path d="M4.6 4h6.8M4.6 12h6.8M3 5.6v4.8M13 5.6v4.8"/></Ico>,
  Play:     (p)=><Ico {...p}><path d="M5 3.5v9l7-4.5-7-4.5Z" fill="currentColor"/></Ico>,
  Doc:      (p)=><Ico {...p}><path d="M3.5 2.5h6l3 3v8a.5.5 0 0 1-.5.5H3.5a.5.5 0 0 1-.5-.5v-11Z"/><path d="M9.5 2.5V6h3M5.5 8.5h5M5.5 11h5M5.5 6h1.5"/></Ico>,
  Send:     (p)=><Ico {...p}><path d="M14 2 2 7.5 7 9.5M14 2l-4 12-3-4.5M14 2 7 9.5"/></Ico>,
  Layers:   (p)=><Ico {...p}><path d="M8 2 2 5l6 3 6-3-6-3Z"/><path d="M2 8l6 3 6-3M2 11l6 3 6-3"/></Ico>,
  Book:     (p)=><Ico {...p}><path d="M3 3h5a2 2 0 0 1 2 2v8a2 2 0 0 0-2-2H3V3Z"/><path d="M13 3H8a2 2 0 0 0-2 2v8a2 2 0 0 1 2-2h5V3Z"/></Ico>,
  Chart:    (p)=><Ico {...p}><path d="M2.5 13.5h11M4 11V8M7 11V5M10 11V3.5M13 11V7"/></Ico>,
  Clock:    (p)=><Ico {...p}><circle cx="8" cy="8" r="5.5"/><path d="M8 5v3l2 1.5"/></Ico>,
  Settings: (p)=><Ico {...p}><circle cx="8" cy="8" r="2"/><path d="M8 1.5v2M8 12.5v2M14.5 8h-2M3.5 8h-2M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4M12.6 12.6l-1.4-1.4M4.8 4.8 3.4 3.4"/></Ico>,
  Bell:     (p)=><Ico {...p}><path d="M3.5 11h9l-1-1.5v-3a3.5 3.5 0 0 0-7 0v3L3.5 11Z"/><path d="M6.5 13a1.5 1.5 0 0 0 3 0"/></Ico>,
  Search:   (p)=><Ico {...p}><circle cx="7" cy="7" r="4.5"/><path d="m10.5 10.5 3 3"/></Ico>,
  Chevron:  (p)=><Ico {...p}><path d="m6 3 4 5-4 5"/></Ico>,
  ChevronD: (p)=><Ico {...p}><path d="m3 6 5 4 5-4"/></Ico>,
  Plus:     (p)=><Ico {...p}><path d="M8 3v10M3 8h10"/></Ico>,
  Check:    (p)=><Ico {...p}><path d="m3 8 3.5 3.5L13 5"/></Ico>,
  X:        (p)=><Ico {...p}><path d="m3.5 3.5 9 9M12.5 3.5l-9 9"/></Ico>,
  Menu:     (p)=><Ico {...p}><path d="M2.5 4h11M2.5 8h11M2.5 12h11"/></Ico>,
  Filter:   (p)=><Ico {...p}><path d="M2 3h12l-4.5 5.5v4.5L6.5 11V8.5L2 3Z"/></Ico>,
  Globe:    (p)=><Ico {...p}><circle cx="8" cy="8" r="5.5"/><path d="M2.5 8h11M8 2.5c2 1.5 2 9.5 0 11M8 2.5c-2 1.5-2 9.5 0 11"/></Ico>,
  Sparkle:  (p)=><Ico {...p}><path d="M8 2v4M8 10v4M2 8h4M10 8h4M4 4l2 2M10 10l2 2M12 4l-2 2M4 12l2-2"/></Ico>,
  Calendar: (p)=><Ico {...p}><rect x="2.5" y="3.5" width="11" height="10" rx="1.5"/><path d="M2.5 6.5h11M5.5 2v3M10.5 2v3"/></Ico>,
  Tag:      (p)=><Ico {...p}><path d="M2.5 7.5v-5h5l6 6-5 5-6-6Z"/><circle cx="5.5" cy="5.5" r="0.8" fill="currentColor"/></Ico>,
  Code:     (p)=><Ico {...p}><path d="m5 5-3 3 3 3M11 5l3 3-3 3M9.5 3.5 6.5 12.5"/></Ico>,
  Image:    (p)=><Ico {...p}><rect x="2" y="3" width="12" height="10" rx="1.5"/><circle cx="6" cy="6.5" r="1.2"/><path d="m2.5 11 3.5-3 3 2.5 2-1.5 2.5 2"/></Ico>,
  Warn:     (p)=><Ico {...p}><path d="M8 2.5 14 13H2L8 2.5Z"/><path d="M8 6.5v3M8 11.2v.1"/></Ico>,
  Dollar:   (p)=><Ico {...p}><path d="M8 2v12M11 5H6.5a2 2 0 0 0 0 4h3a2 2 0 0 1 0 4H5"/></Ico>,
  Bolt:     (p)=><Ico {...p}><path d="M9 2 3 9h4l-1 5 6-7H8l1-5Z"/></Ico>,
  Edit:     (p)=><Ico {...p}><path d="M2.5 13.5h3l8-8-3-3-8 8v3Z"/><path d="m9.5 4.5 3 3"/></Ico>,
  Eye:      (p)=><Ico {...p}><path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Z"/><circle cx="8" cy="8" r="2"/></Ico>,
  Copy:     (p)=><Ico {...p}><rect x="5" y="5" width="8" height="8" rx="1.5"/><path d="M3 10V3.5A.5.5 0 0 1 3.5 3H10"/></Ico>,
  Refresh:  (p)=><Ico {...p}><path d="M13.5 3.5v3h-3M2.5 12.5v-3h3"/><path d="M13.5 6.5A5.5 5.5 0 0 0 3 6M2.5 9.5A5.5 5.5 0 0 0 13 10"/></Ico>,
  Grip:     (p)=><Ico {...p}><circle cx="6" cy="4" r=".8" fill="currentColor"/><circle cx="10" cy="4" r=".8" fill="currentColor"/><circle cx="6" cy="8" r=".8" fill="currentColor"/><circle cx="10" cy="8" r=".8" fill="currentColor"/><circle cx="6" cy="12" r=".8" fill="currentColor"/><circle cx="10" cy="12" r=".8" fill="currentColor"/></Ico>,
  Stop:     (p)=><Ico {...p}><rect x="4" y="4" width="8" height="8" rx="1" fill="currentColor" stroke="none"/></Ico>,
  Pause:    (p)=><Ico {...p}><rect x="4.5" y="3" width="2" height="10" rx=".5" fill="currentColor" stroke="none"/><rect x="9.5" y="3" width="2" height="10" rx=".5" fill="currentColor" stroke="none"/></Ico>,
  External: (p)=><Ico {...p}><path d="M10 2.5h3.5V6M13 3 7 9M8 3.5H3.5v9h9V8"/></Ico>,
  Pine:     (p)=><Ico {...p}><path d="M8 2 4 7h2L3 11h3L2 13.5h12L10 11h3L10 7h2L8 2Z" fill="currentColor" stroke="none" opacity=".9"/></Ico>,
};
window.Icons = Icons;
