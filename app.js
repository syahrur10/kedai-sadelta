'use strict';
const $=s=>document.querySelector(s),rp=n=>'Rp '+Number(n||0).toLocaleString('id-ID');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sha=async t=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('ks:'+t)))].map(b=>b.toString(16).padStart(2,'0')).join('');
const cap=s=>s.trim().replace(/\b\w/g,c=>c.toUpperCase());
const CART='<svg class="cart" viewBox="0 0 48 44" aria-hidden="true"><circle class="drop" cx="27" cy="3" r="4.5" fill="#e9c46a"/><g class="body"><path d="M11.5 12H43l-3.5 12.5H14.5z" fill="#e9c46a"/><path d="M3 6h6.5l4.5 20h23" fill="none" stroke="#f3efe3" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="18" cy="35" r="3.3" fill="#f3efe3"/><circle cx="33" cy="35" r="3.3" fill="#f3efe3"/></g></svg>';
const ST=['Menunggu','Diproses','Selesai','Dibatalkan'];
let db,me,cart=[],q='',kat='',srt='';
const save=()=>localStorage.setItem('ks_db',JSON.stringify(db));
const saveCart=()=>localStorage.setItem('ks_cart',JSON.stringify(cart));
const nid=a=>a.reduce((m,x)=>Math.max(m,x.id),0)+1;
const src=g=>!g?'':g.startsWith('data:')?g:'img/'+g;
let tt;function flash(m,err){const t=$('#toast');t.textContent=m;t.className='show'+(err?' err':'');clearTimeout(tt);tt=setTimeout(()=>t.className='',2800)}

async function init(){
  db=JSON.parse(localStorage.getItem('ks_db')||'null');
  if(!db){
    const now=new Date().toISOString(),U=[['Admin Kedai','admin','12345','admin'],['Budi Penjual','penjual1','penjual123','penjual'],['Sari Pembeli','pembeli1','pembeli123','pembeli']];
    const users=[];for(const [i,u] of U.entries())users.push({id:i+1,nama:u[0],username:u[1],email:u[1]+'@kedaisadelta.test',pass:await sha(u[2]),role:u[3],hp:'',alamat:''});
    const M=[[2,'Mie Ayam','Makanan Berat',15000,25,'Mie ayam dengan topping ayam suwir, pangsit, dan sayuran segar.','mie-ayam.jpg'],[2,'Soto Ayam','Makanan Berat',16000,18,'Soto ayam kuah bening dengan suwiran ayam, telur, dan bawang goreng.','soto-ayam.jpg'],[2,'Sate Ayam','Makanan Berat',20000,15,'Sate ayam bakar dengan bumbu kacang khas, disajikan dengan lontong.','sate-ayam.jpg'],[2,'Nasi Goreng','Makanan Berat',15000,22,'Nasi goreng spesial dengan telur, ayam suwir, dan acar segar.','nasi-goreng.jpg'],[2,'Es Teh Manis','Minuman',5000,40,'Es teh manis segar, cocok menemani makan siang.','es-teh.jpg'],[1,'Seblak','Makanan Berat',20000,30,'Perpaduan kuah segar dan frozen food yang gurih.','seblak.webp'],[1,'Lemon Tea','Minuman',8000,45,'Seduhan teh premium dengan perasan lemon segar.','lemon-tea.jpg'],[1,'Sea Salt Caramel Macchiato','Minuman',15000,45,'Karamel manis, sea salt gurih, susu creamy, dan espresso.','sea-salt-caramel-macchiato.webp'],[1,'Americano','Minuman',13000,45,'Double shot espresso dengan air panas yang pas.','americano.webp'],[1,'Cafe Latte','Minuman',18000,36,'Satu shot espresso dengan steamed milk dan busa tipis.','caffe-latte.webp'],[1,'Cafe Mocha','Minuman',20000,28,'Espresso, cokelat premium, dan susu creamy.','cafe-mocha.webp'],[1,'Ayam Geprek','Makanan Berat',13000,23,'Ayam krispi dengan sambal pedas, segar dan gurih.','ayam-geprek.jpg']];
    db={users,menu:M.map((m,i)=>({id:i+1,uid:m[0],nama:m[1],kat:m[2],harga:m[3],stok:m[4],desk:m[5],gambar:m[6]})),orders:[]};
    save();
  }
  try{cart=JSON.parse(localStorage.getItem('ks_cart')||'[]')}catch{cart=[]}
  me=db.users.find(u=>u.id==localStorage.getItem('ks_me'))||null;
  addEventListener('hashchange',route);route();
}

function dlg(title,fields,v,ok){
  const d=document.createElement('dialog');
  d.innerHTML=`<form><h3>${title}</h3>${fields.map(([n,l,t,o])=>`<label>${l}${t=='select'?`<select name="${n}">${o.map(x=>`<option ${v[n]==x?'selected':''}>${x}</option>`).join('')}</select>`:t=='textarea'?`<textarea name="${n}" rows="3">${esc(v[n])}</textarea>`:t=='file'?`<input name="${n}" type="file" accept="image/*">`:`<input name="${n}" type="${t}" value="${esc(v[n])}">`}</label>`).join('')}<div class="row"><button type="button" class="btn2">Batal</button><button class="btn">Simpan</button></div></form>`;
  const f=d.querySelector('form');
  f.onsubmit=async e=>{e.preventDefault();if(await ok(Object.fromEntries(new FormData(f)))!==false)d.close()};
  f.querySelector('.btn2').onclick=()=>d.close();d.onclose=()=>d.remove();
  document.body.append(d);d.showModal();
}
const resize=f=>new Promise(r=>{const fr=new FileReader;fr.onload=()=>{const i=new Image;i.onload=()=>{const s=Math.min(1,600/i.width),c=document.createElement('canvas');c.width=i.width*s;c.height=i.height*s;c.getContext('2d').drawImage(i,0,0,c.width,c.height);r(c.toDataURL('image/jpeg',.75))};i.onerror=()=>r(null);i.src=fr.result};fr.readAsDataURL(f)});

function nav(){
  const h=location.hash.slice(2),r=me?.role,L=[['',CART]];
  if(r=='pembeli')L.push(['keranjang',`Keranjang${cart.length?' ('+cart.reduce((a,c)=>a+c.qty,0)+')':''}`],['pesanan','Pesanan saya']);
  if(r=='admin'||r=='penjual')L.push(['kelola','Kelola menu'],['pesanan','Pesanan masuk']);
  if(r=='admin')L.push(['user','Pengguna']);
  $('#nav').innerHTML=`<a class="logo" href="#/">kedai<b>sadelta</b></a>`+L.map(([p,t])=>`<a href="#/${p}" class="${h==p?'on':''}${p==''?' home':''}"${p==''?' aria-label="Etalase" title="Etalase"':''}>${t}</a>`).join('')+(me?`<span class="mu">${esc(me.nama)} <span class="tag">${me.role}</span></span><a href="#/" id="out">Keluar</a>`:`<a href="#/login">Masuk</a><a class="btn sm" href="#/register">Daftar</a>`);
  const n=cart.reduce((a,c)=>a+c.qty,0),tot=cart.reduce((a,c)=>a+c.qty*(db.menu.find(m=>m.id==c.id)?.harga||0),0);
  $('#fab').innerHTML=r=='pembeli'&&n&&h!='keranjang'?`<a href="#/keranjang">${CART}<span><small>${n} item</small>${rp(tot)}</span></a>`:'';
  const o=$('#out');if(o)o.onclick=()=>{me=null;localStorage.removeItem('ks_me');flash('Anda sudah keluar.')};
}
const ROLE={kelola:['admin','penjual'],pesanan:['admin','penjual','pembeli'],user:['admin'],keranjang:['pembeli']};
function route(){
  const h=location.hash.slice(2),a=ROLE[h];
  if(a&&!(me&&a.includes(me.role))){flash('Masuk dulu dengan akun yang sesuai.',1);return location.hash='#/login'}
  $('#hero').innerHTML='';({login:loginV,register:regV,keranjang:cartV,kelola:kelolaV,pesanan:pesananV,user:userV}[h]||home)();nav();scrollTo(0,0);
}

function home(){
  const cats=[...new Set(db.menu.map(m=>m.kat))].sort(),P=db.users.filter(u=>u.role=='penjual').length;
  $('#hero').innerHTML=`<section class="hero"><div class="hero-in"><div class="hero-txt"><span class="eyebrow">Kedai Sadelta</span><h1>Pesan dari meja, makan tanpa antre.</h1><p>Mie ayam, soto, sate, sampai kopi susu. Pilih menu, kirim pesanan, dan pantau statusnya dari HP.</p><div class="cta"><a class="btn" href="#menu" onclick="document.getElementById('menu').scrollIntoView({behavior:'smooth'});return false">Lihat menu</a>${me?'':'<a class="btn ghost" href="#/register">Buat akun</a>'}</div><ul class="facts"><li><b>${db.menu.length}</b>menu</li><li><b>${P}</b>penjual</li><li><b>${cats.length}</b>kategori</li></ul></div><div class="plates"><img src="img/mie-ayam.jpg" alt="Mie ayam"><img src="img/ayam-geprek.jpg" alt="Ayam geprek"><img src="img/cafe-mocha.webp" alt="Cafe mocha"></div></div></section>`;
  $('#app').innerHTML=`<section class="steps"><div class="step"><i>1</i><div><b>Pilih menu</b><span>Cari atau filter makanan dan minuman favoritmu.</span></div></div><div class="step"><i>2</i><div><b>Kirim pesanan</b><span>Satu keranjang, otomatis dipecah per penjual.</span></div></div><div class="step"><i>3</i><div><b>Pantau status</b><span>Menunggu, diproses, sampai selesai.</span></div></div></section>
  <h2 id="menu">Menu hari ini</h2><div class="bar"><input id="q" type="search" placeholder="Cari menu, misal: soto" value="${esc(q)}" aria-label="Cari menu"><select id="srt" aria-label="Urutkan">${[['','Urutan awal'],['lo','Harga termurah'],['hi','Harga termahal'],['az','Nama A–Z']].map(([v,t])=>`<option value="${v}" ${srt==v?'selected':''}>${t}</option>`).join('')}</select></div>
  <div class="bar"><button class="chip ${kat?'':'on'}" data-k="">Semua</button>${cats.map(c=>`<button class="chip ${kat==c?'on':''}" data-k="${esc(c)}">${esc(c)}</button>`).join('')}</div><div id="grid" class="grid"></div>`;
  const S={az:(a,b)=>a.nama.localeCompare(b.nama),lo:(a,b)=>a.harga-b.harga,hi:(a,b)=>b.harga-a.harga};
  const io='IntersectionObserver'in window?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.08}):null;
  const draw=()=>{
    const L=db.menu.filter(m=>(!kat||m.kat==kat)&&(m.nama+m.kat).toLowerCase().includes(q.toLowerCase()));if(S[srt])L.sort(S[srt]);
    $('#grid').innerHTML=L.map(m=>{const ok=m.stok>0;return `<article class="item rv"><div class="ph">${m.gambar?`<img src="${esc(src(m.gambar))}" alt="${esc(m.nama)}" loading="lazy">`:'<div class="noimg">🍽️</div>'}${!ok?'<span class="out">Habis</span>':m.stok<=5?'<span class="low">Stok menipis</span>':''}<span class="price">${rp(m.harga)}</span></div><span class="cat">${esc(m.kat)}${ok?' · stok '+m.stok:''}</span><h3>${esc(m.nama)}</h3><p>${esc(m.desk)}</p>${me?.role=='pembeli'?`<button class="btn" data-add="${m.id}" ${ok?'':'disabled'}>${ok?'Tambah ke keranjang':'Stok habis'}</button>`:!me?`<a class="btn2" href="#/login">Masuk untuk memesan</a>`:''}</article>`}).join('')||'<p class="empty">Menu tidak ditemukan. Coba kata kunci lain.</p>';
    document.querySelectorAll('.rv').forEach(el=>io?io.observe(el):el.classList.add('in'));
  };
  draw();
  $('#q').oninput=e=>{q=e.target.value;draw()};
  $('#srt').onchange=e=>{srt=e.target.value;draw()};
  document.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{kat=b.dataset.k;document.querySelectorAll('.chip').forEach(x=>x.classList.toggle('on',x===b));draw()});
  $('#grid').onclick=e=>{const id=+e.target.dataset.add;if(!id)return;const m=db.menu.find(x=>x.id==id),c=cart.find(x=>x.id==id);
    if((c?c.qty:0)+1>m.stok)return flash('Stok '+m.nama+' tidak cukup.',1);
    c?c.qty++:cart.push({id,qty:1});saveCart();nav();flash(m.nama+' masuk keranjang.')};
}

function loginV(){
  if(me)return location.hash='#/';
  $('#app').innerHTML=`<form class="panel auth" id="f"><h2>Masuk</h2><label>Username atau email<input name="u" required autocomplete="username"></label><label>Password<input name="p" type="password" required autocomplete="current-password"></label><button class="btn">Masuk</button><p class="mu">Belum punya akun? <a href="#/register">Daftar</a></p></form>`;
  $('#f').onsubmit=async e=>{e.preventDefault();const f=e.target,u=f.u.value.trim().toLowerCase(),h=await sha(f.p.value);
    const x=db.users.find(a=>(a.username.toLowerCase()==u||a.email.toLowerCase()==u)&&a.pass==h);
    if(!x)return flash('Username/email atau password salah.',1);
    me=x;localStorage.setItem('ks_me',x.id);flash('Selamat datang, '+x.nama+'!');location.hash=x.role=='pembeli'?'#/':'#/kelola'};
}
function regV(){
  if(me)return location.hash='#/';
  $('#app').innerHTML=`<form class="panel auth" id="f"><h2>Buat akun</h2><label>Nama lengkap<input name="nama" required minlength="3"></label><label>Username<input name="user" required minlength="3"></label><label>Email<input name="email" type="email" required></label><label>No. HP<input name="hp"></label><label>Daftar sebagai<select name="role"><option>pembeli</option><option>penjual</option></select></label><label>Password (min. 6)<input name="p" type="password" required minlength="6"></label><label>Ulangi password<input name="p2" type="password" required></label><button class="btn">Buat akun</button></form>`;
  $('#f').onsubmit=async e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));
    if(f.p!=f.p2)return flash('Konfirmasi password tidak sama.',1);
    const err=dup(f.user,f.email);if(err)return flash(err,1);
    db.users.push({id:nid(db.users),nama:f.nama.trim(),username:f.user.trim(),email:f.email.trim(),pass:await sha(f.p),role:f.role=='penjual'?'penjual':'pembeli',hp:f.hp,alamat:''});save();flash('Akun dibuat. Silakan masuk.');location.hash='#/login'};
}
const dup=(u,e,id)=>db.users.some(x=>x.id!=id&&x.username.toLowerCase()==u.trim().toLowerCase())?'Username sudah dipakai.':db.users.some(x=>x.id!=id&&x.email.toLowerCase()==e.trim().toLowerCase())?'Email sudah dipakai.':'';

function cartV(){
  const L=cart.map(c=>({...c,m:db.menu.find(m=>m.id==c.id)})).filter(c=>c.m);
  if(!L.length){$('#app').innerHTML=`<h2>Keranjang</h2><p class="empty">Keranjang masih kosong. <a href="#/">Pilih menu</a></p>`;return}
  const tot=L.reduce((a,c)=>a+c.qty*c.m.harga,0);
  $('#app').innerHTML=`<h2>Keranjang</h2><div class="tw"><table><tr><th>Menu</th><th>Harga</th><th>Jumlah</th><th>Subtotal</th></tr>${L.map(c=>`<tr><td><div class="mi">${c.m.gambar?`<img src="${esc(src(c.m.gambar))}" alt="">`:''}${esc(c.m.nama)}</div></td><td>${rp(c.m.harga)}</td><td><span class="qty"><button class="btn2 sm" data-d="${c.id}:-1">−</button>${c.qty}<button class="btn2 sm" data-d="${c.id}:1">+</button></span></td><td>${rp(c.qty*c.m.harga)}</td></tr>`).join('')}</table></div>
  <div class="panel"><label>Catatan untuk penjual (opsional)<textarea id="cat" rows="2"></textarea></label><div class="row sp"><b>Total ${rp(tot)}</b><button class="btn" id="co">Pesan sekarang</button></div></div>`;
  $('#app').onclick=e=>{const d=e.target.dataset.d;if(!d)return;const [id,n]=d.split(':').map(Number),c=cart.find(x=>x.id==id),m=db.menu.find(x=>x.id==id);
    if(n>0&&c.qty+1>m.stok)return flash('Stok tidak cukup.',1);c.qty+=n;if(c.qty<1)cart=cart.filter(x=>x.id!=id);saveCart();nav();cartV()};
  $('#co').onclick=()=>{
    for(const c of L)if(c.qty>c.m.stok)return flash(`Stok ${c.m.nama} tinggal ${c.m.stok}.`,1);
    const by={};L.forEach(c=>(by[c.m.uid]=by[c.m.uid]||[]).push(c));
    Object.entries(by).forEach(([uid,it])=>{
      it.forEach(c=>c.m.stok-=c.qty);
      db.orders.push({id:nid(db.orders),uid:me.id,sid:+uid,items:it.map(c=>({id:c.id,nama:c.m.nama,harga:c.m.harga,qty:c.qty})),total:it.reduce((a,c)=>a+c.qty*c.m.harga,0),catatan:$('#cat').value.trim(),status:'Menunggu',at:new Date().toISOString()});
    });
    cart=[];save();saveCart();flash('Pesanan berhasil dibuat.');location.hash='#/pesanan'};
}

function pesananV(){
  const r=me.role,O=db.orders.filter(o=>r=='admin'||(r=='penjual'?o.sid==me.id:o.uid==me.id)).sort((a,b)=>b.id-a.id),who=id=>db.users.find(u=>u.id==id)?.nama||'-';
  $('#app').innerHTML=`<h2>${r=='pembeli'?'Pesanan saya':'Pesanan masuk'}</h2>`+(O.length?`<div class="tw"><table><tr><th>#</th><th>Waktu</th>${r=='pembeli'?'':'<th>Pembeli</th>'}<th>Item</th><th>Total</th><th>Status</th></tr>${O.map(o=>`<tr><td>${o.id}</td><td>${new Date(o.at).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'})}</td>${r=='pembeli'?'':`<td>${esc(who(o.uid))}</td>`}<td>${o.items.map(i=>`${i.qty}× ${esc(i.nama)}`).join('<br>')}${o.catatan?`<br><small class="mu">Catatan: ${esc(o.catatan)}</small>`:''}</td><td>${rp(o.total)}</td><td>${r=='pembeli'?`<span class="tag ${o.status}">${o.status}</span>`:`<select data-o="${o.id}" ${o.status=='Dibatalkan'?'disabled':''}>${ST.map(s=>`<option ${s==o.status?'selected':''}>${s}</option>`).join('')}</select>`}</td></tr>`).join('')}</table></div>`:`<p class="empty">Belum ada pesanan.${r=='pembeli'?' <a href="#/">Pesan sekarang</a>':''}</p>`);
  $('#app').onchange=e=>{const id=+e.target.dataset.o;if(!id)return;const o=db.orders.find(x=>x.id==id),s=e.target.value;
    if(s=='Dibatalkan')o.items.forEach(i=>{const m=db.menu.find(x=>x.id==i.id);if(m)m.stok+=i.qty});
    o.status=s;save();flash('Status diperbarui.');pesananV()};
}

function kelolaV(){
  const adm=me.role=='admin',M=db.menu.filter(m=>adm||m.uid==me.id),O=db.orders.filter(o=>adm||o.sid==me.id);
  $('#app').innerHTML=`<div class="row sp"><h2>Kelola menu</h2><button class="btn" id="add">+ Tambah menu</button></div>
  <div class="stats"><div class="panel"><b>${M.length}</b>Menu</div><div class="panel"><b>${O.filter(o=>o.status=='Menunggu').length}</b>Pesanan menunggu</div><div class="panel"><b>${rp(O.filter(o=>o.status=='Selesai').reduce((a,o)=>a+o.total,0))}</b>Pendapatan selesai</div><div class="panel"><b>${M.filter(m=>m.stok<=5).length}</b>Stok ≤ 5</div></div>
  <div class="tw"><table><tr><th></th><th>Nama</th><th>Kategori</th><th>Harga</th><th>Stok</th><th></th></tr>${M.map(m=>`<tr><td>${m.gambar?`<img src="${esc(src(m.gambar))}" alt="">`:''}</td><td>${esc(m.nama)}</td><td>${esc(m.kat)}</td><td>${rp(m.harga)}</td><td>${m.stok}</td><td class="row"><button class="btn2 sm" data-e="${m.id}">Edit</button><button class="btn2 sm danger" data-x="${m.id}">Hapus</button></td></tr>`).join('')||'<tr><td colspan="6" class="empty">Belum ada menu. Tambah menu pertamamu.</td></tr>'}</table></div>`;
  const F=[['nama','Nama menu','text'],['kat','Kategori','text'],['harga','Harga (Rp)','number'],['stok','Stok','number'],['desk','Deskripsi','textarea'],['gambar','Foto (opsional)','file']];
  const form=(t,v,id)=>dlg(t,F,v,async f=>{
    if(f.nama.trim().length<3||!f.kat.trim()||!(+f.harga>=0)||f.harga==='')return flash('Nama (min. 3 huruf), kategori, dan harga wajib diisi.',1),false;
    const o={nama:f.nama.trim(),kat:cap(f.kat),harga:+f.harga,stok:+f.stok||0,desk:f.desk.trim()};
    const img=f.gambar&&f.gambar.size?await resize(f.gambar):null;
    if(id){const m=db.menu.find(x=>x.id==id);Object.assign(m,o);if(img)m.gambar=img}else db.menu.push({id:nid(db.menu),uid:me.id,gambar:img||'',...o});
    save();flash('Menu disimpan.');kelolaV()});
  $('#add').onclick=()=>form('Tambah menu',{kat:'Makanan Berat',stok:10});
  $('#app').onclick=e=>{const d=e.target.dataset;
    if(d.e)form('Edit menu',db.menu.find(m=>m.id==d.e),+d.e);
    if(d.x){const m=db.menu.find(x=>x.id==d.x);if(confirm('Hapus "'+m.nama+'"?')){db.menu=db.menu.filter(x=>x.id!=m.id);cart=cart.filter(c=>c.id!=m.id);save();saveCart();flash('Menu dihapus.');kelolaV()}}};
}

function userV(){
  let rf='';const draw=()=>{
    const U=db.users.filter(u=>(!rf||u.role==rf)&&(u.nama+u.username+u.email).toLowerCase().includes(q.toLowerCase()));
    $('#app').innerHTML=`<div class="row sp"><h2>Pengguna</h2><button class="btn" id="add">+ Tambah pengguna</button></div><div class="bar"><input id="q" type="search" placeholder="Cari nama, username, email" value="${esc(q)}"><select id="rf" style="width:auto"><option value="">Semua role</option>${['admin','penjual','pembeli'].map(r=>`<option ${rf==r?'selected':''}>${r}</option>`).join('')}</select></div>
    <div class="tw"><table><tr><th>Nama</th><th>Username</th><th>Email</th><th>Role</th><th></th></tr>${U.map(u=>`<tr><td>${esc(u.nama)}</td><td>${esc(u.username)}</td><td>${esc(u.email)}</td><td><span class="tag">${u.role}</span></td><td class="row"><button class="btn2 sm" data-e="${u.id}">Edit</button><button class="btn2 sm danger" data-x="${u.id}">Hapus</button></td></tr>`).join('')}</table></div>`;
    $('#q').oninput=e=>{q=e.target.value;const p=e.target.selectionStart;draw();const n=$('#q');n.focus();n.setSelectionRange(p,p)};
    $('#rf').onchange=e=>{rf=e.target.value;draw()};
    const F=[['nama','Nama','text'],['username','Username','text'],['email','Email','email'],['pass','Password (kosongkan jika tidak diubah)','password'],['role','Role','select',['admin','penjual','pembeli']],['hp','No. HP','text'],['alamat','Alamat','textarea']];
    const form=(t,v,id)=>dlg(t,F,v,async f=>{
      if(f.nama.trim().length<3||f.username.trim().length<3)return flash('Nama dan username minimal 3 karakter.',1),false;
      const er=dup(f.username,f.email,id);if(er)return flash(er,1),false;
      if(!id&&f.pass.length<6||id&&f.pass&&f.pass.length<6)return flash('Password minimal 6 karakter.',1),false;
      const adm=db.users.filter(u=>u.role=='admin').length;
      if(id&&db.users.find(u=>u.id==id).role=='admin'&&f.role!='admin'&&adm<=1)return flash('Tidak bisa mengubah satu-satunya admin.',1),false;
      const o={nama:f.nama.trim(),username:f.username.trim(),email:f.email.trim(),role:f.role,hp:f.hp,alamat:f.alamat};
      if(f.pass)o.pass=await sha(f.pass);
      if(id)Object.assign(db.users.find(u=>u.id==id),o);else db.users.push({id:nid(db.users),pass:o.pass,...o});
      if(me.id==id)me=db.users.find(u=>u.id==id);
      save();flash('Pengguna disimpan.');if(me.role!='admin')location.hash='#/';else draw()});
    $('#add').onclick=()=>form('Tambah pengguna',{role:'pembeli'});
    $('#app').onclick=e=>{const d=e.target.dataset;
      if(d.e)form('Edit pengguna',{...db.users.find(u=>u.id==d.e),pass:''},+d.e);
      if(d.x){const u=db.users.find(x=>x.id==d.x);
        if(u.id==me.id)return flash('Tidak bisa menghapus akun sendiri.',1);
        if(u.role=='admin'&&db.users.filter(x=>x.role=='admin').length<=1)return flash('Tidak bisa menghapus satu-satunya admin.',1);
        if(confirm('Hapus pengguna "'+u.nama+'"?')){db.users=db.users.filter(x=>x.id!=u.id);save();flash('Pengguna dihapus.');draw()}}};
  };draw();
}
init();
