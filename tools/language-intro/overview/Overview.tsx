import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import timeline from './timeline.json';

// The Language Page homepage overview film. Timing comes from timeline.json (build-timeline.mjs), footage from
// capture.mjs (real recordings of the running site). Nothing here is a mock-up of the product.
const FPS = 30;
const C = {navy: '#17324d', teal: '#1fa6a2', tealInk: '#0e6d6a', gold: '#f2c15b', coral: '#f2765a', cream: '#f7f4ec', white: '#ffffff'};
const SERIF = 'Georgia, "Times New Roman", serif';
const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const sec = (s: number) => Math.round(s * FPS);

type Scene = (typeof timeline.scenes)[number];
const scene = (id: string) => timeline.scenes.find((s) => s.id === id) as Scene;
const lineAt = (s: Scene, i: number) => s.lines[i].start - s.start; // seconds from scene start

/* ------------------------------------------------------------------ helpers */
const useT = () => useCurrentFrame() / FPS;
const pop = (t: number, at: number, dist = 40) => {
  const p = interpolate(t, [at, at + 0.55], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  return {opacity: p, transform: `translateY(${(1 - p) * dist}px)`} as React.CSSProperties;
};
const Words: React.FC<{text: string; at: number; style?: React.CSSProperties; step?: number; accent?: string[]}> = ({text, at, style, step = 0.09, accent = []}) => {
  const t = useT();
  return (
    <div style={style}>
      {text.split(' ').map((w, i) => (
        <span key={i} style={{display: 'inline-block', marginRight: '0.28em', color: accent.includes(w.replace(/[.,]/g, '')) ? C.tealInk : undefined, ...pop(t, at + i * step, 28)}}>{w}</span>
      ))}
    </div>
  );
};
const Kicker: React.FC<{text: string; at?: number; color?: string}> = ({text, at = 0.2, color = C.tealInk}) => {
  const t = useT();
  return <div style={{position: 'absolute', left: 80, top: 150, fontFamily: SANS, fontWeight: 800, fontSize: 24, letterSpacing: 5, color, textTransform: 'uppercase', ...pop(t, at, 16)}}>{text}</div>;
};
const Chip: React.FC<{label: string; at: number; bg?: string; fg?: string; size?: number}> = ({label, at, bg = C.white, fg = C.navy, size = 28}) => {
  const t = useT();
  return <span style={{display: 'inline-block', fontFamily: SANS, fontWeight: 700, fontSize: size, color: fg, background: bg, borderRadius: 999, padding: '12px 26px', boxShadow: '0 8px 24px #17324d1c', marginRight: 14, marginBottom: 14, ...pop(t, at, 22)}}>{label}</span>;
};

const SceneShell: React.FC<{children: React.ReactNode}> = ({children}) => {
  const f = useCurrentFrame();
  const {durationInFrames: d} = useVideoConfig();
  const inn = interpolate(f, [0, 10], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const out = interpolate(f, [d - 6, d], [1, 0], clamp);
  return <AbsoluteFill style={{opacity: Math.min(inn, out), transform: `translateX(${(1 - inn) * 60}px)`}}>{children}</AbsoluteFill>;
};

/* ------------------------------------------------------------- chrome / rail */
const RAIL = [['open', 'Welcome'], ['explore', 'Explore'], ['experience', 'Experience'], ['support', 'Support']];
const Rail: React.FC<{active: string}> = ({active}) => (
  <div style={{position: 'absolute', top: 58, right: 80, display: 'flex', gap: 34, fontFamily: SANS, fontWeight: 800, fontSize: 21, letterSpacing: 3, textTransform: 'uppercase'}}>
    {RAIL.map(([id, label]) => (
      <div key={id} style={{color: id === active ? C.tealInk : '#17324d66', borderBottom: `5px solid ${id === active ? C.teal : 'transparent'}`, paddingBottom: 8}}>{label}</div>
    ))}
  </div>
);
const Brand: React.FC<{dark?: boolean}> = ({dark}) => (
  <div style={{position: 'absolute', top: 50, left: 80, display: 'flex', alignItems: 'center', gap: 14, fontFamily: SANS, fontWeight: 800, fontSize: 25, letterSpacing: 1, color: dark ? C.white : C.navy}}>
    <Img src={staticFile('mark.svg')} style={{width: 46, height: 46}} />
    THE LANGUAGE PAGE
  </div>
);
const Backdrop: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: C.cream}}>
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(circle at 82% 12%, #d2efea 0, transparent 36%), radial-gradient(circle at 8% 92%, #ffdfb8 0, transparent 32%)'}} />
      <div style={{position: 'absolute', top: -280, right: -190, width: 700, height: 700, borderRadius: '50%', border: `2px solid ${C.teal}33`, transform: `rotate(${f * 0.1}deg)`}} />
      <div style={{position: 'absolute', bottom: -360, left: 700, width: 700, height: 700, borderRadius: '50%', border: `90px solid ${C.gold}1f`}} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------- footage frame */
type Seg = {file: string; src: [number, number]; from: number; to: number};
const FW = 1230;
const FH = Math.round((FW * 9) / 16);
const Footage: React.FC<{segs: Seg[]}> = ({segs}) => {
  const f = useCurrentFrame();
  const {durationInFrames: d} = useVideoConfig();
  const grow = interpolate(f, [0, d], [1, 1.022]);
  return (
    <div style={{position: 'absolute', left: 650, top: 150, width: FW, transform: `scale(${grow})`, transformOrigin: '30% 40%', borderRadius: 22, overflow: 'hidden', background: C.white, boxShadow: '0 40px 90px #17324d40, 0 0 0 2px #17324d14'}}>
      <div style={{height: 40, background: '#e9eef2', display: 'flex', alignItems: 'center', gap: 9, paddingLeft: 18}}>
        {[C.coral, C.gold, C.teal].map((c) => <span key={c} style={{width: 13, height: 13, borderRadius: '50%', background: c}} />)}
        <span style={{marginLeft: 22, fontFamily: SANS, fontSize: 17, color: '#17324d99', background: C.white, borderRadius: 999, padding: '4px 22px'}}>thelanguagepage.com</span>
      </div>
      <div style={{position: 'relative', width: FW, height: FH, overflow: 'hidden', background: C.cream}}>
        {segs.map((s, i) => {
          const from = sec(s.from);
          const nextFrom = segs[i + 1] ? sec(segs[i + 1].from) : sec(s.to);
          const dur = nextFrom - from + (segs[i + 1] ? 8 : 0);
          const rate = (s.src[1] - s.src[0]) / (s.to - s.from);
          if (rate < 0.75 || rate > 1.3) throw new Error(`footage ${s.file} ${s.src} plays at ${rate.toFixed(2)}x`);
          const fade = i === 0 ? 1 : interpolate(f - from, [0, 8], [0, 1], clamp);
          return (
            <Sequence key={i} from={from} durationInFrames={Math.max(1, dur)} layout="none">
              <OffthreadVideo src={staticFile(`footage/${s.file}.mp4`)} startFrom={sec(s.src[0])} playbackRate={rate} muted style={{position: 'absolute', left: 0, top: 0, width: FW, height: 'auto', opacity: fade}} />
            </Sequence>
          );
        })}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------- scenes */
const Open: React.FC = () => {
  const s = scene('open');
  const t = useT();
  return (
    <>
      <Kicker text="Interactive English practice" at={0.5} />
      <div style={{position: 'absolute', left: 80, top: 235, width: 520}}>
        <Words text="Practice English for school, one step at a time." at={0.9} step={0.11} accent={['school,', 'time.'].map((x) => x.replace(/[.,]/g, ''))} style={{fontFamily: SERIF, fontWeight: 700, fontSize: 68, lineHeight: 1.1, color: C.navy}} />
        <div style={{marginTop: 38}}>
          <Chip label="Learners" at={2.4} bg={C.navy} fg={C.white} />
          <Chip label="Teachers" at={3.1} bg={C.teal} fg={C.white} />
          <Chip label="Families" at={3.8} bg={C.gold} fg={C.navy} />
        </div>
        <div style={{...pop(t, lineAt(s, 1) + 0.1), fontFamily: SANS, fontWeight: 700, fontSize: 30, color: C.navy, lineHeight: 1.35}}>Choose a grade, Kindergarten to Grade 8.</div>
      </div>
      <Footage segs={[{file: 'home', src: [0.9, 10.9], from: 0, to: s.dur}]} />
    </>
  );
};

const DOMAINS: [string, string, string][] = [['Listening', C.teal, 'L'], ['Speaking', C.coral, 'S'], ['Reading', C.navy, 'R'], ['Writing', C.gold, 'W']];
const Explore: React.FC = () => {
  const s = scene('explore');
  const t = useT();
  const L1 = lineAt(s, 1);
  const L2 = lineAt(s, 2);
  const times = [2.55, 3.3, 3.95, 4.6];
  return (
    <>
      <Kicker text="Explore" />
      <div style={{position: 'absolute', left: 80, top: 200, width: 520}}>
        <Words text="Four language domains" at={0.5} style={{fontFamily: SERIF, fontWeight: 700, fontSize: 52, lineHeight: 1.1, color: C.navy}} />
        <div style={{marginTop: 34}}>
          {DOMAINS.map(([name, color, letter], i) => (
            <div key={name} style={{display: 'flex', alignItems: 'center', gap: 22, marginBottom: 20, ...pop(t, times[i], 30)}}>
              <div style={{width: 74, height: 74, borderRadius: 24, background: color, color: color === C.gold ? C.navy : C.white, fontFamily: SERIF, fontWeight: 700, fontSize: 40, display: 'grid', placeItems: 'center', boxShadow: '0 10px 26px #17324d26'}}>{letter}</div>
              <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 52, color: C.navy}}>{name}</div>
            </div>
          ))}
        </div>
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 28, color: C.tealInk, marginTop: 6, ...pop(t, L1 + 0.2)}}>Each one has its own studio.</div>
        <div style={{marginTop: 18, ...pop(t, L2 + 0.3)}}>
          <span style={{display: 'inline-block', background: C.navy, color: C.white, fontFamily: SANS, fontWeight: 800, fontSize: 28, borderRadius: 18, padding: '16px 30px', boxShadow: '0 10px 26px #17324d33'}}>Games &amp; Worlds</span>
        </div>
      </div>
      <Footage segs={[
        {file: 'practice', src: [1.3, 6.7], from: 0, to: L1},
        {file: 'speak', src: [1.3, 3.6], from: L1, to: L1 + 2.3},
        {file: 'write', src: [1.3, 3.6], from: L1 + 2.3, to: L2},
        {file: 'games', src: [1.3, 6.5], from: L2, to: s.dur},
      ]} />
    </>
  );
};

const STEPS = ['Warm up', 'Learn', 'Try', 'Reflect'];
const Card: React.FC<{title: string; sub?: string; children?: React.ReactNode; at: number}> = ({title, sub, children, at}) => {
  const t = useT();
  return (
    <div style={{background: C.white, borderRadius: 28, padding: '34px 38px', boxShadow: '0 20px 50px #17324d22', borderLeft: `10px solid ${C.teal}`, ...pop(t, at, 30)}}>
      <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 42, lineHeight: 1.15, color: C.navy}}>{title}</div>
      {sub ? <div style={{fontFamily: SANS, fontSize: 27, lineHeight: 1.35, color: '#17324dcc', marginTop: 12}}>{sub}</div> : null}
      {children ? <div style={{marginTop: 20}}>{children}</div> : null}
    </div>
  );
};
const Experience: React.FC = () => {
  const s = scene('experience');
  const t = useT();
  const L = (i: number) => lineAt(s, i);
  const stepAt = [L(0) + 2.3, L(0) + 2.95, L(0) + 3.55, L(0) + 4.15];
  const idx = [1, 2, 3, 4, 5].reduce((a, i) => (t >= L(i) - 0.05 ? i : a), 0);
  return (
    <>
      <Kicker text="Experience" />
      <div style={{position: 'absolute', left: 80, top: 190, width: 520}}>
        <Words text="Practice that works step by step" at={0.5} style={{fontFamily: SERIF, fontWeight: 700, fontSize: 50, lineHeight: 1.1, color: C.navy}} />
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 28}}>
          {STEPS.map((name, i) => {
            const on = t >= stepAt[i];
            return (
              <div key={name} style={{display: 'flex', alignItems: 'center', gap: 12, background: on ? C.navy : C.white, color: on ? C.white : C.navy, borderRadius: 18, padding: '14px 18px', fontFamily: SANS, fontWeight: 800, fontSize: 25, boxShadow: '0 8px 20px #17324d1a', opacity: t > L(0) - 0.2 + i * 0.2 ? 1 : 0}}>
                <span style={{width: 34, height: 34, borderRadius: '50%', background: on ? C.teal : '#17324d1f', color: on ? C.white : C.navy, display: 'grid', placeItems: 'center', fontSize: 20}}>{i + 1}</span>
                {name}
              </div>
            );
          })}
        </div>
        <div style={{marginTop: 30, minHeight: 250, position: 'relative'}}>
          {idx === 1 && <Card key="l1" at={L(1)} title="Listen again, or slower" sub="Word help in English and Spanish." />}
          {idx === 2 && (
            <Card key="l2" at={L(2)} title="How sure are you?" sub="Choose, rate your confidence, then check.">
              {['Guessing', 'I think so', 'Sure'].map((c, i) => <Chip key={c} label={c} at={L(2) + 0.6 + i * 0.35} size={24} />)}
            </Card>
          )}
          {idx === 3 && <Card key="l3" at={L(3)} title="Specific feedback" sub="What went well, plus one next step." />}
          {idx === 4 && (
            <Card key="l4" at={L(4)} title="You choose the help">
              <Chip label="Learn with help" at={L(4) + 0.5} bg={C.teal} fg={C.white} size={24} />
              <Chip label="Try independently" at={L(4) + 0.9} size={24} />
            </Card>
          )}
          {idx === 5 && <Card key="l5" at={L(5)} title="ACCESS-style practice" sub="The Access Prep hub: practice tests and an assessment simulator." />}
        </div>
      </div>
      <Footage segs={[
        {file: 'activity', src: [4.4, 9.2], from: 0, to: L(1)},
        {file: 'activity', src: [10.3, 17.0], from: L(1), to: L(2)},
        {file: 'activity', src: [18.5, 23.0], from: L(2), to: L(3)},
        {file: 'activity', src: [23.1, 26.7], from: L(3), to: L(4)},
        {file: 'activity', src: [28.6, 31.6], from: L(4), to: L(5)},
        {file: 'accessprep', src: [1.2, 7.7], from: L(5), to: s.dur},
      ]} />
    </>
  );
};

const BEATS = [
  {tag: 'Growth Map', title: 'See what you can do, and what to practice next', sub: 'Evidence from your own work. Not scores.', color: C.teal},
  {tag: 'For teachers', title: 'Start with one real activity for each domain', sub: 'Students choose the help they use.', color: C.coral},
  {tag: 'For families', title: 'Practice English together', sub: 'Directions in English, Spanish, or both.', color: C.gold},
];
const Support: React.FC = () => {
  const s = scene('support');
  const t = useT();
  const L = (i: number) => lineAt(s, i);
  const idx = [1, 2].reduce((a, i) => (t >= L(i) - 0.05 ? i : a), 0);
  const b = BEATS[idx];
  return (
    <>
      <Kicker text="Support" />
      <div style={{position: 'absolute', left: 80, top: 230, width: 520}}>
        <div key={idx}>
          <div style={{display: 'inline-block', background: b.color, color: b.color === C.gold ? C.navy : C.white, fontFamily: SANS, fontWeight: 800, fontSize: 26, borderRadius: 999, padding: '10px 26px', ...pop(t, L(idx) + 0.1, 18)}}>{b.tag}</div>
          <Words text={b.title} at={L(idx) + 0.3} step={0.08} style={{fontFamily: SERIF, fontWeight: 700, fontSize: 56, lineHeight: 1.12, color: C.navy, marginTop: 26}} />
          <div style={{fontFamily: SANS, fontSize: 30, lineHeight: 1.35, color: '#17324dcc', marginTop: 24, ...pop(t, L(idx) + 1.4, 20)}}>{b.sub}</div>
        </div>
        <div style={{display: 'flex', gap: 12, marginTop: 44}}>
          {BEATS.map((x, i) => <div key={x.tag} style={{width: i === idx ? 70 : 24, height: 10, borderRadius: 6, background: i === idx ? x.color : '#17324d26'}} />)}
        </div>
      </div>
      <Footage segs={[
        {file: 'growth', src: [1.3, 7.2], from: 0, to: L(1)},
        {file: 'teachers', src: [1.3, 7.3], from: L(1), to: L(2)},
        {file: 'families', src: [2.0, 8.0], from: L(2), to: s.dur},
      ]} />
    </>
  );
};

const Close: React.FC = () => {
  const s = scene('close');
  const t = useT();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: C.navy, color: C.white, fontFamily: SANS}}>
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(circle at 78% 20%, #1fa6a233 0, transparent 40%), radial-gradient(circle at 12% 90%, #f2c15b26 0, transparent 34%)'}} />
      {[C.teal, C.coral, C.gold, '#ffffff'].map((c, i) => (
        <div key={i} style={{position: 'absolute', width: 90 + i * 20, height: 90 + i * 20, borderRadius: 30, background: c, opacity: 0.16, left: 220 + i * 410, top: 150 + ((i % 2) * 650) + Math.sin((f + i * 20) / 38) * 14}} />
      ))}
      <div style={{position: 'absolute', left: 0, right: 0, top: 215, textAlign: 'center'}}>
        <div style={{...pop(t, 0.3, 20)}}><Img src={staticFile('mark.svg')} style={{width: 120, height: 120}} /></div>
        <div style={{fontWeight: 800, fontSize: 28, letterSpacing: 6, marginTop: 20, ...pop(t, 0.5, 16)}}>THE LANGUAGE PAGE</div>
        <Words text="One place to build" at={0.8} step={0.12} style={{fontFamily: SERIF, fontWeight: 700, fontSize: 108, lineHeight: 1.08, marginTop: 36}} />
        <Words text="English skills." at={1.5} step={0.12} style={{fontFamily: SERIF, fontWeight: 700, fontSize: 108, lineHeight: 1.08, color: C.gold}} />
        <div style={{fontSize: 38, color: '#ffffffcc', fontWeight: 700, marginTop: 28, ...pop(t, lineAt(s, 0) + 1.6, 20)}}>At your own pace.</div>
        <div style={{display: 'inline-block', background: C.teal, borderRadius: 60, padding: '22px 52px', fontSize: 40, fontWeight: 800, marginTop: 44, ...pop(t, lineAt(s, 1) + 0.2, 20)}}>thelanguagepage.com</div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------------- film */
export const Overview: React.FC = () => {
  const parts: [string, React.FC][] = [['open', Open], ['explore', Explore], ['experience', Experience], ['support', Support]];
  const close = scene('close');
  return (
    <AbsoluteFill style={{fontFamily: SANS}}>
      <Backdrop />
      <Brand />
      {parts.map(([id, Cmp]) => {
        const s = scene(id);
        return (
          <Sequence key={id} from={sec(s.start)} durationInFrames={sec(s.dur)}>
            <SceneShell><Rail active={id} /><Cmp /></SceneShell>
          </Sequence>
        );
      })}
      <Sequence from={sec(close.start)} durationInFrames={sec(timeline.total - close.start)}>
        <SceneShell><Close /></SceneShell>
      </Sequence>
    </AbsoluteFill>
  );
};
export const TOTAL_FRAMES = sec(timeline.total);
