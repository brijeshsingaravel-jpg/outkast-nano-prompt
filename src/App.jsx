import React, { useMemo, useState, useEffect } from "react";
import { Copy, Plus, Trash2, Download, Share2, Shuffle, RotateCcw, Lock, Info } from "lucide-react";

/** ---------- Tiny UI Primitives ---------- */
const Label = ({ children, htmlFor }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-zinc-200 mb-1">{children}</label>
);
const Input = (props) => (
  <input {...props} className={`w-full rounded-xl bg-zinc-900/50 border border-zinc-800 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 ${props.className||''}`} />
);
const Select = ({ value, onChange, options, id }) => (
  <select id={id} value={value} onChange={(e)=>onChange(e.target.value)} className="w-full rounded-xl bg-zinc-900/50 border border-zinc-800 px-3 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500">
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);
const Button = ({ children, onClick, variant = "primary", className="", ...rest }) => (
  <button onClick={onClick} {...rest} className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium shadow-sm transition active:translate-y-[1px] ${variant === 'primary' ? 'bg-zinc-100 text-zinc-900 hover:bg-white' : variant === 'ghost' ? 'bg-transparent text-zinc-300 hover:bg-zinc-800/60' : 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700'} ${className}`}>{children}</button>
);
const Card = ({ children }) => (
  <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-4 shadow-lg">{children}</div>
);
const Section = ({ title, children, right }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold tracking-wide text-zinc-300">{title}</h3>
      {right}
    </div>
    {children}
  </div>
);

/** ---------- Constants ---------- */
const HEX6 = /^#([0-9a-f]{6})$/i;
const isBrowser = typeof window !== "undefined";

// Use-case specific option sets (≥5 in each)
const OPTION_SETS = {
  studio: {
    pose: [
      { label: "Relaxed 3/4, hands in pockets", value: "standing 3/4, relaxed, hands in pockets" },
      { label: "Sitting—stool, one knee raised", value: "sitting on a studio stool, one knee raised" },
      { label: "Cross-armed, chin tilt", value: "arms crossed, head slightly tilted" },
      { label: "Half step forward (subtle motion)", value: "dynamic step forward, subtle motion blur" },
      { label: "Hands at sides, natural stance", value: "standing straight, hands relaxed at sides" },
    ],
    camera: [
      { label: "50mm eye-level", value: "50mm eye-level" },
      { label: "85mm portrait, slight top-down", value: "85mm portrait, slight top-down" },
      { label: "35mm wide, low angle", value: "35mm wide, low angle" },
      { label: "70mm shoulder crop", value: "70mm portrait shoulder crop" },
      { label: "105mm tight portrait", value: "105mm tight portrait" },
    ],
    lighting: [
      { label: "2-pt softbox + rim", value: "two softboxes key+fill, subtle rim light" },
      { label: "Clamshell beauty", value: "clamshell beauty lighting" },
      { label: "Rembrandt moody", value: "Rembrandt lighting, soft contrast" },
      { label: "High-key soft fill", value: "high-key soft fill, minimal shadows" },
      { label: "Edge lights (subtle)", value: "soft edge lights with gentle falloff" },
    ],
    bgStyle: [
      { label: "Seamless gradient", value: "studio seamless backdrop, smooth gradient" },
      { label: "Matte solid", value: "matte solid backdrop" },
      { label: "Soft bokeh", value: "soft bokeh background" },
      { label: "Paper sweep neutral", value: "neutral paper sweep backdrop" },
      { label: "Vignette studio", value: "studio backdrop with subtle vignette" },
    ],
    finish: [
      { label: "Cinematic premium", value: "cinematic, premium, editorial" },
      { label: "Hyper-clean", value: "hyper-clean ecommerce" },
      { label: "Moody high-fashion", value: "moody high-fashion" },
      { label: "Editorial natural", value: "editorial natural contrast" },
      { label: "Gloss-controlled", value: "controlled specular highlights" },
    ],
  },
  ecom: {
    pose: [
      { label: "Front—arms at sides", value: "front-facing, arms relaxed at sides" },
      { label: "Quarter turn—hands in pockets", value: "quarter turn, hands in pockets" },
      { label: "Back view—head turn", value: "back view, head turned slightly to camera" },
      { label: "Side view—neutral", value: "side profile, neutral stance" },
      { label: "Front—one hand pinch hem", value: "front-facing, one hand lightly pinching shirt hem" },
    ],
    camera: [
      { label: "50mm catalogue", value: "50mm eye-level catalogue framing" },
      { label: "70mm product crop", value: "70mm tight product crop" },
      { label: "35mm full body", value: "35mm full-body framing" },
      { label: "24-70mm zoom neutral", value: "24-70mm neutral perspective" },
      { label: "65mm waist-up", value: "65mm waist-up framing" },
    ],
    lighting: [
      { label: "Softbox key + reflector", value: "large softbox key with silver reflector fill" },
      { label: "Even top-down panels", value: "even overhead LED panels, minimal shadow" },
      { label: "High-key white sweep", value: "high-key lighting on white sweep" },
      { label: "Soft fill, true color", value: "soft fill prioritizing true-to-color rendering" },
      { label: "Shadow-controlled", value: "controlled shadows, gentle falloff" },
    ],
    bgStyle: [
      { label: "Pure white sweep", value: "pure white infinity sweep" },
      { label: "Light grey matte", value: "light grey matte backdrop" },
      { label: "Neutral beige matte", value: "neutral beige matte backdrop" },
      { label: "Very soft gradient", value: "very soft neutral gradient" },
      { label: "Transparent look", value: "clean backdrop that feels near-transparent" },
    ],
    finish: [
      { label: "Retail clean", value: "hyper-clean ecommerce" },
      { label: "Neutral, true-to-color", value: "neutral finish, true-to-color garment" },
      { label: "Slight clarity boost", value: "slight clarity and micro-contrast" },
      { label: "Matte low-contrast", value: "matte, low-contrast finish" },
      { label: "Subtle HDR feel", value: "subtle HDR feel without halos" },
    ],
  },
  fashion: {
    pose: [
      { label: "Contrapposto relaxed", value: "contrapposto relaxed stance" },
      { label: "Hands on hips, chin high", value: "hands on hips, chin slightly elevated" },
      { label: "One leg cross, lean", value: "one leg crossed over the other, slight lean" },
      { label: "Walking turn (still)", value: "implied walk with torso turn, static capture" },
      { label: "Seated—asymmetric angle", value: "seated at asymmetric angle, one knee up" },
    ],
    camera: [
      { label: "85mm fashion portrait", value: "85mm fashion portrait" },
      { label: "105mm compressed", value: "105mm compressed portrait" },
      { label: "28mm editorial wide", value: "28mm editorial wide, slight distortion" },
      { label: "35mm runway feel", value: "35mm runway perspective" },
      { label: "50mm lookbook mid", value: "50mm lookbook mid-shot" },
    ],
    lighting: [
      { label: "Split light drama", value: "split lighting, controlled speculars" },
      { label: "Hard key + kicker", value: "hard key with kicker rim" },
      { label: "Moody Rembrandt", value: "Rembrandt lighting, soft contrast" },
      { label: "Beauty dish pop", value: "beauty dish with soft fill" },
      { label: "Gel accent subtle", value: "neutral key with subtle gel accent" },
    ],
    bgStyle: [
      { label: "Soft bokeh color field", value: "soft bokeh color field" },
      { label: "Textured concrete", value: "textured concrete backdrop" },
      { label: "Gradient noir", value: "deep gradient noir backdrop" },
      { label: "Muted color wash", value: "muted color wash backdrop" },
      { label: "Editorial paper layers", value: "layered editorial paper backdrop" },
    ],
    finish: [
      { label: "Moody high-fashion", value: "moody high-fashion" },
      { label: "Editorial filmic", value: "editorial filmic contrast" },
      { label: "Cinematic premium", value: "cinematic, premium, editorial" },
      { label: "Grain kissed", value: "fine grain, subtle halation" },
      { label: "Gloss-controlled", value: "controlled specular highlights" },
    ],
  }
};

const DEFAULTS = {
  gender: [
    { label: "Female", value: "female" },
    { label: "Male", value: "male" },
    { label: "Unisex / Androgynous", value: "androgynous" },
  ],
  aspect: [
    { label: "Instagram Story / Reels – 1080×1920 (9:16)", value: "9:16 | 1080x1920" },
    { label: "Instagram Feed – 1080×1350 (4:5)", value: "4:5 | 1080x1350" },
    { label: "Square – 1080×1080 (1:1)", value: "1:1 | 1080x1080" },
    { label: "Facebook Ad – 1200×628 (1.91:1)", value: "1.91:1 | 1200x628" },
    { label: "YouTube Thumb – 1280×720 (16:9)", value: "16:9 | 1280x720" },
    { label: "Pinterest – 1000×1500 (2:3)", value: "2:3 | 1000x1500" },
    { label: "X/Twitter – 1600×900 (16:9)", value: "16:9 | 1600x900" },
    { label: "LinkedIn Ad – 1200×627 (1.91:1)", value: "1.91:1 | 1200x627" },
  ],
};

/** ---------- Template ---------- */
const TEMPLATE = `A luxury fashion studio shot of a {gender} model in an Outkast T-shirt in hex color {tee_hex}. Retain model's face from {face_ref}. Keep the printed design from {design_ref}. Background: {background} tuned to complement {tee_hex}. Pose: {pose}. Camera: {camera}. Lighting: {lighting}. Finish: {finish}. Styling: clean drape, natural fabric folds, true-to-color garment. Composition: centered, headroom balanced, negative space for text on {text_side}. Output: {aspect}, 4K, high detail, sharp focus. Negative: blurry logos, extra text, watermarks, duplicate faces, distorted hands.`;

/** ---------- Utils ---------- */
function useClipboard() {
  const [copied, setCopied] = useState(false);
  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false), 1500);} catch {}
  };
  return {copied, copy};
}
function encodeExtras(extras) {
  try { return btoa(unescape(encodeURIComponent(JSON.stringify(extras)))); } catch { return ""; }
}
function decodeExtras(s) {
  try { return JSON.parse(decodeURIComponent(escape(atob(s)))); } catch { return []; }
}
function compactStateForURL(s) {
  const base = {
    useCase: "studio",
    gender: "female",
    teeHex: "#2d314a",
    pose: OPTION_SETS.studio.pose[0].value,
    camera: OPTION_SETS.studio.camera[0].value,
    lighting: OPTION_SETS.studio.lighting[0].value,
    bgStyle: OPTION_SETS.studio.bgStyle[0].value,
    finish: OPTION_SETS.studio.finish[0].value,
    aspect: DEFAULTS.aspect[0].value,
    textSide: "right",
    faceRef: "<paste face image link or ID>",
    designRef: "<paste design image link or ID>",
    styleLock: false,
  };
  const out = {};
  Object.entries(s).forEach(([k,v])=>{
    if (k === "extras") {
      if (Array.isArray(v) && v.length) out.extras = encodeExtras(v);
      return;
    }
    if (v !== base[k]) out[k] = v;
  });
  return out;
}
function stateToQuery(s) {
  const q = new URLSearchParams();
  const obj = compactStateForURL(s);
  Object.entries(obj).forEach(([k,v])=> q.set(k, v));
  return q.toString();
}
function queryToState() {
  if (!isBrowser) return {};
  const p = new URLSearchParams(location.search);
  const obj = {};
  for (const [k,v] of p) {
    if(k==="extras") obj.extras = decodeExtras(v);
    else if(k==="styleLock") obj.styleLock = (v === "true");
    else obj[k] = v;
  }
  return obj;
}
function parseAspect(aspectValue) {
  const [ratio, size] = String(aspectValue || "").split("|").map(s => s.trim());
  return { ratio, size };
}

/** ---------- App Component ---------- */
export default function App() {
  // Use-case determines option pools
  const [useCase, setUseCase] = useState("studio"); // studio | ecom | fashion

  const [gender, setGender] = useState("female");
  const [teeHex, setTeeHex] = useState("#2d314a");
  const [faceRef, setFaceRef] = useState("<paste face image link or ID>");
  const [designRef, setDesignRef] = useState("<paste design image link or ID>");

  // Initial options seeded from current useCase
  const [pose, setPose] = useState(OPTION_SETS.studio.pose[0].value);
  const [camera, setCamera] = useState(OPTION_SETS.studio.camera[0].value);
  const [lighting, setLighting] = useState(OPTION_SETS.studio.lighting[0].value);
  const [bgStyle, setBgStyle] = useState(OPTION_SETS.studio.bgStyle[0].value);
  const [finish, setFinish] = useState(OPTION_SETS.studio.finish[0].value);

  const [aspect, setAspect] = useState(DEFAULTS.aspect[0].value);
  const [textSide, setTextSide] = useState("right");
  const [styleLock, setStyleLock] = useState(false);

  const [extras, setExtras] = useState([{ key: "grain", value: "very subtle film grain" }]);

  // Hydration from URL or localStorage
  useEffect(()=>{
    if (!isBrowser) return;
    const q = queryToState();
    const hasQuery = Object.keys(q).length > 0;
    if (hasQuery) {
      if(q.useCase) setUseCase(q.useCase);
      if(q.gender) setGender(q.gender);
      if(q.teeHex) setTeeHex(q.teeHex);
      if(q.faceRef) setFaceRef(q.faceRef);
      if(q.designRef) setDesignRef(q.designRef);
      if(q.pose) setPose(q.pose);
      if(q.camera) setCamera(q.camera);
      if(q.lighting) setLighting(q.lighting);
      if(q.bgStyle) setBgStyle(q.bgStyle);
      if(q.finish) setFinish(q.finish);
      if(q.aspect) setAspect(q.aspect);
      if(q.textSide) setTextSide(q.textSide);
      if(typeof q.styleLock === "boolean") setStyleLock(q.styleLock);
      if(q.extras) setExtras(q.extras);
    } else {
      const raw = localStorage.getItem("nbuilder:v1");
      if(raw){
        try{
          const s = JSON.parse(raw);
          setUseCase(s.useCase ?? "studio");
          setGender(s.gender ?? "female");
          setTeeHex(s.teeHex ?? "#2d314a");
          setFaceRef(s.faceRef ?? "<paste face image link or ID>");
          setDesignRef(s.designRef ?? "<paste design image link or ID>");
          setPose(s.pose ?? OPTION_SETS.studio.pose[0].value);
          setCamera(s.camera ?? OPTION_SETS.studio.camera[0].value);
          setLighting(s.lighting ?? OPTION_SETS.studio.lighting[0].value);
          setBgStyle(s.bgStyle ?? OPTION_SETS.studio.bgStyle[0].value);
          setFinish(s.finish ?? OPTION_SETS.studio.finish[0].value);
          setAspect(s.aspect ?? DEFAULTS.aspect[0].value);
          setTextSide(s.textSide ?? "right");
          setStyleLock(!!s.styleLock);
          setExtras(Array.isArray(s.extras) ? s.extras : []);
        }catch{}
      }
    }
  }, []);

  // When useCase changes, rebase options (respect current choices if valid)
  useEffect(()=>{
    const pool = OPTION_SETS[useCase];
    if (!pool.pose.find(p=>p.value===pose)) setPose(pool.pose[0].value);
    if (!pool.camera.find(p=>p.value===camera)) setCamera(pool.camera[0].value);
    if (!pool.lighting.find(p=>p.value===lighting)) setLighting(pool.lighting[0].value);
    if (!pool.bgStyle.find(p=>p.value===bgStyle)) setBgStyle(pool.bgStyle[0].value);
    if (!pool.finish.find(p=>p.value===finish)) setFinish(pool.finish[0].value);
  }, [useCase]);

  // Persist + compact URL (debounced)
  useEffect(()=>{
    if (!isBrowser) return;
    const id = setTimeout(()=>{
      const state = { useCase, gender, teeHex, faceRef, designRef, pose, camera, lighting, bgStyle, finish, aspect, textSide, styleLock, extras };
      localStorage.setItem("nbuilder:v1", JSON.stringify(state));
      const search = stateToQuery(state);
      const newUrl = `${location.origin}${location.pathname}${search ? `?${search}` : ""}`;
      window.history.replaceState(null, "", newUrl);
    }, 120);
    return ()=> clearTimeout(id);
  }, [useCase, gender, teeHex, faceRef, designRef, pose, camera, lighting, bgStyle, finish, aspect, textSide, styleLock, extras]);

  const background = useMemo(() => `${bgStyle} that blends with ${HEX6.test(teeHex) ? teeHex : "#2d314a"}`, [bgStyle, teeHex]);

  const prompt = useMemo(() => {
    const base = TEMPLATE
      .replaceAll("{gender}", gender)
      .replaceAll("{tee_hex}", HEX6.test(teeHex) ? teeHex : "#2d314a")
      .replaceAll("{face_ref}", faceRef)
      .replaceAll("{design_ref}", designRef)
      .replaceAll("{background}", background)
      .replaceAll("{pose}", pose)
      .replaceAll("{camera}", camera)
      .replaceAll("{lighting}", lighting)
      .replaceAll("{finish}", finish)
      .replaceAll("{text_side}", textSide)
      .replaceAll("{aspect}", aspect);

    const extraText = extras.filter(e=>e.key && e.value).map(e => `${e.key}: ${e.value}`).join("; ");
    return extraText ? `${base} | Extras: ${extraText}` : base;
  }, [gender, teeHex, faceRef, designRef, background, pose, camera, lighting, finish, aspect, textSide, extras]);

  const jsonPayload = useMemo(() => ({
    model: "nano-banana-vX", // unchanged shape
    inputs: {
      face_ref: faceRef,
      design_ref: designRef,
      tee_hex: HEX6.test(teeHex) ? teeHex : "#2d314a",
      gender,
      pose,
      camera,
      lighting,
      background: background,
      finish,
      text_side: textSide,
      aspect,
      extras: Object.fromEntries(extras.filter(e=>e.key && e.value).map(e=>[e.key, e.value]))
    },
    prompt,
    negative_prompt: "blurry logos, extra text, watermark, duplicate faces, distorted hands",
    version: "1.1"
  }), [faceRef, designRef, teeHex, gender, pose, camera, lighting, background, finish, textSide, aspect, extras, prompt]);

  const {copied: promptCopied, copy: copyPrompt} = useClipboard();
  const {copied: urlCopied, copy: copyURL} = useClipboard();
  const {copied: jsonCopied, copy: copyJSON} = useClipboard();

  const addExtra = () => setExtras([...extras, { key: "", value: "" }]);
  const updateExtra = (i, field, value) => setExtras(extras.map((e, idx)=> idx===i ? { ...e, [field]: value } : e));
  const removeExtra = (i) => setExtras(extras.filter((_, idx)=> idx!==i));

  const shareLink = async () => {
    if (!isBrowser) return;
    const state = { useCase, gender, teeHex, faceRef, designRef, pose, camera, lighting, bgStyle, finish, aspect, textSide, styleLock, extras };
    const url = `${location.origin}${location.pathname}?${stateToQuery(state)}`;
    try { await navigator.clipboard.writeText(url); } catch {}
  };

  const downloadJSON = () => {
    const slug = [
      "nano-banana",
      useCase,
      gender,
      (HEX6.test(teeHex) ? teeHex.replace('#','') : '2d314a'),
      new Date().toISOString().replace(/[:.]/g,'-')
    ].join('_') + '.json';
    const blob = new Blob([JSON.stringify(jsonPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = slug; a.click();
    URL.revokeObjectURL(url);
  };

  const randomize = () => {
    // Only pose/camera/light
    const pick = (arr) => arr[Math.floor(Math.random()*arr.length)].value;
    const pool = OPTION_SETS[useCase];
    setPose(pick(pool.pose));
    setCamera(pick(pool.camera));
    setLighting(pick(pool.lighting));
  };

  const resetAll = () => {
    setUseCase("studio");
    setGender("female");
    setTeeHex("#2d314a");
    setFaceRef("<paste face image link or ID>");
    setDesignRef("<paste design image link or ID>");
    setPose(OPTION_SETS.studio.pose[0].value);
    setCamera(OPTION_SETS.studio.camera[0].value);
    setLighting(OPTION_SETS.studio.lighting[0].value);
    setBgStyle(OPTION_SETS.studio.bgStyle[0].value);
    setFinish(OPTION_SETS.studio.finish[0].value);
    setAspect(DEFAULTS.aspect[0].value);
    setTextSide("right");
    setStyleLock(false);
    setExtras([{ key: "grain", value: "very subtle film grain" }]);
  };

  // Keyboard shortcuts
  useEffect(()=>{
    const onKey = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if(mod && e.key.toLowerCase()==='b'){ e.preventDefault(); copyPrompt(prompt); }
      if(mod && e.key.toLowerCase()==='j'){ e.preventDefault(); downloadJSON(); }
    };
    window.addEventListener('keydown', onKey);
    return ()=> window.removeEventListener('keydown', onKey);
  }, [prompt]);

  // Derived options for current useCase
  const poses = OPTION_SETS[useCase].pose;
  const cameras = OPTION_SETS[useCase].camera;
  const lightings = OPTION_SETS[useCase].lighting;
  const backgrounds = OPTION_SETS[useCase].bgStyle;
  const finishes = OPTION_SETS[useCase].finish;

  // Simple inline validation
  const hexValid = HEX6.test(teeHex);
  const faceValid = faceRef && !/^<paste face/.test(faceRef);
  const designValid = designRef && !/^<paste design/.test(designRef);

  const { ratio, size } = parseAspect(aspect);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-black via-zinc-950 to-black text-zinc-100 p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-semibold">Outkast — Nano Banana Prompt Generator</h1>
            <div className="ml-auto flex gap-2">
              <Button variant="secondary" onClick={randomize}><Shuffle size={16}/> Randomize</Button>
              <Button variant="secondary" onClick={resetAll}><RotateCcw size={16}/> Reset</Button>
              <Button variant="secondary" onClick={async ()=>{
                await shareLink();
                const url = `${location.origin}${location.pathname}?${stateToQuery({ useCase, gender, teeHex, faceRef, designRef, pose, camera, lighting, bgStyle, finish, aspect, textSide, styleLock, extras })}`;
                copyURL(url);
              }}>
                <Share2 size={16}/> {urlCopied ? "URL Copied!" : "Copy URL"}
              </Button>
            </div>
          </div>
          <p className="text-zinc-400 text-sm">Pick a use-case → fill details → get a production-ready prompt + JSON. Style Lock prevents presets from changing background/finish.</p>
          <div className="flex flex-wrap gap-2 items-center">
            <Select id="usecase" value={useCase} onChange={(v)=>{
              if (styleLock) {
                const prevBG = bgStyle; const prevFinish = finish;
                setUseCase(v);
                setTimeout(()=>{ setBgStyle(prevBG); setFinish(prevFinish); }, 0);
              } else {
                setUseCase(v);
              }
            }} options={[
              { label: "Studio (Editorial)", value: "studio" },
              { label: "E-commerce", value: "ecom" },
              { label: "Fashion (High-fashion)", value: "fashion" },
            ]}/>
            <Button
              variant={styleLock ? "primary" : "secondary"}
              onClick={()=>setStyleLock(val=>!val)}
              className="ml-2"
              aria-pressed={styleLock}
              title="Lock background & finish from preset changes"
            >
              <Lock size={16}/> {styleLock ? "Style Lock: ON" : "Style Lock: OFF"}
            </Button>
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <div className="grid md:grid-cols-2 gap-4">
                <Section title="Model & Garment">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <Select id="gender" value={gender} onChange={setGender} options={DEFAULTS.gender} />
                    </div>
                    <div>
                      <Label htmlFor="tee">T-shirt HEX</Label>
                      <div className="flex gap-2 items-center">
                        <Input id="tee" value={teeHex} onChange={(e)=>setTeeHex(e.target.value)} placeholder="#321541" aria-invalid={!hexValid}/>
                        <input type="color" value={hexValid? teeHex : "#2d314a"}
                          onChange={(e)=>setTeeHex(e.target.value)}
                          className="w-12 h-10 rounded-xl border border-zinc-800 bg-transparent" />
                      </div>
                      <p className={`text-xs mt-1 ${hexValid ? "text-zinc-500" : "text-red-400"}`}>
                        {hexValid ? "Looks good." : "Use 6-digit hex like #321541"}
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="face">Face Reference (URL / ID)</Label>
                      <Input id="face" value={faceRef} onChange={(e)=>setFaceRef(e.target.value)} placeholder="https://... or file:face_01" aria-invalid={!faceValid}/>
                      {!faceValid && <p className="text-xs text-amber-400 mt-1">Tip: add a real URL/ID to avoid generic faces.</p>}
                    </div>
                    <div>
                      <Label htmlFor="design">Design Reference (URL / ID)</Label>
                      <Input id="design" value={designRef} onChange={(e)=>setDesignRef(e.target.value)} placeholder="https://... or file:design_01" aria-invalid={!designValid}/>
                      {!designValid && <p className="text-xs text-amber-400 mt-1">Tip: add a design URL/ID to preserve your print.</p>}
                    </div>
                  </div>
                </Section>

                <Section title="Pose, Camera & Light">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="pose">Pose</Label>
                      <Select id="pose" value={pose} onChange={setPose} options={poses} />
                    </div>
                    <div>
                      <Label htmlFor="camera">Camera</Label>
                      <Select id="camera" value={camera} onChange={setCamera} options={cameras} />
                    </div>
                    <div>
                      <Label htmlFor="lighting">Lighting</Label>
                      <Select id="lighting" value={lighting} onChange={setLighting} options={lightings} />
                    </div>
                  </div>
                </Section>

                <Section title="Background & Finish"
                  right={
                    <span className="text-xs text-zinc-400">
                      {styleLock ? "Locked by Style Lock" : "Editable"}
                    </span>
                  }>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="bg">Background Style</Label>
                      <Select id="bg" value={bgStyle} onChange={(v)=> setBgStyle(v)} options={backgrounds} />
                    </div>
                    <div>
                      <Label htmlFor="finish">Aesthetic Finish</Label>
                      <Select id="finish" value={finish} onChange={(v)=> setFinish(v)} options={finishes} />
                    </div>
                    <div>
                      <Label htmlFor="textside">Overlay Text Side</Label>
                      <Select id="textside" value={textSide} onChange={setTextSide} options={[
                        {label:"Left", value:"left"},
                        {label:"Right", value:"right"},
                        {label:"Top", value:"top"},
                        {label:"Bottom", value:"bottom"}
                      ]} />
                    </div>
                  </div>
                </Section>

                <Section title="Output Settings">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="aspect">Aspect & Size</Label>
                      <Select id="aspect" value={aspect} onChange={setAspect} options={DEFAULTS.aspect} />
                      <p className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                        <Info size={14} aria-hidden />
                        {`${ratio || "—"} • ${size || "—"} (best for platform listed)`}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <Label>Extras (optional key → value pairs)</Label>
                      <div className="space-y-2">
                        {extras.map((e, i) => (
                          <div key={i} className="flex gap-2">
                            <Input placeholder="key (e.g., lut)" value={e.key} onChange={(ev)=>updateExtra(i,'key', ev.target.value)} />
                            <Input placeholder="value (e.g., unified teal-orange)" value={e.value} onChange={(ev)=>updateExtra(i,'value', ev.target.value)} />
                            <Button variant="ghost" onClick={()=>removeExtra(i)} aria-label="Remove"><Trash2 size={16} /></Button>
                          </div>
                        ))}
                        <Button variant="secondary" onClick={addExtra}><Plus size={16}/> Add extra</Button>
                      </div>
                    </div>
                  </div>
                </Section>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <Section
                title="Generated Prompt"
                right={
                  <div className="flex gap-2">
                    <Button onClick={()=>copyPrompt(prompt)}>{promptCopied ? 'Copied!' : (<><Copy size={16}/> Copy</>)}</Button>
                    <Button variant="secondary" onClick={async ()=>{ await shareLink(); const url = `${location.origin}${location.pathname}?${stateToQuery({ useCase, gender, teeHex, faceRef, designRef, pose, camera, lighting, bgStyle, finish, aspect, textSide, styleLock, extras })}`; copyURL(url); }}>
                      <Share2 size={16}/>{urlCopied ? "URL Copied!" : "Copy URL"}
                    </Button>
                  </div>
                }>
                <textarea readOnly value={prompt} className="w-full h-64 rounded-2xl bg-zinc-900/60 border border-zinc-800 p-3 text-sm" />
              </Section>
            </Card>

            <Card>
              <Section
                title="JSON Payload"
                right={
                  <div className="flex gap-2">
                    <Button onClick={()=>copyJSON(JSON.stringify(jsonPayload, null, 2))}><Copy size={16}/>{jsonCopied ? "Copied!" : "Copy"}</Button>
                    <Button variant="secondary" onClick={downloadJSON}><Download size={16}/>Download</Button>
                    <Button variant="secondary" onClick={async ()=>{ await shareLink(); const url = `${location.origin}${location.pathname}?${stateToQuery({ useCase, gender, teeHex, faceRef, designRef, pose, camera, lighting, bgStyle, finish, aspect, textSide, styleLock, extras })}`; copyURL(url); }}>
                      <Share2 size={16}/> {urlCopied ? "URL Copied!" : "Copy URL"}
                    </Button>
                  </div>
                }>
                <pre className="w-full h-64 overflow-auto rounded-2xl bg-zinc-900/60 border border-zinc-800 p-3 text-xs text-zinc-300">{JSON.stringify(jsonPayload, null, 2)}</pre>
              </Section>
            </Card>

            <Card>
              <Section title="How to customize">
                <ul className="list-disc pl-5 space-y-1 text-zinc-400 text-sm">
                  <li>Switch <b>Use-case</b> to swap curated options for Studio, E-com, or Fashion.</li>
                  <li>Toggle <b>Style Lock</b> to prevent presets from changing Background & Finish.</li>
                  <li>URL auto-updates with compact params (safe to share; defaults omitted).</li>
                  <li>Keyboard: <kbd>Cmd/Ctrl+B</kbd> copy prompt, <kbd>Cmd/Ctrl+J</kbd> download JSON.</li>
                </ul>
              </Section>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
