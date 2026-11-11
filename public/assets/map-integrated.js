
    (() => {
      'use strict';
      const $ = (selector) => document.querySelector(selector);
      const icon = (name) => {
        const shapes = {
          flat:'<rect x="5" y="3.5" width="14" height="17" rx="1.5"/><path d="M9 7.5h1m4 0h1M9 11h1m4 0h1M9 14.5h1m4 0h1M11 20.5v-3h2v3"/>',
          house:'<path d="m3 10 9-7 9 7v10H3V10Z"/><path d="M9 20v-7h6v7M3 10h18"/>',
          plot:'<path d="m4 7 11-4 5 4v11l-11 3-5-4V7Z"/><path d="M4 7 9 11l11-4M9 11v10" stroke-dasharray="2 2"/>',
          bed:'<path d="M3 11V5M3 11v9M21 20v-9M3 15h18M6 15V8h12a3 3 0 0 1 3 3v4"/>',
          bath:'<path d="M4 13h16v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-3ZM4 13V6a3 3 0 0 1 6 0M8 7h5"/>',
          area:'<path d="M4 4h16v16H4zM4 10V4h6m4 16h6v-6M4 20l16-16"/>',
          pin:'<path d="M20 10c0 5.5-8 12-8 12S4 15.5 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>'
        };
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shapes[name] || shapes.pin}</svg>`;
      };
      // Listings are read from the agency database. Plot coordinates below are
      // DETERMINISTIC ILLUSTRATIONS, NOT real GPS or title/parcel boundaries.
      let properties = [];
      const areaBand = {'Dubai Marina':0,'JBR':1,'Business Bay':2};
      const mapLocation = (p) => {
        const band = areaBand[p.area] ?? 0;
        const n = Number(p.id) || 1;
        // 5 columns x 4 rows per demo district keeps pins individually tappable.
        const position = Math.floor((n-1)/3);
        const col = position % 5, row = Math.floor(position / 5) % 4;
        const layer = Math.floor(position / 20);
        return {
          x: [338,723,1094][band] + col*61 + ((n*7)%9) + layer*8,
          y: 173 + row*181 + ((n*11)%15) + layer*8
        };
      };
      const toMapProperty = (p,index) => {
        const {x,y} = mapLocation(p);
        const type = p.type==='Plot'?'plot':(['Villa','Townhouse'].includes(p.type)?'house':'flat');
        return {id:String(p.id),ref:p.ref,title:p.title,area:p.area,type,
          actualType:p.type,purpose:p.purpose==='buy'?'sale':'rent',beds:p.bedrooms,
          baths:p.bathrooms,sqft:p.size_sqft,price:p.price_aed,x,y,
          description:p.description,amenities:Array.isArray(p.amenities)?p.amenities:[],
          photo:p.photos?.[0]||'', agent:p.agent_name,agentPhone:p.agent_phone||'',
          slug:p.slug,href:`/${p.purpose}/${p.area.toLowerCase().replaceAll(' ','-')}/${encodeURIComponent(p.slug)}`,
          variation:index%5};
      };
      const state = {type:'all',purpose:'all',search:'',savedOnly:false,selected:null,saved:loadSaved(),scale:1,x:0,y:0};
      const viewport = $('#mapViewport'); const world = $('#mapWorld'); const layer = $('#pinsLayer');
      const formatNumber = (number) => new Intl.NumberFormat('en-AE').format(number);
      const priceLabel = (p) => `AED ${formatNumber(p.price)}`;
      function loadSaved(){try{return new Set(JSON.parse(localStorage.getItem('mg-map-saved-v1')||'[]').filter(x=>typeof x==='string'));}catch{return new Set();}}
      function persistSaved(){try{localStorage.setItem('mg-map-saved-v1',JSON.stringify([...state.saved]));}catch{} }
      const safe = (str)=>String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
      // Completely local SVG art to keep the single HTML file working offline.
      function illustration(p) {
        const n=p.variation; const id=`${p.id}-art`; const sky=['#d3e2df','#d9e3da','#d2ddd9','#d4e5e6','#e7dfd2'][n], sun=['#fce8b8','#f9e9cb','#f9e2bb','#f0e9d1','#f4ddbd'][n];
        let architecture='';
        if(p.type==='flat'){
          architecture=`<path d="M0 320Q250 288 680 320V420H0Z" fill="#7db7ae" opacity=".38"/><rect x="170" y="112" width="210" height="275" fill="#faf6ea"/><rect x="194" y="91" width="180" height="296" fill="#cfdbd5"/><rect x="388" y="163" width="136" height="224" fill="#c3d8d4"/><rect x="388" y="157" width="136" height="11" fill="#7ea89f"/><rect x="190" y="91" width="9" height="296" fill="#a6bfb2"/>`;
          for(let a=0;a<5;a++)for(let b=0;b<4;b++)architecture+=`<rect x="${211+b*39}" y="${115+a*48}" width="25" height="33" rx="2" fill="${(a+b+n)%3===0?'#8faead':'#648e96'}" opacity=".85"/>`;
          for(let a=0;a<4;a++)for(let b=0;b<3;b++)architecture+=`<rect x="${403+b*39}" y="${182+a*45}" width="25" height="29" fill="#7ca5a6"/>`;
          architecture+=`<path d="M0 370Q340 353 680 369V420H0Z" fill="#69aab4" opacity=".54"/><path d="M0 391Q340 375 680 394" fill="none" stroke="#c2e3dc" stroke-width="3"/>`;
        }else if(p.type==='house'){
          architecture=`<path d="M0 340 Q290 310 680 335V420H0Z" fill="#a6b8a0"/><rect x="130" y="172" width="433" height="183" rx="2" fill="#e7decf"/><rect x="175" y="135" width="330" height="221" fill="#f3e7d6"/><rect x="163" y="126" width="348" height="15" rx="2" fill="#c5c6b2"/><rect x="202" y="157" width="92" height="116" fill="#7ca5a1"/><rect x="313" y="157" width="72" height="115" fill="#6f9998"/><rect x="400" y="155" width="80" height="117" fill="#86aca5"/><path d="M192 277h304v7H192z" fill="#c6bbad"/><rect x="315" y="287" width="82" height="69" fill="#b3bdae"/><rect x="414" y="291" width="65" height="65" fill="#8ba49a"/><path d="M0 356h680v64H0z" fill="#ddc4a6"/><path d="M0 391 C230 377 440 402 680 378V420H0Z" fill="#9eb3a0"/>`;
          architecture+=`<path d="M98 347V193M100 251c-62-24-40-86-8-87 41-7 49 52 8 87M88 202c-57-18-46-68-9-71 45-4 55 37 9 71" stroke="#628b71" stroke-width="14" fill="none" stroke-linecap="round"/><path d="M567 351V224M564 269c-61-20-50-79-11-81 50-4 58 53 11 81" fill="none" stroke="#72947c" stroke-width="18" stroke-linecap="round"/>`;
        }else{
          architecture=`<path d="M0 238 680 203V420H0Z" fill="#bdcba4"/><path d="M0 330 680 282V420H0Z" fill="#a3b997"/><path d="M0 395 680 354" stroke="#f7e9cd" stroke-width="47"/><path d="M115 345 302 224 552 276 375 389Z" fill="#d8c8a4" stroke="#f9f2e3" stroke-width="7"/><path d="m115 345 187-121 250 52-177 113Z" fill="#d7cbac" stroke="#648f7d" stroke-width="5" stroke-dasharray="12 9"/><path d="M303 224v165M115 345l437-69" fill="none" stroke="#a0b49f" stroke-width="2" stroke-dasharray="8 7"/><path d="M82 221v136M594 246v112" stroke="#6b9077" stroke-width="7"/><circle cx="82" cy="207" r="42" fill="#7d9e75"/><circle cx="592" cy="222" r="50" fill="#7d9e75"/><circle cx="617" cy="247" r="27" fill="#8cb486"/>`;
        }
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 420" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Illustrative artwork of a ${p.type === 'flat' ? 'modern apartment' : p.type === 'house' ? 'modern house' : 'land plot'}"><defs><linearGradient id="sky-${id}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${sky}"/><stop offset="1" stop-color="#f2eee0"/></linearGradient></defs><rect width="680" height="420" fill="url(#sky-${id})"/><circle cx="${505-n*32}" cy="${85+n*8}" r="59" fill="${sun}" opacity=".73"/><path d="M0 283Q150 249 301 281T680 260" fill="none" stroke="#ffffff" stroke-width="3" opacity=".23"/>${architecture}</svg>`;
      }
      function seedMapDecoration(){
        let seed=42; const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
        let blocks='';for(let row=0;row<19;row++)for(let col=0;col<33;col++){
          const x=col*49+304+rand()*12, y=row*50+rand()*12-5; if(x>1008&&x<1223)continue;
          if(rand()<.23)continue;
          const w=18+rand()*19,h=17+rand()*17;
          blocks+=`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="2" fill="${rand()>.54?'#dedfce':'#e9e3d6'}" opacity=".82"/>`;
        }
        $('#buildingBlocks').innerHTML=blocks;
        let park='', roads='';
        const parks=[[358,410,79,46],[563,798,100,50],[722,307,98,50],[892,764,94,45],[1320,300,85,49],[1351,888,65,36]];
        parks.forEach(([x,y,rx,ry],i)=>{park+=`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#cae2b8"/><ellipse cx="${x-9}" cy="${y+7}" rx="${rx*.6}" ry="${ry*.5}" fill="#b7d8aa" opacity=".63"/>`;for(let j=0;j<10;j++){const xx=x+(rand()-.5)*rx*1.6,yy=y+(rand()-.5)*ry*1.2;park+=`<circle cx="${xx.toFixed(1)}" cy="${yy.toFixed(1)}" r="${(3+rand()*4).toFixed(1)}" fill="#8bbf94" opacity=".6"/>`;}});
        for(let i=0;i<18;i++){const x=314+i*62;roads+=`<path d="M${x} 0 Q${x-45+rand()*80} 470 ${x+rand()*80-40} 960" fill="none" stroke="#fdfdf7" stroke-width="7" opacity=".78"/>`}
        $('#parks').innerHTML=park;$('#minorRoads').innerHTML=roads;
      }
      function matching(p){return (state.type==='all'||state.type===p.type)&&(state.purpose==='all'||state.purpose===p.purpose)&&(!state.savedOnly||state.saved.has(p.id))&&(!state.search||`${p.title} ${p.area} ${p.ref} ${p.id} ${p.actualType} ${p.type} ${p.purpose}`.toLowerCase().includes(state.search));}
      function getMatches(){return properties.filter(matching);}
      const filters=[['all','All places','all'],['purpose:sale','For sale','sale'],['purpose:rent','To rent','rent'],['type:flat','Apartments','flat'],['type:house','Houses','house'],['type:plot','Plots','plot']];
      function renderFilters(){const html=filters.map(([key,label])=>{const active=key==='all'?(state.type==='all'&&state.purpose==='all'&&!state.savedOnly):(key.startsWith('type:')?state.type===key.split(':')[1]:state.purpose===key.split(':')[1]);return `<button type="button" class="chip ${active?'active':''}" data-filter="${key}" aria-pressed="${active}">${safe(label)}</button>`;}).join('');$('#desktopFilters').innerHTML=html;$('#mobileFilters').innerHTML=html;$('#savedBtn').setAttribute('aria-pressed',String(state.savedOnly));$('#savedCounter').textContent=`Saved ${state.saved.size}${state.savedOnly?' · Showing':''}`;}
      function buildPins(){layer.innerHTML=properties.map((p)=>`<button type="button" class="pin" style="left:${p.x}px;top:${p.y}px" data-id="${p.id}" aria-label="View ${safe(p.title)}, ${safe(p.area)}, ${safe(priceLabel(p))}"><span class="pin-body">${icon(p.type)}</span><span class="pin-label">${safe(priceLabel(p))}</span></button>`).join('');}
      function buildCard(p){return `<button type="button" class="listing-card ${state.selected===p.id?'active':''}" data-id="${safe(p.id)}" aria-label="Open ${safe(p.title)} details"><span class="card-art">${illustration(p)}</span><span class="listing-main"><span class="list-label">${p.purpose==='rent'?'FOR RENT':'FOR SALE'} · ${p.type==='flat'?'APARTMENT':p.type.toUpperCase()}</span><span class="list-title">${safe(p.title)}</span><span class="list-place">${safe(p.area)} · ${formatNumber(p.sqft)} sqft</span><span class="list-price">${priceLabel(p)}${p.purpose==='rent'?'<small> /year</small>':''}</span></span></button>`;}
      function renderMatches(){const list=getMatches(), ids=new Set(list.map(p=>p.id)); layer.querySelectorAll('.pin').forEach(el=>{el.classList.toggle('hidden',!ids.has(el.dataset.id));el.classList.toggle('active',el.dataset.id===state.selected);el.classList.toggle('saved',state.saved.has(el.dataset.id));});$('#visibleCount').textContent=String(list.length);$('#desktopCount').textContent=`${list.length} ${list.length===1?'place':'places'} available`;$('#listButtonCount').textContent=`View ${list.length} listings`;
        const html=list.length?list.map(buildCard).join(''):'<div class="empty-state"><strong>No properties found</strong>Try another area or clear the filters.</div>';
        $('#desktopResults').innerHTML=html;$('#mobileResults').innerHTML=html;
        if(state.selected&&!ids.has(state.selected))closeDetails();renderFilters();
      }
      function updateMap(animate=false){world.classList.toggle('animate',animate);world.style.transform=`translate(${state.x}px,${state.y}px) scale(${state.scale})`;}
      function minimumScale(){return Math.max(viewport.clientWidth/1440,viewport.clientHeight/960)*.84;}
      function fitMap(){const w=viewport.clientWidth,h=viewport.clientHeight;state.scale=Math.max(w/1440,h/960)*1.055;state.x=(w-1440*state.scale)/2;state.y=(h-960*state.scale)/2;updateMap(true);}
      function constrain(){const w=viewport.clientWidth,h=viewport.clientHeight,cw=1440*state.scale,ch=960*state.scale,margin=100;state.x=Math.min(margin,Math.max(w-cw-margin,state.x));state.y=Math.min(margin,Math.max(h-ch-margin,state.y));}
      function zoomBy(factor,clientX,clientY){const rect=viewport.getBoundingClientRect(),cx=clientX===undefined?rect.width/2:clientX-rect.left,cy=clientY===undefined?rect.height/2:clientY-rect.top;let next=Math.min(2.6,Math.max(minimumScale(),state.scale*factor));const ratio=next/state.scale;state.x=cx-(cx-state.x)*ratio;state.y=cy-(cy-state.y)*ratio;state.scale=next;constrain();updateMap(true);}
      function panTo(p){const w=viewport.clientWidth,h=viewport.clientHeight,mobile=window.innerWidth<=720;const targetX=mobile?w*.49:w*.39,targetY=mobile?h*.37:h*.51;state.x=targetX-p.x*state.scale;state.y=targetY-p.y*state.scale;constrain();updateMap(true);}
      function showDetails(id){const p=properties.find(p=>p.id===id);if(!p)return;state.selected=p.id;$('#detailHero').querySelector(':scope > svg, :scope > img')?.remove();$('#detailHero').insertAdjacentHTML('afterbegin',p.photo?`<img src="${safe(p.photo)}" alt="${safe(p.title)}" loading="lazy" data-fallback="/assets/demo-residence-${String(p.variation+1).padStart(2,'0')}.svg">`:illustration(p));const type=p.type==='flat'?'Apartment':p.type==='house'?'House':'Land plot';$('#detailBody').innerHTML=`<span class="detail-badge">${p.purpose==='sale'?'For sale':'For rent'} · ${type}</span><h3>${safe(p.title)}</h3><div class="detail-place">${icon('pin')} ${safe(p.area)} · Dubai, UAE</div><div class="detail-price">${priceLabel(p)}${p.purpose==='rent'?'<small> / year</small>':''}</div><div class="detail-stats"><div class="detail-stat">${icon('area')}<strong>${formatNumber(p.sqft)}</strong><small>sqft</small></div><div class="detail-stat">${icon('bed')}<strong>${p.type==='plot'?'—':p.beds}</strong><small>bedrooms</small></div><div class="detail-stat">${icon('bath')}<strong>${p.type==='plot'?'—':p.baths}</strong><small>bathrooms</small></div></div><div class="detail-sectiontitle">About this place</div><p class="description">${safe(p.description)}</p><div class="amenities">${p.amenities.map(a=>`<span class="amenity">${safe(a)}</span>`).join('')}</div><div class="agent-mini"><b>YOUR PROPERTY ADVISER</b><span>${safe(p.agent||'Marina Gate adviser')}</span></div><a class="detail-open" href="${safe(p.href)}" target="_top" rel="noopener">View full listing <span>↗</span></a><div class="detail-ref">REFERENCE ${safe(p.ref)} · Illustrative demo data</div>`;
        $('#detailSaveBtn').setAttribute('aria-pressed',String(state.saved.has(p.id)));$('#detailSaveBtn').setAttribute('aria-label',state.saved.has(p.id)?'Remove saved property':'Save property');$('#details .detail-scroll').scrollTop=0;$('#details').classList.add('open');$('#details').setAttribute('aria-hidden','false');$('#mobileListPanel').classList.remove('open');$('#mobileListPanel').setAttribute('aria-hidden','true');document.querySelectorAll('.pin').forEach(el=>el.classList.toggle('active',el.dataset.id===p.id));document.querySelectorAll('.listing-card').forEach(el=>el.classList.toggle('active',el.dataset.id===p.id));panTo(p);}
      function closeDetails(){state.selected=null;$('#details').classList.remove('open');$('#details').setAttribute('aria-hidden','true');layer.querySelectorAll('.pin').forEach(el=>el.classList.remove('active'));document.querySelectorAll('.listing-card').forEach(el=>el.classList.remove('active'));}
      function toggleSave(){const id=state.selected;if(!id)return;if(state.saved.has(id))state.saved.delete(id);else state.saved.add(id);persistSaved();renderMatches();$('#detailSaveBtn').setAttribute('aria-pressed',String(state.saved.has(id)));$('#detailSaveBtn').setAttribute('aria-label',state.saved.has(id)?'Remove saved property':'Save property');toast(state.saved.has(id)?'Added to your saved places':'Removed from saved places');}
      let toastTimer;function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('show');toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2800);}
      function applyFilter(key){if(key==='all'){state.type='all';state.purpose='all';state.savedOnly=false;}else{const [kind,value]=key.split(':');if(kind==='type'){state.type=state.type===value?'all':value;}else{state.purpose=state.purpose===value?'all':value;}state.savedOnly=false;}renderMatches();}
      function setSearch(value){state.search=value.toLowerCase().trim();if($('#searchInput').value!==value)$('#searchInput').value=value;if($('#mobileSearch').value!==value)$('#mobileSearch').value=value;renderMatches();}
      function openModal(kind){
        const p=properties.find(x=>x.id===state.selected);
        if(kind==='contact'&&!p)return;
        $('#modalTitle').textContent=kind==='contact'?'Enquire about this property':'About this property explorer';
        $('#modalContent').innerHTML=kind==='contact'?`<p class="modal-sub">Your enquiry about <strong>${safe(p.title)}</strong> will be recorded against reference ${safe(p.ref)} and assigned to ${safe(p.agent||'the property adviser')}.</p><form id="requestForm"><label class="form-field">Full name<input name="name" required minlength="2" maxlength="120" placeholder="Your name" autocomplete="name"></label><label class="form-field">Email address<input name="email" type="email" required maxlength="180" placeholder="name@example.com" autocomplete="email"></label><label class="form-field">Phone number<input name="phone" type="tel" required minlength="7" maxlength="35" placeholder="+971 50 123 4567" autocomplete="tel"></label><label class="form-field">Message<textarea name="message" required maxlength="1500">I would like to arrange a viewing of ${safe(p.title)} (${safe(p.ref)}).</textarea></label><label class="sr-only" aria-hidden="true">Leave this field blank<input name="website" tabindex="-1" autocomplete="off"></label><p class="demo-note">This demo saves the inquiry securely to the local database. Email is not sent unless the agency configures a verified mail provider.</p><button type="submit" class="primary-btn form-submit">Send enquiry to adviser</button></form>`:`<p class="modal-sub">Explore the agency's live demonstration listings with a custom-drawn interactive map. Filter by property type and purpose, save favourites, and open full property pages.</p><div class="demo-note"><strong>Important:</strong> This is a schematic demonstration, not an official street map or verified plot-boundary survey. Property details are fictional sample data linked to the agency's working database.</div><button type="button" class="primary-btn form-submit" id="gotIt">Explore the map</button>`;
        $('#modalBackdrop').classList.add('open');$('#modalBackdrop').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';$('#modalClose').focus();
      }
      function closeModal(){ $('#modalBackdrop').classList.remove('open');$('#modalBackdrop').setAttribute('aria-hidden','true');document.body.style.overflow='';}
      layer.addEventListener('click',(e)=>{const pin=e.target.closest('.pin');if(pin)showDetails(pin.dataset.id);});
      for(const id of ['desktopResults','mobileResults'])$("#"+id).addEventListener('click',(e)=>{const card=e.target.closest('.listing-card');if(card)showDetails(card.dataset.id);});
      document.addEventListener('click',e=>{const f=e.target.closest('[data-filter]');if(f)applyFilter(f.dataset.filter);});
      $('#searchInput').addEventListener('input',e=>setSearch(e.target.value));$('#mobileSearch').addEventListener('input',e=>setSearch(e.target.value));$('#resetFilters').addEventListener('click',()=>{state.type='all';state.purpose='all';state.savedOnly=false;setSearch('');renderMatches();});$('#savedBtn').addEventListener('click',()=>{state.savedOnly=!state.savedOnly;renderMatches();if(state.savedOnly&&state.saved.size===0)toast('Click a property, then its heart to save it');});
      $('#closeDetails').addEventListener('click',closeDetails);$('#detailSaveBtn').addEventListener('click',toggleSave);$('#requestBtn').addEventListener('click',()=>openModal('contact'));$('#aboutBtn').addEventListener('click',()=>openModal('about'));
      $('#modalClose').addEventListener('click',closeModal);$('#modalBackdrop').addEventListener('click',(e)=>{if(e.target.id==='modalBackdrop')closeModal();});$('#modalContent').addEventListener('click',e=>{if(e.target.id==='gotIt')closeModal();});
      $('#modalContent').addEventListener('submit',async e=>{
        if(e.target.id!=='requestForm')return;
        e.preventDefault();const form=e.target;if(!form.reportValidity())return;
        const p=properties.find(x=>x.id===state.selected);if(!p)return;
        const submit=form.querySelector('[type=submit]');submit.disabled=true;submit.textContent='Sending enquiry…';
        const values=Object.fromEntries(new FormData(form).entries());
        try{
          const response=await fetch('/api/inquiries',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({...values,property_id:Number(p.id)})});
          const result=await response.json();
          if(!response.ok)throw Error(result.error||'Unable to send enquiry.');
          $('#modalContent').innerHTML=`<p class="modal-sub"><strong>Your enquiry has been recorded.</strong> Reference ${safe(result.reference)} is attributed to the listing's assigned adviser.</p><div class="demo-note">${safe(result.notice)} ${result.email_status==='demo_queued'?'Email remains in demo mode until configured.':''}</div><button type="button" class="primary-btn form-submit" id="gotIt">Back to the map</button>`;
        }catch(err){toast(err.message);submit.disabled=false;submit.textContent='Try sending again';}
      });
      $('#openList').addEventListener('click',()=>{$('#mobileListPanel').classList.add('open');$('#mobileListPanel').setAttribute('aria-hidden','false');});$('#closeList').addEventListener('click',()=>{$('#mobileListPanel').classList.remove('open');$('#mobileListPanel').setAttribute('aria-hidden','true');});
      $('#zoomIn').addEventListener('click',()=>zoomBy(1.25));$('#zoomOut').addEventListener('click',()=>zoomBy(.8));$('#resetMap').addEventListener('click',()=>fitMap());
      viewport.addEventListener('wheel',e=>{e.preventDefault();zoomBy(e.deltaY<0?1.12:1/1.12,e.clientX,e.clientY);},{passive:false});
      // Pointer handling supports mouse drag and touch pan. Touch pinch is handled using two pointers.
      const pointers=new Map();let dragStart=null,pinch=null;
      viewport.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;world.classList.remove('animate');viewport.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1){dragStart={px:e.clientX,py:e.clientY,x:state.x,y:state.y};viewport.classList.add('dragging');}else if(pointers.size===2){const a=[...pointers.values()];pinch={distance:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),scale:state.scale,x:state.x,y:state.y,centerX:(a[0].x+a[1].x)/2,centerY:(a[0].y+a[1].y)/2};dragStart=null;}});
      viewport.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2&&pinch){const a=[...pointers.values()],dist=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),rect=viewport.getBoundingClientRect(),cx=pinch.centerX-rect.left,cy=pinch.centerY-rect.top;state.scale=Math.min(2.6,Math.max(minimumScale(),pinch.scale*(dist/Math.max(1,pinch.distance))));const ratio=state.scale/pinch.scale;state.x=cx-(cx-pinch.x)*ratio;state.y=cy-(cy-pinch.y)*ratio;constrain();updateMap();}else if(dragStart){state.x=dragStart.x+e.clientX-dragStart.px;state.y=dragStart.y+e.clientY-dragStart.py;constrain();updateMap();}});
      function endPointer(e){if(!pointers.has(e.pointerId))return;pointers.delete(e.pointerId);if(pointers.size===0){dragStart=null;pinch=null;viewport.classList.remove('dragging');}else if(pointers.size===1){const a=[...pointers.values()][0];dragStart={px:a.x,py:a.y,x:state.x,y:state.y};pinch=null;}}
      viewport.addEventListener('pointerup',endPointer);viewport.addEventListener('pointercancel',endPointer);
      viewport.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(e.key)){e.preventDefault();if(e.key==='+')zoomBy(1.15);else if(e.key==='-')zoomBy(1/1.15);else{world.classList.add('animate');state.x+=e.key==='ArrowLeft'?55:e.key==='ArrowRight'?-55:0;state.y+=e.key==='ArrowUp'?55:e.key==='ArrowDown'?-55:0;constrain();updateMap(true);}}});
      document.addEventListener('keydown',e=>{if(e.key==='Escape'){if($('#modalBackdrop').classList.contains('open'))closeModal();else if($('#details').classList.contains('open'))closeDetails();else {$('#mobileListPanel').classList.remove('open');$('#mobileListPanel').setAttribute('aria-hidden','true');}}});
      let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(fitMap,130);});
      seedMapDecoration();
      const loadMapListings=async()=>{
        try{
          const response=await fetch('/api/map/listings',{credentials:'same-origin'});
          if(!response.ok)throw Error('Unable to load agency listings');
          const data=await response.json();
          properties=(data.items||[]).map(toMapProperty);
          buildPins();renderMatches();requestAnimationFrame(fitMap);
          const requestedRef=new URLSearchParams(location.search).get('ref');
          if(requestedRef){const match=properties.find(p=>p.ref===requestedRef);if(match)setTimeout(()=>showDetails(match.id),220);}
        }catch(err){
          $('#desktopResults').innerHTML='<div class="empty-state"><strong>Listings unavailable</strong>Start the Marina Gate server and refresh the map.</div>';
          $('#mobileResults').innerHTML=$('#desktopResults').innerHTML;
          $('#desktopCount').textContent='Connection unavailable';
          $('#visibleCount').textContent='0';
          toast(err.message);
          requestAnimationFrame(fitMap);
        }
      };
      document.addEventListener('error',e=>{const el=e.target;if(el.tagName==='IMG'&&el.dataset.fallback&&el.src!==new URL(el.dataset.fallback,location.origin).href){el.src=el.dataset.fallback;}},true);
      loadMapListings();
    })();
  