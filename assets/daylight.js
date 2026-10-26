/* Daylight slider for the hero: blends morning / noon / evening frames by time of day.
   Layers stack morning (bottom) → noon (--a) → evening (--b), so a crossfade never dips in brightness. */
(function(){
var hero=document.getElementById('top'),box=document.getElementById('sun');
if(!hero||!box)return;
var R=document.getElementById('sunR'),T=document.getElementById('sunT'),D=document.getElementById('sunD'),G=document.getElementById('sunG');
var ks=box.querySelectorAll('.sun-ks button');
var red=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
var MIN=360,MAX=1260,K={morning:420,noon:780,evening:1170};
/* colour of the sun disc and strength of the top shade at each keyframe */
var SUN={morning:[255,214,184],noon:[255,246,214],evening:[255,155,74]},SH={morning:.24,noon:.4,evening:.2};

function clamp(v,a,b){return v<a?a:v>b?b:v}
function lerp(a,b,t){return a+(b-a)*t}
function mix(c1,c2,t){return 'rgb('+c1.map(function(v,i){return Math.round(lerp(v,c2[i],t))}).join(',')+')'}
function pad(n){return (n<10?'0':'')+n}
function fmt(m){return pad(Math.floor(m/60))+':'+pad(m%60)}
function part(m){return m<600?'Ранок':m<960?'День':'Вечір'}

/* lazy-load a frame (bg picture + sofa cut-out) */
var loaded={evening:true};
function load(k){
  if(loaded[k])return;loaded[k]=true;
  hero.querySelectorAll('[data-k="'+k+'"]').forEach(function(el){
    if(el.tagName==='PICTURE'){var s=el.querySelector('source');s.srcset=s.getAttribute('data-srcset');el.querySelector('img').src='assets/hero-'+k+'-1600.webp'}
    else el.src='assets/sofa-'+k+'.webp';
  });
}

function set(m){
  m=clamp(Math.round(m),MIN,MAX);
  var a,b,sun,sh;
  if(m<=K.noon){var t=clamp((m-K.morning)/(K.noon-K.morning),0,1);a=t;b=0;sun=mix(SUN.morning,SUN.noon,t);sh=lerp(SH.morning,SH.noon,t);load('morning');if(t>0)load('noon')}
  else{var u=clamp((m-K.noon)/(K.evening-K.noon),0,1);a=1;b=u;sun=mix(SUN.noon,SUN.evening,u);sh=lerp(SH.noon,SH.evening,u);load('noon')}
  var s=hero.style;s.setProperty('--a',a.toFixed(3));s.setProperty('--b',b.toFixed(3));s.setProperty('--sh',sh.toFixed(3));s.setProperty('--sun',sun);
  var p=(m-MIN)/(MAX-MIN),x=122-108*Math.cos(p*Math.PI),y=70-60*Math.sin(p*Math.PI);
  D.setAttribute('cx',x.toFixed(1));D.setAttribute('cy',y.toFixed(1));G.setAttribute('cx',x.toFixed(1));G.setAttribute('cy',y.toFixed(1));
  T.innerHTML=fmt(m)+'<small>'+part(m)+'</small>';
  R.value=m;R.setAttribute('aria-valuetext',fmt(m)+', '+part(m).toLowerCase());
  ks.forEach(function(k){k.setAttribute('aria-pressed',String(part(+k.dataset.t)===part(m)))});
}

/* animated jump for the Ранок / День / Вечір buttons */
var raf=0;
function go(to){
  cancelAnimationFrame(raf);
  var from=+R.value;if(red||from===to){set(to);return}
  var t0=performance.now(),dur=900+Math.abs(to-from)*1.2;
  (function step(n){var p=clamp((n-t0)/dur,0,1),e=p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;set(lerp(from,to,e));if(p<1)raf=requestAnimationFrame(step)})(t0);
}

R.addEventListener('input',function(){cancelAnimationFrame(raf);set(+R.value)});
ks.forEach(function(k){k.addEventListener('click',function(){go(+k.dataset.t)})});

/* start at the visitor's local time */
var now=new Date();
set(now.getHours()*60+now.getMinutes());
box.hidden=false;

/* fetch the remaining frames once the page has settled, so dragging is instant */
function rest(){['morning','noon'].forEach(load)}
if(document.readyState==='complete')setTimeout(rest,1500);else addEventListener('load',function(){setTimeout(rest,1500)});
})();
