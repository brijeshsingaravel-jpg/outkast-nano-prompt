import React, { useMemo, useState, useEffect } from "react";
import { Copy, Plus, Trash2, Download, Share2, Shuffle } from "lucide-react";

// Lightweight shadcn-style primitives (Tailwind utilities)
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

// Default option sets
const DEFAULTS = {
  gender: [
    { label: "Female", value: "female" },
    { label: "Male", value: "male" },
    { label: "Unisex / Androgynous", value: "androgynous" },
  ],
  pose: [
    { label: "Stand—Relaxed 3/4, hands in pockets", value: "standing 3/4, relaxed, hands in pockets" },
    { label: "Sitting—Stool, one knee up", value: "sitting on a studio stool, one knee raised" },
    { label: "Cross‑armed, head slightly tilted", value: "arms crossed, head slightly tilted" },
    { label: "Dynamic step forward", value: "dynamic step forward, subtle motion blur" },
  ],
  camera: [
    { label: "50mm eye‑level", value: "50mm eye-level" },
    { label: "85mm portrait, slight top‑down", value: "85mm portrait, slight top-down" },
    { label: "35mm wide, low angle", value: "35mm wide, low angle" },
  ],
  lighting: [
    { label: "2‑point softbox + rim light", value: "two softboxes key+fill, subtle rim light" },
    { label: "Clamshell beauty light", value: "clamshell beauty lighting" },
    { label: "Moody Rembrandt", value: "Rembrandt lighting, soft contrast" },
  ],
  bgStyle: [
    { label: "Studio seamless gradient", value: "studio seamless backdrop, smooth gradient" },
    { label: "Matte solid", value: "matte solid backdrop" },
    { label: "Soft bokeh", value: "soft bokeh background" },
  ],
  finish: [
    { label: "Cinematic, premium", value: "cinematic, premium, editorial" },
    { label: "Hyper‑clean ecommerce", value: "hyper-clean ecommerce" },
    { label: "Moody fashion", value: "moody high-fashion" },
  ],
  aspect: [
    { label: "9:16 (Reel)", value: "9:16" },
    { label: "4:5 (Feed)", value: "4:5" },
    { label: "1:1 (Square)", value: "1:1" },
  ],
};

// Creator presets
const PRESETS = {
  studioPremium: {
    name: "Studio • Premium",
    lighting: "two softboxes key+fill, subtle rim light",
    finish: "cinematic, premium, editorial",
    camera: "85mm portrait, slight top-down",
    bgStyle: "studio seamless backdrop, smooth gradient",
  },
  ecommerceClean: {
    name: "E‑com • Clean",
    lighting: "clamshell beauty lighting",
    finish: "hyper-clean ecommerce",
    camera: "50mm eye-level",
    bgStyle: "matte solid backdrop",
  },
  moodyFashion: {
    name: "Fashion • Moody",
    lighting: "Rembrandt lighting, soft contrast",
    finish: "moody high-fashion",
    camera: "35mm wide, low angle",
    bgStyle: "soft bokeh background",
  },
};

// Prompt template
const TEMPLATE = `A luxury fashion studio shot of a {gender} model in an Outkast T‑shirt in hex color {tee_hex}. Retain model's face from {face_ref}. Keep the printed design from {design_ref}. Background: {background} tuned to complement {tee_hex}. Pose: {pose}. Camera: {camera}. Lighting: {lighting}. Finish: {finish}. Styling: clean drape, natural fabric folds, true-to-color garment. Composition: centered, headroom balanced, negative space for text on {text_side}. Output: {aspect}, 4K, high detail, sharp focus. Negative: blurry logos, extra text, watermarks, duplicate faces, distorted hands.`;

function useClipboard() {
  const [copied, setCopied] = useState(false);
  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false), 1500);} catch {}
  };
  return {copied, copy};
}

function stateToQuery(s) {
  const q = new URLSearchParams();
  Object.entries(s).forEach(([k,v])=>{
    if(typeof v === "string") q.set(k,v);
    if(k==="extras") q.set("extras", btoa(unescape(encodeURIComponent(JSON.stringify(v)))));
  });
  return q.toString();
}
function queryToState() {
  const p = new URLSearchParams(location.search);
  const obj = {};
  for (const [k,v] of p) {
    if(k==="extras") {
      try { obj.extras = JSON.parse(decodeURIComponent(escape(atob(v)))); } catch {}
    } else obj[k] = v;
  }
  return obj;
}

export default function PromptBuilder() {
  const [gender, setGender] = useState("female");
  const [teeHex, setTeeHex] = useState("#2d314a");
  const [faceRef, setFaceRef] = useState("<paste face image link or ID>");
  const [designRef, setDesignRef] = useState("<paste design image link or ID>");
  const [pose, setPose] = useState(DEFAULTS.pose[0].value);
  const [camera, setCamera] = useState(DEFAULTS.camera[0].value);
  const [lighting, setLighting] = useState(DEFAULTS.lighting[0].value);
  const [bgStyle, setBgStyle] = useState(DEFAULTS.bgStyle[0].value);
  const [finish, setFinish] = useState(DEFAULTS.finish[0].value);
  const [aspect, setAspect] = useState("9:16");
  const [textSide, setTextSide] = useState("right");

  const [extras, setExtras] = useState([
    { key: "grain", value: "very subtle film grain" },
  ]);

  // Load from URL or localStorage on first mount
  useEffect(()=>{
    const q = queryToState();
    const hasQuery = Object.keys(q).length > 0;
    if (hasQuery) {
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
      if(q.extras) setExtras(q.extras);
    } else {
      const raw = localStorage.getItem("nbuilder:v1");
      if(raw){
        try{
          const s = JSON.parse(raw);
          setGender(s.gender ?? "female");
          setTeeHex(s.teeHex ?? "#2d314a");
          setFaceRef(s.faceRef ?? "");
          setDesignRef(s.designRef ?? "");
          setPose(s.pose ?? DEFAULTS.pose[0].value);
          setCamera(s.camera ?? DEFAULTS.camera[0].value);
          setLighting(s.lighting ?? DEFAULTS.lighting[0].value);
          setBgStyle(s.bgStyle ?? DEFAULTS.bgStyle[0].value);
          setFinish(s.finish ?? DEFAULTS.finish[0].value);
          setAspect(s.aspect ?? "9:16");
          setTextSide(s.textSide ?? "right");
          setExtras(s.extras ?? []);
        }catch{}
      }
    }
  }, []);

  // Persist to localStorage
  useEffect(()=>{
    const state = { gender, teeHex, faceRef, designRef, pose, camera, lighting, bgStyle, finish, aspect, textSide, extras };
    localStorage.setItem("nbuilder:v1", JSON.stringify(state));
  }, [gender, teeHex, faceRef, designRef, pose, camera, lighting, bgStyle, finish, aspect, textSide, extras]);

  const background = useMemo(() => `${bgStyle} that blends with ${teeHex}`, [bgStyle, teeHex]);

  const prompt = useMemo(() => {
    const base = TEMPLATE
      .replaceAll("{gender}", gender)
      .replaceAll("{tee_hex}", teeHex)
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
    model: "nano-banana-vX", // change to exact model if needed
    inputs: {
      face_ref: faceRef,
      design_ref: designRef,
      tee_hex: teeHex,
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

  const {copied, copy} = useClipboard();

  const addExtra = () => setExtras([...extras, { key: "", value: "" }]);
  const updateExtra = (i, field, value) => setExtras(extras.map((e, idx)=> idx===i ? { ...e, [field]: value } : e));
  const removeExtra = (i) => setExtras(extras.filter((_, idx)=> idx!==i));

  const shareLink = () => {
    const state = { gender, teeHex, faceRef, designRef, pose, camera, lighting, bgStyle, finish, aspect, textSide, extras };
    const url = `${location.origin}${location.pathname}?${stateToQuery(state)}`;
    navigator.clipboard.writeText(url);
    alert("Share link copied!");
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(jsonPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'nano-banana-prompt.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const randomize = () => {
    const pick = (arr) => arr[Math.floor(Math.random()*arr.length)].value;
    setPose(pick(DEFAULTS.pose));
    setCamera(pick(DEFAULTS.camera));
    setLighting(pick(DEFAULTS.lighting));
  };

  // Keyboard shortcuts: Cmd/Ctrl+B => copy prompt, Cmd/Ctrl+J => download JSON
  useEffect(()=>{
    const onKey = (e) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if(mod && e.key.toLowerCase()==='b'){ e.preventDefault(); copy(prompt); }
      if(mod && e.key.toLowerCase()==='j'){ e.preventDefault(); downloadJSON(); }
    };
    window.addEventListener('keydown', onKey);
    return ()=> window.removeEventListener('keydown', onKey);
  }, [prompt]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-black via-zinc-950 to-black text-zinc-100 p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-3">
          <h1 className="text-2xl md:text-3xl font-semibold">Outkast — Nano Banana Prompt Generator</h1>
          <p className="text-zinc-400 text-sm">Fill the blanks → pick options → get a clean, production‑ready prompt + JSON for your workflow.</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PRESETS).map(([k,v])=> (
              <Button key={k} variant="secondary" onClick={()=>{ setLighting(v.lighting); setFinish(v.finish); setCamera(v.camera); setBgStyle(v.bgStyle); }}>
                {v.name}
              </Button>
            ))}
            <Button variant="secondary" onClick={randomize}><Shuffle size={16}/> Quick randomize</Button>
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
                      <Label htmlFor="tee">T‑shirt HEX</Label>
                      <div className="flex gap-2 items-center">
                        <Input id="tee" value={teeHex} onChange={(e)=>setTeeHex(e.target.value)} placeholder="#321541" />
                        <input type="color" value={/^#([0-9a-f]{6})$/i.test(teeHex)? teeHex : "#2d314a"}
                          onChange={(e)=>setTeeHex(e.target.value)}
                          className="w-12 h-10 rounded-xl border border-zinc-800 bg-transparent" />
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">{/^#([0-9a-f]{6})$/i.test(teeHex) ? "Looks good." : "Use 6-digit hex like #321541"}</p>
                    </div>
                    <div>
                      <Label htmlFor="face">Face Reference (URL / ID)</Label>
                      <Input id="face" value={faceRef} onChange={(e)=>setFaceRef(e.target.value)} placeholder="https://... or file:face_01" />
                    </div>
                    <div>
                      <Label htmlFor="design">Design Reference (URL / ID)</Label>
                      <Input id="design" value={designRef} onChange={(e)=>setDesignRef(e.target.value)} placeholder="https://... or file:design_01" />
                    </div>
                  </div>
                </Section>
                <Section title="Pose, Camera & Light">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="pose">Pose</Label>
                      <Select id="pose" value={pose} onChange={setPose} options={DEFAULTS.pose} />
                    </div>
                    <div>
                      <Label htmlFor="camera">Camera</Label>
                      <Select id="camera" value={camera} onChange={setCamera} options={DEFAULTS.camera} />
                    </div>
                    <div>
                      <Label htmlFor="lighting">Lighting</Label>
                      <Select id="lighting" value={lighting} onChange={setLighting} options={DEFAULTS.lighting} />
                    </div>
                  </div>
                </Section>
                <Section title="Background & Finish">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="bg">Background Style</Label>
                      <Select id="bg" value={bgStyle} onChange={setBgStyle} options={DEFAULTS.bgStyle} />
                    </div>
                    <div>
                      <Label htmlFor="finish">Aesthetic Finish</Label>
                      <Select id="finish" value={finish} onChange={setFinish} options={DEFAULTS.finish} />
                    </div>
                    <div>
                      <Label htmlFor="textside">Overlay Text Side</Label>
                      <Select id="textside" value={textSide} onChange={setTextSide} options={[{label:"Left", value:"left"},{label:"Right", value:"right"},{label:"Top", value:"top"},{label:"Bottom", value:"bottom"}]} />
                    </div>
                  </div>
                </Section>
                <Section title="Output Settings">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="aspect">Aspect Ratio</Label>
                      <Select id="aspect" value={aspect} onChange={setAspect} options={DEFAULTS.aspect} />
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <Label>Extras (optional key → value pairs)</Label>
                      <div className="space-y-2">
                        {extras.map((e, i) => (
                          <div key={i} className="flex gap-2">
                            <Input placeholder="key (e.g., lut)" value={e.key} onChange={(ev)=>updateExtra(i,'key', ev.target.value)} />
                            <Input placeholder="value (e.g., unified teal‑orange)" value={e.value} onChange={(ev)=>updateExtra(i,'value', ev.target.value)} />
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
              <Section title="Generated Prompt" right={<div className="flex gap-2"><Button onClick={()=>copy(prompt)}>{copied ? 'Copied!' : (<><Copy size={16}/> Copy</>)}</Button><Button variant="secondary" onClick={shareLink}><Share2 size={16}/>Share</Button></div>}>
                <textarea readOnly value={prompt} className="w-full h-64 rounded-2xl bg-zinc-900/60 border border-zinc-800 p-3 text-sm" />
              </Section>
            </Card>
            <Card>
              <Section title="JSON Payload" right={<div className="flex gap-2"><Button onClick={()=>copy(JSON.stringify(jsonPayload, null, 2))}><Copy size={16}/>Copy</Button><Button variant="secondary" onClick={downloadJSON}><Download size={16}/>Download</Button><Button variant="secondary" onClick={shareLink}><Share2 size={16}/>Share</Button></div>}>
                <pre className="w-full h-64 overflow-auto rounded-2xl bg-zinc-900/60 border border-zinc-800 p-3 text-xs text-zinc-300">{JSON.stringify(jsonPayload, null, 2)}</pre>
              </Section>
            </Card>
            <Card>
              <Section title="How to customize">
                <ul className="list-disc pl-5 space-y-1 text-zinc-400 text-sm">
                  <li>Edit option sets in <code>DEFAULTS</code> (pose, camera, lighting, etc.).</li>
                  <li>Change the sentence structure in <code>TEMPLATE</code> — keep the <code>{`{placeholders}`}</code> for blanks.</li>
                  <li>Add more blanks by creating state + a field, then use it in <code>TEMPLATE</code>.</li>
                  <li>Use the JSON for automations (e.g., Zapier/Make) to call Nano Banana with consistent prompts.</li>
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

