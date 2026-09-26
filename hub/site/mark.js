/* 3PT · the mark, in the browser. A port of scripts/banner.mjs (the README banner) so every leaf can
   draw the same tetrahedron the same way: three points on the base (plan, build, instrument), the
   batteries core at the apex, faces shaded as the SDF shader shades them (plateau, rim), contour
   rings outside, a glow at each point, the loop around the base and the backfeed arrows that close it.
   Colours are read from the 3pt.css tokens at call time, so light/dark and any retheme follow.
     MARK.svg({ w, h, focus, loop, contours, labels, scale })  → SVG markup
     MARK.mount(el, opts)                                       → sets el.innerHTML
   focus: 'plan' | 'build' | 'instrument' | 'core' | null  — that point is lit, the rest recede. */
(function(){
  var G = typeof globalThis !== 'undefined' ? globalThis : window;
  function tok(name, fb){ try { var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v || fb; } catch(e){ return fb; } }
  function hex(s){ s=(s||'').trim(); var m=/^#([0-9a-f]{3,8})$/i.exec(s); if(!m) return s; var h=m[1]; if(h.length<6) h=h.split('').map(function(c){return c+c;}).join(''); return '#'+h.slice(0,6); }
  function mix(a,b,t){ a=hex(a); b=hex(b); if(a[0]!=='#'||b[0]!=='#') return a; var c=function(h){return [1,3,5].map(function(i){return parseInt(h.slice(i,i+2),16);});}; var A=c(a),B=c(b);
    return '#'+A.map(function(v,i){return Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0');}).join(''); }
  var deg = function(d){ return d*Math.PI/180; };
  var AZ = deg(-50), EL = deg(30), ROLL = deg(13);
  function rot(p){ var x=p[0],y=p[1],z=p[2];
    var x1 = x*Math.cos(AZ) + z*Math.sin(AZ), z1 = -x*Math.sin(AZ) + z*Math.cos(AZ), y1 = y;
    var y2 = y1*Math.cos(EL) - z1*Math.sin(EL), z2 = y1*Math.sin(EL) + z1*Math.cos(EL);
    var x3 = x1*Math.cos(ROLL) - y2*Math.sin(ROLL), y3 = x1*Math.sin(ROLL) + y2*Math.cos(ROLL);
    return [x3, y3, z2]; }
  var sub=function(a,b){return a.map(function(v,i){return v-b[i];});}, cross=function(a,b){return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];};
  var norm=function(v){var n=Math.hypot(v[0],v[1],v[2]);return v.map(function(x){return x/n;});}, dot=function(a,b){return a.reduce(function(s,v,i){return s+v*b[i];},0);};
  var fmt = function(n){ return (Math.round(n*10)/10).toString(); };

  function svg(o){
    o = o || {};
    var W = o.w || 520, H = o.h || 420, S = o.scale || Math.min(W, H) * 0.27;
    var CX = W/2 + (o.dx||0), CY = H/2 + 18 + (o.dy||0);
    var T = { canvas: tok('--bg','#0f1216'), ink: tok('--ink','#e6e9ee'), faint: tok('--faint','#6b7684'), accent: tok('--flag','#ff6b4a'),
              plan: tok('--plan','#8b7cf6'), build: tok('--build','#e0a33a'), instrument: tok('--instrument','#3fb886'), core: tok('--cyan','#3aa6d9') };
    var focus = o.focus || null;
    var dim = function(k){ return focus && focus !== k; };
    var r = 1, h = Math.SQRT2 * r;
    var P3 = { A:[0,0,-r], B:[0.866*r,0,0.5*r], C:[-0.866*r,0,0.5*r], O:[0,h,0] };
    var proj = function(p){ var q = rot(p); return { x: CX + q[0]*S, y: CY - q[1]*S, z: q[2] }; };
    var V = {}; for (var k in P3) V[k] = proj(P3[k]);
    var light = (function(){ var L=[-0.55,0.65,0.75]; var n=Math.hypot(L[0],L[1],L[2]); return L.map(function(v){return v/n;}); })();
    var FACES = [ {k:'OAB',v:['O','A','B'],hue:[T.core,T.plan,T.build]}, {k:'OBC',v:['O','B','C'],hue:[T.core,T.build,T.instrument]},
                  {k:'OCA',v:['O','C','A'],hue:[T.core,T.instrument,T.plan]}, {k:'ABC',v:['A','C','B'],hue:[T.plan,T.instrument,T.build]} ];
    var SOLID = [0,h/4,0];
    FACES.forEach(function(f){ var p = f.v.map(function(k){return P3[k];}); var n = norm(cross(sub(p[1],p[0]), sub(p[2],p[0])));
      var fc = [0,1,2].map(function(i){return (p[0][i]+p[1][i]+p[2][i])/3;}); if (dot(n, sub(fc,SOLID)) < 0) n = n.map(function(v){return -v;});
      var nr = rot(n); f.visible = nr[2] > 0; f.lambert = Math.max(0, dot(nr, light)); });
    var visible = FACES.filter(function(f){return f.visible;});
    var pt = function(k){ return fmt(V[k].x)+','+fmt(V[k].y); }, poly = function(ks){ return ks.map(pt).join(' '); };
    var centroid = function(ks){ return { x: ks.reduce(function(s,k){return s+V[k].x;},0)/ks.length, y: ks.reduce(function(s,k){return s+V[k].y;},0)/ks.length }; };
    var uid = 'm'+Math.random().toString(36).slice(2,7);
    var defs = '', faces = '';
    visible.forEach(function(f){ var c = centroid(f.v); var base = mix(mix(f.hue[1],f.hue[2],.5), f.hue[0], .35); var lum = 0.62 + 0.38*f.lambert;
      var inner = mix(T.canvas, base, 0.48*lum), edge = mix(T.canvas, base, 0.92*lum+0.08);
      defs += '<radialGradient id="'+uid+'f'+f.k+'" gradientUnits="userSpaceOnUse" cx="'+fmt(c.x)+'" cy="'+fmt(c.y)+'" r="'+fmt(S*1.05)+'"><stop offset="0" stop-color="'+inner+'"/><stop offset=".72" stop-color="'+mix(inner,edge,.5)+'"/><stop offset="1" stop-color="'+edge+'"/></radialGradient>';
      faces += '<polygon points="'+poly(f.v)+'" fill="url(#'+uid+'f'+f.k+')" fill-opacity=".92"/>';
      f.v.forEach(function(k,i){ var op = (0.42*lum) * (dim(({A:'plan',B:'build',C:'instrument',O:'core'})[k]) ? 0.35 : 1);
        defs += '<radialGradient id="'+uid+'w'+f.k+k+'" gradientUnits="userSpaceOnUse" cx="'+fmt(V[k].x)+'" cy="'+fmt(V[k].y)+'" r="'+fmt(S*1.2)+'"><stop offset="0" stop-color="'+f.hue[i]+'" stop-opacity="'+op.toFixed(2)+'"/><stop offset="1" stop-color="'+f.hue[i]+'" stop-opacity="0"/></radialGradient>';
        faces += '<polygon points="'+poly(f.v)+'" fill="url(#'+uid+'w'+f.k+k+')"/>'; }); });
    var EDGES = [['O','A'],['O','B'],['O','C'],['A','B'],['B','C'],['C','A']], edges = '';
    EDGES.forEach(function(e){ var vis = visible.some(function(f){return f.v.indexOf(e[0])>=0 && f.v.indexOf(e[1])>=0;});
      edges += '<line x1="'+fmt(V[e[0]].x)+'" y1="'+fmt(V[e[0]].y)+'" x2="'+fmt(V[e[1]].x)+'" y2="'+fmt(V[e[1]].y)+'" stroke="'+T.ink+'" stroke-opacity="'+(vis?'.5':'.16')+'" stroke-width="'+(vis?'1.4':'1')+'"'+(vis?'':' stroke-dasharray="3 5"')+'/>'; });
    var pts = Object.keys(V).map(function(k){return V[k];}).sort(function(a,b){return a.x-b.x||a.y-b.y;});
    var cr=function(o,a,b){return (a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x);}; var lo=[],up=[];
    pts.forEach(function(p){ while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0) lo.pop(); lo.push(p); });
    pts.slice().reverse().forEach(function(p){ while(up.length>=2&&cr(up[up.length-2],up[up.length-1],p)<=0) up.pop(); up.push(p); });
    var HULL = lo.slice(0,-1).concat(up.slice(0,-1));
    var HC = { x: HULL.reduce(function(s,p){return s+p.x;},0)/HULL.length, y: HULL.reduce(function(s,p){return s+p.y;},0)/HULL.length };
    var ring = function(k){ return HULL.map(function(p){ return fmt(HC.x+(p.x-HC.x)*k)+','+fmt(HC.y+(p.y-HC.y)*k); }).join(' '); };
    var rim = '<polygon points="'+HULL.map(function(p){return fmt(p.x)+','+fmt(p.y);}).join(' ')+'" fill="none" stroke="'+T.ink+'" stroke-opacity=".28" stroke-width="2"/>';
    var contours = '';
    if (o.contours !== false) for (var i=1;i<=5;i++) contours += '<polygon points="'+ring(1+0.14*i)+'" fill="none" stroke="'+T.ink+'" stroke-opacity="'+(0.13-0.02*i).toFixed(3)+'" stroke-width="1" stroke-dasharray="2 5"/>';
    var loop = '';
    if (o.loop !== false) { var LR = 1.24, n = 72, d = '';
      for (var j=0;j<=n;j++){ var a=j/n*Math.PI*2; var p=proj([LR*Math.sin(a),0,-LR*Math.cos(a)]); d += (j?'L':'M')+fmt(p.x)+' '+fmt(p.y); }
      loop += '<path d="'+d+'" fill="none" stroke="'+T.accent+'" stroke-opacity=".55" stroke-width="1.5" stroke-dasharray="5 6"/>';
      [35,155,275].forEach(function(dg){ var a=deg(dg); var p=proj([LR*Math.sin(a),0,-LR*Math.cos(a)]), q=proj([LR*Math.sin(a+0.06),0,-LR*Math.cos(a+0.06)]);
        var ang=Math.atan2(q.y-p.y,q.x-p.x)*180/Math.PI; loop += '<path d="M0 0 L-11 -5.5 L-8 0 L-11 5.5 Z" fill="'+T.accent+'" transform="translate('+fmt(q.x)+' '+fmt(q.y)+') rotate('+fmt(ang)+')"/>'; }); }
    var LABEL = { A:['PLAN',T.plan,'plan'], B:['BUILD',T.build,'build'], C:['INSTRUMENT',T.instrument,'instrument'], O:['CORE · BATTERIES',T.core,'core'] };
    var glows = '', verts = '', labels = '';
    ['A','B','C','O'].forEach(function(k){ var L=LABEL[k], v=V[k], big=k==='O', dm = dim(L[2]);
      glows += '<ellipse cx="'+fmt(v.x)+'" cy="'+fmt(v.y)+'" rx="'+fmt(S*1.3)+'" ry="'+fmt(S*0.95)+'" fill="url(#'+uid+'g'+k+')"/>';
      defs += '<radialGradient id="'+uid+'g'+k+'" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="'+L[1]+'" stop-opacity="'+((big?.38:.30)*(dm?.3:1)).toFixed(2)+'"/><stop offset="1" stop-color="'+L[1]+'" stop-opacity="0"/></radialGradient>';
      verts += '<circle cx="'+fmt(v.x)+'" cy="'+fmt(v.y)+'" r="'+(big?22:16)+'" fill="'+L[1]+'" fill-opacity="'+(dm?'.08':'.22')+'" filter="url(#'+uid+'blur)"/>'
             + '<circle cx="'+fmt(v.x)+'" cy="'+fmt(v.y)+'" r="'+(big?9:7)+'" fill="'+L[1]+'" fill-opacity="'+(dm?'.45':'1')+'"/>'
             + '<circle cx="'+fmt(v.x)+'" cy="'+fmt(v.y)+'" r="'+(big?3.4:2.5)+'" fill="#fff" fill-opacity="'+(dm?'.3':'.8')+'"/>';
      if (o.labels !== false) { var pos = { O:[0,-30,'middle'], A:[16,4,'start'], B:[0,28,'middle'], C:[-16,4,'end'] }[k];
        labels += '<text x="'+fmt(v.x+pos[0])+'" y="'+fmt(v.y+pos[1])+'" text-anchor="'+pos[2]+'" fill="'+L[1]+'" fill-opacity="'+(dm?'.5':'1')+'" style="font:600 10px/1 var(--mono);letter-spacing:.12em">'+L[0]+'</text>'; } });
    var ground = '<ellipse cx="'+fmt(V.B.x*0.5+V.C.x*0.5)+'" cy="'+fmt(V.B.y+22)+'" rx="'+fmt(S*1.9)+'" ry="'+fmt(S*0.4)+'" fill="url(#'+uid+'gr)" filter="url(#'+uid+'soft)"/>';
    defs += '<radialGradient id="'+uid+'gr" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="'+T.core+'" stop-opacity=".2"/><stop offset=".5" stop-color="'+T.build+'" stop-opacity=".08"/><stop offset="1" stop-color="'+T.core+'" stop-opacity="0"/></radialGradient>';
    defs += '<filter id="'+uid+'blur" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="7"/></filter><filter id="'+uid+'soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>';
    return '<svg viewBox="0 0 '+W+' '+H+'" width="100%" role="img" aria-label="'+(o.label||'The 3PT mark: Plan, Build and Instrument around the batteries core, the loop and its backfeed')+'" style="display:block"><defs>'+defs+'</defs>'
      + glows + contours + ground + loop + faces + edges + rim + verts + labels + '</svg>';
  }
  function mount(el, o){ if (typeof el === 'string') el = document.querySelector(el); if (el) el.innerHTML = svg(o); }
  G.MARK = { svg: svg, mount: mount };
})();
