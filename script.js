// ======= AYARLAR =======
const TELEGRAM_KANAL = "https://t.me/makifaknc";
const WORKER_URL = "https://misty-feather-eb2a.akncmakif.workers.dev";

// ======= ÜRÜNLER =======
const urunler = [
    { id: 1, emoji: "🎮", ad: "Oyun Hesabı", aciklama: "Yüklü dijital oyun hesabı. Sıfır ve garantili.", fiyat: 250 },
    { id: 2, emoji: "💎", ad: "Premium Paket", aciklama: "Oyun içi premium ayrıcalıklar, anında teslim.", fiyat: 150 },
    { id: 3, emoji: "🎁", ad: "Hediye Kartı", aciklama: "Dijital hediye kartı, dilediğin yerde kullan.", fiyat: 100 },
    { id: 4, emoji: "🖥️", ad: "Eğitim Paketi", aciklama: "Dijital kurs ve eğitim içerikleri, ömür boyu erişim.", fiyat: 300 },
    { id: 5, emoji: "🔑", ad: "Lisans Anahtarı", aciklama: "Orijinal yazılım lisans anahtarı, kurulum desteğiyle.", fiyat: 180 },
    { id: 6, emoji: "📦", ad: "Özel Paket", aciklama: "İhtiyacına özel dijital ürün paketi.", fiyat: 400 }
];

// ======= WORKER API =======
async function apiPost(yol, veri) {
    const r = await fetch(WORKER_URL + yol, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(veri)
    });
    return r.json();
}

function siparisBildir(metin) {
    apiPost("/siparis", { metin: metin }).catch(function () {});
}

// ======= OTURUM (server destekli, localStorage sadece oturum) =======
function oturumAl() {
    try { return JSON.parse(localStorage.getItem("em_oturum")); } catch (e) { return null; }
}

function oturumKaydet(o) {
    localStorage.setItem("em_oturum", JSON.stringify(o));
}

function aktifKullanici() {
    const o = oturumAl();
    return o ? o.ad : null;
}

// ======= HESAP: KAYIT =======
// Adım 1: ad + şifre + Telegram ID gönder, kod Telegram'a gider
async function kayitAdim1() {
    const ad = document.getElementById("kullaniciAdi").value.trim();
    const sifre = document.getElementById("sifre").value;
    const sifreTekrar = document.getElementById("sifreTekrar").value;
    const tgId = document.getElementById("tgId").value.trim();
    const hata = document.getElementById("modalHata");
    hata.textContent = "";

    if (!ad || !sifre || !tgId) { hata.textContent = "Kullanıcı adı, şifre ve Telegram ID gerekli."; return; }
    if (sifre !== sifreTekrar) { hata.textContent = "Şifreler eşleşmiyor!"; return; }
    if (sifre.length < 4) { hata.textContent = "Şifre en az 4 karakter olmalı."; return; }
    if (!/^\d{5,}$/.test(tgId)) { hata.textContent = "Telegram ID sayı olmalı (ID'ni @userinfobot'a yazarak öğren)."; return; }

    const r = await apiPost("/hesap/kayit", { ad: ad, sifre: sifre, tg_id: tgId });
    if (r.ok) {
        kayitBekleyen = { ad: ad };
        girisBtnModaGec("kayit");
    } else {
        hata.textContent = r.hata || "Hata oluştu.";
    }
}

// Adım 2: kodu doğrula, hesap oluşur, kimlik gelir
async function kayitAdim2() {
    const kod = document.getElementById("kod").value.trim();
    const hata = document.getElementById("modalHata");
    hata.textContent = "";
    if (!kod) { hata.textContent = "Kodu girin."; return; }

    const r = await apiPost("/hesap/kayit2", { ad: kayitBekleyen.ad, kod: kod });
    if (r.ok) {
        oturumKaydet({ ad: r.ad, kimlik: r.kimlik, yetki: "kullanici" });
        mesajGoster("Kaydınız tamam! Kimliğiniz: #" + r.kimlik);
        hesapAlaniniGuncelle();
        modalKapat();
    } else {
        hata.textContent = r.hata || "Hata oluştu.";
    }
}

// ======= HESAP: GİRİŞ =======
// Adım 1: ad + şifre → kod Telegram'a gider
async function girisAdim1() {
    const ad = document.getElementById("kullaniciAdi").value.trim();
    const sifre = document.getElementById("sifre").value;
    const hata = document.getElementById("modalHata");
    hata.textContent = "";

    if (!ad || !sifre) { hata.textContent = "Kullanıcı adı ve şifre gerekli."; return; }

    const r = await apiPost("/hesap/giris", { ad: ad, sifre: sifre });
    if (r.ok) {
        girisBekleyen = { ad: ad };
        girisBtnModaGec("giris");
    } else {
        hata.textContent = r.hata || "Hata oluştu.";
    }
}

// Adım 2: kodu doğrula, oturum açılır
async function girisAdim2() {
    const kod = document.getElementById("kod").value.trim();
    const hata = document.getElementById("modalHata");
    hata.textContent = "";
    if (!kod) { hata.textContent = "Kodu girin."; return; }

    const r = await apiPost("/hesap/giris2", { ad: girisBekleyen.ad, kod: kod });
    if (r.ok) {
        oturumKaydet({ ad: r.ad, kimlik: r.kimlik, yetki: r.yetki });
        mesajGoster("Hoş geldin, " + r.ad + "! 🆔 #" + r.kimlik);
        hesapAlaniniGuncelle();
        modalKapat();
    } else {
        hata.textContent = r.hata || "Hata oluştu.";
    }
}

let kayitBekleyen = null;
let girisBekleyen = null;

// Modal'ı kod doğrulama adımına geçir
function girisBtnModaGec(mod) {
    document.getElementById("kodAlani").style.display = "block";
    document.getElementById("kod").value = "";
    document.getElementById("girisBtn").textContent = "Doğrula";
    document.getElementById("modalHata").textContent = "";
    document.getElementById("girisBtn").onclick = mod === "kayit" ? kayitAdim2 : girisAdim2;
    document.getElementById("modalDegis").style.display = "none";
    document.getElementById("sifre").disabled = true;
    document.getElementById("kullaniciAdi").disabled = true;
    document.getElementById("sifreTekrar").disabled = true;
    document.getElementById("tgId").disabled = true;
}

// Modal'ı ilk adıma döndür
function girisBtnModaSifirla() {
    document.getElementById("kodAlani").style.display = "none";
    document.getElementById("sifre").disabled = false;
    document.getElementById("kullaniciAdi").disabled = false;
    document.getElementById("sifreTekrar").disabled = false;
    document.getElementById("tgId").disabled = false;
    document.getElementById("modalDegis").style.display = "block";
}

function girisIslem() {
    const mod = document.getElementById("modalBaslik").dataset.mod;
    if (document.getElementById("kodAlani").style.display === "block") {
        if (mod === "kayit") kayitAdim2(); else girisAdim2();
    } else {
        if (mod === "kayit") kayitAdim1(); else girisAdim1();
    }
}

function girisModalAc(mod) {
    document.getElementById("modalBaslik").dataset.mod = mod;
    document.getElementById("modalBaslik").textContent = mod === "kayit" ? "Hesap Oluştur" : "Hesabına Giriş Yap";
    document.getElementById("modalHata").textContent = "";
    document.getElementById("kodAlani").style.display = "none";
    document.getElementById("sifreTekrar").style.display = mod === "kayit" ? "block" : "none";
    document.getElementById("tgId").style.display = mod === "kayit" ? "block" : "none";
    document.getElementById("modalAltYazi").textContent = mod === "kayit"
        ? "Kayıt için ad, şifre ve Telegram ID girin. Kod Telegram'ına gelir."
        : "Hesabına giriş yapmak için bilgilerini gir. Kod Telegram'ına gelir.";
    document.getElementById("modalDegis").innerHTML = mod === "kayit"
        ? 'Zaten hesabın var mı? <a href="#" onclick="girisModunaGec()">Giriş yap</a>'
        : 'Hesabın yok mu? <a href="#" onclick="kayitModunaGec()">Kayıt ol</a>';
    document.getElementById("girisBtn").textContent = "Devam";
    document.getElementById("girisBtn").onclick = girisIslem;
    girisBtnModaSifirla();
    document.getElementById("girisModal").classList.add("acik");
    document.getElementById("kod").focus();
}

function kayitModunaGec() {
    document.getElementById("kullaniciAdi").value = "";
    document.getElementById("sifre").value = "";
    document.getElementById("sifreTekrar").value = "";
    document.getElementById("tgId").value = "";
    girisModalAc("kayit");
}

function girisModunaGec() {
    document.getElementById("kullaniciAdi").value = "";
    document.getElementById("sifre").value = "";
    girisModalAc("giris");
}

function modalKapat() {
    document.getElementById("girisModal").classList.remove("acik");
    girisBtnModaSifirla();
    kayitBekleyen = null;
    girisBekleyen = null;
}

// ======= OTURUM / ÇIKIŞ =======
function oturumKapat() {
    localStorage.removeItem("em_oturum");
    hesapAlaniniGuncelle();
    hesapPanelKapat();
    destekPanelKapat();
    mesajGoster("Çıkış yapıldı.");
}

function hesapAlaniniGuncelle() {
    const alan = document.getElementById("hesapAlan");
    const o = oturumAl();
    if (o) {
        const yetkiEtiket = o.yetki === "admin" ? "👑 Admin" : o.yetki === "whitelist" ? "⭐ Whitelist" : "";
        alan.innerHTML = `
            <span class="kullanici-ad">👤 ${o.ad}${o.kimlik ? ' <span class="kimlik-num">#' + o.kimlik + "</span>" : ""}</span>
            ${yetkiEtiket ? '<span class="kimlik-num">' + yetkiEtiket + "</span>" : ""}
            <button class="cikis-btn" onclick="oturumKapat()">Çıkış</button>
        `;
    } else {
        alan.innerHTML = `
            <button class="mini-btn" onclick="girisModalAc('giris')">Giriş Yap</button>
            <button class="mini-btn kayit" onclick="girisModalAc('kayit')">Kayıt Ol</button>
        `;
    }
    // Destek linkini yetkiliyse göster
    const navDestek = document.getElementById("navDestek");
    if (o && (o.yetki === "admin" || o.yetki === "whitelist")) {
        navDestek.style.display = "inline";
    } else {
        navDestek.style.display = "none";
    }
}

// ======= HESAP PANELİ =======
function hesapPanelAc() {
    const o = oturumAl();
    if (!o) { girisModalAc("giris"); return; }

    document.getElementById("hesapBilgi").innerHTML = `
        <p class="kucuk" style="color:#e8ecf5;">👤 ${o.ad}</p>
        <p class="kucuk">🆔 Kimlik: <strong>#${o.kimlik}</strong></p>
        <p class="kucuk">Yetki: <strong>${o.yetki === "admin" ? "👑 Admin" : o.yetki === "whitelist" ? "⭐ Whitelist" : "👤 Kullanıcı"}</strong></p>
    `;

    document.getElementById("yetkiBilgi").innerHTML = o.yetki === "admin"
        ? '<p class="kucuk" style="color:#2aa24e;">Sen admin'sin. Kullanıcıları whitelist\'e ekleyebilirsin.</p>'
        : o.yetki === "whitelist"
            ? '<p class="kucuk" style="color:#2aa24e;">⭐ Whitelist üyesisin. Destek biletlerini görebilirsin.</p>'
            : '<p class="kucuk">Hesabın aktif. Destek biletlerini görmek için yetki verilmesi gerekir.</p>';

    // Yetki iste butonu sadece normal kullanıcıda görünür
    document.getElementById("yetkiAlAlan").style.display = o.yetki === "kullanici" ? "block" : "none";
    document.getElementById("yKod").style.display = "none";
    document.getElementById("yKodBtn").style.display = "none";
    document.getElementById("yHata").textContent = "";

    // Whitelist yönetimi sadece admin'de
    document.getElementById("whitelistYonetimi").style.display = o.yetki === "admin" ? "block" : "none";
    document.getElementById("wHata").textContent = "";
    document.getElementById("kullaniciListe").innerHTML = "";
    document.getElementById("hesapModal").classList.add("acik");
}

function hesapPanelKapat() {
    document.getElementById("hesapModal").classList.remove("acik");
}

// ======= YETKİ AL (admin ol) =======
let yetkiBekliyor = false;

async function yetkiAl() {
    const o = oturumAl();
    const hata = document.getElementById("yHata");
    hata.textContent = "";
    if (!o) { hata.textContent = "Giriş yapmalısın."; return; }

    hata.style.color = "#e04b4b";
    hata.textContent = "İstek gönderiliyor...";
    const r = await apiPost("/yetki/al", { ad: o.ad });
    if (r.ok) {
        document.getElementById("yKod").style.display = "block";
        document.getElementById("yKodBtn").style.display = "block";
        document.getElementById("yKod").value = "";
        hata.style.color = "#2aa24e";
        hata.textContent = "Onay kodu sahibin Telegram'ına gönderildi. Girip doğrula.";
        yetkiBekliyor = true;
    } else {
        hata.style.color = "#e04b4b";
        hata.textContent = r.hata || "Hata oluştu.";
    }
}

async function yetkiDogrula() {
    const o = oturumAl();
    const kod = document.getElementById("yKod").value.trim();
    const hata = document.getElementById("yHata");
    hata.textContent = "";
    if (!o) { hata.textContent = "Giriş yapmalısın."; return; }
    if (!kod) { hata.textContent = "Kodu gir."; return; }

    const r = await apiPost("/yetki/dogrula", { ad: o.ad, kod: kod });
    if (r.ok) {
        oturumKaydet({ ad: o.ad, kimlik: o.kimlik, yetki: "admin" });
        mesajGoster("👑 Artık admin'sin!");
        hesapPanelAc();
        hesapAlaniniGuncelle();
    } else {
        hata.textContent = r.hata || "Hata oluştu.";
    }
}

// ======= WHITELIST YÖNETİMİ (admin) =======
async function whitelistEkle() {
    const o = oturumAl();
    const kimlik = document.getElementById("wKod").value.trim();
    const hata = document.getElementById("wHata");
    hata.textContent = "";
    if (!o || o.yetki !== "admin") { hata.textContent = "Admin yetkin yok."; return; }
    if (!kimlik) { hata.textContent = "Kimlik numarası girin."; return; }

    const r = await apiPost("/whitelist/ekle", { admin: o.ad, kimlik: kimlik });
    if (r.ok) {
        mesajGoster(r.mesaj);
        document.getElementById("wKod").value = "";
        kullanicilariGoster();
    } else {
        hata.textContent = r.hata || "Hata oluştu.";
    }
}

async function whitelistCikar() {
    const o = oturumAl();
    const kimlik = document.getElementById("wKod").value.trim();
    const hata = document.getElementById("wHata");
    hata.textContent = "";
    if (!o || o.yetki !== "admin") { hata.textContent = "Admin yetkin yok."; return; }
    if (!kimlik) { hata.textContent = "Kimlik numarası girin."; return; }

    const r = await apiPost("/whitelist/cikar", { admin: o.ad, kimlik: kimlik });
    if (r.ok) {
        mesajGoster(r.mesaj);
        document.getElementById("wKod").value = "";
        kullanicilariGoster();
    } else {
        hata.textContent = r.hata || "Hata oluştu.";
    }
}

async function kullanicilariGoster() {
    const o = oturumAl();
    const kutu = document.getElementById("kullaniciListe");
    if (!o || o.yetki !== "admin") { kutu.innerHTML = '<p class="kucuk">Admin yetkin yok.</p>'; return; }

    const r = await apiPost("/kullanicilar", { admin: o.ad });
    if (!r.ok) { kutu.innerHTML = '<p class="kucuk">' + (r.hata || "Hata") + "</p>"; return; }

    kutu.innerHTML = "";
    if (r.kullanicilar.length === 0) {
        kutu.innerHTML = '<p class="kucuk">Henüz kullanıcı yok.</p>';
        return;
    }
    r.kullanicilar.forEach((k, i) => {
        const satir = document.createElement("div");
        satir.className = "kullanici-satir";
        satir.innerHTML = `
            <span>${i + 1}. 👤 ${k.ad}</span>
            <span class="tarih">🆔 #${k.kimlik || "yok"}<br>${k.yetki === "admin" ? "👑 Admin" : k.yetki === "whitelist" ? "⭐ Whitelist" : "👤 Kullanıcı"} · ${k.tarih || ""}</span>
        `;
        kutu.appendChild(satir);
    });
}

// ======= DESTEK PANELİ (whitelist/admin) =======
let destekSayac = null;

function destekPanelAc() {
    const o = oturumAl();
    if (!o || (o.yetki !== "admin" && o.yetki !== "whitelist")) {
        mesajGoster("Destek panelini görmek için yetkin yok.");
        return;
    }
    document.getElementById("destekModal").classList.add("acik");
    biletleriYukle();
    // Gerçek zamanlı güncelleme: 10 saniyede bir yenile
    if (destekSayac) clearInterval(destekSayac);
    destekSayac = setInterval(biletleriYukle, 10000);
}

function destekPanelKapat() {
    document.getElementById("destekModal").classList.remove("acik");
    if (destekSayac) { clearInterval(destekSayac); destekSayac = null; }
}

async function biletleriYukle() {
    const o = oturumAl();
    if (!o) return;
    const kutu = document.getElementById("biletListe");

    const r = await apiPost("/biletler", { ad: o.ad });
    if (!r.ok) {
        if (r.yetkisiz) {
            kutu.innerHTML = '<p class="kucuk">Bu paneli görmek için yetkin yok.</p>';
            document.getElementById("navDestek").style.display = "none";
            return;
        }
        kutu.innerHTML = '<p class="kucuk">' + (r.hata || "Hata") + "</p>";
        return;
    }

    if (r.biletler.length === 0) {
        kutu.innerHTML = '<p class="kucuk">Henüz bilet yok.</p>';
        return;
    }

    kutu.innerHTML = "";
    r.biletler.forEach(b => {
        const satir = document.createElement("div");
        satir.className = "bilet-satir";

        const durumEtiket = b.durum === "bekliyor"
            ? '<span class="bilet-durum bekliyor">⏳ Onay Bekliyor</span>'
            : b.durum === "aktif"
                ? '<span class="bilet-durum aktif">💬 Aktif</span>'
                : '<span class="bilet-durum kapali">🔒 Kapalı</span>';

        let aksiyon = "";
        if (b.durum === "aktif") {
            aksiyon = `
                <div class="bilet-mesajlar" id="msj-${b.id}"></div>
                <textarea class="bilet-yanit" id="yanit-${b.id}" placeholder="Yanıt yaz..."></textarea>
                <button class="btn tam-genislik" style="font-size:14px;padding:10px;" onclick="biletYanitla('${b.id}')">💬 Gönder</button>
                <button class="btn tam-genislik" style="background:#b91c1c;font-size:14px;padding:10px;" onclick="biletKapat('${b.id}')">🔒 Kapat</button>
            `;
        } else if (b.durum === "bekliyor" && o.yetki === "admin") {
            aksiyon = `<button class="btn tam-genislik" style="background:#2aa24e;font-size:14px;padding:10px;" onclick="biletAktifYap('${b.id}')">✅ Onayla</button>`;
        }

        satir.innerHTML = `
            <div class="bilet-ust">
                <span class="bilet-id">${b.id}</span>
                ${durumEtiket}
            </div>
            <div class="bilet-konu">👤 ${b.isim || "Müşteri"} · 📌 ${b.konu}</div>
            <div class="bilet-sorun">${b.sorun}</div>
            <div class="bilet-alt">📅 ${b.tarih}</div>
            ${aksiyon}
        `;
        kutu.appendChild(satir);

        if (b.durum === "aktif") {
            biletMesajlariGoster(b.id);
        }
    });
}

async function biletMesajlariGoster(id) {
    const o = oturumAl();
    const r = await apiPost("/bilet/mesajlar", { ad: o.ad, id: id });
    if (!r.ok) return;
    const kutu = document.getElementById("msj-" + id);
    if (!kutu) return;
    kutu.innerHTML = "";
    r.mesajlar.forEach(m => {
        const div = document.createElement("div");
        div.style.margin = "4px 0";
        div.style.padding = "6px 8px";
        div.style.borderRadius = "6px";
        div.style.background = m.kim === "sahip" ? "#14432a" : "#232c42";
        div.style.fontSize = "13px";
        div.innerHTML = "<b>" + (m.kim === "sahip" ? "🧑‍💼 Siz" : "👤 " + (m.isim || "Müşteri")) + "</b> · " + m.metin + '<br><span style="color:#9ca3af;font-size:11px">' + m.t + "</span>";
        kutu.appendChild(div);
    });
    kutu.scrollTop = kutu.scrollHeight;
}

async function biletYanitla(id) {
    const o = oturumAl();
    const mesaj = document.getElementById("yanit-" + id).value.trim();
    if (!mesaj) { mesajGoster("Yanıt yazın."); return; }
    const r = await apiPost("/bilet/yanitla", { ad: o.ad, id: id, mesaj: mesaj });
    if (r.ok) {
        document.getElementById("yanit-" + id).value = "";
        biletleriYukle();
    } else {
        mesajGoster(r.hata || "Hata");
    }
}

async function biletKapat(id) {
    const o = oturumAl();
    const r = await apiPost("/bilet/durum", { ad: o.ad, id: id, durum: "kapali" });
    if (r.ok) biletleriYukle();
    else mesajGoster(r.hata || "Hata");
}

async function biletAktifYap(id) {
    const o = oturumAl();
    const r = await apiPost("/bilet/durum", { ad: o.ad, id: id, durum: "aktif" });
    if (r.ok) biletleriYukle();
    else mesajGoster(r.hata || "Hata");
}

// ======= SEPET =======
let sepet = [];

function urunleriCiz() {
    const grid = document.getElementById("urunGrid");
    grid.innerHTML = "";
    urunler.forEach(u => {
        const kart = document.createElement("div");
        kart.className = "urun-kart";
        kart.innerHTML = `
            <div class="urun-gorsel">${u.emoji}</div>
            <div class="urun-bilgi">
                <h3>${u.ad}</h3>
                <p>${u.aciklama}</p>
                <div class="urun-alt">
                    <span class="fiyat">${u.fiyat}₺</span>
                    <button class="ekle" onclick="sepeteEkle(${u.id})">Sepete Ekle</button>
                </div>
            </div>
        `;
        grid.appendChild(kart);
    });
}

function sepeteEkle(id) {
    const u = urunler.find(x => x.id === id);
    const varMi = sepet.find(x => x.id === id);
    if (varMi) {
        varMi.adet++;
    } else {
        sepet.push({ ...u, adet: 1 });
    }
    sepetSayisiGuncelle();
    mesajGoster(u.ad + " sepete eklendi!");
}

function sepetSayisiGuncelle() {
    const toplam = sepet.reduce((t, x) => t + x.adet, 0);
    document.getElementById("sepetSayi").textContent = toplam;
    sepetListesiCiz();
}

function sepetListesiCiz() {
    const liste = document.getElementById("sepetListe");
    liste.innerHTML = "";
    if (sepet.length === 0) {
        liste.innerHTML = '<p style="color:#6b7794;">Sepetin boş.</p>';
        document.getElementById("sepetToplam").textContent = "0₺";
        return;
    }
    let toplam = 0;
    sepet.forEach(x => {
        toplam += x.fiyat * x.adet;
        const satir = document.createElement("div");
        satir.className = "sepet-urun";
        satir.innerHTML = `
            <span>${x.emoji} ${x.ad} (${x.adet})</span>
            <span>${x.fiyat * x.adet}₺</span>
            <button onclick="sepettenCikar(${x.id})">✕</button>
        `;
        liste.appendChild(satir);
    });
    document.getElementById("sepetToplam").textContent = toplam + "₺";
}

function sepettenCikar(id) {
    sepet = sepet.filter(x => x.id !== id);
    sepetSayisiGuncelle();
}

function sepetiAc() {
    document.getElementById("sepetPanel").classList.add("acik");
}

function sepetiKapat() {
    document.getElementById("sepetPanel").classList.remove("acik");
}

// ======= SİPARİŞ =======
function siparisVer() {
    if (sepet.length === 0) {
        mesajGoster("Sepetin boş!");
        return;
    }
    if (!aktifKullanici()) {
        mesajGoster("Ödeme yapmak için giriş yapmalısın!");
        girisModalAc("giris");
        return;
    }
    odemeOzetiniDoldur();
    document.getElementById("odemeModal").classList.add("acik");
}

// ======= ÖDEME MENÜSÜ (Sadece Türkiye kartları) =======
function odemeOzetiniDoldur() {
    const liste = document.getElementById("odemeUrunListe");
    liste.innerHTML = "";
    let toplam = 0;
    sepet.forEach(x => {
        toplam += x.fiyat * x.adet;
        const satir = document.createElement("div");
        satir.className = "odeme-urun";
        satir.innerHTML = `${x.emoji} ${x.ad} x${x.adet} — <strong>${x.fiyat * x.adet}₺</strong>`;
        liste.appendChild(satir);
    });
    document.getElementById("odemeToplam").textContent = toplam + "₺";
    document.getElementById("odemeHata").textContent = "";
}

function odemeKapat() {
    document.getElementById("odemeModal").classList.remove("acik");
}

function kartNoFormatla(deger) {
    return deger.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

function sktFormatla(deger) {
    const s = deger.replace(/\D/g, "").slice(0, 4);
    if (s.length > 2) return s.slice(0, 2) + "/" + s.slice(2);
    return s;
}

function kartTuruBelirle(no) {
    const s = no.replace(/\D/g, "");
    if (s.startsWith("9792") || s.startsWith("9692") || s.startsWith("65")) return "TROY";
    if (s.startsWith("4")) return "VISA";
    if (s.startsWith("5") || (s.length >= 2 && parseInt(s.slice(0, 2)) >= 51 && parseInt(s.slice(0, 2)) <= 55)) return "MASTERCARD";
    return "BİLİNMİYOR";
}

function odemeYap() {
    const ad = document.getElementById("kartSahip").value.trim();
    const no = document.getElementById("kartNo").value.replace(/\s/g, "");
    const skt = document.getElementById("kartSkt").value;
    const cvv = document.getElementById("kartCvv").value.trim();
    const hata = document.getElementById("odemeHata");
    const tur = kartTuruBelirle(no);

    if (!ad) { hata.textContent = "Kart sahibi adını yaz."; return; }
    if (no.length !== 16 || !/^\d{16}$/.test(no)) { hata.textContent = "Geçerli bir kart numarası gir (16 haneli)."; return; }
    if (tur === "BİLİNMİYOR") { hata.textContent = "Sadece Türkiye kartları kabul edilir (Troy, Visa, Mastercard)."; return; }
    if (!/^\d{2}\/\d{2}$/.test(skt)) { hata.textContent = "Son kullanma tarihini AA/YY formatında gir."; return; }
    if (cvv.length < 3) { hata.textContent = "CVV giriniz (kartın arkasındaki 3 hane)."; return; }

    let toplam = 0;
    for (let i = 0; i < no.length; i++) {
        let d = parseInt(no[i]);
        if (i % 2 === 0) { d *= 2; if (d > 9) d -= 9; }
        toplam += d;
    }
    if (toplam % 10 !== 0) { hata.textContent = "Kart numarası geçersiz görünüyor."; return; }

    const maske = {
        son4: no.slice(-4),
        marka: tur,
        skt: skt,
        cvv: cvv
    };
    no = null; cvv = null;

    const siparis = {
        adSoyad: ad,
        kullanici: aktifKullanici(),
        urunler: sepet.map(x => x.ad + " x" + x.adet).join(", "),
        tutar: sepet.reduce((t, x) => t + x.fiyat * x.adet, 0) + "₺",
        tarih: new Date().toLocaleString("tr-TR"),
        kart: tur + " •••• " + maske.son4 + " (" + maske.skt + ")"
    };
    const kayitlar = siparisleriAl();
    kayitlar.unshift(siparis);
    siparisleriKaydet(kayitlar);

    const bildirim =
        "🛒 YENİ SİPARİŞ\n────────────────\n" +
        "👤 Ad Soyad: " + siparis.adSoyad + "\n" +
        "🆔 Kullanıcı: " + (siparis.kullanici || "Girişsiz") + "\n" +
        "📦 Ürünler: " + siparis.urunler + "\n" +
        "💰 Tutar: " + siparis.tutar + "\n" +
        "💳 Kart: " + siparis.kart + "\n" +
        "📅 Tarih: " + siparis.tarih + "\n────────────────\n" +
        "Müşteriyle iletişim: " + TELEGRAM_KANAL;
    siparisBildir(bildirim);

    const btn = document.getElementById("odemeBtn");
    btn.disabled = true;
    btn.textContent = "İşleniyor...";
    hata.textContent = "";
    hata.style.color = "#2aa24e";

    setTimeout(() => {
        hata.textContent = "✓ Ödeme alındı! Siparişiniz hazırlanıyor.";
        document.getElementById("odemeOzet").style.display = "none";
        document.getElementById("odemeSonuc").style.display = "block";
        sepet = [];
        sepetSayisiGuncelle();
        sepetiKapat();
    }, 1800);
}

// ======= SİPARİŞ KAYITLARI =======
function siparisleriAl() {
    const veri = localStorage.getItem("em_siparisler");
    return veri ? JSON.parse(veri) : [];
}

function siparisleriKaydet(liste) {
    localStorage.setItem("em_siparisler", JSON.stringify(liste));
}

function siparisleriGoster() {
    const liste = siparisleriAl();
    const kutu = document.getElementById("siparisListe");
    document.getElementById("siparisToplam").textContent = liste.length;
    kutu.innerHTML = "";
    if (liste.length === 0) {
        kutu.innerHTML = '<p class="kucuk">Henüz sipariş yok.</p>';
        return;
    }
    liste.forEach((s, i) => {
        const satir = document.createElement("div");
        satir.className = "siparis-satir";
        satir.innerHTML = `
            <div class="siparis-ust">
                <span class="siparis-ad">${s.adSoyad}</span>
                <span class="siparis-tutar">${s.tutar}</span>
            </div>
            <div class="siparis-detay">${s.urunler}</div>
            <div class="siparis-tarih">📅 ${s.tarih} ${s.kullanici ? "· 👤 " + s.kullanici : ""}</div>
            ${s.kart ? '<div class="siparis-kart">💳 ' + s.kart + "</div>" : ""}
        `;
        kutu.appendChild(satir);
    });
}

function odemeSonucKapat() {
    document.getElementById("odemeModal").classList.remove("acik");
    document.getElementById("odemeOzet").style.display = "block";
    document.getElementById("odemeSonuc").style.display = "none";
    document.getElementById("odemeBtn").disabled = false;
    document.getElementById("odemeBtn").textContent = "Ödemeyi Tamamla";
    document.getElementById("odemeHata").textContent = "";
    document.getElementById("odemeHata").style.color = "#e04b4b";
    document.getElementById("kartSahip").value = "";
    document.getElementById("kartNo").value = "";
    document.getElementById("kartSkt").value = "";
    document.getElementById("kartCvv").value = "";
}

// ======= DESTEK (Telegram) =======
function destekAc() {
    window.open(TELEGRAM_KANAL, "_blank");
}

// ======= MESAJ =======
function mesajGoster(mesaj) {
    const el = document.getElementById("mesaj");
    el.textContent = mesaj;
    el.classList.add("goster");
    setTimeout(() => el.classList.remove("goster"), 2500);
}

// ======= BAŞLAT =======
urunleriCiz();
hesapAlaniniGuncelle();

// Giriş modalını Enter ile de kapat
document.addEventListener("keydown", e => {
    if (e.key === "Escape") { modalKapat(); odemeKapat(); hesapPanelKapat(); destekPanelKapat(); }
    if (e.key === "Enter" && document.getElementById("girisModal").classList.contains("acik")) {
        girisIslem();
    }
    if (e.key === "Enter" && document.getElementById("odemeModal").classList.contains("acik")) {
        odemeYap();
    }
});

// Modal dışına tıklayınca kapat
document.getElementById("girisModal").addEventListener("click", e => {
    if (e.target === document.getElementById("girisModal")) modalKapat();
});

document.getElementById("odemeModal").addEventListener("click", e => {
    if (e.target === document.getElementById("odemeModal")) odemeKapat();
});

document.getElementById("hesapModal").addEventListener("click", e => {
    if (e.target === document.getElementById("hesapModal")) hesapPanelKapat();
});

document.getElementById("destekModal").addEventListener("click", e => {
    if (e.target === document.getElementById("destekModal")) destekPanelKapat();
});
