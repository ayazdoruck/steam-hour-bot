Steam Saat Kasma Botu
Bu proje, Steam hesabınızda belirli oyunlarda çevrimiçiymiş gibi görünerek saat biriktirmenizi sağlayan bir Node.js tabanlı bottur. Kullanıcı dostu bir web arayüzü üzerinden Steam hesabınıza giriş yapabilir, oyunları seçerek saat kasmaya başlayabilirsiniz. Türkçe ve İngilizce dil desteği ile koyu/açık tema seçenekleri sunar.
Özellikler

Steam hesabına kolay giriş (kullanıcı adı, şifre ve Steam Guard kodu desteği).
Birden fazla oyunda aynı anda saat kasma.
Gerçek zamanlı bot durumu takibi (WebSocket ile).
Türkçe ve İngilizce dil desteği.
Koyu ve açık tema seçenekleri.
Basit ve mobil uyumlu web arayüzü.

Gereksinimler

Node.js (v14 veya üstü)
Steam hesabı (Steam Guard etkinleştirilmiş olmalı)
İnternet bağlantısı

Kurulum

Bu depoyu bilgisayarınıza klonlayın veya indirin:git clone https://github.com/kullanici/steam-idle-bot.git
cd steam-idle-bot


Gerekli bağımlılıkları yükleyin:npm install


Botu başlatın:npm start

Geliştirme modunda çalıştırmak için (otomatik yeniden başlatma):npm run dev



Kullanım

Botu başlattıktan sonra tarayıcınızda http://localhost:3000 adresine gidin.
Giriş Yap bölümünde Steam kullanıcı adınızı ve şifrenizi girin, ardından "Giriş Yap" butonuna tıklayın.
Eğer Steam Guard etkinse, e-posta veya mobil uygulamanızdan gelen kodu Steam Guard Kodu alanına girin.
Giriş başarılı olduğunda, saat kasmak istediğiniz oyunların AppID'lerini (ör. 730 CS:GO için) ilgili alana virgülle ayırarak girin (ör. 730,440).
Botu Başlat butonuna tıklayın. Bot, seçilen oyunlarda çevrimiçiymiş gibi görünecek.
Bot durumunu ve oynanan oyunları arayüzden takip edebilirsiniz.
Botu durdurmak için Botu Durdur butonuna, çıkış yapmak için Çıkış Yap butonuna tıklayın.
Dil (Türkçe/İngilizce) ve tema (Koyu/Açık) seçeneklerini sağ üstteki menüden değiştirebilirsiniz.

Ekran Görüntüsü
(Not: Ekran görüntüsü eklemek için screenshots klasörüne bir resim yükleyin ve yolu güncelleyin.)
Dikkat Edilmesi Gerekenler

Güvenlik: Kullanıcı adı ve şifreniz yerel olarak işlenir, ancak HTTPS kullanılmıyorsa ağda ele geçirilebilir. Üretim ortamında HTTPS/WSS kullanın.
Steam Guard: E-posta veya mobil kod gerekir. TOTP (2FA uygulamaları) desteklenmez.
Tek Kullanıcı: Şu anda yalnızca tek bir Steam hesabı için çalışır. Çoklu kullanıcı desteği için geliştirme gereklidir.
Steam Kuralları: Steam'in hizmet şartlarına uygun kullanın. Aşırı kullanım hesabınızın kısıtlanmasına neden olabilir.
Hata Günlüğü: Hatalar konsola yazılır. Kalıcı bir log sistemi yoktur.

Geliştirme

Yeni özellikler veya hata düzeltmeleri için bir pull request açabilirsiniz.
Önerilen iyileştirmeler:
HTTPS/WSS desteği.
Çoklu kullanıcı oturumları.
Steam TOTP entegrasyonu.
Kalıcı hata günlüğü.



Lisans
Bu proje MIT Lisansı altında lisanslanmıştır.
İletişim
Sorularınız veya önerileriniz için GitHub Issues üzerinden iletişime geçebilirsiniz.
