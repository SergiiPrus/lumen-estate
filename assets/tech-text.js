/* Tech text for the hero title: letters become dashed vector outlines under the cursor.
   Vanilla re-implementation of the idea (reveal per letter, dashed outline, specks, click kick).
   Settings below mirror the props from the React Bits example. */
(function(){
var hero=document.getElementById('top'),cv=hero&&hero.querySelector('.tt');
if(!cv||!cv.getContext)return;
var ctx=cv.getContext('2d'),h=document.documentElement;
var red=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
var P={color:'#fffff0',dash:4,gap:2,specks:15,speed:.5,kick:true,lineWidth:1.5};
var L=[],S=[],ptr={x:-9999,y:-9999,on:false},W=0,H=0,dpr=1,t0=null,last=0,run=false,vis=true,nextPulse=0,touchT=0;
function clamp(v){return v<0?0:v>1?1:v}
function ease(v){return 1-Math.pow(1-v,3)}
function measure(){
  var hr=hero.getBoundingClientRect();dpr=Math.min(window.devicePixelRatio||1,2);
  W=hr.width;H=hr.height;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
  var old=L,idx=0;L=[];
  hero.querySelectorAll('.big .ln span').forEach(function(sp,li){
    var cs=getComputedStyle(sp),size=parseFloat(cs.fontSize),tn=sp.firstChild;if(!tn)return;
    var font=cs.fontWeight+' '+size+'px '+cs.fontFamily,txt=tn.textContent;
    ctx.font=font;
    for(var i=0;i<txt.length;i++){
      if(txt[i]===' ')continue;
      var r=document.createRange();r.setStart(tn,i);r.setEnd(tn,i+1);
      var b=r.getBoundingClientRect(),up=txt[i].toUpperCase(),m=ctx.measureText(up),o=old[idx]||{};
      L.push({ch:up,font:font,size:size,line:li,idx:idx,
        x:b.left-hr.left,y:b.top-hr.top+(m.fontBoundingBoxAscent||size*.95),w:m.width,cap:m.actualBoundingBoxAscent||size*.72,
        e:o.e||0,k:o.k||0,pulse:o.pulse||0,ox:o.ox||0,oy:o.oy||0,vx:o.vx||0,vy:o.vy||0,dash:o.dash||0});
      idx++;
    }
  });
}
function draw(now){
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
  if(t0===null)return;
  ctx.fillStyle=ctx.strokeStyle=P.color;ctx.lineWidth=P.lineWidth;ctx.lineJoin='round';
  var T0=(now-t0)/1000;
  L.forEach(function(l){
    var T=red?9:T0-l.idx*.08-l.line*.25;if(T<0)return;
    var a=red?1:clamp(T/.35),introE=red?0:(T<.45?1:1-clamp((T-.45)/.5)),lift=red?0:(1-ease(clamp(T/.9)))*l.size*.22;
    var e=Math.max(l.e,l.pulse*.9,l.k,introE),x=l.x+l.ox,y=l.y+l.oy+lift;
    ctx.font=l.font;
    ctx.setLineDash([]);ctx.globalAlpha=a*(1-e*.95);if(ctx.globalAlpha>.005)ctx.fillText(l.ch,x,y);
    if(e>.02){ctx.setLineDash([P.dash,P.gap]);ctx.lineDashOffset=-l.dash;ctx.globalAlpha=a*Math.min(1,e*1.2);ctx.strokeText(l.ch,x,y)}
  });
  ctx.setLineDash([]);ctx.fillStyle=P.color;
  S.forEach(function(s){ctx.globalAlpha=clamp(s.life/s.max)*.9;ctx.fillRect(s.x,s.y,1.6,1.6)});
  ctx.globalAlpha=1;
}
function frame(now){
  if(!run)return;
  var dt=Math.min((now-last)/1000,.05);last=now;
  if(t0!==null&&now>nextPulse&&!ptr.on&&L.length){L[Math.floor(Math.random()*L.length)].pulse=1;nextPulse=now+2600}
  L.forEach(function(l){
    var px=l.size*.1,inside=ptr.on&&ptr.x>=l.x-px&&ptr.x<=l.x+l.w+px&&ptr.y>=l.y-l.cap-px&&ptr.y<=l.y+px;
    l.e+=((inside?1:0)-l.e)*Math.min(1,dt*9);
    l.pulse=Math.max(0,l.pulse-dt*.7);l.k=Math.max(0,l.k-dt*1.8);
    l.vx+=(-90*l.ox-9*l.vx)*dt;l.vy+=(-90*l.oy-9*l.vy)*dt;l.ox+=l.vx*dt;l.oy+=l.vy*dt;
    l.dash+=P.speed*dt*60;
    var e=Math.max(l.e,l.pulse*.9,l.k);
    if(e>.35&&Math.random()<P.specks*e*dt*.8&&S.length<140){
      var ang=Math.random()*6.283,sp=8+Math.random()*16,life=.8+Math.random()*.7;
      S.push({x:l.x+l.ox+Math.random()*l.w,y:l.y+l.oy-Math.random()*l.cap,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,life:life,max:life});
    }
  });
  for(var i=S.length-1;i>=0;i--){var s=S[i];s.life-=dt;if(s.life<=0){S.splice(i,1);continue}s.x+=s.vx*dt;s.y+=s.vy*dt}
  draw(now);
  requestAnimationFrame(frame);
}
function go(){if(run||!vis||red)return;run=true;last=performance.now();requestAnimationFrame(frame)}
function stop(){run=false}
function rel(e){var r=hero.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top,in:e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom}}
function start(){if(t0===null){t0=red?-1e9:performance.now();if(red)draw(0);go()}}
function init(){
  measure();if(!L.length)return;
  hero.classList.add('tech');
  if(h.classList.contains('loaded'))start();
  else new MutationObserver(function(m,o){if(h.classList.contains('loaded')){o.disconnect();start()}}).observe(h,{attributes:true,attributeFilter:['class']});
  if(red)return;
  addEventListener('pointermove',function(e){var p=rel(e);ptr.x=p.x;ptr.y=p.y;ptr.on=p.in;if(e.pointerType==='touch'){clearTimeout(touchT);touchT=setTimeout(function(){ptr.on=false},700)}},{passive:true});
  document.addEventListener('pointerleave',function(){ptr.on=false});
  addEventListener('pointerdown',function(e){
    var p=rel(e);if(!p.in)return;
    if(e.target.closest&&e.target.closest('a,button,input,select,form,.glass,.hd,.dd'))return;
    ptr.x=p.x;ptr.y=p.y;ptr.on=true;
    if(e.pointerType==='touch'){clearTimeout(touchT);touchT=setTimeout(function(){ptr.on=false},700)}
    if(!P.kick)return;
    L.forEach(function(l){
      var dx=l.x+l.w/2-p.x,dy=l.y-l.cap/2-p.y,d=Math.hypot(dx,dy)||1,R=l.size*1.3;
      if(d<R){var f=1-d/R;l.vx+=dx/d*320*f;l.vy+=dy/d*320*f;l.k=1}
    });
  },{passive:true});
  new IntersectionObserver(function(es){vis=es[0].isIntersecting;vis?go():stop()}).observe(hero);
}
var rz;
function remeasure(){cancelAnimationFrame(rz);rz=requestAnimationFrame(function(){measure();if(red||!run)draw(performance.now())})}
if('ResizeObserver' in window)new ResizeObserver(function(){if(L.length)remeasure()}).observe(hero);
var fl=document.fonts&&document.fonts.load?Promise.all([document.fonts.load('500 100px Urbanist'),document.fonts.load('300 100px Urbanist')]):Promise.resolve();
fl.then(function(){return document.fonts?document.fonts.ready:0}).then(init,init);
})();
