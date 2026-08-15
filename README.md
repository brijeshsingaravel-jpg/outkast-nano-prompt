# Outkast Nano Prompt

A prompt builder for product photography, made for putting a t-shirt design on a model and getting
a consistent image back.

You pick the shot rather than describe it — pose, camera, lighting, background, finish, aspect
ratio — and it writes the prompt. The point is repeatability: the same lighting and framing across
a whole product run, instead of a slightly different photoshoot every time you retype a sentence.

## What you choose

| | |
|---|---|
| **Garment** | t-shirt colour as a HEX value |
| **References** | a face and a design, by URL or file id |
| **Pose** | including things like *contrapposto relaxed* |
| **Camera & lighting** | *clamshell beauty*, *beauty dish pop*, *gel accent subtle* |
| **Background & finish** | *gradient noir*, *editorial filmic*, *grain kissed*, *light grey matte* |
| **Overlay text side** | left, right, bottom |
| **Aspect & size** | 1:1 1080×1080 · 4:5 1080×1350 · 9:16 1080×1920 · 2:3 1000×1500 · 16:9 |
| **Extras** | your own key → value pairs, for anything the form does not cover |

It gives you back a written prompt and a JSON payload, either of which you can copy.

## Style Lock

**The reason this exists rather than a notes file.** Turn Style Lock on and the look — lighting,
background, finish — is held fixed while you change the garment, the design or the pose. That is
what makes twenty products look like one catalogue instead of twenty separate attempts.

## Copy URL

Your whole configuration is encoded into the address bar, so a preset is just a link. Send it to
someone and they open the form exactly as you left it. Nothing is stored on a server, because
there is no server.

## It sends nothing anywhere

No API calls, no analytics, no account. It is a single React page that runs in your browser and
builds text. The only network traffic is loading the page itself.

## Running it

```bash
npm install
npm run dev
```

Vite, React and Tailwind. `src/App.jsx` is the whole application — 646 lines, no backend.

## Status

**Built for one clothing business and shared as-is.** It is not a general-purpose tool and was
never meant to be. If the shape is useful to you — pick the variables, lock the style, share the
preset as a URL — take it.

Built in Chennai.
