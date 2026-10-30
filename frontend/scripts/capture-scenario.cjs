// 시나리오 전체 캡처: 첫 실행부터 첫 장소 미션 완료, 각 탭 화면까지 자동으로 플레이하며
// 핵심 장면 스크린샷(shots/)과 녹화 영상(video/)을 남긴다.
//   1) npm run dev   (http://localhost:5173)
//   2) node scripts/capture-scenario.cjs <출력폴더>
//   3) 영상에서 바뀐 프레임만 뽑기:
//      ffmpeg -i <출력폴더>/video/*.webm -vf "fps=4,mpdecimate,setpts=N/FRAME_RATE/TB" -fps_mode vfr frames/frame-%04d.png
// Playwright(Chromium)가 필요하다. 카메라 화면은 앱의 목업(CameraMock)이라 실제 카메라가 필요 없다.
const { chromium } = require('playwright');
const OUT=process.argv[2] ?? 'capture';
require('node:fs').mkdirSync(OUT + '/shots', { recursive: true });
const URL='http://localhost:5173';
(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:420,height:880},deviceScaleFactor:2,permissions:['geolocation'],
   recordVideo:{dir:OUT+'/video',size:{width:420,height:880}}});
 const p=await ctx.newPage(); const errs=[];
 p.on('pageerror',e=>errs.push(e.message)); p.on('dialog',d=>d.accept());
 let n=0; const log=[];
 const shot=async(name)=>{ n++; const f=`${String(n).padStart(3,'0')}-${name}.png`; await p.screenshot({path:`${OUT}/shots/${f}`}); log.push(f); };
 const wait=ms=>p.waitForTimeout(ms);
 const step=async(name,fn)=>{ try{ await fn(); }catch(e){ log.push(`!! ${name}: ${e.message.split('\n')[0]}`); } };
 const click=(sel,o={})=>p.click(sel,{timeout:5000,...o});
 const tap=async(sel)=>{ try{ await p.click(sel,{timeout:1500}); }catch{} };
 const go=async(h)=>{ await p.goto(URL+'/#'+h); await wait(1000); };

 // 1. 첫 실행 → 지도 + 온보딩 카드
 await step('start',async()=>{ await p.goto(URL+'/'); await wait(1500); await shot('첫실행-온보딩1');
   for(let i=2;i<=4;i++){ await click('.tour-next'); await wait(600); await shot(`온보딩${i}`); }
   await click('.tour-next').catch(()=>{}); await wait(800); });
 await step('map',async()=>{ if(await p.$('.tour-skip')) await click('.tour-skip'); await wait(800); await shot('지도-흑백'); });

 // 2. 주변 스팟 → 소제동 선택 → 걸어가기 → 탐험
 await step('select',async()=>{ await click('.radar-item:has-text("소제동")'); await wait(900); await shot('지도-소제동-선택'); });
 await step('walk',async()=>{ if(await p.$('.btn-walk')){ await click('.btn-walk'); await p.waitForSelector('.bottom-sheet .btn-primary',{timeout:20000}); await wait(500); await shot('지도-소제동-도착'); } });
 await step('explore',async()=>{ await click('.bottom-sheet .btn-primary'); await wait(1800); await shot('장소-카메라-벽QR'); });

 // 3. QR → 동반자 선택 → 안내 대화 → 스토리
 await step('qr',async()=>{ await click('.poster',{force:true}); await wait(900); await shot('QR인식-동반자선택'); });
 await step('pick',async()=>{ await click('.gp-jungang'); await wait(400); await shot('동반자-중앙이-선택'); await click('.gp-go'); await wait(1600); });
 await step('intro',async()=>{ let i=1; while(await p.$('.story-layer')){ await wait(1500); await shot(`안내대화-${i++}`); await tap('.story-layer'); await wait(200); await tap('.story-layer'); await wait(300); if(i>8) break; } });
 await step('story',async()=>{ await wait(900); await shot('스토리-시작-동반자한마디'); await wait(3500); await shot('스토리-흐르는중'); await p.waitForSelector('.ca-mission',{timeout:20000}); await wait(800); await shot('스토리-끝-미션시작'); await click('.ca-mission'); await wait(1300); });

 // 4. 현장 미션: 시연 코드로 타깃 3개 → 과거복원 → 단서 → 자물쇠
 await step('mission',async()=>{ await shot('미션-현장탐사'); await click('.fq-camera-btn'); await wait(1500); await shot('미션-카메라');
   // 첫 타깃은 사진 인증(셔터), 나머지는 QR 모드에서 비출 팻말 고르기 (카메라 목업)
   const labels=['관사촌 안내 팻말','낮은 기와지붕','오래된 담벼락'];
   for(let i=0;i<3;i++){
     if(!(await p.$('.cam-modal'))){ await click('.fq-camera-btn'); await wait(600); }
     if(i===0){ await click('.shutter-btn'); await wait(1200); }
     else { await click('.mode-tab:has-text("QR")'); await wait(400); if(i===1) await shot('미션-QR-팻말고르기'); await click('.qr-target'); await wait(1500); }
     await shot(`과거복원-${labels[i]}`);
     if(i===0){ await click('.ba-cam-btn'); await wait(1200); await shot('카메라-옛모습-겹치기'); await click('.pc-done'); await wait(500); }
     await click('.ba-btn'); await wait(700); await shot(`단서-${labels[i]}`); await click('.clue-btn'); await wait(800);
   }
   await wait(600); await shot('미션-단서3개'); await click('.fq-solve-btn'); await wait(700); await shot('자물쇠');
   for(const d of [3,5,2]){ await click(`.key:text-is("${d}")`); await wait(250); }
   await wait(600); await shot('자물쇠-풀림'); await wait(900); await shot('미션완료'); await p.waitForURL(/meet/,{timeout:8000}); await wait(1200); });

 // 5. 시간 친구 만남 (교감 → 마음 잇기)
 await step('meet',async()=>{ await shot('친구만남-발견'); await click('.meet-cta'); await wait(900); await shot('교감-1');
   for(let s=0;s<3;s++){ const btns=await p.$$('.choice-btn');
     for(let i=0;i<btns.length;i++){ const bs=await p.$$('.choice-btn'); if(!bs[i]) break; await bs[i].click(); await wait(500);
       if(await p.$('.choice-btn.correct')){ await shot(`교감-정답-${s+1}`); await wait(1500); break; }
       await shot(`교감-오답-${s+1}`); await wait(1900); }
     if(await p.$('.catch-phase, .stage')) break; }
   await wait(800); await shot('마음잇기');
   for(let k=0;k<3 && !(await p.$('.success-phase'));k++){
     await p.evaluate(()=>new Promise(res=>{const st=document.querySelector('.stage');const t0=performance.now();(function f(){const r=document.querySelector('.shrink-ring');if(!r||performance.now()-t0>5000)return res();const w=parseFloat(r.style.width);if(Math.abs(w-169.2)<5){st.click();res()}else requestAnimationFrame(f)})()}));
     await wait(400); await shot(`마음잇기-탭${k+1}`); }
   await wait(1800); await shot('친구-영입성공'); await click('.success-btn'); await wait(1500); });

 // 6. 완료 → 첫 미션 안내 대화 → 지도(컬러 복원)
 await step('complete',async()=>{ await shot('기억복원-완료'); let i=1; while(await p.$('.story-layer') && i<6){ await wait(1400); await shot(`첫완료-대화-${i++}`); await tap('.story-layer'); await wait(200); await tap('.story-layer'); await wait(300); }
   await shot('완료화면'); await click('.cta-btn'); await wait(1800); await shot('지도-소제동-컬러복원'); await go('/location/sojedom'); await shot('완료한-장소-다시보기'); });

 // 7. 매장 핀 · 쿠폰
 await step('store',async()=>{ const pin=await p.$('.lf-store-dot'); if(pin){ await pin.click({force:true}); await wait(800); await shot('지도-매장핀-웨이팅'); }
   await go('/coupon/sojedom'); await shot('쿠폰-상단'); await p.mouse.move(210,500); await p.mouse.wheel(0,600); await wait(600); await shot('쿠폰-QR-바코드'); await p.mouse.wheel(0,2000); await wait(600); await shot('쿠폰-하단'); });

 // 8. 하단 탭: 코스 · 도감 · 내 정보 · 등급 · 랭킹
 await step('tabs',async()=>{ await go('/map'); await click('.tab:has-text("코스")'); await wait(900); await shot('코스');
   await click('.tab:has-text("도감")'); await wait(900); await shot('도감');
   await click('.buddy-card'); await wait(900); await shot('친구-상세'); 
   await go('/profile'); await shot('내정보'); await p.evaluate(()=>document.querySelector('.rec-scroll').scrollTo(0,9999)); await wait(300); await shot('내정보-기록-초기화버튼');
   await go('/grade'); await shot('등급혜택'); await go('/ranking'); await shot('랭킹'); });

 // 9. 현장 QR 강화 · 공유 카드 · 채팅 · 엔딩
 await step('extra',async()=>{ await go('/qrscan?from=sojedom'); await wait(800); await shot('매장QR-스캔');
   await go('/chat/sojo'); await shot('친구-대화'); await go('/share/sojo'); await shot('공유카드'); await go('/ending'); await shot('엔딩'); });

 await ctx.close(); await b.close();
 console.log(log.join('\n')); console.log('errors:',errs.join(' | ')||'none');
})();
