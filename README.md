# Steam Saat Kasma Botu

Bu proje, Steam hesabınızda belirli oyunlarda çevrimiçiymiş gibi görünerek saat biriktirmenizi sağlayan bir Node.js tabanlı bottur. Kullanıcı dostu bir web arayüzü üzerinden Steam hesabınıza giriş yapabilir, oyunları seçerek saat kasmaya başlayabilirsiniz. Türkçe ve İngilizce dil desteği ile koyu/açık tema seçenekleri sunar.

---

## Özellikler

* **Steam Hesabına Kolay Giriş:** Kullanıcı adı, şifre ve Steam Guard kodu desteği.
* **Birden Fazla Oyunda Aynı Anda Saat Kasma:** Tek seferde birden çok oyun için saat kasabilirsiniz.
* **Gerçek Zamanlı Bot Durumu Takibi:** WebSocket bağlantısı aracılığıyla botun anlık durumunu izleyin.
* **Türkçe ve İngilizce Dil Desteği:** Kullanıcı arayüzünü istediğiniz dilde kullanabilirsiniz.
* **Koyu ve Açık Tema Seçenekleri:** Göz yormayan veya aydınlık bir arayüz tercih edebilirsiniz.
* **Basit ve Mobil Uyumlu Web Arayüzü:** Her cihazdan kolayca erişilebilir tasarım.

---

## Gereksinimler

Bu projeyi çalıştırabilmek için sisteminizde aşağıdakilerin yüklü olması gerekmektedir:

* **Node.js** (v14 veya üstü önerilir)
* **Steam Hesabı** (Steam Guard etkinleştirilmiş olmalı)
* **İnternet Bağlantısı**

---

## Kurulum

Projeyi yerel makinenize kurmak ve çalıştırmak için aşağıdaki adımları izleyin:

1.  **Depoyu Klonlayın veya İndirin:**
    ```bash
    git clone [https://github.com/ayazdoruck/steam-hour-bot.git](https://github.com/ayazdoruck/steam-hour-bot.git)
    cd steam-hour-bot
    ```
    *Not: Yukarıdaki klonlama URL'sini kendi GitHub kullanıcı adınla güncelledim.*

2.  **Gerekli Bağımlılıkları Yükleyin:**
    ```bash
    npm install
    ```

3.  **Botu Başlatın:**
    ```bash
    npm start
    ```

4.  **Geliştirme Modunda Çalıştırmak İçin (Otomatik Yeniden Başlatma):**
    ```bash
    npm run dev
    ```

---

## Kullanım

1.  Botu başlattıktan sonra tarayıcınızda **http://localhost:3443** adresine gidin.
    *Not: Kodunda 3443 portu kullanıldığı için kullanım talimatını buna göre güncelledim.*
2.  **Giriş Yap** bölümünde Steam kullanıcı adınızı ve şifrenizi girin, ardından "Giriş Yap" butonuna tıklayın.
3.  Eğer Steam Guard etkinse, e-posta veya mobil uygulamanızdan gelen kodu **Steam Guard Kodu** alanına girin.
4.  Giriş başarılı olduğunda, saat kasmak istediğiniz oyunların AppID'lerini (ör. **730** CS:GO için, **440** Team Fortress 2 için) ilgili alana virgülle ayırarak girin (ör. `730,440`).
5.  **Başlat** butonuna tıklayın. Bot, seçilen oyunlarda çevrimiçiymiş gibi görünecek ve saat kasmaya başlayacaktır.
6.  Bot durumunu ve oynanan oyunları arayüzden takip edebilirsiniz.
7.  Botu durdurmak için **Durdur** butonuna, Steam hesabından tamamen çıkış yapmak için **Çıkış Yap** butonuna tıklayın.
8.  Dil (Türkçe/İngilizce) ve tema (Koyu/Açık) seçeneklerini sağ üstteki menüden değiştirebilirsiniz.

---

## Ekran Görüntüsü

(Not: Ekran görüntüsü eklemek için `screenshots` klasörüne bir resim yükleyin ve aşağıdaki yolu güncelleyin.)

```markdown
