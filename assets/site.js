
/* Mobile menu toggle */
(function(){
  var b=document.querySelector('.nav-toggle'),n=document.getElementById('site-nav');
  if(!b||!n) return;
  b.addEventListener('click',function(){var o=b.getAttribute('aria-expanded')==='true';b.setAttribute('aria-expanded',String(!o));n.classList.toggle('open',!o);});
})();

/* Idealized potential flow over a semicircular obstacle at a wall (the
   building sits inside it), with a power-law boundary-layer profile.
   Particles are advected by this field; color shows the local speed ratio. */
(function(){
  var cv=document.getElementById('wind'); if(!cv||!cv.getContext) return;
  var ctx=cv.getContext('2d');
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W,H,dpr,a,xc,yg,N,parts=[],running=true,last=0;
  var NIGHT='#0E1A33';
  var stops=[[0,[28,110,122]],[0.45,[43,179,177]],[0.78,[191,217,166]],[1,[242,165,65]]];
  var pal=[];
  for(var i=0;i<32;i++){var t=i/31,k=0;while(k<stops.length-2&&t>stops[k+1][0])k++;
    var s0=stops[k],s1=stops[k+1],f=(t-s0[0])/(s1[0]-s0[0]);
    pal.push('rgb('+[0,1,2].map(function(j){return Math.round(s0[1][j]+(s1[1][j]-s0[1][j])*f)}).join(',')+')');}
  function vel(x,y){
    var X=x-xc,Y=yg-y,r2=X*X+Y*Y,a2=a*a;
    if(r2<a2*1.02||Y<0) return null;
    var r4=r2*r2,u=1-a2*(X*X-Y*Y)/r4,v=-2*a2*X*Y/r4;
    var prof=Math.pow(Math.max(Y,2)/(yg*0.95),0.2);
    return [u*prof,v*prof,Math.sqrt(u*u+v*v)*prof];
  }
  function spawn(anywhere){
    for(var tries=0;tries<20;tries++){
      var x=anywhere?Math.random()*W:-Math.random()*40, y=yg-yg*0.985*Math.pow(Math.random(),1.5);
      if(vel(x,y)) return {x:x,y:y,life:150+Math.random()*450};
    }
    return {x:-10,y:yg*0.2,life:300};
  }
  function drawBuilding(){
    ctx.strokeStyle='#2C4373';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,yg+1);ctx.lineTo(W,yg+1);ctx.stroke();
    var w=0.70*a,h=0.58*a,ap=0.93*a;
    ctx.fillStyle='#2E4A80';ctx.beginPath();
    ctx.moveTo(xc-w,yg);ctx.lineTo(xc-w,yg-h);ctx.lineTo(xc,yg-ap);ctx.lineTo(xc+w,yg-h);ctx.lineTo(xc+w,yg);ctx.closePath();ctx.fill();
    ctx.fillStyle='#F2A541';
    for(var i=0;i<9;i++){var t=0.08+0.84*i/8,px=xc-w+2*w*t,py=t<=0.5?(h+(ap-h)*t*2):(ap-(ap-h)*(t-0.5)*2);
      ctx.beginPath();ctx.arc(px,yg-py-Math.max(2,a*0.03),Math.max(2,a*0.028),0,6.283);ctx.fill();}
  }
  function layout(){
    dpr=Math.min(window.devicePixelRatio||1,2);
    W=cv.clientWidth;H=cv.clientHeight;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    var narrow=W<760;
    a=narrow?Math.min(W*0.24,H*0.15):Math.min(W*0.13,H*0.24);
    xc=W*(narrow?0.66:0.73); yg=H*(narrow?0.94:0.88);
    N=Math.round(Math.min(1100,W*H/(narrow?1700:1150)));
    parts=[];for(var i=0;i<N;i++)parts.push(spawn(true));
    ctx.fillStyle=NIGHT;ctx.fillRect(0,0,W,H);
    if(reduce) drawStatic();
  }
  function drawStatic(){
    ctx.fillStyle=NIGHT;ctx.fillRect(0,0,W,H);ctx.lineWidth=1.6;
    var lines=26;
    for(var j=1;j<=lines;j++){
      var x=0,y=yg-(yg*0.97)*Math.pow(j/lines,1.25),step=W/700;
      ctx.beginPath();ctx.moveTo(x,y);
      for(var n=0;n<1400&&x<W;n++){var V=vel(x,y);if(!V)break;
        var sp=Math.hypot(V[0],V[1])||1;x+=V[0]/sp*step;y-=V[1]/sp*step;ctx.lineTo(x,y);}
      ctx.strokeStyle='rgba(43,179,177,'+(0.25+0.6*(1-j/lines))+')';ctx.stroke();
    }
    drawBuilding();
  }
  function frame(ts){
    if(!running){requestAnimationFrame(frame);return;}
    var dt=last?Math.min((ts-last)/1000,0.05):0.016;last=ts;
    ctx.fillStyle='rgba(14,26,51,0.085)';ctx.fillRect(0,0,W,H);
    var spd=W/6.5, buckets={};
    for(var i=0;i<parts.length;i++){
      var p=parts[i],V=vel(p.x,p.y);
      if(!V||p.x>W+5||p.life--<0){parts[i]=spawn(false);continue;}
      var mx=p.x+V[0]*spd*dt*0.5,my=p.y-V[1]*spd*dt*0.5,V2=vel(mx,my)||V;
      var nx=p.x+V2[0]*spd*dt,ny=p.y-V2[1]*spd*dt;
      var c=Math.max(0,Math.min(31,Math.round(((V2[2]-0.85)/0.5)*31)));
      (buckets[c]=buckets[c]||[]).push(p.x,p.y,nx,ny);
      p.x=nx;p.y=ny;
    }
    ctx.lineWidth=1.6;ctx.lineCap='round';
    for(var key in buckets){var b=buckets[key];ctx.strokeStyle=pal[key];ctx.beginPath();
      for(var q=0;q<b.length;q+=4){ctx.moveTo(b[q],b[q+1]);ctx.lineTo(b[q+2],b[q+3]);}ctx.stroke();}
    drawBuilding();
    requestAnimationFrame(frame);
  }
  var rt;window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(layout,150);});
  layout();
  if(!reduce){
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(es){running=es[0].isIntersecting;last=0;}).observe(document.getElementById('hero'));
    }
    requestAnimationFrame(frame);
  }
})();
/* Photo viewer: open a tile in a dialog; arrows, Esc, and backdrop click supported. */
(function(){
  var dlg=document.getElementById('viewer'); if(!dlg||!dlg.showModal) return;
  var img=document.getElementById('vimg'),cap=document.getElementById('vcap'),idx=0;
  function tiles(){return Array.prototype.slice.call(document.querySelectorAll('.mosaic .tile'));}
  function show(i){var t=tiles();if(!t.length)return;idx=(i+t.length)%t.length;
    var im=t[idx].querySelector('img');img.src=im.src;img.alt=im.alt;cap.textContent=t[idx].querySelector('figcaption').textContent;}
  document.querySelector('.mosaic').addEventListener('click',function(e){
    var b=e.target.closest('.tile button');if(!b)return;show(tiles().indexOf(b.closest('.tile')));dlg.showModal();});
  document.getElementById('vprev').onclick=function(){show(idx-1);};
  document.getElementById('vnext').onclick=function(){show(idx+1);};
  document.getElementById('vclose').onclick=function(){dlg.close();};
  dlg.addEventListener('click',function(e){if(e.target===dlg)dlg.close();});
  dlg.addEventListener('keydown',function(e){if(e.key==='ArrowLeft')show(idx-1);if(e.key==='ArrowRight')show(idx+1);});
})();

/* Looping videos: load and play only while on screen; never autoplay when the visitor prefers reduced motion. */
(function(){
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var vids=document.querySelectorAll('video.auto-video');
  if(!vids.length||reduce||!('IntersectionObserver' in window)) return;
  var io=new IntersectionObserver(function(es){es.forEach(function(e){
    var v=e.target;
    if(e.isIntersecting){var p=v.play();if(p&&p.catch)p.catch(function(){});}else{v.pause();}
  });},{threshold:0.35});
  vids.forEach(function(v){io.observe(v);});
})();

/* Rotating "in action" panel: cross-fades slides, plays a slide's video only while it is showing,
   pauses when off screen or when the visitor presses Pause, and stays still under reduced motion. */
(function(){
  var rot=document.querySelector('.rotator'); if(!rot) return;
  var slides=[].slice.call(rot.querySelectorAll('.rot-slide')); if(!slides.length) return;
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var idx=0, timer=null, paused=reduce, visible=true;
  var toggle=rot.querySelector('.rot-toggle');
  function prime(i){var im=slides[i].querySelector('img[data-src]'); if(im){im.src=im.getAttribute('data-src'); im.removeAttribute('data-src');}}
  function media(i){return slides[i].querySelector('video');}
  function schedule(){clearTimeout(timer); if(paused||!visible) return;
    timer=setTimeout(function(){show(idx+1);}, parseInt(slides[idx].getAttribute('data-dur')||'4500',10));}
  function show(i){
    var old=media(idx); if(old) old.pause();
    slides[idx].classList.remove('is-active');
    idx=(i+slides.length)%slides.length; prime(idx); prime((idx+1)%slides.length);
    slides[idx].classList.add('is-active');
    var v=media(idx); if(v&&!paused&&visible){var p=v.play(); if(p&&p.catch)p.catch(function(){});}
    schedule();
  }
  function setPaused(p){paused=p; toggle.textContent=p?'Play':'Pause'; toggle.setAttribute('aria-label',p?'Play the slideshow':'Pause the slideshow');
    var v=media(idx); if(v){ if(p) v.pause(); else {var q=v.play(); if(q&&q.catch)q.catch(function(){});} } schedule();}
  rot.querySelector('.rot-next').onclick=function(){show(idx+1);};
  rot.querySelector('.rot-prev').onclick=function(){show(idx-1);};
  toggle.onclick=function(){setPaused(!paused);};
  if(reduce){toggle.textContent='Play'; toggle.setAttribute('aria-label','Play the slideshow');}
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){visible=es[0].isIntersecting; var v=media(idx);
      if(!visible){clearTimeout(timer); if(v) v.pause();} else { if(v&&!paused){var p=v.play(); if(p&&p.catch)p.catch(function(){});} schedule(); }
    },{threshold:0.25}).observe(rot);
  }
  prime(1); schedule();
})();
