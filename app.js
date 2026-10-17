'use strict';
const app=document.getElementById('app');
const cfg=window.LOVEVERSE_CONFIG||{};
const configured=cfg.supabaseUrl?.startsWith('https://') && !cfg.supabaseUrl.includes('PASTE_') && cfg.supabaseAnonKey && !cfg.supabaseAnonKey.includes('PASTE_');
const db=configured&&window.supabase?window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey):null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const themes={stars:{name:'Зоряний всесвіт',emoji:'🌌',places:['Зірка спогадів','Місяць бажань','Сузір’я серця'],icons:['🌟','🌙','💖']},garden:{name:'Чарівний сад',emoji:'🌸',places:['Дерево спогадів','Озеро бажань','Квітка кохання'],icons:['🌳','🪷','🌺']},ocean:{name:'Океан кохання',emoji:'🌊',places:['Острів спогадів','Маяк надії','Перлина серця'],icons:['🏝️','🗼','🐚']}};
function view(html){app.innerHTML=html;window.scrollTo({top:0,behavior:'instant'});}function errorText(e){return esc(e?.message||'Сталася помилка. Спробуйте ще раз.');}
function warning(){return !db?'<div class="notice">⚙️ Supabase ще не підключено. Заповніть <b>config.js</b> і виконайте <b>schema.sql</b> за інструкцією README.</div>':''}
function home(){view(`<section class="hero reveal"><div class="eyebrow">Маленький всесвіт для великих почуттів</div><h1>Створи всесвіт<br>для особливої людини ✨</h1><p class="lead">Перетвори ваші спогади на чарівну інтерактивну історію. Один сюрприз. Три таємниці. Безліч емоцій.</p><div class="actions"><a class="btn" href="#/create">💝 Створити сюрприз</a><a class="btn secondary" href="#/demo">✨ Спробувати демо</a></div></section><div class="grid"><article class="tile"><div class="emoji">🌸</div><h3>Ваші спогади</h3><p>Три особисті моменти, які оживають у казковому світі.</p></article><article class="tile"><div class="emoji">💌</div><h3>Справжні почуття</h3><p>Фінальне послання, яке відкриється лише наприкінці пригоди.</p></article><article class="tile"><div class="emoji">🔗</div><h3>Одне посилання</h3><p>Надішли створений сюрприз у будь-який месенджер.</p></article></div>${warning()}`)}
function create(){view(`<div class="panel reveal"><div class="eyebrow">Твоя історія</div><h2>Створити романтичний всесвіт 💗</h2><p class="muted">Заповни поля — і ми збережемо персональну інтерактивну пригоду.</p>${warning()}<form id="create-form"><div class="field"><label for="recipient">Для кого сюрприз?</label><input id="recipient" maxlength="80" required placeholder="Наприклад, Софія"></div><div class="field"><label for="sender">Від кого?</label><input id="sender" maxlength="80" required placeholder="Наприклад, Максим"></div><div class="field"><label for="theme">Атмосфера</label><select id="theme"><option value="stars">🌌 Зоряний всесвіт</option><option value="garden">🌸 Чарівний сад</option><option value="ocean">🌊 Океан кохання</option></select></div><h3>Три чарівні спогади</h3>${[1,2,3].map(i=>`<div class="field"><label for="memory${i}">Спогад №${i}</label><textarea id="memory${i}" maxlength="600" required placeholder="Напиши про особливий момент, який ви пережили разом…"></textarea></div>`).join('')}<div class="field"><label for="message">Головне послання 💌</label><textarea id="message" maxlength="3000" required placeholder="Те, що ти хочеш сказати від усього серця…"></textarea></div><p class="hint">Історію зможе прочитати кожен, хто отримає посилання. Не додавай конфіденційні дані.</p><button id="submit" class="btn" type="submit">✨ Створити мій всесвіт</button><div id="status" role="status" aria-live="polite"></div></form></div>`);document.getElementById('create-form').addEventListener('submit',save)}
async function identity(){if(!db)throw Error('Спочатку підключіть Supabase у config.js.');let {data:{session},error}=await db.auth.getSession();if(error)throw error;if(!session){const res=await db.auth.signInAnonymously();if(res.error)throw res.error;session=res.data.session;}if(!session?.user)throw Error('Не вдалося створити анонімну сесію. Перевірте Auth → Providers → Anonymous Sign-ins.');return session.user.id;}
function slug(){const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');}
async function save(ev){ev.preventDefault();const b=document.getElementById('submit'),status=document.getElementById('status');b.disabled=true;status.innerHTML='<p class="muted">Зберігаємо магію…</p>';try{const owner_id=await identity();const data={owner_id,slug:slug(),recipient:document.getElementById('recipient').value.trim(),sender:document.getElementById('sender').value.trim(),theme:document.getElementById('theme').value,memories:[1,2,3].map(i=>document.getElementById('memory'+i).value.trim()),message:document.getElementById('message').value.trim()};if(!data.recipient||!data.sender||!data.message||data.memories.some(x=>!x))throw Error('Заповни всі поля.');const {error}=await db.from('stories').insert(data);if(error)throw error;location.hash='#/created/'+data.slug;}catch(e){status.innerHTML=`<div class="notice">${errorText(e)}</div>`}finally{b.disabled=false}}
function storyUrl(slug){return location.href.split('#')[0]+'#/s/'+encodeURIComponent(slug)}
function created(slug){const url=storyUrl(slug);view(`<div class="panel center reveal"><div class="big-heart">💖</div><h2>Твій всесвіт створено!</h2><p class="muted">Надішли це посилання особливій людині:</p><p class="break">${esc(url)}</p><div class="actions"><button class="btn" id="copy">🔗 Скопіювати посилання</button><a class="btn secondary" href="#/s/${esc(slug)}">👀 Переглянути</a></div><p class="hint" id="copy-status"></p></div>`);document.getElementById('copy').onclick=async()=>{try{await navigator.clipboard.writeText(url);document.getElementById('copy-status').textContent='Посилання скопійовано!'}catch{document.getElementById('copy-status').textContent='Виділи та скопіюй посилання вище вручну.'}}}
const demo={recipient:'Софія',sender:'Людина, яка тебе дуже цінує',theme:'garden',memories:['Пам’ятаєш нашу першу зустріч? Тоді почалася моя улюблена історія.','Навіть звичайні прогулянки з тобою перетворюються на пригоду.','Твоя усмішка — мій найтепліший спогад.'],message:'Дякую, що ти є у моєму житті. Я хочу створити з тобою ще тисячу прекрасних спогадів. ❤️'};
async function loadStory(slug){if(!db)throw Error('Підключіть Supabase у config.js.');if(!/^[a-f0-9]{32}$/.test(slug))throw Error('Неправильне посилання.');await identity();
const { data, error } = await db.rpc(
  'get_shared_story',
  { p_slug: slug }
);
if(error)throw error;const story=Array.isArray(data)?data[0]:data;if(!story)throw Error('Історію не знайдено або її видалено.');return story;}
function experience(data) {
  const t = themes[data.theme] || themes.stars;
  const themeKey = Object.hasOwn(themes, data.theme) ? data.theme : 'stars';
  let stage = -1;
  const opened = new Set();

  function render() {
    if (stage === -1) {
      view(`<div class="panel scene reveal lv-scene lv-intro" data-theme="${themeKey}"><div class="lv-orbit" aria-hidden="true">✦ · ✧ · ✦</div><div class="eyebrow">Особливе послання</div><div class="planet">${t.emoji}</div><h2>${esc(data.recipient)}, для тебе створили цілий всесвіт</h2><p>Тут заховані три спогади й одне послання від серця.</p><button class="btn" id="start">✨ Увійти у всесвіт</button></div>`);
      document.getElementById('start').onclick = () => { stage = 0; render(); };
      return;
    }
    if (stage === 0) {
      view(`<div class="panel reveal lv-world-panel" data-theme="${themeKey}"><div class="center"><div class="eyebrow">${esc(t.name)}</div><h2>${esc(data.recipient)}, обери чарівне місце ✨</h2><p class="muted">Відкрий усі три таємниці, щоб побачити головне послання.</p></div><div class="world">${t.places.map((place,i)=>`<button data-place="${i}" class="${opened.has(i)?'done':''}"><span class="emoji">${t.icons[i]}</span>${esc(place)}<br><small>${opened.has(i)?'✓ Відкрито':'Натисни, щоб відкрити'}</small></button>`).join('')}</div><div class="progress" role="progressbar" aria-label="Відкриті спогади" aria-valuemin="0" aria-valuemax="3" aria-valuenow="${opened.size}"><div style="width:${opened.size/3*100}%"></div></div><p class="center muted">${opened.size} / 3 таємниці</p>${opened.size===3?'<div class="center"><button class="btn" id="final">💝 Відкрити головне послання</button></div>':''}</div>`);
      document.querySelectorAll('[data-place]').forEach(b => b.onclick = () => { stage = Number(b.dataset.place) + 1; opened.add(stage - 1); render(); });
      const finalButton = document.getElementById('final');
      if (finalButton) finalButton.onclick = () => { stage = 4; render(); };
      return;
    }
    if (stage >= 1 && stage <= 3) {
      const i = stage - 1;
      view(`<div class="panel scene reveal lv-scene lv-memory" data-theme="${themeKey}"><div class="step">ТАЄМНИЦЯ ${stage} З 3</div><div class="lv-memory-stars" aria-hidden="true">✦ ✧ ✦</div><div class="planet">${t.icons[i]}</div><h2>${esc(t.places[i])}</h2><p>${esc(data.memories[i] || 'Наш незабутній момент.')}</p><div class="lv-memory-actions"><button class="btn secondary" id="back">← До всесвіту</button><button class="btn" id="next-memory">${opened.size === 3 ? "💝 До послання" : "✨ Наступна таємниця"}</button></div></div>`);
      document.getElementById('back').onclick = () => { stage = 0; render(); };
      document.getElementById('next-memory').onclick = () => {
        const next = [0, 1, 2].find(index => !opened.has(index));
        if (next === undefined) {
          stage = 4;
        } else {
          opened.add(next);
          stage = next + 1;
        }
        render();
      };
      return;
    }

    // Головне послання і фінальна сцена розміщені одна під одною.
    const hearts = Array.from({ length: 32 }, (_, i) => {
      const symbols = ['💗', '💕', '💖', '❤️', '✨'];
      return `<span aria-hidden="true" style="--x:${(i*37+11)%100}%;--delay:${(i*.43)%9}s;--duration:${5+i%6}s;--size:${18+i%23}px">${symbols[i%symbols.length]}</span>`;
    }).join('');
    view(`
      <div class="love-ending" data-theme="${themeKey}">
        <section class="panel scene reveal love-letter"><div class="lv-letter-stars" aria-hidden="true">✧ ✦ ✧</div>
          <div class="big-heart">💗</div>
          <div class="eyebrow">Головне послання</div>
          <h2>${esc(data.recipient)}, це для тебе</h2>
          <p>${esc(data.message)}</p>
          <p class="muted">З любов’ю, ${esc(data.sender)} ❤️</p>
          <div class="scroll-invitation">
            <p>Але це ще не кінець нашої історії…</p>
            <span>Прокрути вниз 💕</span>
            <div class="scroll-arrow" aria-hidden="true">↓</div>
          </div>
        </section>
        <section class="magic-finale" id="magic-finale" aria-label="Магічний фінал">
          <div class="firework firework-one" aria-hidden="true"></div>
          <div class="firework firework-two" aria-hidden="true"></div>
          <div class="firework firework-three" aria-hidden="true"></div>
          <div class="floating-hearts" aria-hidden="true">${hearts}</div>
          <div class="finale-content">
            <div class="finale-heart" aria-hidden="true">💖</div>
            <h2>${esc(data.recipient)}, ти — справжнє диво!</h2>
            <p>І якби мені довелося обирати серед мільйонів зірок, я б знову обрав тебе.</p>
            <div class="finale-love" aria-hidden="true">❤️ ∞ ❤️</div>
            <p class="finale-signature">Наша історія тільки починається…</p>
            <button class="btn" id="again">💞 Прожити історію знову</button>
          </div>
        </section>
      </div>`);
    document.getElementById('again').onclick = () => {
      opened.clear();
      stage = -1;
      render();
    };
  }
  render();
}
async function mine(){view('<div class="panel"><h2>Мої всесвіти 💞</h2><p class="muted">Завантажуємо твої історії…</p></div>');try{const id=await identity();const {data,error}=await db.from('stories').select('slug,recipient,theme,created_at').eq('owner_id',id).order('created_at',{ascending:false});if(error)throw error;view(`<div class="panel"><h2>Мої всесвіти 💞</h2><p class="muted">Історії, створені з цього анонімного акаунта.</p>${data.length?data.map(x=>`<div class="story-card"><div><h3>${(themes[x.theme]||themes.stars).emoji} Для ${esc(x.recipient)}</h3><p class="small">${esc(new Date(x.created_at).toLocaleDateString('uk-UA'))}</p></div><div class="actions"><a class="btn secondary" href="#/s/${esc(x.slug)}">Відкрити</a><button class="btn secondary" data-delete="${esc(x.slug)}">Видалити</button></div></div>`).join(''):'<p>Поки що немає сюрпризів. <a href="#/create">Створи перший!</a></p>'}<p class="hint">Не очищуй дані браузера: без прив’язаного акаунта анонімний доступ може бути втрачено.</p></div>`);document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=async()=>{if(!confirm('Назавжди видалити цей сюрприз?'))return;b.disabled=true;const {error}=await db.from('stories').delete().eq('slug',b.dataset.delete).eq('owner_id',id);if(error){alert(error.message);b.disabled=false}else mine()})}catch(e){view(`<div class="panel"><h2>Мої всесвіти</h2><div class="notice">${errorText(e)}</div><a href="#/">На головну</a></div>`)}}
async function route(){const path=decodeURIComponent(location.hash.slice(1)||'/');if(path==='/')return home();if(path==='/create')return create();if(path==='/mine')return mine();if(path==='/demo')return experience(demo);if(path.startsWith('/created/'))return created(path.slice(9));if(path.startsWith('/s/')){view('<div class="panel center">✨ Шукаємо твій всесвіт…</div>');try{const story=await loadStory(path.slice(3));if(location.hash==='#'+path)experience(story)}catch(e){view(`<div class="panel center"><h2>Не вдалося відкрити історію</h2><div class="notice">${errorText(e)}</div><a class="btn" href="#/">На головну</a></div>`)}return}home()}
window.addEventListener('hashchange',route);route();
