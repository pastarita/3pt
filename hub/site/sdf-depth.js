/* 3PT · sdf-depth: a signed-distance-field depth background (experiment, 2026-09-26).
   One fragment shader draws the triangle mark (three points) as a height field: inside is a soft
   plateau, outside falls off, a rim lights the edge, faint contours mark distance, and each region
   takes the hue of the nearest point (plan, build, instrument). Colours are read from CSS custom
   properties on the host so the same shader re-skins with the design system's tokens.

     SDF.mount(el, { fixed:false, intensity:0.6, speed:1, scale:1, vars:{...} })  → handle
     handle.recolor()  after the host's tokens change   ·  handle.destroy()

   Reduced motion renders one still frame. Offscreen and hidden tabs pause. No WebGL → a CSS
   radial-gradient fallback built from the same colours. Self-contained; no dependencies. */
(function(){
  var G = (typeof globalThis!=='undefined'?globalThis:window);
  if (G.SDF || typeof document==='undefined') return;

  var VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  var FS = [
    'precision highp float;',
    'uniform vec2 u_res;uniform float u_time;uniform float u_int;uniform float u_scale;',
    'uniform vec3 u_bg;uniform vec3 u_a;uniform vec3 u_b;uniform vec3 u_c;',
    'float sdTri(vec2 p,vec2 p0,vec2 p1,vec2 p2){',
    ' vec2 e0=p1-p0,e1=p2-p1,e2=p0-p2,v0=p-p0,v1=p-p1,v2=p-p2;',
    ' vec2 q0=v0-e0*clamp(dot(v0,e0)/dot(e0,e0),0.,1.),q1=v1-e1*clamp(dot(v1,e1)/dot(e1,e1),0.,1.),q2=v2-e2*clamp(dot(v2,e2)/dot(e2,e2),0.,1.);',
    ' float s=sign(e0.x*e2.y-e0.y*e2.x);',
    ' vec2 d=min(min(vec2(dot(q0,q0),s*(v0.x*e0.y-v0.y*e0.x)),vec2(dot(q1,q1),s*(v1.x*e1.y-v1.y*e1.x))),vec2(dot(q2,q2),s*(v2.x*e2.y-v2.y*e2.x)));',
    ' return -sqrt(d.x)*sign(d.y);}',
    'float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}',
    'float field(vec2 p,vec2 A,vec2 B,vec2 C){',
    ' float d=sdTri(p,A,B,C);',
    ' d=smin(d,length(p-A)-.055,.09);d=smin(d,length(p-B)-.055,.09);d=smin(d,length(p-C)-.055,.09);',
    ' return d;}',
    'void main(){',
    ' vec2 uv=(gl_FragCoord.xy-.5*u_res)/min(u_res.x,u_res.y);',
    ' float t=u_time*.06;',
    ' vec2 drift=vec2(.10*sin(t*.7),.05*cos(t*.9));',
    ' float r=.30*u_scale;',
    ' vec2 A=vec2(0.,r)+drift,B=vec2(.866*r,-.5*r)+drift,C=vec2(-.866*r,-.5*r)+drift;',
    ' float d=field(uv,A,B,C);',
    ' float e=1.5/min(u_res.x,u_res.y);',
    ' vec2 g=vec2(field(uv+vec2(e,0.),A,B,C)-field(uv-vec2(e,0.),A,B,C),field(uv+vec2(0.,e),A,B,C)-field(uv-vec2(0.,e),A,B,C))/(2.*e);',
    ' float wa=1./(dot(uv-A,uv-A)+.02),wb=1./(dot(uv-B,uv-B)+.02),wc=1./(dot(uv-C,uv-C)+.02);',
    ' vec3 hue=(u_a*wa+u_b*wb+u_c*wc)/(wa+wb+wc);',
    ' float glow=1.-smoothstep(0.,.75,d);',
    ' float plateau=1.-smoothstep(-.08,.0,d);',
    ' float rim=exp(-abs(d)*38.);',
    ' float contour=smoothstep(.92,1.,abs(fract(d*14.)-.5)*2.)*(1.-smoothstep(0.,.7,abs(d)));',
    ' vec3 n=normalize(vec3(-g*plateau*.6,1.));',
    ' float light=.75+.25*dot(n,normalize(vec3(-.5,.7,.6)));',
    ' vec3 col=mix(u_bg,hue,(glow*.35+plateau*.30)*u_int);',
    ' col=mix(col,hue,rim*.35*u_int);',
    ' col+=hue*contour*.06*u_int;',
    ' col*=mix(1.,light,.5*u_int);',
    ' col+=(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5)/255.;',
    ' gl_FragColor=vec4(col,1.);}'
  ].join('\n');

  var css = '.sdf-host{position:relative}.sdf-host>canvas.sdf{position:absolute;inset:0;width:100%;height:100%;display:block;z-index:0;pointer-events:none;border-radius:inherit}'
    + '.sdf-host>*:not(canvas.sdf){position:relative;z-index:1}'
    + 'canvas.sdf.fixed{position:fixed;inset:0;width:100vw;height:100vh;z-index:0;pointer-events:none}'
    + '.sdf-fallback{background:radial-gradient(circle at 50% 30%,var(--sdf-a) 0,transparent 40%),radial-gradient(circle at 78% 66%,var(--sdf-b) 0,transparent 40%),radial-gradient(circle at 22% 66%,var(--sdf-c) 0,transparent 40%)}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function rgb(s){ s=(s||'').trim(); var m=/^#([0-9a-f]{3,8})$/i.exec(s); if(m){ var h=m[1]; if(h.length<6) h=h.split('').map(function(c){return c+c;}).join(''); return [0,2,4].map(function(i){return parseInt(h.slice(i,i+2),16)/255;}); }
    m=/rgba?\(([^)]+)\)/.exec(s); if(m){ var p=m[1].split(/[\s,\/]+/).map(parseFloat); return [p[0]/255,p[1]/255,p[2]/255]; } return null; }
  function readVar(el, names, fallback){ var cs=getComputedStyle(el); for (var i=0;i<names.length;i++){ var v=cs.getPropertyValue(names[i]); if(v && v.trim()) return v.trim(); } return fallback; }
  var reduced = matchMedia('(prefers-reduced-motion: reduce)');

  function mount(host, opts){
    opts = opts||{};
    var vars = opts.vars || { bg:['--t-canvas','--bg-canvas','--bg'], a:['--t-plan','--point-plan','--plan'], b:['--t-build','--point-build','--build'], c:['--t-instrument','--point-instrument','--instrument'] };
    var canvas = document.createElement('canvas'); canvas.className = 'sdf' + (opts.fixed ? ' fixed' : ''); canvas.setAttribute('aria-hidden','true');
    if (!opts.fixed) host.classList.add('sdf-host');
    host.insertBefore(canvas, host.firstChild);
    var gl = canvas.getContext('webgl', { antialias:false, alpha:false, powerPreference:'low-power' });
    var colors = function(){ return { bg:rgb(readVar(host,vars.bg,'#0f1216'))||[.06,.07,.09], a:rgb(readVar(host,vars.a,'#8b7cf6'))||[.55,.49,.96], b:rgb(readVar(host,vars.b,'#e0a33a'))||[.88,.64,.23], c:rgb(readVar(host,vars.c,'#3fb886'))||[.25,.72,.53] }; };
    if (!gl) { host.classList.add('sdf-fallback'); var c0=colors(); ['a','b','c'].forEach(function(k){ var v=c0[k]; host.style.setProperty('--sdf-'+k,'rgba('+Math.round(v[0]*255)+','+Math.round(v[1]*255)+','+Math.round(v[2]*255)+',.18)'); }); canvas.remove(); return { recolor:function(){}, destroy:function(){ host.classList.remove('sdf-fallback'); } }; }
    function sh(t,s){ var o=gl.createShader(t); gl.shaderSource(o,s); gl.compileShader(o); if(!gl.getShaderParameter(o,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; }
    var prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER,VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER,FS)); gl.linkProgram(prog); gl.useProgram(prog);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog,'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    var U = {}; ['u_res','u_time','u_int','u_scale','u_bg','u_a','u_b','u_c'].forEach(function(n){ U[n]=gl.getUniformLocation(prog,n); });
    var col = colors(), intensity = opts.intensity==null?0.6:opts.intensity, speed = opts.speed==null?1:opts.speed, scale = opts.scale==null?1:opts.scale;
    var running = true, visible = true, raf = 0, t0 = performance.now(), w=0, h=0;
    function size(){ var dpr=Math.min(devicePixelRatio||1,1.5); var r=opts.fixed?{width:innerWidth,height:innerHeight}:host.getBoundingClientRect(); var W=Math.max(1,Math.round(r.width*dpr)), H=Math.max(1,Math.round(r.height*dpr)); if(W!==w||H!==h){ w=W;h=H;canvas.width=W;canvas.height=H;gl.viewport(0,0,W,H);} }
    function frame(now){ raf=0; size(); gl.uniform2f(U.u_res,w,h); gl.uniform1f(U.u_time,((now-t0)/1000)*speed); gl.uniform1f(U.u_int,intensity); gl.uniform1f(U.u_scale,scale);
      gl.uniform3fv(U.u_bg,col.bg); gl.uniform3fv(U.u_a,col.a); gl.uniform3fv(U.u_b,col.b); gl.uniform3fv(U.u_c,col.c); gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
      if (running && visible && !reduced.matches) raf=requestAnimationFrame(frame); }
    function kick(){ if(!raf) raf=requestAnimationFrame(frame); }
    var ro = ('ResizeObserver' in G) ? new ResizeObserver(kick) : null; if (ro && !opts.fixed) ro.observe(host);
    var io = ('IntersectionObserver' in G && !opts.fixed) ? new IntersectionObserver(function(es){ visible = es[0].isIntersecting; if(visible) kick(); }) : null; if (io) io.observe(host);
    function onVis(){ if(document.hidden){ running=false; } else { running=true; kick(); } }
    document.addEventListener('visibilitychange', onVis); addEventListener('resize', kick); reduced.addEventListener && reduced.addEventListener('change', kick);
    kick();
    return {
      canvas: canvas,
      recolor: function(){ col=colors(); kick(); },
      set: function(o){ if(o.intensity!=null) intensity=o.intensity; if(o.speed!=null) speed=o.speed; if(o.scale!=null) scale=o.scale; kick(); },
      destroy: function(){ running=false; if(raf) cancelAnimationFrame(raf); if(ro) ro.disconnect(); if(io) io.disconnect(); document.removeEventListener('visibilitychange', onVis); removeEventListener('resize', kick); canvas.remove(); host.classList.remove('sdf-host'); }
    };
  }
  G.SDF = { mount:mount, FS:FS };
})();
