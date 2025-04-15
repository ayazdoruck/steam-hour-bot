const ws = new WebSocket(`ws://${location.host}`);
let isLoggedIn = localStorage.getItem('isLoggedIn') === 'true' || false;
let steamGuardCallback = null;
let currentLanguage = localStorage.getItem('languagePreference') || 'tr';

const translations = {
  tr: {
    title: "Steam AFK Bot - AyazDoruck",
    usernamePlaceholder: "Steam Kullanıcı Adı",
    passwordPlaceholder: "Steam Şifre",
    loginButton: "Giriş Yap",
    guardTitle: "Steam Guard Kodu Gerekli",
    guardButton: "Onayla",
    botStatusLabel: "Bot Durumu:",
    currentGamesLabel: "Çalışan Oyunlar:",
    noConnection: "Bağlantı Yok 🔴",
    running: "Çalışıyor 🟢",
    stopped: "Durdu 🔴",
    appidPlaceholder: "Oyun AppID'leri (virgülle ayırın)",
    startButton: "Başlat",
    stopButton: "Durdur",
    logoutButton: "Çıkış Yap",
    emailCodeMessage: "E-posta adresinize gönderilen doğrulama kodunu ya da Steam Guard kodunu girin:",
    domainCodeMessage: " adresine gönderilen kodu girin:",
    loginError: "Lütfen kullanıcı adı ve şifre girin!",
    guardError: "Lütfen kodu girin!",
    appidError: "Lütfen en az bir AppID girin!",
    logoutConfirm: "Hesaptan çıkış yapmak istediğinize emin misiniz?",
    logoutSuccess: "Başarıyla çıkış yapıldı",
    connectionError: "Sunucuyla bağlantı kurulamadı",
    connectionClosed: "Sunucu bağlantısı kesildi. Lütfen sayfayı yenileyin."
  },
  en: {
    title: "Steam AFK Bot - AyazDoruck",
    usernamePlaceholder: "Steam Username",
    passwordPlaceholder: "Steam Password",
    loginButton: "Login",
    guardTitle: "Steam Guard Code Required",
    guardButton: "Submit",
    botStatusLabel: "Bot Status:",
    currentGamesLabel: "Running Games:",
    noConnection: "No Connection 🔴",
    running: "Running 🟢",
    stopped: "Stopped 🔴",
    appidPlaceholder: "Game AppIDs (comma separated)",
    startButton: "Start",
    stopButton: "Stop",
    logoutButton: "Logout",
    emailCodeMessage: "Enter the verification code or Steam Guard code sent to your email address:",
    domainCodeMessage: "Enter the code ",
    loginError: "Please enter username and password!",
    guardError: "Please enter code!",
    appidError: "Please enter at least one AppID!",
    logoutConfirm: "Are you sure you want to logout?",
    logoutSuccess: "Successfully logged out",
    connectionError: "Failed to connect to server",
    connectionClosed: "Server connection lost. Please refresh the page."
  }
};

// Tema değiştirme
document.getElementById('themeToggle').addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  document.getElementById('themeToggle').textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('themePreference', isDark ? 'dark' : 'light');
});

// Dil değiştirme butonu
document.getElementById('languageToggle').addEventListener('click', function() {
  currentLanguage = currentLanguage === 'tr' ? 'en' : 'tr';
  localStorage.setItem('languagePreference', currentLanguage);
  this.textContent = currentLanguage === 'tr' ? '🇺🇸' : '🇹🇷';
  
  // Tüm çevirileri uygula
  applyTranslations();
  
  // Durum bilgisini yenile
  const statusElement = document.getElementById('botStatus');
  const isRunning = statusElement.classList.contains('status-running');
  const gamesText = document.getElementById('currentGames').textContent;
  const games = gamesText === '-' ? [] : gamesText.split(', ').map(Number);
  
  updateStatus(games, isRunning);
});

// Şifre görünürlük butonu
document.getElementById('togglePassword').addEventListener('click', function() {
  const passwordInput = document.getElementById('password');
  const icon = this.querySelector('i');
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    icon.textContent = 'visibility_off';
  } else {
    passwordInput.type = 'password';
    icon.textContent = 'visibility';
  }
});

// Sayfa yüklendiğinde
window.addEventListener('DOMContentLoaded', () => {
  // Tema ayarı
  const savedTheme = localStorage.getItem('themePreference') || 'dark';
  if (savedTheme === 'light') {
    document.body.classList.remove('dark-mode');
    document.body.classList.add('light-mode');
    document.getElementById('themeToggle').textContent = '🌙';
  }
  
  // Dil ayarı
  const savedLanguage = localStorage.getItem('languagePreference') || 'tr';
  currentLanguage = savedLanguage;
  document.getElementById('languageToggle').textContent = currentLanguage === 'tr' ? '🇺🇸' : '🇹🇷';
  applyTranslations();

  // Giriş durumunu kontrol et
  if (isLoggedIn) {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('appSection').style.display = 'block';
    document.getElementById('statusBox').style.display = 'block';
    document.getElementById('guardSection').style.display = 'none';
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'getStatus' }));
    }
  } else {
    document.getElementById('statusBox').style.display = 'none';
  }
});

// Tüm çevirileri uygula
function applyTranslations() {
  const lang = translations[currentLanguage];
  
  // Başlık
  document.title = lang.title;
  
  // Giriş bölümü
  document.getElementById('username').placeholder = lang.usernamePlaceholder;
  document.getElementById('password').placeholder = lang.passwordPlaceholder;
  document.getElementById('loginButton').textContent = lang.loginButton;
  
  // Guard bölümü
  document.getElementById('guardTitle').textContent = lang.guardTitle;
  document.getElementById('submitGuardButton').textContent = lang.guardButton;
  
  // Durum bölümü
  document.getElementById('botStatusLabel').textContent = lang.botStatusLabel;
  document.getElementById('currentGamesLabel').textContent = lang.currentGamesLabel;
  
  // Bot kontrol bölümü
  document.getElementById('appid').placeholder = lang.appidPlaceholder;
  document.getElementById('startBotButton').textContent = lang.startButton;
  document.getElementById('stopBotButton').textContent = lang.stopButton;
  document.getElementById('logoutButton').textContent = lang.logoutButton;
}

// Buton event listener'ları
document.getElementById('loginButton').addEventListener('click', login);
document.getElementById('submitGuardButton').addEventListener('click', submitGuardCode);
document.getElementById('startBotButton').addEventListener('click', startBot);
document.getElementById('stopBotButton').addEventListener('click', stopBot);
document.getElementById('logoutButton').addEventListener('click', logout);

// WebSocket mesajları
ws.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);
    

    switch (data.type) {
      case 'steamGuard':
        steamGuardCallback = data.callbackId;
        showSteamGuardForm(data.domain);
        break;
      case 'loggedOn':
        handleSuccessfulLogin();
        break;
      case 'loggedOut':
        alert(translations[currentLanguage].logoutSuccess);
        resetUI();
        break;
      case 'botStarted':
        updateStatus(data.games, true);
        break;
      case 'botStopped':
        updateStatus([], false);
        break;
      case 'status':
        updateStatus(data.games, data.running);
        break;
      case 'error':
        showError(data.message);
        break;
      case 'loginError':
        showLoginError(data.message);
        break;
    }
  } catch (error) {
    console.error('Mesaj işleme hatası:', error);
    showError('Geçersiz sunucu yanıtı');
  }
};

function showSteamGuardForm(domain) {
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('guardSection').style.display = 'block';
  
  const guardMessage = document.getElementById('guardMessage');
  const lang = translations[currentLanguage];
  guardMessage.textContent = domain 
    ? lang.domainCodeMessage + domain 
    : lang.emailCodeMessage;
  
  document.getElementById('guardCode').value = '';
  document.getElementById('guardCode').focus();
}

function handleSuccessfulLogin() {
  isLoggedIn = true;
  localStorage.setItem('isLoggedIn', 'true');
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('guardSection').style.display = 'none';
  document.getElementById('appSection').style.display = 'block';
  document.getElementById('statusBox').style.display = 'block';
  updateStatus();
}

function logout() {
  if (confirm(translations[currentLanguage].logoutConfirm)) {
    ws.send(JSON.stringify({ type: 'logout' }));
    localStorage.removeItem('isLoggedIn');
    isLoggedIn = false;
    resetUI();
  }
}

function resetUI() {
  isLoggedIn = false;
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
  document.getElementById('guardCode').value = '';
  document.getElementById('loginSection').style.display = 'block';
  document.getElementById('guardSection').style.display = 'none';
  document.getElementById('appSection').style.display = 'none';
  document.getElementById('statusBox').style.display = 'none';
  document.getElementById('loginError').style.display = 'none';
  document.getElementById('errorMessage').style.display = 'none';
  updateStatus([], false);
}

function showError(message) {
  const errorElement = document.getElementById('errorMessage');
  errorElement.textContent = message;
  errorElement.style.display = 'block';
  setTimeout(() => errorElement.style.display = 'none', 5000);
}

function showLoginError(message) {
  document.getElementById('loginError').textContent = message;
  document.getElementById('loginError').style.display = 'block';
  document.getElementById('loginSection').style.display = 'block';
  document.getElementById('guardSection').style.display = 'none';
}

function login() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!username || !password) {
    showLoginError(translations[currentLanguage].loginError);
    return;
  }

  document.getElementById('loginError').style.display = 'none';
  ws.send(JSON.stringify({ 
    type: 'login', 
    username, 
    password 
  }));
}

function submitGuardCode() {
  const code = document.getElementById('guardCode').value.trim();
  if (!code) {
    showError(translations[currentLanguage].guardError);
    return;
  }
  
  if (steamGuardCallback) {
    ws.send(JSON.stringify({ 
      type: 'steamGuardResponse', 
      code,
      callbackId: steamGuardCallback
    }));
    steamGuardCallback = null;
  }
}

function startBot() {
  const appids = document.getElementById('appid').value.trim();
  if (!appids) {
    showError(translations[currentLanguage].appidError);
    return;
  }
  ws.send(JSON.stringify({ 
    type: 'startFarming', 
    appids 
  }));
}

function stopBot() {
  ws.send(JSON.stringify({ 
    type: 'stopFarming' 
  }));
}

function updateStatus(games = [], running = false) {
  const lang = translations[currentLanguage];
  const statusElement = document.getElementById('botStatus');
  statusElement.textContent = running ? lang.running : lang.stopped;
  statusElement.className = running ? 'status-running' : 'status-stopped';
  document.getElementById('currentGames').textContent = games.length ? games.join(', ') : '-';
}

// Hata yönetimi
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
  const lang = translations[currentLanguage];
  document.getElementById('botStatus').textContent = lang.noConnection;
  showError(lang.connectionError);
};

ws.onclose = () => {
  const lang = translations[currentLanguage];
  document.getElementById('botStatus').textContent = lang.noConnection;
  showError(lang.connectionClosed);
};

// Bağlantı açıldığında
ws.onopen = () => {
  if (isLoggedIn) {
    ws.send(JSON.stringify({ type: 'getStatus' }));
  }
};