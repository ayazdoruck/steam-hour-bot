# Steam Saat Kasma Botu

Bu proje, Steam hesaplarınızda istediğiniz oyunlarda saat kasmak için kullanabileceğiniz, web tabanlı bir arayüze sahip bir Node.js botudur.

---

## İçindekiler

* [Özellikler](#özellikler)
* [Gereksinimler](#gereksinimler)
* [Kurulum](#kurulum)
* [Kullanım](#kullanım)
* [Nasıl Çalışır?](#nasıl-çalışır)
* [Katkıda Bulunma](#katkıda-bulunma)
* [Lisans](#lisans)

---

## Özellikler

* **Web Arayüzü:** Kullanımı kolay web tabanlı arayüz ile giriş yapma ve botu yönetme.
* **Steam Guard Desteği:** E-posta veya mobil onay kodu ile giriş yapabilme.
* **Çoklu Oyun Desteği:** Aynı anda birden fazla oyunda saat kasabilme.
* **Bot Durumu:** Botun çalışma durumunu ve hangi oyunlarda saat kastığını görebilme.
* **Kullanıcı Dostu:** Basit ve anlaşılır bir kurulum ve kullanım süreci.

---

## Gereksinimler

Bu projeyi çalıştırabilmek için sisteminizde aşağıdakilerin yüklü olması gerekmektedir:

* **Node.js** (v14 veya üzeri önerilir)
* **npm** (Node.js ile birlikte gelir)

---

## Kurulum

Projeyi yerel makinenize kurmak ve çalıştırmak için aşağıdaki adımları izleyin:

1.  **Projeyi Klonlayın:**
    ```bash
    git clone [https://github.com/ayazdoruck/steam-hour-bot.git](https://github.com/ayazdoruck/steam-hour-bot.git)
    ```
2.  **Proje Dizinine Girin:**
    ```bash
    cd steam-hour-bot
    ```
3.  **Bağımlılıkları Yükleyin:**
    ```bash
    npm install
    ```

---

## Kullanım

### Geliştirme Ortamında Çalıştırma (nodemon ile)

Kodda değişiklik yaparken otomatik yeniden başlatma özelliğiyle projeyi çalıştırmak için:

```bash
npm run dev