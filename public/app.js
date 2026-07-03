let ws;
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 10000;

let isLoggedIn = localStorage.getItem('isLoggedIn') === 'true' || false;
let steamGuardCallback = null;
let currentLanguage = localStorage.getItem('languagePreference') || 'en';

let sessionTimerInterval = null;
let farmingStartedAtMs = null;
let knownTotalSeconds = 0;

const translations = {
  tr: {
    title: "Steam AFK Bot - AyazDoruck",
    usernamePlaceholder: "Steam Kullanıcı Adı",
    passwordPlaceholder: "Steam Şifre",
    loginButton: "Giriş Yap",
    guardTitle: "Steam Guard Kodu Gerekli",
    guardButton: "Onayla",
    guardCodePlaceholder: "Steam Guard Kodu",
    botStatusLabel: "Bot Durumu:",
    currentGamesLabel: "Çalışan Oyunlar:",
    sessionTimeLabel: "Bu Oturum:",
    totalTimeLabel: "Toplam Süre:",
    noConnection: "Bağlantı Yok",
    running: "Çalışıyor",
    stopped: "Durdu",
    appidPlaceholder: "Oyun AppID'leri (virgülle ayırın)",
    startButton: "Başlat",
    stopButton: "Durdur",
    logoutButton: "Çıkış Yap",
    cancelButton: "İptal",
    confirmButton: "Onayla",
    emailCodeMessage: "E-posta adresinize gönderilen doğrulama kodunu ya da Steam Guard kodunu girin:",
    domainCodeMessagePrefix: "",
    domainCodeMessageSuffix: " adresine gönderilen kodu girin:",
    loginError: "Lütfen kullanıcı adı ve şifre girin!",
    guardError: "Lütfen kodu girin!",
    appidError: "Lütfen en az bir AppID girin!",
    logoutConfirm: "Hesaptan çıkış yapmak istediğinize emin misiniz?",
    logoutSuccess: "Başarıyla çıkış yapıldı",
    connectionError: "Sunucuyla bağlantı kurulamadı",
    connectionClosed: "Sunucu bağlantısı kesildi, yeniden bağlanılıyor...",
    notConnectedYet: "Sunucuya henüz bağlanılamadı, birazdan tekrar deneyin",
    reconnecting: "Yeniden Bağlanıyor",
    steamReconnecting: "Steam bağlantısı koptu, yeniden bağlanılıyor...",
    steamConnectionLost: "Steam bağlantısı kalıcı olarak koptu, lütfen tekrar giriş yapın.",
    invalidServerResponse: "Geçersiz sunucu yanıtı"
  },
  en: {
    title: "Steam AFK Bot - AyazDoruck",
    usernamePlaceholder: "Steam Username",
    passwordPlaceholder: "Steam Password",
    loginButton: "Login",
    guardTitle: "Steam Guard Code Required",
    guardButton: "Submit",
    guardCodePlaceholder: "Steam Guard Code",
    botStatusLabel: "Bot Status:",
    currentGamesLabel: "Running Games:",
    sessionTimeLabel: "This Session:",
    totalTimeLabel: "Total Time:",
    noConnection: "No Connection",
    running: "Running",
    stopped: "Stopped",
    appidPlaceholder: "Game AppIDs (comma separated)",
    startButton: "Start",
    stopButton: "Stop",
    logoutButton: "Logout",
    cancelButton: "Cancel",
    confirmButton: "Confirm",
    emailCodeMessage: "Enter the verification code or Steam Guard code sent to your email address:",
    domainCodeMessagePrefix: "Enter the code sent to ",
    domainCodeMessageSuffix: ":",
    loginError: "Please enter username and password!",
    guardError: "Please enter code!",
    appidError: "Please enter at least one AppID!",
    logoutConfirm: "Are you sure you want to logout?",
    logoutSuccess: "Successfully logged out",
    connectionError: "Failed to connect to server",
    connectionClosed: "Server connection lost, reconnecting...",
    notConnectedYet: "Not connected to server yet, try again shortly",
    reconnecting: "Reconnecting",
    steamReconnecting: "Steam connection lost, reconnecting...",
    steamConnectionLost: "Steam connection lost permanently, please log in again.",
    invalidServerResponse: "Invalid server response"
  }
};

// Tema değiştirme
document.getElementById('themeToggle').addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
  document.body.classList.toggle('dark-mode');
  applyThemeIcon();
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('themePreference', isDark ? 'dark' : 'light');
});

function applyThemeIcon() {
  const isDark = document.body.classList.contains('dark-mode');
  document.querySelector('#themeToggle i').textContent = isDark ? 'light_mode' : 'dark_mode';
}

// Dil değiştirme butonu
document.getElementById('languageToggle').addEventListener('click', function() {
  currentLanguage = currentLanguage === 'tr' ? 'en' : 'tr';
  localStorage.setItem('languagePreference', currentLanguage);
  applyTranslations();
  renderStatus();
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

// Section görünürlük yardımcıları (animasyonlu geçiş için display yerine class kullanılır)
function showSection(id) {
  document.getElementById(id).classList.remove('section-hidden');
}

function hideSection(id) {
  document.getElementById(id).classList.add('section-hidden');
}

// Uygulama durumu, DOM'dan geri okumak yerine burada tutulur (reconnect sonrası yeniden çizim için)
let appState = { running: false, games: [] };

// Sayfa yüklendiğinde
window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('themePreference') || 'dark';
  if (savedTheme === 'light') {
    document.body.classList.remove('dark-mode');
    document.body.classList.add('light-mode');
  }
  applyThemeIcon();

  const savedLanguage = localStorage.getItem('languagePreference') || 'en';
  currentLanguage = savedLanguage;
  applyTranslations();

  if (isLoggedIn) {
    hideSection('loginSection');
    showSection('appSection');
    showSection('statusBox');
    hideSection('guardSection');
  } else {
    hideSection('statusBox');
  }

  connectWebSocket();
});

// Tüm çevirileri uygula
function applyTranslations() {
  const lang = translations[currentLanguage];

  document.title = lang.title;
  document.getElementById('languageToggle').textContent = currentLanguage === 'tr' ? 'EN' : 'TR';

  document.getElementById('username').placeholder = lang.usernamePlaceholder;
  document.getElementById('password').placeholder = lang.passwordPlaceholder;
  document.getElementById('loginButton').textContent = lang.loginButton;

  document.getElementById('guardTitle').textContent = lang.guardTitle;
  document.getElementById('guardCode').placeholder = lang.guardCodePlaceholder;
  document.getElementById('submitGuardButton').textContent = lang.guardButton;

  document.getElementById('botStatusLabel').textContent = lang.botStatusLabel;
  document.getElementById('currentGamesLabel').textContent = lang.currentGamesLabel;
  document.getElementById('sessionTimeLabel').textContent = lang.sessionTimeLabel;
  document.getElementById('totalTimeLabel').textContent = lang.totalTimeLabel;

  document.getElementById('appid').placeholder = lang.appidPlaceholder;
  document.getElementById('startBotButton').textContent = lang.startButton;
  document.getElementById('stopBotButton').textContent = lang.stopButton;
  document.getElementById('logoutButton').textContent = lang.logoutButton;

  document.getElementById('confirmModalCancel').textContent = lang.cancelButton;
  document.getElementById('confirmModalOk').textContent = lang.confirmButton;
}

// Buton event listener'ları
document.getElementById('loginButton').addEventListener('click', login);
document.getElementById('submitGuardButton').addEventListener('click', submitGuardCode);
document.getElementById('startBotButton').addEventListener('click', startBot);
document.getElementById('stopBotButton').addEventListener('click', stopBot);
document.getElementById('logoutButton').addEventListener('click', logout);

function connectWebSocket() {
  ws = new WebSocket(`ws://${location.host}`);

  ws.onopen = () => {
    reconnectAttempts = 0;
    if (isLoggedIn) {
      ws.send(JSON.stringify({ type: 'getStatus' }));
    }
  };

  ws.onmessage = (event) => {
    setButtonsPending(false);
    try {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'steamGuard':
          steamGuardCallback = data.callbackId;
          showSteamGuardForm(data.domain);
          break;
        case 'loggedOn':
          handleSuccessfulLogin(data.lastAppids, data.totalSeconds);
          break;
        case 'reconnecting':
          showReconnectingState();
          break;
        case 'connectionError':
          showToast(data.message || translations[currentLanguage].steamConnectionLost, 'error');
          localStorage.removeItem('isLoggedIn');
          resetUI();
          break;
        case 'loggedOut':
          showToast(translations[currentLanguage].logoutSuccess, 'success');
          resetUI();
          break;
        case 'botStarted':
          farmingStartedAtMs = data.farmingStartedAt || Date.now();
          appState = { running: true, games: data.games || [] };
          renderStatus();
          break;
        case 'botStopped':
          if (typeof data.totalSeconds === 'number') knownTotalSeconds = data.totalSeconds;
          appState = { running: false, games: [] };
          renderStatus();
          break;
        case 'status':
          if (typeof data.totalSeconds === 'number') knownTotalSeconds = data.totalSeconds;
          farmingStartedAtMs = data.farmingStartedAt || null;
          appState = { running: data.running, games: data.games || [] };
          renderStatus();
          break;
        case 'error':
          showToast(data.message, 'error');
          break;
        case 'loginError':
          showLoginError(data.message);
          break;
      }
    } catch (error) {
      console.error('Message processing error:', error);
      showToast(translations[currentLanguage].invalidServerResponse, 'error');
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws.onclose = () => {
    document.getElementById('botStatus').textContent = translations[currentLanguage].noConnection;
    document.getElementById('botStatus').className = 'status-stopped';
    if (reconnectAttempts === 0) {
      showToast(translations[currentLanguage].connectionClosed, 'error');
    }
    scheduleReconnect();
  };
}

function scheduleReconnect() {
  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
  reconnectAttempts++;
  setTimeout(connectWebSocket, delay);
}

// readyState kontrolü olmadan ws.send() reconnect penceresinde hataya düşebiliyordu
function wsSend(payload) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    showToast(translations[currentLanguage].notConnectedYet, 'error');
    return false;
  }
  ws.send(JSON.stringify(payload));
  return true;
}

// Bir istek gönderilirken ilgili butonların tekrar tıklanmasını engeller
function setButtonsPending(pending) {
  ['loginButton', 'submitGuardButton', 'startBotButton', 'stopBotButton', 'logoutButton'].forEach(id => {
    document.getElementById(id).disabled = pending;
  });
}

function showSteamGuardForm(domain) {
  hideSection('loginSection');
  showSection('guardSection');

  const guardMessage = document.getElementById('guardMessage');
  const lang = translations[currentLanguage];
  guardMessage.textContent = domain
    ? lang.domainCodeMessagePrefix + domain + lang.domainCodeMessageSuffix
    : lang.emailCodeMessage;

  document.getElementById('guardCode').value = '';
  document.getElementById('guardCode').focus();
}

function handleSuccessfulLogin(lastAppids, totalSeconds) {
  isLoggedIn = true;
  localStorage.setItem('isLoggedIn', 'true');
  hideSection('loginSection');
  hideSection('guardSection');
  showSection('appSection');
  showSection('statusBox');
  if (Array.isArray(lastAppids) && lastAppids.length > 0) {
    document.getElementById('appid').value = lastAppids.join(', ');
  }
  if (typeof totalSeconds === 'number') knownTotalSeconds = totalSeconds;
}

function showReconnectingState() {
  const lang = translations[currentLanguage];
  const statusElement = document.getElementById('botStatus');
  statusElement.textContent = lang.reconnecting;
  statusElement.className = 'status-reconnecting';
  showToast(lang.steamReconnecting, 'error');
}

function logout() {
  showConfirmModal(translations[currentLanguage].logoutConfirm, () => {
    if (wsSend({ type: 'logout' })) {
      setButtonsPending(true);
    }
    localStorage.removeItem('isLoggedIn');
    isLoggedIn = false;
    resetUI();
  });
}

function resetUI() {
  isLoggedIn = false;
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
  document.getElementById('guardCode').value = '';
  showSection('loginSection');
  hideSection('guardSection');
  hideSection('appSection');
  hideSection('statusBox');
  document.getElementById('loginError').style.display = 'none';
  appState = { running: false, games: [] };
  farmingStartedAtMs = null;
  knownTotalSeconds = 0;
  renderStatus();
}

function showToast(message, kind) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'toast toast-' + (kind || 'error');
  showSection('toast');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => hideSection('toast'), 5000);
}

function showLoginError(message) {
  document.getElementById('loginError').textContent = message;
  document.getElementById('loginError').style.display = 'block';
  showSection('loginSection');
  hideSection('guardSection');
}

function showConfirmModal(text, onConfirm) {
  document.getElementById('confirmModalText').textContent = text;
  showSection('confirmModal');

  const okButton = document.getElementById('confirmModalOk');
  const cancelButton = document.getElementById('confirmModalCancel');

  const cleanup = () => {
    hideSection('confirmModal');
    okButton.removeEventListener('click', onOk);
    cancelButton.removeEventListener('click', onCancel);
  };
  const onOk = () => { cleanup(); onConfirm(); };
  const onCancel = () => cleanup();

  okButton.addEventListener('click', onOk);
  cancelButton.addEventListener('click', onCancel);
}

function login() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!username || !password) {
    showLoginError(translations[currentLanguage].loginError);
    return;
  }

  document.getElementById('loginError').style.display = 'none';
  if (wsSend({ type: 'login', username, password })) {
    setButtonsPending(true);
  }
}

function submitGuardCode() {
  const code = document.getElementById('guardCode').value.trim();
  if (!code) {
    showToast(translations[currentLanguage].guardError, 'error');
    return;
  }

  if (steamGuardCallback && wsSend({ type: 'steamGuardResponse', code, callbackId: steamGuardCallback })) {
    steamGuardCallback = null;
    setButtonsPending(true);
  }
}

function startBot() {
  const appids = document.getElementById('appid').value.trim();
  if (!appids) {
    showToast(translations[currentLanguage].appidError, 'error');
    return;
  }
  if (wsSend({ type: 'startFarming', appids })) {
    setButtonsPending(true);
  }
}

function stopBot() {
  if (wsSend({ type: 'stopFarming' })) {
    setButtonsPending(true);
  }
}

function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function formatGamesList(games) {
  if (!games || games.length === 0) return '-';
  return games.map(g => g.name ? `${g.appid} (${g.name})` : `${g.appid}`).join(', ');
}

function renderStatus() {
  const lang = translations[currentLanguage];
  const statusElement = document.getElementById('botStatus');
  statusElement.textContent = appState.running ? lang.running : lang.stopped;
  statusElement.className = appState.running ? 'status-running' : 'status-stopped';
  document.getElementById('currentGames').textContent = formatGamesList(appState.games);
  document.getElementById('totalTime').textContent = formatDuration(knownTotalSeconds);

  clearInterval(sessionTimerInterval);
  if (appState.running && farmingStartedAtMs) {
    updateSessionTimer();
    sessionTimerInterval = setInterval(updateSessionTimer, 1000);
  } else {
    document.getElementById('sessionTime').textContent = '00:00:00';
  }
}

function updateSessionTimer() {
  const elapsed = (Date.now() - farmingStartedAtMs) / 1000;
  document.getElementById('sessionTime').textContent = formatDuration(elapsed);
}
