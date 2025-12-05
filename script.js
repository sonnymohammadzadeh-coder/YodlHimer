/* ---------- Small helper / DOM ready ---------- */
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

document.addEventListener('DOMContentLoaded', () => {
  // hide loading after assets ready
  setTimeout(() => document.querySelector('.loading').classList.add('hidden'), 700);

  initSlideshow();
  initSparkles();
  initAnimations();
  initLightbox();
  initMobileToggle();
  initSearch();
});

/* ---------- Slideshow ---------- */
function initSlideshow(){
  const slides = $$('.slide');
  const dotsWrap = $('.slide-controls');
  if(!slides.length) return;
  let idx = 0;
  function goto(i){
    slides.forEach((s, j)=> s.classList.toggle('active', i===j));
    $$('.dot').forEach((d,j)=> d.classList.toggle('active', i===j));
    idx = i;
  }
  // create dots
  slides.forEach((_, i) => {
    const d = document.createElement('div'); d.className='dot'; if(i===0) d.classList.add('active');
    d.addEventListener('click', ()=> goto(i));
    dotsWrap.appendChild(d);
  });
  goto(0);
  let timer = setInterval(()=> goto((idx+1)%slides.length), 5200);
  // pause on hover
  $('.slides').addEventListener('mouseenter', ()=> clearInterval(timer));
  $('.slides').addEventListener('mouseleave', ()=> timer = setInterval(()=> goto((idx+1)%slides.length), 5200));
}

/* ---------- Sparkles (canvas) ---------- */
function initSparkles(){
  const canvas = document.createElement('canvas'); canvas.className='sparkles';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let w=canvas.width=innerWidth, h=canvas.height=innerHeight;
  const particles = [];
  function rand(min,max){return Math.random()*(max-min)+min}
  function create(){ particles.push({x:rand(0,w), y:rand(0,h), r:rand(1,3.6), vx:rand(-0.15,0.15), vy:rand(-0.2,0.25), a:rand(0.2,0.9)}); }
  for(let i=0;i<80;i++) create();
  function resize(){ w=canvas.width=innerWidth; h=canvas.height=innerHeight; }
  addEventListener('resize', resize);
  function draw(){
    ctx.clearRect(0,0,w,h);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if(p.x< -10) p.x = w+10;
      if(p.x> w+10) p.x=-10;
      if(p.y>h+10) p.y=-10;
      ctx.beginPath();
      const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*6);
      g.addColorStop(0, `rgba(255,150,195,${p.a})`);
      g.addColorStop(1, `rgba(255,150,195,0)`);
      ctx.fillStyle = g;
      ctx.arc(p.x,p.y,p.r*3,0,Math.PI*2);
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
}

/* ---------- IntersectionObserver animations ---------- */
function initAnimations(){
  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add('in-view');
        obs.unobserve(e.target);
      }
    });
  }, {threshold: 0.12});
  $$('.fade-up').forEach(el => obs.observe(el));
  $$('.slide-in-left').forEach(el => obs.observe(el));
}

/* ---------- Lightbox gallery ---------- */
function initLightbox(){
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightbox-img');
  $$('.gallery-item').forEach(item=>{
    item.addEventListener('click', ()=>{
      const img = item.querySelector('img');
      lbImg.src = img.dataset.large || img.src;
      lb.classList.add('open');
    });
  });
  lb.addEventListener('click', (e)=> {
    if(e.target === lb || e.target.id === 'close-lightbox') lb.classList.remove('open');
  });
}

/* ---------- Mobile menu toggle ---------- */
function initMobileToggle(){
  const btn = document.querySelector('.mobile-toggle');
  if(!btn) return;
  btn.addEventListener('click', ()=>{
    const nav = document.querySelector('.nav');
    if(nav.style.display === 'flex') nav.style.display = '';
    else nav.style.display = 'flex';
  });
}

/* ---------- Client-side search (fetch and index pages) ---------- */
function initSearch(){
  const searchInput = document.getElementById('site-search-input');
  const searchBtn = document.getElementById('site-search-btn');
  const resultsWrap = document.getElementById('search-results');
  const pages = ['index.html','about.html','gallery.html','contact.html'];
  const index = [];
  // fetch pages and index them (simple)
  Promise.all(pages.map(p => fetch(p).then(r => r.text().catch(()=>'')))).then(htmls=>{
    htmls.forEach((h,i)=>{
      if(!h) return;
      const tmp = document.createElement('div');
      tmp.innerHTML = h;
      const title = (tmp.querySelector('title') && tmp.querySelector('title').textContent) || pages[i];
      const bodyText = tmp.textContent.replace(/\s+/g,' ').trim();
      index.push({path:pages[i], title, text: bodyText});
    });
  }).catch(()=>{ /* ignore errors */ });

  function renderResults(items){
    resultsWrap.innerHTML = items.length ? items.map(it => `
      <a class="card" href="${it.path}" style="display:block;margin:8px 0;">
        <strong style="display:block">${it.title}</strong>
        <small style="color:#96506f">${it.path}</small>
        <div style="color:#6b5560;margin-top:6px">${it.snippet}</div>
      </a>`).join('') : `<div class="card">No results</div>`;
  }

  function search(q){
    if(!q) { resultsWrap.innerHTML=''; return; }
    const ql = q.toLowerCase();
    const results = index.map(it => {
      const pos = it.text.toLowerCase().indexOf(ql);
      const snippet = pos >= 0 ? it.text.slice(Math.max(0,pos-60), pos+140).replace(/\n/g,' ') + '...' : '';
      let score = 0;
      if(it.title.toLowerCase().includes(ql)) score += 40;
      if(pos >= 0) score += 20;
      score += (it.text.split(ql).length - 1);
      return {...it, score, snippet};
    }).filter(r => r.score>0).sort((a,b)=>b.score-a.score).slice(0,10);
    renderResults(results);
  }

  if(searchBtn && searchInput){
    searchBtn.addEventListener('click', ()=> search(searchInput.value));
    searchInput.addEventListener('keydown', e => { if(e.key === 'Enter') search(searchInput.value) });
  }

  // quick open with Ctrl+K or /
  document.addEventListener('keydown', e=>{
    if((e.ctrlKey && e.key.toLowerCase()==='k') || e.key === '/'){
      e.preventDefault();
      searchInput.focus();
    }
  });
}

/* ---------- small utility: spinner rotation ---------- */
(() => {
  const style = document.createElement('style');
  style.innerHTML = '@keyframes spin{to{transform:rotate(360deg)}}';
  document.head.appendChild(style);
})();
// Simple page text search
document.getElementById("site-search-btn").addEventListener("click", performSearch);
document.getElementById("site-search-input").addEventListener("keydown", function (e) {
    if (e.key === "Enter") performSearch();
});

function performSearch() {
    const query = document.getElementById("site-search-input").value.toLowerCase();
    const resultsContainer = document.getElementById("search-results");
    resultsContainer.innerHTML = ""; // clear old results

    if (!query) return;

    const text = document.body.innerText.toLowerCase();
    const count = text.split(query).length - 1;

    resultsContainer.innerHTML =
        `<div style="padding:12px;background:#ffddec;border-radius:8px">
            Found <strong>${count}</strong> occurrences of “${query}”.
        </div>`;
}
