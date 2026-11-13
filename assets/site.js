
/* Mobile menu toggle */
(function(){
  var b=document.querySelector('.nav-toggle'),n=document.getElementById('site-nav');
  if(!b||!n) return;
  b.addEventListener('click',function(){var o=b.getAttribute('aria-expanded')==='true';b.setAttribute('aria-expanded',String(!o));n.classList.toggle('open',!o);});
})();

/* Schematic animation of wind over a low-rise building (side view). The outer flow is a power-law
   boundary layer over a Rankine oval fitted to the house (uniform flow plus a source-sink pair on the
   ground). Clockwise vortices shed from the windward eave ride the shear layer, grow, decay, and sink
   into the wake; with their images below the ground they produce the reverse flow of the separation
   bubble and the cavity. A horseshoe vortex sits at the windward foot. Particles are advected by the
   field; color shows the local speed ratio. */
(function(){
  var cv=document.getElementById('wind'); if(!cv||!cv.getContext) return;
  var ctx=cv.getContext('2d');
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W,H,dpr,xc,yg,bw,bh,ap,N,parts=[],smoke=[],vort=[],fixed=[],running=true,last=0,tShed=0;
  var ob,om,G0,rc0,spd,SM=940,accE=0,accW=0,accC=0;                     // oval half-spacing and strength; vortex scales; speed scale
  var NIGHT='#0E1A33';
  var stops=[[0,[28,110,122]],[0.45,[43,179,177]],[0.78,[191,217,166]],[1,[242,165,65]]],pal=[];
  for(var i=0;i<32;i++){var t=i/31,k=0;while(k<stops.length-2&&t>stops[k+1][0])k++;
    var s0=stops[k],s1=stops[k+1],f=(t-s0[0])/(s1[0]-s0[0]);
    pal.push('rgb('+[0,1,2].map(function(j){return Math.round(s0[1][j]+(s1[1][j]-s0[1][j])*f)}).join(',')+')');}
  function inside(x,y){                       // inside the house (screen coordinates)
    var X=x-xc,Y=yg-y; if(Y<0) return true; if(Math.abs(X)>bw) return false;
    return Y<bh+(ap-bh)*(1-Math.abs(X)/bw);
  }
  function ovalHalfHeight(m,b){               // half-height of a Rankine oval with U=1
    var h=b; for(var it=0;it<60;it++){var g=(m/Math.PI)*Math.atan2(2*b*h,h*h-b*b); h=0.5*h+0.5*g;} return h;
  }
  function fitOval(){                         // choose source spacing and strength so the oval hugs the house
    var best=null;
    for(var bf=0.30;bf<=0.95;bf+=0.01){
      var b=bf*bw,lo=0,hi=50*bw;
      for(var it=0;it<50;it++){var m=0.5*(lo+hi); if(ovalHalfHeight(m,b)<ap*1.03) lo=m; else hi=m;}
      var m=0.5*(lo+hi),L=Math.sqrt(b*b+m*b/Math.PI),e=Math.abs(L-bw*1.06);
      if(!best||e<best[0]) best=[e,b,m];
    }
    ob=best[1]; om=best[2];
  }
  function addVortex(u,x,Y,G,rc,img){         // clockwise Lamb-Oseen vortex at (x,Y) plus its image below the ground
    if(img===undefined) img=1;
    var dx=u.X-x,dy=u.Y-Y,r2=dx*dx+dy*dy+1e-6,f=G/(2*Math.PI)*(r2>36*rc*rc?1/r2:(1-Math.exp(-r2/(rc*rc)))/r2);
    u.u+=f*dy; u.v-=f*dx;
    dy=u.Y+Y; r2=dx*dx+dy*dy+1e-6; f=img*G/(2*Math.PI)*(r2>36*rc*rc?1/r2:(1-Math.exp(-r2/(rc*rc)))/r2);
    u.u-=f*dy; u.v+=f*dx;
  }
  function vel(x,y,skip){
    if(inside(x,y)) return null;
    var X=x-xc,Y=yg-y;
    var xa=X+ob,xb=X-ob,ra=xa*xa+Y*Y+1e-6,rb=xb*xb+Y*Y+1e-6,k=om/(2*Math.PI);
    var u={X:x,Y:Y,u:1+k*(xa/ra-xb/rb),v:k*(Y/ra-Y/rb)};
    var prof=Math.pow(Math.max(Y,2)/(yg*0.95),0.2); u.u*=prof; u.v*=prof;
    var dxw=X-bw;
    if(dxw>-0.05*bh){                                 // the separated cavity behind the building holds slow air
      var e=Math.pow(Math.max(dxw,0)/(1.6*bh),2)+Math.pow(Y/(1.05*bh),2),tt=Math.min(1,Math.max(0,(e-0.6)/0.55));
      var m=0.90*(1-tt*tt*(3-2*tt)); u.u*=1-m; u.v*=1-m;
    }
    // standing recirculating eddy about 0.75 H behind the leeward wall; its image in the wall (and that image's
    // image in the ground) make the wall a boundary, so the reverse flow slows, turns up, and rotates before the wall
    var xv=xc+bw+0.75*bh, Yv=0.6*bh, Gc=0.44*bh, rcv=0.45*bh;
    addVortex(u,xv,Yv,Gc,rcv);
    var wgt=Math.min(1,Math.max(0,(dxw+0.3*bh)/(0.3*bh)));
    if(wgt>0){var tmp={X:u.X,Y:u.Y,u:0,v:0}; addVortex(tmp,xc+bw-0.75*bh,Yv,-Gc,rcv); u.u+=wgt*tmp.u; u.v+=wgt*tmp.v;}
    for(var i=0;i<fixed.length;i++){var q=fixed[i]; addVortex(u,q.x,q.Y,q.G,q.rc);}
    for(var j=0;j<vort.length;j++){if(vort[j]===skip) continue; var w=vort[j]; addVortex(u,w.x,w.Y,w.G,w.rc,0.5);}
    // the building surfaces are impermeable: near a wall or roof, flow heading into the surface is turned along it.
    // Reverse flow in the cavity rises up the leeward wall and rejoins the outer flow; on the windward wall the flow
    // splits at the stagnation point (about two-thirds of the height), feeding the horseshoe vortex below it.
    var dw=0.22*bh,dr=0.14*bh,f,d;
    if(Y<bh){
      d=X-bw;
      if(d>=0&&d<dw&&u.u<0){                       // leeward wall: low down the reverse flow turns upward,
        f=1-d/dw; var un=-u.u,                     // higher up it turns back downstream, closing the cavity loop
            t=Math.min(1,Math.max(0,(Y-0.40*bh)/(0.42*bh)));
        u.v+=un*f*(1-t); u.u+=un*f*(1+0.6*t);
      }
      d=-bw-X; if(d>=0&&d<dw&&u.u>0){f=1-d/dw; u.v+=(Y>0.66*bh?1:-1)*u.u*f; u.u*=(1-f);}
    }
    if(Math.abs(X)<=bw){
      var sl=(ap-bh)/bw, roofY=bh+(ap-bh)*(1-Math.abs(X)/bw), c=1/Math.sqrt(1+sl*sl);
      d=(Y-roofY)*c;
      if(d>=0&&d<dr){
        var nx=(X<0?-sl:sl)*c, ny=c, un=u.u*nx+u.v*ny;          // outward normal of the windward or leeward slope
        if(un<0){f=1-d/dr; u.u-=nx*un*f; u.v-=ny*un*f;}
      }
    }
    return [u.u,u.v,Math.sqrt(u.u*u.u+u.v*u.v)];
  }
  function stepVortices(dt){
    tShed+=dt;
    if(tShed>1.25){tShed=0; vort.push({x:xc-bw+rc0*0.6,Y:bh+rc0*0.9,G:G0,rc:rc0,age:0});}
    for(var i=vort.length-1;i>=0;i--){
      var w=vort[i]; w.age+=dt;
      var V=vel(w.x,yg-w.Y,w)||[0.6,0,0.6], Ue=Math.pow(Math.max(w.Y,2)/(yg*0.95),0.2);
      // shear-layer vortices convect at about half the outer speed; downstream they settle into the wake
      w.x+=(0.45*Ue+0.12*V[0])*spd*dt; w.Y+=0.12*V[1]*spd*dt;
      if(w.x>xc+bw) w.Y+=(1.25*bh-w.Y)*0.35*dt;
      if(w.Y<w.rc*0.8) w.Y=w.rc*0.8;
      w.rc=rc0*(1+w.age/2.6); w.G=G0*Math.exp(-w.age/6);
      if(w.x>W+4*w.rc||w.G<0.08*G0) vort.splice(i,1);
    }
  }
  function spawn(anywhere){
    for(var tries=0;tries<30;tries++){
      var x=anywhere?Math.random()*W:-Math.random()*40, y=yg-yg*0.985*Math.pow(Math.random(),1.5);
      if(vel(x,y)) return {x:x,y:y,life:2.5+Math.random()*7.5};
    }
    return {x:-10,y:yg*0.2,life:5};
  }
  function moveSmoke(dt,draw){
    accE+=240*dt; accW+=84*dt; accC+=46*dt;       // release rates per second, independent of the screen's refresh rate
    while(accE>=1){accE--; if(smoke.length<SM) smoke.push({x:xc-bw+Math.random()*3,y:yg-bh-1.5-Math.random()*4,life:9.3});}
    while(accW>=1){accW--; if(smoke.length<SM) smoke.push({x:xc+bw+2+Math.random()*3.4*bh,y:yg-2-Math.random()*1.15*bh,life:4});}
    while(accC>=1){accC--; if(smoke.length<SM) smoke.push({x:xc+bw+(0.2+1.1*Math.random())*bh,y:yg-(0.1+0.8*Math.random())*bh,life:6});}   // inside the standing eddy
    if(draw) ctx.beginPath();
    for(var s2=smoke.length-1;s2>=0;s2--){
      var q2=smoke[s2],U2=vel(q2.x,q2.y);
      q2.life-=dt; if(!U2||q2.x>W+5||q2.life<0){smoke.splice(s2,1);continue;}
      var hx=q2.x+U2[0]*spd*dt*0.5,hy=q2.y-U2[1]*spd*dt*0.5,U3=vel(hx,hy)||U2;
      var tx=q2.x+U3[0]*spd*dt,ty=Math.min(q2.y-U3[1]*spd*dt,yg-0.5);
      if(draw){ctx.moveTo(q2.x,q2.y);ctx.lineTo(tx,ty);}
      q2.x=tx;q2.y=ty;
    }
    if(draw) ctx.stroke();
  }
  function drawBuilding(){
    ctx.strokeStyle='#2C4373';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,yg+1);ctx.lineTo(W,yg+1);ctx.stroke();
    ctx.fillStyle='#2E4A80';ctx.strokeStyle='rgba(159,182,211,.85)';ctx.lineWidth=1.2;ctx.beginPath();
    ctx.moveTo(xc-bw,yg);ctx.lineTo(xc-bw,yg-bh);ctx.lineTo(xc,yg-ap);ctx.lineTo(xc+bw,yg-bh);ctx.lineTo(xc+bw,yg);ctx.closePath();ctx.fill();ctx.stroke();
    // pressure taps: small flush holes along the roof slopes and walls
    var r=Math.max(1,bh*0.016); ctx.fillStyle='rgba(232,239,248,.9)';
    var n=9; for(var i=0;i<=n;i++){var t=i/n;
      var px=xc-bw+bw*t,py=yg-(bh+(ap-bh)*t); ctx.beginPath();ctx.arc(px+1.5*t,py+2.4,r,0,6.283);ctx.fill();
      px=xc+bw*t; py=yg-(ap-(ap-bh)*t); ctx.beginPath();ctx.arc(px-1.5*t,py+2.4,r,0,6.283);ctx.fill();}
    for(var j=1;j<6;j++){var yy=yg-bh*j/6; ctx.beginPath();ctx.arc(xc-bw+2.4,yy,r,0,6.283);ctx.fill(); ctx.beginPath();ctx.arc(xc+bw-2.4,yy,r,0,6.283);ctx.fill();}
  }
  function layout(){
    dpr=Math.min(window.devicePixelRatio||1,2);
    W=cv.clientWidth;H=cv.clientHeight;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    var narrow=W<760, a=narrow?Math.min(W*0.20,H*0.13):Math.min(W*0.105,H*0.20);
    xc=W*(narrow?0.40:0.62); yg=H*(narrow?0.94:0.86);
    bw=0.80*a; bh=0.62*a; ap=0.92*a; fitOval();
    rc0=bh*0.15; G0=6.2*rc0; spd=W/(narrow?5.5:6.5); SM=narrow?480:940;   // lighter load on phones
    fixed=[{x:xc-bw-0.30*bh,Y:0.24*bh,G:0.6*G0,rc:0.18*bh}];          // horseshoe vortex at the windward foot
    vort=[];tShed=0; for(var s=0;s<16;s++) stepVortices(0.25);     // start with a developed wake
    N=Math.round(Math.min(1300,W*H/(narrow?1500:1000)));
    parts=[];for(var i=0;i<N;i++)parts.push(spawn(true)); smoke=[]; accE=accW=accC=0;
    if(!reduce){for(var w0=0;w0<150;w0++){stepVortices(1/30); moveSmoke(1/30,false);}}
    ctx.fillStyle=NIGHT;ctx.fillRect(0,0,W,H);
    if(reduce) drawStatic();
  }
  function drawStatic(){
    ctx.fillStyle=NIGHT;ctx.fillRect(0,0,W,H);ctx.lineWidth=1.4;
    var lines=30;
    for(var j=1;j<=lines;j++){
      var x=0,y=yg-(yg*0.97)*Math.pow(j/lines,1.25),step=W/700;
      ctx.beginPath();ctx.moveTo(x,y);
      for(var n=0;n<1600&&x<W&&x>-5;n++){var V=vel(x,y);if(!V)break;
        var sp=Math.hypot(V[0],V[1])||1;x+=V[0]/sp*step;y-=V[1]/sp*step;ctx.lineTo(x,y);}
      ctx.strokeStyle='rgba(43,179,177,'+(0.25+0.6*(1-j/lines))+')';ctx.stroke();
    }
    // a still of the separated flow: run the vortex and smoke model briefly, then draw the recent smoke paths
    smoke=[]; ctx.strokeStyle='rgba(232,239,248,0.11)';ctx.lineWidth=1.2;
    for(var n=0;n<420;n++){stepVortices(1/60); moveSmoke(1/60,n>=330);}
    drawBuilding();
  }
  function frame(ts){
    if(!running){requestAnimationFrame(frame);return;}
    var dt=last?Math.min((ts-last)/1000,0.05):0.016;last=ts;
    stepVortices(dt);
    ctx.fillStyle='rgba(14,26,51,'+(1-Math.pow(1-0.085,dt*60)).toFixed(4)+')';ctx.fillRect(0,0,W,H);
    var buckets={};
    for(var i=0;i<parts.length;i++){
      var p=parts[i],V=vel(p.x,p.y);
      p.life-=dt; if(!V||p.x>W+5||p.x<-60||p.y<-5||p.life<0){parts[i]=spawn(false);continue;}
      var mx=p.x+V[0]*spd*dt*0.5,my=p.y-V[1]*spd*dt*0.5,V2=vel(mx,my)||V;
      var nx=p.x+V2[0]*spd*dt,ny=p.y-V2[1]*spd*dt;
      if(ny>yg-0.5) ny=yg-0.5;
      var c=Math.max(0,Math.min(31,Math.round(((V2[2]-0.55)/0.85)*31)));
      (buckets[c]=buckets[c]||[]).push(p.x,p.y,nx,ny);
      p.x=nx;p.y=ny;
    }
    ctx.lineWidth=1.6;ctx.lineCap='round';
    for(var key in buckets){var b=buckets[key];ctx.strokeStyle=pal[key];ctx.beginPath();
      for(var q=0;q<b.length;q+=4){ctx.moveTo(b[q],b[q+1]);ctx.lineTo(b[q+2],b[q+3]);}ctx.stroke();}
    // smoke released at the windward eave (shear layer) and inside the cavity, as in wind-tunnel flow visualization
    ctx.strokeStyle='rgba(232,239,248,0.62)';ctx.lineWidth=1.3; moveSmoke(dt,true);
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
