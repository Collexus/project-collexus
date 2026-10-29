/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars */
// @ts-nocheck
"use client";

import { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { LucideGlyph } from "@/components/icon";
import { events } from "@/data/events";

const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function normalizeSearchValue(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function mountLucidePlaceholders(container) {
  return [...container.querySelectorAll(".lucide-mount[data-lucide]")].map((node) => {
    const root = createRoot(node);
    root.render(<LucideGlyph name={node.dataset.lucide} />);
    return root;
  });
}

export function OriginalInteractions() {
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const categories = {
      "Hackathons": { icon: "terminal", punch: "Build boldly. Ship what matters.", desc: "Published RCEE hackathon records.", cards: [] },
      "Internships": { icon: "work", punch: "Opportunities from official sources.", desc: "No verified RCEE internship listing is in the current source set.", cards: [] },
      "Workshops": { icon: "school", punch: "Learn by doing.", desc: "Published RCEE workshop records.", cards: [] },
      "Branch Events": { icon: "hub", punch: "Your branch. Your people.", desc: "Published RCEE project and branch event records.", cards: [] },
      "Cultural Events": { icon: "celebration", punch: "Make memories beyond the classroom.", desc: "Published RCEE cultural event records.", cards: [] },
      "Outdoors": { icon: "park", punch: "Find fresh air between classes.", desc: "No published RCEE outdoor event records are in the current source set.", cards: [] },
    };
    const eventGroup = { Hackathon: "Hackathons", Workshop: "Workshops", "Project expo": "Branch Events", Cultural: "Cultural Events" };
    events.forEach((event) => {
      const group = categories[eventGroup[event.category]];
      group.cards.push([event.category.toUpperCase(), event.title, event.description, "View details", event.image, event.dateStart || "", event.slug]);
    });
    window.__COLLEXUS_CATEGORY_DATA__ = categories;
    ["studentEventSelect", "outerEventSelect"].forEach((id) => {
      const select = document.getElementById(id);
      if (!select) return;
      select.replaceChildren(...events.map((event) => {
        const option = document.createElement("option");
        option.value = event.title; option.textContent = event.title;
        if (event.dateStart) option.dataset.date = event.dateStart;
        return option;
      }));
    });
    (() => {
      
       const input=document.getElementById('globalSearch'), panel=document.getElementById('searchSuggestions'), clearSearchButton=document.getElementById('clearGlobalSearch');
       const shortcutModifier=document.getElementById('searchShortcutModifier');
       if(shortcutModifier)shortcutModifier.textContent=/Mac|iPhone|iPad/.test(navigator.platform)?'⌘':'Ctrl';
       const searchButtons=[...document.querySelectorAll('[data-search]')];
       function focusSearch(value){ if(!input)return; input.value=value; input.dispatchEvent(new Event('input',{bubbles:true})); if(panel)panel.classList.add('hidden'); input.setAttribute('aria-expanded','false'); window.openCollexusCategory?.(value); }
       searchButtons.forEach(b=>b.addEventListener('click',()=>focusSearch(b.dataset.search)));
       if(input&&panel){
        function updateSearchSuggestions(){
         const q=normalizeSearchValue(input.value);
         const categorySuggestions=[...panel.querySelectorAll('button[data-search]')];
         const eventSuggestions=[...panel.querySelectorAll('[data-event-search-result]')];
         let categoryCount=0,eventCount=0;
         categorySuggestions.forEach(button=>{const matches=!q||normalizeSearchValue(button.dataset.search||'').includes(q);button.style.display=matches?'grid':'none';if(matches)categoryCount++});
         eventSuggestions.forEach(link=>{const matches=!!q&&normalizeSearchValue(link.dataset.eventSearchKey||'').includes(q);link.style.display=matches?'grid':'none';if(matches)eventCount++});
         const eventGroup=document.getElementById('eventSearchResultGroup');
         const emptyMessage=document.getElementById('searchSuggestionsEmpty');
         if(eventGroup)eventGroup.hidden=!q||eventCount===0;
         if(emptyMessage)emptyMessage.hidden=!q||categoryCount+eventCount>0;
         panel.classList.remove('hidden');
         input.setAttribute('aria-expanded','true');
         if(clearSearchButton)clearSearchButton.hidden=!input.value;
        }
        const closeSuggestions=()=>{panel.classList.add('hidden');input.setAttribute('aria-expanded','false')};
        input.addEventListener('focus',updateSearchSuggestions);
        input.addEventListener('input',updateSearchSuggestions);
        clearSearchButton?.addEventListener('click',()=>{
          input.value='';
          if(document.body.classList.contains('category-mode')) window.closeCollexusCategory?.();
          input.dispatchEvent(new Event('input',{bubbles:true}));
          input.focus({preventScroll:true});
        });
        document.addEventListener('click',e=>{if(!input.parentElement.contains(e.target))closeSuggestions()});
        document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();input.focus()}if(e.key==='Escape')closeSuggestions()});
       }
       // Scroll-word-reveal inspired section reveal.
       const reveal=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('revealed');reveal.unobserve(e.target)}}),{threshold:.15});
       document.querySelectorAll('.scroll-reveal').forEach(el=>reveal.observe(el));
       // Animated stat numbers.
       document.querySelectorAll('[data-count], .stat-number:not(#enrolledCount)').forEach(el=>{const raw=el.textContent.match(/[\d,.]+/);if(!raw)return;const target=parseFloat(raw[0].replace(/,/g,'')); if(!isFinite(target))return; const suffix=el.textContent.slice(raw.index+raw[0].length); let done=false; const io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting&&!done){done=true;let t=0;const start=performance.now();const tick=now=>{t=Math.min(1,(now-start)/900);const eased=1-Math.pow(1-t,3);el.textContent=Math.round(target*eased).toLocaleString()+suffix;if(t<1)requestAnimationFrame(tick)};requestAnimationFrame(tick);io.disconnect()}}));io.observe(el)});
       // Coverflow carousel.
       const cards=[...document.querySelectorAll('.cover-card')], dots=document.getElementById('coverDots'); let active=0;
       function render(){cards.forEach((c,i)=>{c.classList.remove('is-active','prev','next','far');if(i===active)c.classList.add('is-active');else if(i===(active-1+cards.length)%cards.length)c.classList.add('prev');else if(i===(active+1)%cards.length)c.classList.add('next');else c.classList.add('far')});if(dots){dots.innerHTML='';cards.forEach((_,i)=>{const d=document.createElement('span');d.className='cover-dot'+(i===active?' active':'');d.onclick=()=>{active=i;render()};dots.appendChild(d)})}}
       document.getElementById('coverPrev')?.addEventListener('click',()=>{active=(active-1+cards.length)%cards.length;render()});document.getElementById('coverNext')?.addEventListener('click',()=>{active=(active+1)%cards.length;render()});render();setInterval(()=>{active=(active+1)%cards.length;render()},6000);
       
    })();
    (() => {
      
            // 1. Tab filtering for events
            const filterTabs = document.querySelectorAll('.event-filter-tab');
            const eventItems = document.querySelectorAll('.event-item');
      
            filterTabs.forEach(tab => {
              tab.addEventListener('click', () => {
                filterTabs.forEach(t => {
                  t.classList.remove('bg-primary', 'text-on-primary');
                  t.classList.add('text-on-surface-variant');
                });
                tab.classList.remove('text-on-surface-variant');
                tab.classList.add('bg-primary', 'text-on-primary');
      
                const category = tab.getAttribute('data-category');
                eventItems.forEach(item => {
                  if (category === 'all' || item.getAttribute('data-category') === category) {
                    item.style.display = 'flex';
                  } else {
                    item.style.display = 'none';
                  }
                });
              });
            });
      
            // 2. Day selector for weekend timetable
            const dayTabs = document.querySelectorAll('.day-tab');
            const panes = document.querySelectorAll('.timetable-pane');
      
            dayTabs.forEach(tab => {
              tab.addEventListener('click', () => {
                dayTabs.forEach(t => {
                  t.classList.remove('bg-primary', 'text-on-primary');
                  t.classList.add('text-on-surface-variant');
                });
                tab.classList.remove('text-on-surface-variant');
                tab.classList.add('bg-primary', 'text-on-primary');
      
                const targetDay = tab.getAttribute('data-day');
                panes.forEach(pane => {
                  if (pane.id === `schedule-${targetDay}`) {
                    pane.classList.remove('hidden');
                  } else {
                    pane.classList.add('hidden');
                  }
                });
              });
            });
      
    })();
    (() => {
      
       const categoryData=window.__COLLEXUS_CATEGORY_DATA__;
       const views=document.getElementById('categoryViews'), title=document.getElementById('categoryTitle'), punchline=document.getElementById('categoryPunchline'), desc=document.getElementById('categoryDescription'), eyebrow=document.getElementById('categoryEyebrow'), cards=document.getElementById('categoryCards');
       let categoryCardIconRoots=[];
       function openCategory(name){
        const key=Object.keys(categoryData).find(k=>k.toLowerCase()===String(name).toLowerCase())||'Hackathons'; const d=categoryData[key];
        eyebrow.textContent=key.toUpperCase(); title.textContent=key; punchline.textContent=d.punch; desc.textContent=d.desc;
        categoryCardIconRoots.forEach(root=>root.unmount());
        cards.innerHTML=d.cards.length ? d.cards.map((c,i)=>`<article class="category-card" style="animation-delay:${i*70}ms"><div class="category-card-media"><img src="${c[4]}" alt="${c[1]} event" loading="lazy"></div><div><div class="category-card-top"><span class="category-card-tag">${c[0]}</span><span class="lucide-icon category-card-icon lucide-mount" data-lucide="${d.icon}"></span></div><h3>${c[1]}</h3><p>${c[2]}</p></div><a class="category-card-action" href="${publicBasePath}/events/${c[6]}/">${c[3]} <span class="lucide-icon lucide-mount" data-lucide="arrow_forward"></span></a></article>`).join('') : `<div class="category-empty-state"><span class="lucide-icon lucide-mount category-empty-icon" data-lucide="${d.icon}"></span><h3>No outdoor events listed yet</h3><p>${d.desc}</p></div>`;
        categoryCardIconRoots=mountLucidePlaceholders(cards);
        document.body.classList.add('category-mode'); views.classList.remove('hidden'); views.scrollIntoView({behavior:'smooth',block:'start'}); history.replaceState(null,'','#'+key.toLowerCase().replace(/\s+/g,'-')); 
       }
       function closeCategory(){document.body.classList.remove('category-mode');views.classList.add('hidden');history.replaceState(null,'','#home');window.scrollTo({top:0,behavior:'smooth'});}
       document.getElementById('categoryBack')?.addEventListener('click',closeCategory);
       window.openCollexusCategory=openCategory;
       window.closeCollexusCategory=closeCategory;
       document.querySelector('.collexus-brand')?.addEventListener('click',e=>{e.preventDefault();closeCategory();});
       document.querySelector('.home-back-top')?.addEventListener('click',e=>{
        e.preventDefault();
        const behavior=window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth';
        history.replaceState(null,'',`${location.pathname}${location.search}#home`);
        window.scrollTo({top:0,behavior});
       });
      
       // V6 registration + passes + live enrolled count + calendar
       const REG_KEY='collexus_registrations_v6';
       function getRegs(){try{return JSON.parse(localStorage.getItem(REG_KEY)||'[]')}catch{return []}}
       function saveRegs(regs){localStorage.setItem(REG_KEY,JSON.stringify(regs));renderCalendar()}
       const passModal=document.getElementById('passModal'), passSuccess=document.getElementById('passSuccess');
       function openPass(type,eventName){passModal?.classList.remove('hidden');passModal?.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';setPassType(type);if(eventName){['studentEventSelect','outerEventSelect'].forEach(id=>{const sel=document.getElementById(id);if(sel && ![...sel.options].some(o=>o.value===eventName)){const o=document.createElement('option');o.value=eventName;o.textContent=eventName;sel.appendChild(o)} if(sel)sel.value=eventName;});}}
       function closePass(){passModal?.classList.add('hidden');passModal?.setAttribute('aria-hidden','true');document.body.style.overflow=''}
       function setPassType(type){passModal?.setAttribute('data-pass-type',type);document.querySelectorAll('[data-pass-tab]').forEach(b=>{const active=b.dataset.passTab===type;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});document.getElementById('studentPassForm')?.classList.toggle('hidden',type!=='student');document.getElementById('outerPassForm')?.classList.toggle('hidden',type!=='outer');passSuccess?.classList.add('hidden')}
       document.querySelectorAll('[data-open-pass]').forEach(b=>b.addEventListener('click',()=>openPass(b.dataset.openPass)));
       document.querySelectorAll('[data-close-pass]').forEach(b=>b.addEventListener('click',closePass));
       document.querySelectorAll('[data-pass-tab]').forEach(b=>b.addEventListener('click',()=>setPassType(b.dataset.passTab)));
       function registerEvent(name,date){
         openPass('student',name); document.getElementById('studentEventSelect').value=name; document.getElementById('outerEventSelect').value=name;
         const studentForm=document.getElementById('studentPassForm'), outerForm=document.getElementById('outerPassForm');
         if(studentForm) studentForm.dataset.eventDate=date||'';
         if(outerForm) outerForm.dataset.eventDate=date||'';
       }
       document.addEventListener('click',e=>{const b=e.target.closest('.register-event');if(b&&!b.hasAttribute('data-next-route')){e.preventDefault();registerEvent(b.dataset.registerEvent,b.dataset.eventDate||'')}});
       function handlePassSubmit(form,type){form.addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(form);const name=fd.get('event');const date=form.dataset.eventDate||undefined||'';const regs=getRegs();if(!regs.some(r=>r.name===name))regs.push({name,date,registeredAt:new Date().toISOString(),passType:type});else {const r=regs.find(r=>r.name===name);r.passType=type}saveRegs(regs);const code=(type==='student'?'STU':'OUT')+'-'+Math.random().toString(36).slice(2,8).toUpperCase();passSuccess.textContent=`Local demo reference • ${name} • ID ${code} (not an event registration)`;passSuccess.classList.remove('hidden');form.reset();renderCalendar();});}
       handlePassSubmit(document.getElementById('studentPassForm'),'student');handlePassSubmit(document.getElementById('outerPassForm'),'outer');
       // Calendar
       const calModal=document.getElementById('calendarModal'), calGrid=document.getElementById('calendarGrid'), calLabel=document.getElementById('calendarMonthLabel');
       function calendarAnchor(){const today=new Date(),todayIso=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`,todayKey=`${todayIso}-${String(today.getDate()).padStart(2,'0')}`;const dated=events.filter(event=>event.dateStart).map(event=>event.dateStart).sort();const focus=dated.some(date=>date.startsWith(todayIso))?today:dated.find(date=>date>=todayKey)||dated.at(-1);const anchor=focus?new Date(`${focus.slice(0,7)}-01T12:00:00`):today;anchor.setDate(1);return anchor}
       let calCursor=calendarAnchor();
       let calendarIconRoots=[];
       function renderCalendar(){if(!calGrid)return;calendarIconRoots.forEach(root=>root.unmount());const regs=getRegs();const y=calCursor.getFullYear(),m=calCursor.getMonth();calLabel.textContent=new Intl.DateTimeFormat('en',{month:'long',year:'numeric'}).format(calCursor);calGrid.innerHTML='';
        // Highlight every event date currently displayed on the website, even before registration.
        const publicByDate={};
        events.forEach(event=>{
          if(!event.dateStart)return;
          const rangeStart=new Date(`${event.dateStart}T12:00:00`);
          const rangeEnd=new Date(`${event.dateEnd||event.dateStart}T12:00:00`);
          for(const cursor=new Date(rangeStart);cursor<=rangeEnd;cursor.setDate(cursor.getDate()+1)){
            const iso=`${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,'0')}-${String(cursor.getDate()).padStart(2,'0')}`;
            (publicByDate[iso]??=[]).push({name:event.title,slug:event.slug});
          }
        });
        const first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate(),prevDays=new Date(y,m,0).getDate();
        for(let i=0;i<first;i++){const d=document.createElement('div');d.className='calendar-day muted';d.innerHTML=`<span class="day-num">${prevDays-first+i+1}</span>`;calGrid.appendChild(d)}
        const today=new Date();const todayIso=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
        for(let day=1;day<=days;day++){const iso=`${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;const matches=regs.filter(r=>r.date===iso);const publicEvents=[...new Map((publicByDate[iso]||[]).map(event=>[event.slug,event])).values()];const hasEvent=publicEvents.length>0;const d=document.createElement('div');d.className='calendar-day'+(hasEvent?' event-day':'')+(matches.length?' registered':'')+(iso===todayIso?' today':'');
          const unregisteredEvents=publicEvents.filter(event=>!matches.some(r=>r.name===event.name));
          const publicLabels=unregisteredEvents.slice(0,2).map(event=>`<a class="event-dot public-dot" href="${publicBasePath}/events/${event.slug}/" title="Open ${event.name}">• ${event.name}</a>`).join('');
          const moreEvents=unregisteredEvents.length>2?`<span class="event-dot public-more">+${unregisteredEvents.length-2} more</span>`:'';
          const registeredLabels=matches.map(r=>`<span class="event-dot registered-dot"><span class="lucide-icon lucide-mount" data-lucide="check_circle"></span> ${r.name}</span>`).join('');
          d.innerHTML=`<span class="day-num">${day}</span>${registeredLabels}${publicLabels}${moreEvents}`;calGrid.appendChild(d)}
        const total=first+days;for(let i=total;i<42;i++){const d=document.createElement('div');d.className='calendar-day muted';d.innerHTML=`<span class="day-num">${i-total+1}</span>`;calGrid.appendChild(d)}
        const monthPrefix=`${y}-${String(m+1).padStart(2,'0')}-`;
        calendarIconRoots=mountLucidePlaceholders(calGrid);
        const hasEventThisMonth=Object.keys(publicByDate).some(date=>date.startsWith(monthPrefix))||regs.some(reg=>reg.date?.startsWith(monthPrefix));
        document.getElementById('calendarEmpty')?.classList.toggle('hidden',hasEventThisMonth)}
       document.getElementById('calendarButton')?.addEventListener('click',()=>{calModal.classList.remove('hidden');calModal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';calCursor=calendarAnchor();renderCalendar()});
       document.getElementById('calClose')?.addEventListener('click',()=>{calModal.classList.add('hidden');calModal.setAttribute('aria-hidden','true');document.body.style.overflow=''});document.querySelectorAll('[data-close-calendar]').forEach(b=>b.addEventListener('click',()=>{calModal.classList.add('hidden');calModal.setAttribute('aria-hidden','true');document.body.style.overflow=''}));
       document.getElementById('calPrev')?.addEventListener('click',()=>{calCursor.setMonth(calCursor.getMonth()-1);renderCalendar()});document.getElementById('calNext')?.addEventListener('click',()=>{calCursor.setMonth(calCursor.getMonth()+1);renderCalendar()});
       document.addEventListener('keydown',e=>{if(e.key==='Escape'){closePass();calModal?.classList.add('hidden');calModal?.setAttribute('aria-hidden','true');document.body.style.overflow=''}});
      
       // Make category buttons/card controls open a dedicated category view.
       document.querySelectorAll('[data-search]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openCategory(b.dataset.search)}));
        // Enter opens the first matching event, or the closest category when no event matches.
        const input=document.getElementById('globalSearch'); input?.addEventListener('keydown',e=>{if(e.key==='Enter'){const q=normalizeSearchValue(input.value); if(!q)return; const matchingEventLink=[...document.querySelectorAll('[data-event-search-result]')].find(link=>link.style.display!=='none'&&normalizeSearchValue(link.dataset.eventSearchKey||'').includes(q)); if(matchingEventLink){window.location.assign(matchingEventLink.href);return;} const match=Object.keys(categoryData).find(k=>normalizeSearchValue(k).includes(q)||q.includes(normalizeSearchValue(k))); if(match){document.getElementById('searchSuggestions')?.classList.add('hidden');input.setAttribute('aria-expanded','false');openCategory(match)}}});
       // Login chooser.
       const modal=document.getElementById('loginModal'), hint=document.getElementById('loginFormHint');
       function closeLogin(){modal.classList.add('hidden');modal.setAttribute('aria-hidden','true');document.body.style.overflow='';}
       document.querySelectorAll('[data-close-login]').forEach(x=>x.addEventListener('click',closeLogin));
       document.addEventListener('keydown',e=>{if(e.key==='Escape')closeLogin()});
       const loginOptions=document.querySelector('.login-options'); const loginBackIcon=document.querySelector('.login-back-icon'); const studentLoginForm=document.getElementById('studentLoginForm'); const facultyLoginForm=document.getElementById('facultyLoginForm'); const eventRegistrationPanel=document.getElementById('eventRegistrationPanel'); const hostEventPanel=document.getElementById('hostEventPanel');
       function showLoginForm(type){ loginOptions?.classList.add('hidden'); loginBackIcon?.classList.remove('hidden'); studentLoginForm?.classList.toggle('active',type==='student'); facultyLoginForm?.classList.toggle('active',type==='faculty'); eventRegistrationPanel?.classList.toggle('hidden',type!=='event-register'); hostEventPanel?.classList.toggle('hidden',type!=='host-event'); hint?.classList.add('hidden'); }
       function showLoginOptions(){ loginOptions?.classList.remove('hidden'); loginBackIcon?.classList.add('hidden'); studentLoginForm?.classList.remove('active'); facultyLoginForm?.classList.remove('active'); eventRegistrationPanel?.classList.add('hidden'); hostEventPanel?.classList.add('hidden'); hint?.classList.add('hidden'); }
       document.querySelectorAll('[data-login-type]').forEach(btn=>btn.addEventListener('click',()=>showLoginForm(btn.dataset.loginType)));
       document.querySelectorAll('[data-login-back]').forEach(btn=>btn.addEventListener('click',showLoginOptions));
       document.querySelectorAll('[data-event-register-back]').forEach(btn=>btn.addEventListener('click',showLoginOptions));
       const showAuthUnavailable=(e: Event)=>{e.preventDefault();if(hint){hint.textContent='Sign-in is unavailable in this static demo. Your credentials were not sent.';hint.classList.remove('hidden');}};
       studentLoginForm?.addEventListener('submit',showAuthUnavailable);
       facultyLoginForm?.addEventListener('submit',showAuthUnavailable);
       // Digital pass actions
       // Category page navigation starts at the top and keeps every section one-click away.
       document.querySelectorAll('[data-category-nav]').forEach(btn=>btn.addEventListener('click',()=>openCategory(btn.dataset.categoryNav)));
       document.getElementById('categoryPassesNav')?.addEventListener('click',()=>document.getElementById('digitalPasses')?.scrollIntoView({behavior:'smooth',block:'start'}));
       // Event registration form inside the login panel.
       const loginEventSelect=document.getElementById('loginEventSelect');
       if(loginEventSelect){ Object.values(categoryData).forEach(group=>group.cards.forEach(c=>{ if(![...loginEventSelect.options].some(o=>o.value===c[1])){const o=document.createElement('option');o.value=c[1];o.textContent=c[1];o.dataset.date=c[5] || '';loginEventSelect.appendChild(o);} })); }
       document.getElementById('eventRegistrationForm')?.addEventListener('submit',e=>{
         e.preventDefault(); const fd=new FormData(e.currentTarget); const opt=loginEventSelect?.selectedOptions?.[0]; const name=fd.get('event'); const date=opt?.dataset.date||''; const regs=getRegs();
         if(!regs.some(r=>r.name===name)){regs.push({name,date,registeredAt:new Date().toISOString(),passType:fd.get('passType'),registrant:fd.get('name'),email:fd.get('email')});} else {const r=regs.find(r=>r.name===name);r.passType=fd.get('passType');r.registrant=fd.get('name');r.email=fd.get('email');}
         saveRegs(regs); hint.textContent=`Registration successful for ${name}. Your event date is highlighted in Calendar.`; hint.classList.remove('hidden'); e.currentTarget.reset(); renderCalendar();
       });
      
      
        // Menu Drawer Handlers & Tab Switching
        const menuDrawer = document.getElementById('campusMenuDrawer');
        const mainMenuBtn = document.getElementById('mainMenuBtn');
        const menuFilterBadge = document.getElementById('menuFilterBadge');
        const menuTabFilterBadge = document.getElementById('filterActiveCount');
        const menuContentFilters = document.getElementById('menuContentFilters');
      
        function openMenu() {
          menuContentFilters?.classList.remove('hidden');
          menuDrawer?.classList.remove('hidden');
          menuDrawer?.setAttribute('aria-hidden', 'false');
          mainMenuBtn?.classList.add('is-active');
          document.body.style.overflow = 'hidden';
        }
      
        function closeMenu() {
          menuDrawer?.classList.add('hidden');
          menuDrawer?.setAttribute('aria-hidden', 'true');
          mainMenuBtn?.classList.remove('is-active');
          document.body.style.overflow = '';
        }
      
        mainMenuBtn?.addEventListener('click', () => {
          if (menuDrawer?.classList.contains('hidden')) openMenu();
          else closeMenu();
        });
        document.querySelectorAll('[data-close-menu]').forEach(b => b.addEventListener('click', closeMenu));
        document.querySelectorAll('[data-menu-close]').forEach(b => b.addEventListener('click', closeMenu));
      
        // Menu action links & Navigation
        document.querySelectorAll('[data-menu-action]').forEach(b => {
          b.addEventListener('click', e => {
            const act = b.dataset.menuAction;
            closeMenu();
            if (act === 'home') {
              e.preventDefault();
              closeCategory();
            } else if (act === 'featured') {
              e.preventDefault();
              closeCategory();
              setTimeout(() => document.getElementById('featured-events')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
            } else if (act === 'passes') {
              e.preventDefault();
              closeCategory();
              setTimeout(() => document.getElementById('digitalPasses')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
            } else if (act === 'calendar') {
              e.preventDefault();
              document.getElementById('calendarButton')?.click();
            } else if (act === 'student-pass') {
              e.preventDefault();
              openPass('student');
            } else if (act === 'outer-pass') {
              e.preventDefault();
              openPass('outer');
            } else if (act === 'login') {
              e.preventDefault();
              loginBtn?.click();
            }
          });
        });
      
        // Menu Internal Quick Search Filter
        const menuSearchInput = document.getElementById('menuSearchInput');
        menuSearchInput?.addEventListener('input', e => {
          const query = e.target.value.trim().toLowerCase();
          const bentoCards = document.querySelectorAll('.menu-bento-card');
          bentoCards.forEach(card => {
            const text = card.textContent.toLowerCase();
            card.style.display = text.includes(query) ? '' : 'none';
          });
        });
      
        // Start every fresh visit in day mode and keep the selection during client navigation.
        const themeToggleBtn = document.getElementById('themeToggleBtn');
        const themeToggleLabel = document.getElementById('themeToggleLabel');
        const setDisplayTheme = (theme) => {
          const isLight = theme === 'light';
          document.documentElement.dataset.collexusTheme = isLight ? 'light' : 'dark';
          document.body.classList.remove('dark-green-theme');
          themeToggleBtn?.setAttribute('aria-checked', String(isLight));
          themeToggleBtn?.setAttribute('aria-label', `${isLight ? 'Day' : 'Dark'} theme is on`);
          if (themeToggleLabel) themeToggleLabel.textContent = isLight ? 'Day' : 'Dark';
          const themeIcon = themeToggleBtn?.querySelector('.theme-toggle-thumb .lucide-icon');
          if (themeIcon) themeIcon.dataset.iconName = isLight ? 'light_mode' : 'dark_mode';
        };

        themeToggleBtn?.addEventListener('click', () => {
          const isLight = document.documentElement.dataset.collexusTheme === 'light';
          setDisplayTheme(isLight ? 'dark' : 'light');
        });

        setDisplayTheme(document.documentElement.dataset.collexusTheme === 'dark' ? 'dark' : 'light');
      
        // Integrated Event Filtering Engine
        const sectionFilterBtn = document.getElementById('sectionFilterBtn');
        const filterCountLabel = document.getElementById('filterCountLabel');
        const noFilteredEvents = document.getElementById('noFilteredEvents');
         const globalSearchInput = document.getElementById('globalSearch');
         const eventResultsStatus = document.getElementById('eventResultsStatus');
         const noResultsHint = document.getElementById('noFilteredEventsHint');
      
        const activeFilters = {
          audience: 'all',
          pricing: 'all',
          category: 'all',
          branch: 'all'
        };
         let searchQuery = normalizeSearchValue(globalSearchInput?.value || '');
      
        // Both menu entry points open directly to the event filters.
        sectionFilterBtn?.addEventListener('click', () => {
          openMenu();
        });
      
        // Filter chips selection
        document.querySelectorAll('[data-filter-group]').forEach(group => {
          const groupName = group.dataset.filterGroup;
          group.querySelectorAll('.filter-chip, .menu-filter-chip').forEach(chip => {
            chip.setAttribute('aria-pressed', chip.classList.contains('active') ? 'true' : 'false');
            chip.addEventListener('click', () => {
              group.querySelectorAll('.filter-chip, .menu-filter-chip').forEach(c => { c.classList.remove('active'); c.setAttribute('aria-pressed', 'false'); });
              chip.classList.add('active');
              chip.setAttribute('aria-pressed', 'true');
              activeFilters[groupName] = chip.dataset.filterVal || 'all';
              updateFilterPreview();
            });
          });
        });

        function matchesSelectedFilters(card) {
          const audience = (card.dataset.audience || '').toLowerCase().split(/\s+/);
          const pricing = (card.dataset.pricing || 'unknown').toLowerCase();
          const minimumFee = Number(card.dataset.minFee);
          const hasMinimumFee = card.dataset.minFee !== undefined && card.dataset.minFee !== '' && Number.isFinite(minimumFee);
          const category = (card.dataset.category || '').toLowerCase();
          const specialEvent = card.dataset.specialEvent === 'true';
          const branch = (card.dataset.branch || '').toLowerCase();
          const tracks = (card.dataset.tracks || '').toLowerCase().split('|');
           const searchableText = normalizeSearchValue(card.dataset.searchText || '');
          const matchesPricing = activeFilters.pricing === 'all' ||
            pricing === activeFilters.pricing ||
            (activeFilters.pricing === 'under-250' && hasMinimumFee && minimumFee < 250) ||
            (activeFilters.pricing === 'under-500' && hasMinimumFee && minimumFee < 500);
          return (activeFilters.audience === 'all' || audience.includes(activeFilters.audience)) &&
            matchesPricing &&
             (activeFilters.category === 'all' || (activeFilters.category === 'special' && specialEvent) || category.includes(activeFilters.category) || activeFilters.category.includes(category)) &&
             (activeFilters.branch === 'all' || branch === activeFilters.branch || tracks.includes(activeFilters.branch)) &&
             (!searchQuery || searchableText.includes(searchQuery));
        }

        function updateFilterPreview() {
          const count = [...document.querySelectorAll('#eventsGrid .event-item')].filter(matchesSelectedFilters).length;
          const preview = document.getElementById('filterPreviewCount');
          if (preview) preview.textContent = `${count} ${count === 1 ? 'event' : 'events'}`;
        }
        const eventGrid = document.getElementById('eventsGrid');
        const eventRowsButton = document.getElementById('toggleEventRows');
        function setEventListExpanded(expanded) {
          if (!eventGrid || !eventRowsButton) return;
          eventGrid.classList.toggle('expanded', expanded);
          eventRowsButton.setAttribute('aria-expanded', expanded ? 'true' : 'false');
          const label = eventRowsButton.querySelector('span');
          const icon = eventRowsButton.querySelector('.lucide-icon');
          if (label) label.textContent = expanded ? 'Show fewer events' : `Show all ${eventGrid.querySelectorAll('.event-item').length} events`;
          if (icon) icon.dataset.iconName = expanded ? 'expand_less' : 'expand_more';
        }
        eventRowsButton?.addEventListener('click', () => setEventListExpanded(!eventGrid?.classList.contains('expanded')));
        updateFilterPreview();
      
        function applyActiveFilters(options = {}) {
          const closeDrawer = options.closeDrawer !== false;
          const scrollToResults = options.scrollToResults !== false;
          const eventCards = document.querySelectorAll('#eventsGrid .event-item');
          // Reveal the complete set whenever a filter is applied so matching records are never hidden below the collapsed rows.
          setEventListExpanded(true);
          let visibleCount = 0;
          const activeEntries = Object.entries(activeFilters).filter(([_, val]) => val !== 'all');
          if (filterCountLabel) {
            filterCountLabel.textContent = activeEntries.length ? `${activeEntries.length} ${activeEntries.length === 1 ? 'filter' : 'filters'}` : '';
            filterCountLabel.classList.toggle('hidden', activeEntries.length === 0);
            sectionFilterBtn?.setAttribute('aria-label', activeEntries.length ? `Open event filters, ${activeEntries.length} active` : 'Open event filters');
          }
      
          eventCards.forEach(card => {
            if (matchesSelectedFilters(card)) {
              card.style.display = '';
              visibleCount++;
            } else {
              card.style.display = 'none';
            }
          });
      
          // Keep the header count and the filter panel summary in sync.
          if (activeEntries.length > 0) {
            if (menuFilterBadge) {
              menuFilterBadge.textContent = String(activeEntries.length);
              menuFilterBadge.classList.remove('hidden');
            }
            if (menuTabFilterBadge) {
              menuTabFilterBadge.textContent = `${activeEntries.length} Active`;
              menuTabFilterBadge.classList.remove('hidden');
            }
            mainMenuBtn?.classList.add('is-active');
          } else {
            if (menuFilterBadge) {
              menuFilterBadge.textContent = '0';
              menuFilterBadge.classList.add('hidden');
            }
            if (menuTabFilterBadge) {
              menuTabFilterBadge.textContent = '0 Active';
              menuTabFilterBadge.classList.add('hidden');
            }
            mainMenuBtn?.classList.remove('is-active');
          }
      
          // Show/hide empty state
          if (noFilteredEvents) {
            noFilteredEvents.classList.toggle('hidden', visibleCount > 0);
          }
          const searchTerm = globalSearchInput?.value.trim() || '';
          if (eventResultsStatus) {
            eventResultsStatus.textContent = searchTerm
              ? `${visibleCount} ${visibleCount === 1 ? 'event matches' : 'events match'} “${searchTerm}”.`
              : activeEntries.length
                ? `Showing ${visibleCount} of ${eventCards.length} published event records.`
                : `Showing all ${eventCards.length} published event records.`;
          }
          if (noResultsHint) {
            noResultsHint.textContent = searchTerm
              ? `No published listings match “${searchTerm}”. Try a title, track, organizer, venue, or date.`
              : 'Try a broader search or clear the filters to see the full schedule.';
          }
          updateFilterPreview();
      
          if (closeDrawer) {
            closeMenu();
            if (document.body.classList.contains('category-mode')) {
              closeCategory();
            }
          }
          if (scrollToResults) {
            setTimeout(() => {
              document.getElementById('featured-events')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          }
        }

        globalSearchInput?.addEventListener('input', () => {
          searchQuery = normalizeSearchValue(globalSearchInput.value);
          applyActiveFilters({ closeDrawer: false, scrollToResults: false });
        });
      
        function resetAllFilters() {
          Object.keys(activeFilters).forEach(k => activeFilters[k] = 'all');
          if (globalSearchInput) {
            globalSearchInput.value = '';
            globalSearchInput.dispatchEvent(new Event('input', { bubbles: true }));
            globalSearchInput.setAttribute('aria-expanded', 'false');
          }
          document.getElementById('searchSuggestions')?.classList.add('hidden');
          searchQuery = '';
          document.querySelectorAll('[data-filter-group]').forEach(group => {
            group.querySelectorAll('.filter-chip, .menu-filter-chip').forEach(c => {
              c.classList.toggle('active', c.dataset.filterVal === 'all');
              c.setAttribute('aria-pressed', c.dataset.filterVal === 'all' ? 'true' : 'false');
            });
          });
          applyActiveFilters();
        }
      
        document.getElementById('applyFiltersBtn')?.addEventListener('click', applyActiveFilters);
        document.getElementById('resetFiltersBtn')?.addEventListener('click', resetAllFilters);
        document.getElementById('resetFromEmptyBtn')?.addEventListener('click', resetAllFilters);
      
        // Global ESC key handler
        document.addEventListener('keydown', e => {
          if (e.key === 'Escape') {
            closeMenu();
            closePass();
            closeLogin();
            calModal?.classList.add('hidden');
            calModal?.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
          }
        });
      
       // If a category hash is opened directly, show that category.
       const initial=decodeURIComponent(location.hash.slice(1)); const match=Object.keys(categoryData).find(k=>k.toLowerCase().replace(/\s+/g,'-')===initial.toLowerCase()); if(match)openCategory(match);
      
    })();
  }, []);
  return null;
}
