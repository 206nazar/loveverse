'use strict';
const app=document.getElementById('app');
const cfg=window.LOVEVERSE_CONFIG||{};
const configured=cfg.supabaseUrl?.startsWith('https://') && !cfg.supabaseUrl.includes('PASTE_') && cfg.supabaseAnonKey && !cfg.supabaseAnonKey.includes('PASTE_');
const db=configured&&window.supabase?window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey):null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const themes={stars:{name:'Зоряний всесвіт',emoji:'🌌',places:['Зірка спогадів','Місяць бажань','Сузір’я серця'],icons:['🌟','🌙','💖']},garden:{name:'Чарівний сад',emoji:'🌸',places:['Дерево спогадів','Озеро бажань','Квітка кохання'],icons:['🌳','🪷','🌺']},ocean:{name:'Океан кохання',emoji:'🌊',places:['Острів спогадів','Маяк надії','Перлина серця'],icons:['🏝️','🗼','🐚']}};
function view(html){app.innerHTML=html;app.classList.remove('lv4-enter');void app.offsetWidth;app.classList.add('lv4-enter');window.scrollTo({top:0,behavior:'instant'});}function errorText(e){return esc(e?.message||'Сталася помилка. Спробуйте ще раз.');}
function warning(){return !db?'<div class="notice">⚙️ Supabase ще не підключено. Заповніть <b>config.js</b> і виконайте <b>schema.sql</b> за інструкцією README.</div>':''}
function home(){view(`<section class="hero reveal"><div class="eyebrow">Маленький всесвіт для великих почуттів</div><h1>Створи всесвіт<br>для особливої людини ✨</h1><p class="lead">Перетвори ваші спогади на чарівну інтерактивну історію. Один сюрприз. Три таємниці. Безліч емоцій.</p><div class="actions"><a class="btn" href="#/create">💝 Створити сюрприз</a><a class="btn secondary" href="#/demo">✨ Спробувати демо</a></div></section><div class="grid"><article class="tile"><div class="emoji">🌸</div><h3>Ваші спогади</h3><p>Три особисті моменти, які оживають у казковому світі.</p></article><article class="tile"><div class="emoji">💌</div><h3>Справжні почуття</h3><p>Фінальне послання, яке відкриється лише наприкінці пригоди.</p></article><article class="tile"><div class="emoji">🔗</div><h3>Одне посилання</h3><p>Надішли створений сюрприз у будь-який месенджер.</p></article></div>${warning()}`)}
function create(){view(`<div class="panel reveal"><div class="eyebrow">Твоя історія</div><h2>Створити романтичний всесвіт 💗</h2><p class="muted">Заповни поля — і ми збережемо персональну інтерактивну пригоду.</p>${warning()}<form id="create-form"><div class="field"><label for="recipient">Для кого сюрприз?</label><input id="recipient" maxlength="80" required placeholder="Наприклад, Софія"></div><div class="field"><label for="sender">Від кого?</label><input id="sender" maxlength="80" required placeholder="Наприклад, Максим"></div><div class="field"><label for="theme">Атмосфера</label><select id="theme"><option value="stars">🌌 Зоряний всесвіт</option><option value="garden">🌸 Чарівний сад</option><option value="ocean">🌊 Океан кохання</option></select></div><div class="field"><label for="music">🎵 Музична атмосфера</label><select id="music"><option value="dream">✨ Зоряна мелодія</option><option value="warm">💗 Теплі почуття</option><option value="calm">🌊 Тихий вечір</option><option value="off">🔇 Без музики</option></select></div><h3>Три чарівні спогади</h3>${[1,2,3].map(i=>`<div class="field"><label for="memory${i}">Спогад №${i}</label><textarea id="memory${i}" maxlength="600" required placeholder="Напиши про особливий момент, який ви пережили разом…"></textarea><label for="photo${i}" class="lv4-photo-label">📸 Фото до спогаду (необов’язково)</label><input id="photo${i}" type="file" accept="image/jpeg,image/png,image/webp,image/avif"><p class="hint">Максимум 5 МБ. Фото буде доступне тим, хто має посилання.</p></div>`).join('')}<div class="field"><label for="message">Головне послання 💌</label><textarea id="message" maxlength="3000" required placeholder="Те, що ти хочеш сказати від усього серця…"></textarea></div><p class="hint">Історію зможе прочитати кожен, хто отримає посилання. Не додавай конфіденційні дані.</p><button id="submit" class="btn" type="submit">✨ Створити мій всесвіт</button><div id="status" role="status" aria-live="polite"></div></form></div>`);document.getElementById('create-form').addEventListener('submit',save);
const b=document.createElement('button');b.type='button';b.className='btn secondary';b.textContent='👀 Попередній перегляд';document.getElementById('submit').before(b);b.onclick=previewDraft;
if(lv4Draft)restoreDraft();}
async function identity(){if(!db)throw Error('Спочатку підключіть Supabase у config.js.');let {data:{session},error}=await db.auth.getSession();if(error)throw error;if(!session){const res=await db.auth.signInAnonymously();if(res.error)throw res.error;session=res.data.session;}if(!session?.user)throw Error('Не вдалося створити анонімну сесію. Перевірте Auth → Providers → Anonymous Sign-ins.');return session.user.id;}
function slug(){const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');}
let lv4Draft=null;
let lv4Urls=[];
function clearLv4Urls(){lv4Urls.forEach(x=>URL.revokeObjectURL(x));lv4Urls=[];}
function captureDraft(){
  const f=document.getElementById('create-form');if(!f.reportValidity())return null;
  const values={recipient:document.getElementById('recipient').value.trim(),sender:document.getElementById('sender').value.trim(),theme:document.getElementById('theme').value,music:document.getElementById('music').value,memories:[1,2,3].map(i=>document.getElementById('memory'+i).value.trim()),message:document.getElementById('message').value.trim()};
  if(!values.recipient||!values.sender||!values.message||values.memories.some(x=>!x)){alert('Заповни всі поля.');return null;}
  const files=[1,2,3].map(i=>document.getElementById('photo'+i).files[0]||null);
  if(files.some(x=>x&&(x.size>5*1024*1024||!['image/jpeg','image/png','image/webp','image/avif'].includes(x.type)))){alert('Фото має бути JPG, PNG, WebP або AVIF до 5 МБ.');return null;}
  return {values,files};
}
function restoreDraft(){if(!lv4Draft)return;const d=lv4Draft.values;
  for(const key of ['recipient','sender','theme','music','message'])document.getElementById(key).value=d[key];
  d.memories.forEach((v,i)=>document.getElementById('memory'+(i+1)).value=v);
  d.files.forEach((file,i)=>{if(!file)return;const input=document.getElementById('photo'+(i+1));try{const dt=new DataTransfer();dt.items.add(file);input.files=dt.files;}catch{const note=document.createElement('p');note.className='hint';note.textContent='Вибери фото повторно: '+file.name;input.after(note);}});
}
function previewDraft(){const d=captureDraft();if(!d)return;lv4Draft=d;clearLv4Urls();
  const images=d.files.map(file=>{if(!file)return null;const url=URL.createObjectURL(file);lv4Urls.push(url);return url;});
  experience({...d.values,lvMusic:d.values.music,lvImages:images},true);
}
const PHOTO_BUCKET='loveverse-photos';
async function save(ev){
  ev.preventDefault();
  const button=document.getElementById('submit'),status=document.getElementById('status');
  const draft=captureDraft();if(!draft)return;lv4Draft=draft;
  button.disabled=true;
  status.innerHTML='<p class="muted">Зберігаємо історію…</p>';
  let storySlug=null,paths=[];
  try{
    const owner_id=await identity();
    const data={owner_id,slug:slug(),recipient:document.getElementById('recipient').value.trim(),sender:document.getElementById('sender').value.trim(),theme:document.getElementById('theme').value,memories:[1,2,3].map(i=>document.getElementById('memory'+i).value.trim()),message:document.getElementById('message').value.trim()};
    const music=document.getElementById('music').value;
    if(!data.recipient||!data.sender||!data.message||data.memories.some(x=>!x))throw Error('Заповни всі поля.');
    const files=[1,2,3].map(i=>document.getElementById('photo'+i).files[0]||null);
    const types={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif'};
    for(const file of files)if(file&&(!types[file.type]||file.size>5*1024*1024))throw Error('Фото має бути JPG, PNG, WebP або AVIF розміром до 5 МБ.');
    const {error:storyError}=await db.from('stories').insert(data);
    if(storyError)throw storyError;
    storySlug=data.slug;
    const images=[null,null,null];
    for(let i=0;i<3;i++){
      if(!files[i])continue;
      status.textContent='Завантажуємо фото '+(i+1)+' із 3…';
      const path=owner_id+'/'+data.slug+'/'+(i+1)+'.'+types[files[i].type];
      const {error}=await db.storage.from(PHOTO_BUCKET).upload(path,files[i],{contentType:files[i].type,upsert:false});
      if(error)throw error;
      images[i]=path;paths.push(path);
    }
    const {error:extraError}=await db.from('story_extras').insert({slug:data.slug,owner_id,music,images});
    if(extraError)throw extraError;
    location.hash='#/created/'+data.slug;
  }catch(e){
    if(paths.length)await db.storage.from(PHOTO_BUCKET).remove(paths);
    if(storySlug)await db.from('stories').delete().eq('slug',storySlug);
    status.innerHTML='<div class="notice">'+errorText(e)+'<p class="hint">Для цієї версії виконай SQL з файлу SETUP.md у Supabase.</p></div>';
  }finally{button.disabled=false;}
}
function storyUrl(slug){return location.href.split('#')[0]+'#/s/'+encodeURIComponent(slug)}
function created(slug){const url=storyUrl(slug);view(`<div class="panel center reveal"><div class="big-heart">💖</div><h2>Твій всесвіт створено!</h2><p class="muted">Надішли це посилання особливій людині:</p><p class="break">${esc(url)}</p><div class="actions"><button class="btn" id="copy">🔗 Скопіювати посилання</button><a class="btn secondary" href="#/s/${esc(slug)}">👀 Переглянути</a></div><p class="hint" id="copy-status"></p></div>`);document.getElementById('copy').onclick=async()=>{try{await navigator.clipboard.writeText(url);document.getElementById('copy-status').textContent='Посилання скопійовано!'}catch{document.getElementById('copy-status').textContent='Виділи та скопіюй посилання вище вручну.'}}}
const demo={lvMusic:'dream',recipient:'Софія',sender:'Людина, яка тебе дуже цінує',theme:'garden',memories:['Пам’ятаєш нашу першу зустріч? Тоді почалася моя улюблена історія.','Навіть звичайні прогулянки з тобою перетворюються на пригоду.','Твоя усмішка — мій найтепліший спогад.'],message:'Дякую, що ти є у моєму житті. Я хочу створити з тобою ще тисячу прекрасних спогадів. ❤️'};
async function loadStory(slug){if(!db)throw Error('Підключіть Supabase у config.js.');if(!/^[a-f0-9]{32}$/.test(slug))throw Error('Неправильне посилання.');await identity();
const { data, error } = await db.rpc(
  'get_shared_story',
  { p_slug: slug }
);
if(error)throw error;const story=Array.isArray(data)?data[0]:data;if(!story)throw Error('Історію не знайдено або її видалено.');
const {data:extras}=await db.from('story_extras').select('music,images').eq('slug',slug).maybeSingle();
story.lvMusic=extras?.music||'off';
story.lvImages=Array.isArray(extras?.images)?extras.images:[null,null,null];
return story;}
let lvMusicPlayer=null;
function stopLvMusic(){
  if(!lvMusicPlayer)return;
  lvMusicPlayer.pause();lvMusicPlayer.currentTime=0;lvMusicPlayer=null;
}
function startLvMusic(choice){
  if(!['dream','warm','calm'].includes(choice))return false;
  stopLvMusic();
  const player=new Audio('./music/'+choice+'.ogg');
  player.loop=true;player.volume=.42;player.preload='auto';
  lvMusicPlayer=player;
  player.play().catch(error=>{
    console.warn('Не вдалося відтворити музику',error);
    if(lvMusicPlayer===player){stopLvMusic();const b=document.getElementById('lv4-music');if(b){b.textContent='🎵 Спробувати ще раз';b.setAttribute('aria-pressed','false');}}
  });
  return true;
}
function musicButton(choice){
  return choice&&choice!=='off'?'<button class="lv4-music" id="lv4-music" type="button" aria-pressed="false">🎵 Увімкнути музику</button>':'';
}
function attachMusic(choice){
  const b=document.getElementById('lv4-music');
  if(b){b.textContent=lvMusicPlayer?'🔇 Вимкнути музику':'🎵 Увімкнути музику';b.setAttribute('aria-pressed',String(Boolean(lvMusicPlayer)));b.onclick=()=>{
    if(lvMusicPlayer){stopLvMusic();b.textContent='🎵 Увімкнути музику';b.setAttribute('aria-pressed','false');}
    else if(startLvMusic(choice)){b.textContent='🔇 Вимкнути музику';b.setAttribute('aria-pressed','true');}
  };}
}
function storyPhoto(path,preview=false){
  if(preview&&typeof path==='string'&&lv4Urls.includes(path))return '<figure class="lv4-polaroid"><img src="'+esc(path)+'" alt="Фото спогаду"><figcaption>Мить, яку хочеться зберегти ♡</figcaption></figure>';
  if(!db||typeof path!=='string'||!/^[-a-zA-Z0-9_]+\/[a-f0-9]{32}\/[1-3]\.(jpg|png|webp|avif)$/.test(path))return '';
  const url=db.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
  return '<figure class="lv4-polaroid"><img src="'+esc(url)+'" alt="Фото спогаду" loading="lazy"><figcaption>Мить, яку хочеться зберегти ♡</figcaption></figure>';
}
function experience(data,preview=false) {
  const t = themes[data.theme] || themes.stars;
  const themeKey = Object.prototype.hasOwnProperty.call(themes, data.theme) ? data.theme : 'stars';
  const opened = new Set();
  let stage = -1;
  let portalBusy = false;
  let envelopeBusy = false;
  const particles = (count=24) => Array.from({length:count},(_,i)=>
    `<i aria-hidden="true" style="--i:${i};--angle:${i*360/count}deg;--delay:${(i%9)*-.4}s;--size:${2+(i%4)}px"></i>`).join('');

  function render() {
    const banner=()=>preview?'<div class="lv4-preview-banner"><span>👀 Попередній перегляд · історія ще не збережена</span><button class="btn secondary" id="lv4-edit">✏️ Редагувати</button><button class="btn" id="lv4-save">💾 Зберегти</button></div>':'';
    const wireBanner=()=>{if(!preview)return;
      const edit=document.getElementById('lv4-edit'),save=document.getElementById('lv4-save');
      if(edit)edit.onclick=()=>{stopLvMusic();create();};
      if(save)save.onclick=()=>{stopLvMusic();create();document.getElementById('create-form').requestSubmit();};
    };
    if (stage === -1) {
      view(`${banner()}<section class="lv3-experience" data-theme="${themeKey}">
        <div class="lv3-intro">${musicButton(data.lvMusic)}
          <div class="eyebrow">LoveVerse · Твоя особлива пригода</div>
          <div class="lv3-portal" aria-hidden="true"><div class="lv3-portal-ring"></div><div class="lv3-portal-ring second"></div><div class="lv3-portal-core">${t.emoji}</div><div class="lv3-portal-dust">${particles(32)}</div></div>
          <h2>${esc(data.recipient)}, цей всесвіт створений для тебе</h2>
          <p>Три особливі спогади. Одне послання, яке чекає саме на тебе.</p>
          <button class="btn" id="start">✨ Відкрити портал</button>
        </div>
      </section>`);
      wireBanner();attachMusic(data.lvMusic);
      document.getElementById('start').onclick=()=>{
        if(portalBusy)return;
        portalBusy=true;
        const screen=document.querySelector('.lv3-intro');
        screen.classList.add('lv3-entering');
        const go=()=>{stage=0;portalBusy=false;render();};
        if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)go();
        else setTimeout(go,900);
      };
      return;
    }
    if(stage===0){
      view(`${banner()}<section class="lv3-experience" data-theme="${themeKey}">
        <div class="lv3-map">${musicButton(data.lvMusic)}
          <div class="eyebrow">${esc(t.name)} · Карта спогадів</div>
          <h2>${esc(data.recipient)}, обери свою зірку</h2>
          <p class="muted">Кожне місце зберігає частинку вашої історії.</p>
          <div class="lv3-map-path" aria-hidden="true"></div>
          <div class="lv3-map-places">${t.places.map((place,i)=>`<button class="lv3-place ${opened.has(i)?'done':''}" data-place="${i}" aria-label="${esc(place)}. ${opened.has(i)?'Вже відкрито':'Відкрити спогад'}">
            <span class="lv3-place-orbit"><span class="lv3-place-icon">${t.icons[i]}</span></span>
            <strong>${esc(place)}</strong><small>${opened.has(i)?'✓ Спогад відкрито':'✦ Торкнись, щоб відкрити'}</small>
          </button>`).join('')}</div>
          <div class="lv3-progress-label">${opened.size} з 3 спогадів відкрито</div>
          <div class="progress" role="progressbar" aria-label="Відкриті спогади" aria-valuemin="0" aria-valuemax="3" aria-valuenow="${opened.size}"><div style="width:${opened.size/3*100}%"></div></div>
          ${opened.size===3?'<div class="center lv3-map-finish"><button class="btn" id="final">💌 Відкрити таємний лист</button></div>':''}
        </div>
      </section>`);
      wireBanner();attachMusic(data.lvMusic);
      document.querySelectorAll('[data-place]').forEach(b=>b.onclick=()=>{
        const index=Number(b.dataset.place);
        opened.add(index);b.querySelector('.lv3-place-orbit')?.classList.add('lv4-zoom');
        const go=()=>{stage=index+1;render();};
        if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)go();else setTimeout(go,420);
      });
      const final=document.getElementById('final');
      if(final)final.onclick=()=>{stage=4;render();};
      return;
    }
    if(stage>=1&&stage<=3){
      const i=stage-1;
      view(`${banner()}<section class="lv3-experience" data-theme="${themeKey}">
        <div class="lv3-memory">${musicButton(data.lvMusic)}
          <div class="eyebrow">Спогад ${stage} із 3</div>
          <div class="lv3-memory-symbol" aria-hidden="true">${t.icons[i]}</div>
          <h2>${esc(t.places[i])}</h2>
          <div class="lv3-memory-paper">${storyPhoto(data.lvImages?.[i],preview)}<span class="lv3-quote" aria-hidden="true">“</span><p>${esc(data.memories[i] || 'Наш незабутній момент.')}</p></div>
          <div class="lv-memory-actions"><button class="btn secondary" id="back">← До карти</button><button class="btn" id="next-memory">${opened.size===3?'💌 До листа':'✨ Наступний спогад'}</button></div>
        </div>
      </section>`);
      wireBanner();attachMusic(data.lvMusic);
      document.getElementById('back').onclick=()=>{stage=0;render();};
      document.getElementById('next-memory').onclick=()=>{
        const next=[0,1,2].find(n=>!opened.has(n));
        if(next===undefined)stage=4;
        else {opened.add(next);stage=next+1;}
        render();
      };
      return;
    }
    if(stage===4){
      view(`${banner()}<section class="lv3-experience" data-theme="${themeKey}">
        <div class="lv3-envelope-scene">${musicButton(data.lvMusic)}
          <div class="eyebrow">Усі три спогади відкрито</div>
          <h2>Залишилось дещо найважливіше…</h2>
          <p class="muted">Цей лист написаний спеціально для тебе, ${esc(data.recipient)}.</p>
          <button class="lv3-envelope" id="open-envelope" aria-label="Відкрити таємний лист">
            <span class="lv3-envelope-back"></span><span class="lv3-envelope-note">💗</span><span class="lv3-envelope-flap"></span><span class="lv3-envelope-front"></span><span class="lv3-envelope-seal">♥</span>
          </button>
          <button class="btn" id="open-letter">💌 Відкрити лист</button>
          <p class="hint">Натисни на конверт або кнопку</p>
        </div>
      </section>`);
      wireBanner();attachMusic(data.lvMusic);
      const open=()=>{
        if(envelopeBusy)return;
        envelopeBusy=true;
        document.querySelector('.lv3-envelope').classList.add('lv3-open');
        document.getElementById('open-letter').disabled=true;
        const go=()=>{envelopeBusy=false;stage=5;render();};
        if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)go();
        else setTimeout(go,1150);
      };
      document.getElementById('open-envelope').onclick=open;
      document.getElementById('open-letter').onclick=open;
      return;
    }
    const hearts=Array.from({length:26},(_,i)=>{
      const symbols=['💗','💕','💖','✨'];
      return `<span aria-hidden="true" style="--x:${(i*37+11)%100}%;--delay:${(i*.43)%9}s;--duration:${6+i%5}s;--size:${17+i%18}px">${symbols[i%symbols.length]}</span>`;
    }).join('');
    view(`${banner()}<div class="love-ending lv3-ending" data-theme="${themeKey}">
      <section class="panel scene reveal love-letter lv3-letter">${musicButton(data.lvMusic)}
        <div class="lv-letter-stars" aria-hidden="true">✧ ✦ ✧</div>
        <div class="big-heart">💗</div>
        <div class="eyebrow">Головне послання</div>
        <h2>${esc(data.recipient)}, це для тебе</h2>
        <p class="lv3-message">${esc(data.message)}</p>
        <p class="muted">З любов’ю, ${esc(data.sender)} ❤️</p>
        <div class="scroll-invitation"><p>Але це ще не кінець нашої історії…</p><span>Прокрути вниз 💕</span><div class="scroll-arrow" aria-hidden="true">↓</div></div>
      </section>
      <section class="magic-finale lv3-finale" id="magic-finale" aria-label="Магічний фінал">
        <div class="lv3-heart-constellation" aria-hidden="true">♥</div>
        <div class="lv4-star-game" id="lv4-star-game">
          <div class="lv4-star-title"><h3>Збери п’ять зірок ✨</h3><p>Натисни на кожну, щоб створити серце</p><strong id="lv4-star-count">0 / 5</strong></div>
          ${Array.from({length:5},(_,i)=>`<button class="lv4-star" type="button" data-star="${i}" style="--sx:${[17,72,32,82,50][i]}%;--sy:${[28,24,68,70,48][i]}%" aria-label="Зірка ${i+1}">✦</button>`).join('')}
          <div class="lv4-big-heart" aria-hidden="true">♥</div>
        </div>
        <div class="firework firework-one" aria-hidden="true"></div><div class="firework firework-two" aria-hidden="true"></div><div class="firework firework-three" aria-hidden="true"></div>
        <div class="floating-hearts" aria-hidden="true">${hearts}</div>
        <div class="finale-content lv4-final-reveal">
          <div class="lv-finale-kicker">І нехай ця мить залишиться назавжди ✨</div>
          <div class="finale-heart" aria-hidden="true">💖</div>
          <h2>${esc(data.recipient)}, ти — справжнє диво!</h2>
          <p>І якби мені довелося обирати серед мільйонів зірок, я б знову обрав тебе.</p>
          <div class="finale-love" aria-hidden="true">❤️ ∞ ❤️</div>
          <p class="finale-signature">Наша історія тільки починається…</p>
          <button class="btn" id="again">💞 Прожити історію знову</button>
        </div>
      </section>
    </div>`);
    wireBanner();attachMusic(data.lvMusic);
      const finale=document.getElementById('magic-finale');
      const starGame=document.getElementById('lv4-star-game');
      const count=document.getElementById('lv4-star-count');
      let found=0;finale.classList.add('lv4-await');
      document.querySelectorAll('[data-star]').forEach(star=>star.onclick=()=>{
        if(star.disabled)return;star.disabled=true;star.classList.add('lv4-collected');
        found++;count.textContent=found+' / 5';
        if(found===5){starGame.classList.add('lv4-complete');finale.classList.remove('lv4-await');finale.classList.add('lv4-unlocked');}
      });
      document.getElementById('again').onclick=()=>{opened.clear();stage=-1;render();};
  }
  render();
}
async function mine(){view('<div class="panel"><h2>Мої всесвіти 💞</h2><p class="muted">Завантажуємо твої історії…</p></div>');try{const id=await identity();const {data,error}=await db.from('stories').select('slug,recipient,theme,created_at').eq('owner_id',id).order('created_at',{ascending:false});if(error)throw error;view(`<div class="panel"><h2>Мої всесвіти 💞</h2><p class="muted">Історії, створені з цього анонімного акаунта.</p>${data.length?data.map(x=>`<div class="story-card"><div><h3>${(themes[x.theme]||themes.stars).emoji} Для ${esc(x.recipient)}</h3><p class="small">${esc(new Date(x.created_at).toLocaleDateString('uk-UA'))}</p></div><div class="actions"><a class="btn secondary" href="#/s/${esc(x.slug)}">Відкрити</a><button class="btn secondary" data-delete="${esc(x.slug)}">Видалити</button></div></div>`).join(''):'<p>Поки що немає сюрпризів. <a href="#/create">Створи перший!</a></p>'}<p class="hint">Не очищуй дані браузера: без прив’язаного акаунта анонімний доступ може бути втрачено.</p></div>`);document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=async()=>{if(!confirm('Назавжди видалити цей сюрприз?'))return;b.disabled=true;const {error}=await db.from('stories').delete().eq('slug',b.dataset.delete).eq('owner_id',id);if(error){alert(error.message);b.disabled=false}else mine()})}catch(e){view(`<div class="panel"><h2>Мої всесвіти</h2><div class="notice">${errorText(e)}</div><a href="#/">На головну</a></div>`)}}
async function route(){stopLvMusic();clearLv4Urls();lv4Draft=null;const path=decodeURIComponent(location.hash.slice(1)||'/');if(path==='/')return home();if(path==='/create')return create();if(path==='/mine')return mine();if(path==='/demo')return experience(demo);if(path.startsWith('/created/'))return created(path.slice(9));if(path.startsWith('/s/')){view('<div class="panel center">✨ Шукаємо твій всесвіт…</div>');try{const story=await loadStory(path.slice(3));if(location.hash==='#'+path)experience(story)}catch(e){view(`<div class="panel center"><h2>Не вдалося відкрити історію</h2><div class="notice">${errorText(e)}</div><a class="btn" href="#/">На головну</a></div>`)}return}home()}
window.addEventListener('hashchange',route);route();
