// CRT renderer: black + grain background, worn UI layer with light bloom,
// warm white palette in normal or inverted mode. The UI is drawn white on black
// into a 2D canvas and uploaded with upload(); render(t) draws one frame at time t (seconds).

const CRT_PALETTE = ['#030302', '#121210', '#4d4c47', '#ecebe3', '#ffffff'];
const CRT_PALETTE_INV = ['#eeece4', '#e1dfd6', '#a19f96', '#1a1916', '#050504'];

const CRT_VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

const CRT_BLUR = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uTex;
uniform vec2 uDir;
void main() {
  float w[5] = float[](0.227, 0.194, 0.121, 0.054, 0.016);
  vec3 s = texture(uTex, vUv).rgb * w[0];
  for (int i = 1; i < 5; i++) {
    s += texture(uTex, vUv + uDir * float(i)).rgb * w[i];
    s += texture(uTex, vUv - uDir * float(i)).rgb * w[i];
  }
  o = vec4(s, 1.0);
}`;

const CRT_FINAL = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uUI;
uniform sampler2D uBloom;
uniform vec2 uRes;
uniform float uTime, uShowUI;
uniform float uLift, uStorm, uStormKind, uBlank;   // launch sequence (all 0 = normal screen)
uniform vec3 uC0, uC1, uC2, uC3, uC4;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; }
  return v;
}

vec3 ramp(float x) {
  if (x < 0.07) return mix(uC0, uC1, x / 0.07);
  if (x < 0.35) return mix(uC1, uC2, (x - 0.07) / 0.28);
  if (x < 0.90) return mix(uC2, uC3, (x - 0.35) / 0.55);
  return mix(uC3, uC4, clamp((x - 0.90) / 0.4, 0.0, 1.0));
}

float band(float y, float speed, float offset, float width) {
  float c = 1.0 - fract(offset + uTime * speed);
  float d = abs(y - c); d = min(d, 1.0 - d);
  return exp(-pow(d / width, 2.0));
}

// Static screen-space wear: sparse specks + organic dirt. Darkens the UI only.
float wearMask(vec2 frag, float gs) {
  float speck  = smoothstep(0.90, 0.96, noise(frag / (2.6 * gs)));
  float speck2 = smoothstep(0.91, 0.97, noise(frag / (7.0 * gs) + 5.0));
  vec2 q = frag / (45.0 * gs);
  q += vec2(fbm(q * 0.7), fbm(q * 0.7 + 5.2)) * 1.6;
  float dirt = smoothstep(0.60, 0.70, fbm(q));
  float film = noise(frag / (1.6 * gs) + 9.0);
  float m = 1.0;
  m *= 1.0 - speck * 0.55;
  m *= 1.0 - speck2 * 0.5;
  m *= 1.0 - dirt * (0.55 + 0.3 * film);
  m *= 1.0 - 0.05 * film;
  return m;
}

void main() {
  vec2 frag = vUv * uRes;
  vec2 uv = vUv;
  vec2 px = 1.0 / uRes;
  float gs = max(1.0, uRes.y / 1000.0);
  float tick = floor(uTime * 15.0);              // 15 Hz clock, as in the reference

  float I = 0.035;
  float b1 = band(uv.y, 0.011, 0.33, 0.022);
  float b2 = band(uv.y, 0.007, 0.70, 0.030);
  float streak = noise(vec2(uv.x * 4.0 + tick * 0.7, uv.y * uRes.y * 0.35));
  I += (b1 + b2 * 0.8) * (0.012 + 0.035 * streak * streak);
  float g = hash(floor(frag / gs) + tick * 13.7) - 0.5;
  I += g * 0.03;

  vec2 erode = vec2(noise(frag / (6.0 * gs) + 11.0), noise(frag / (6.0 * gs) + 37.0)) - 0.5;
  float jitter = (b1 + b2) * (noise(vec2(uv.y * 90.0, tick)) - 0.5) * 0.0009;
  vec2 uvUI = uv + erode * px * 0.7 * gs + vec2(jitter, 0.0);
  vec2 d = px * gs * 1.4;
  float ui = texture(uUI, uvUI).r * 0.4
           + (texture(uUI, uvUI + vec2(d.x, 0)).r + texture(uUI, uvUI - vec2(d.x, 0)).r
           +  texture(uUI, uvUI + vec2(0, d.y)).r + texture(uUI, uvUI - vec2(0, d.y)).r) * 0.15;
  ui *= wearMask(frag, gs);
  ui *= 0.93 + 0.07 * noise(frag / (160.0 * gs));
  ui *= uShowUI;
  float bloom = texture(uBloom, uv).r * uShowUI;

  I = mix(I, 0.85 + g * 0.05, ui) + bloom * 0.08;

  // launch sequence: background lift, storm growing in from the edges (bottom first), blank screen
  I += uLift;
  if (uStorm > 0.0) {
    // fine speckles, dense at the edges (bottom first), creeping inward; sparse everywhere at the very end
    float e = min(min(uv.x, 1.0 - uv.x) * 1.5, min(uv.y, (1.0 - uv.y) * 1.7));
    float n = fbm(frag / (28.0 * gs) + vec2(0.0, uTime * 0.05));
    float n2 = noise(frag / (6.0 * gs) + 4.0);
    float reach = 0.05 + uStorm * 0.38;   // the centre is only reached by the sparse late grain
    float edgeW = pow(clamp(1.0 - (e + (n - 0.5) * 0.18) / reach, 0.0, 1.0), 1.4);
    float density = edgeW * smoothstep(0.3, 0.72, n) + uStorm * uStorm * 0.22 * smoothstep(0.45, 0.8, n);
    density = clamp(density * (0.7 + 0.6 * n2), 0.0, 1.0);
    // phosphor: a fixed grain that lights up, like a dirty screen being overdriven; snow: it flickers at 15 Hz
    float speck = hash(floor(frag / (1.4 * gs)) + (uStormKind < 0.5 ? 3.1 : tick * 7.3));
    I += step(1.0 - density, speck) * (0.5 + 0.5 * n) * (0.45 + 0.45 * uStorm);
  }
  I *= 1.0 - uBlank;

  float scan = 0.5 + 0.5 * cos(frag.y / (2.5 * gs) * 6.2832);
  I *= 1.0 - 0.03 * scan;
  vec2 vq = uv * (1.0 - uv.yx);
  I *= mix(1.0, pow(clamp(vq.x * vq.y * 16.0, 0.0, 1.0), 0.28), 0.3);

  o = vec4(ramp(I), 1.0);
}`;

function createCRT(canvas) {
  const gl = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true });

  function shader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  function program(fs) {
    const p = gl.createProgram();
    gl.attachShader(p, shader(gl.VERTEX_SHADER, CRT_VERT));
    gl.attachShader(p, shader(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, 'aPos');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {};
    for (let i = 0; i < gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i++) {
      const name = gl.getActiveUniform(p, i).name;
      u[name] = gl.getUniformLocation(p, name);
    }
    return { p, u };
  }
  function texture(w, h) {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (w) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    return t;
  }
  function target(w, h) {
    const tex = texture(w, h);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex, fb, w, h };
  }
  const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16) / 255);

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const blurProg = program(CRT_BLUR);
  const finalProg = program(CRT_FINAL);
  const uiTex = texture();
  let W = 0, H = 0, bloomA, bloomB;

  function blur(src, dst, dx, dy) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb);
    gl.viewport(0, 0, dst.w, dst.h);
    gl.useProgram(blurProg.p);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, src);
    gl.uniform1i(blurProg.u.uTex, 0);
    gl.uniform2f(blurProg.u.uDir, dx / dst.w, dy / dst.h);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  return {
    resize(w, h) {
      W = w; H = h; canvas.width = w; canvas.height = h;
      bloomA = target(w >> 1, h >> 1);
      bloomB = target(w >> 1, h >> 1);
    },
    upload(src) {
      gl.bindTexture(gl.TEXTURE_2D, uiTex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    },
    render(t, { inverted = false, showUI = true, lift = 0, storm = 0, stormKind = 0, blank = 0 } = {}) {
      blur(uiTex, bloomA, 2, 0); blur(bloomA.tex, bloomB, 0, 2);
      blur(bloomB.tex, bloomA, 4, 0); blur(bloomA.tex, bloomB, 0, 4);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, W, H);
      gl.useProgram(finalProg.p);
      const u = finalProg.u;
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, uiTex); gl.uniform1i(u.uUI, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, bloomB.tex); gl.uniform1i(u.uBloom, 1);
      gl.uniform2f(u.uRes, W, H);
      gl.uniform1f(u.uTime, t);
      gl.uniform1f(u.uShowUI, showUI ? 1 : 0);
      gl.uniform1f(u.uLift, lift);
      gl.uniform1f(u.uStorm, storm);
      gl.uniform1f(u.uStormKind, stormKind);
      gl.uniform1f(u.uBlank, blank);
      (inverted ? CRT_PALETTE_INV : CRT_PALETTE).forEach((c, i) => gl.uniform3fv(u[`uC${i}`], hex(c)));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
  };
}
