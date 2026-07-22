// Initialize Lucide icons
lucide.createIcons();

// Elements
const elInit = document.getElementById('state-initializing');
const elReady = document.getElementById('state-ready');
const elPeerId = document.getElementById('peer-id-display');
const elConnStatus = document.getElementById('connection-status');
const elConnDot = document.getElementById('connection-dot');
const elConnText = document.getElementById('connection-text');

const elActionConnect = document.getElementById('action-connect');
const elActionTransfer = document.getElementById('action-transfer');
const elLinkInput = document.getElementById('link-input');
const elBtnConnect = document.getElementById('btn-connect');
const elBtnConnectIcon = document.getElementById('btn-connect-icon');
const elBtnConnectText = document.getElementById('btn-connect-text');
const elBtnDisconnect = document.getElementById('btn-disconnect');

const elDropzone = document.getElementById('dropzone');
const elFileInput = document.getElementById('file-input');
const elDropEmpty = document.getElementById('dropzone-empty');
const elDropSelected = document.getElementById('dropzone-selected');
const elSelectedFileName = document.getElementById('selected-file-name');
const elSelectedFileSize = document.getElementById('selected-file-size');

const elBtnSend = document.getElementById('btn-send');
const elProgPanel = document.getElementById('progress-panel');
const elProgSpinner = document.getElementById('progress-spinner');
const elProgLabel = document.getElementById('progress-label');
const elProgPercent = document.getElementById('progress-percent');
const elProgFill = document.getElementById('progress-fill');

const elReceivedSection = document.getElementById('received-files-section');
const elReceivedList = document.getElementById('received-files-list');

// State
let peer = null;
let currentConnection = null;
let selectedFile = null;

// Generate 6-char short ID
function generateShortId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Initialize PeerJS
function initPeer() {
  const shortId = generateShortId();
  peer = new Peer(shortId);

  peer.on('open', (id) => {
    elInit.style.display = 'none';
    elReady.style.display = 'block';
    elPeerId.innerText = id;
  });

  peer.on('connection', (conn) => {
    handleConnection(conn);
  });

  peer.on('error', (err) => {
    console.error(err);
    alert('PeerJS Error: ' + err.type);
    resetToReady();
  });
}

// Handle established connection
function handleConnection(conn) {
  currentConnection = conn;
  
  // Update UI for connection established
  elConnDot.style.background = 'var(--green)';
  elConnText.style.color = 'var(--green)';
  elConnText.innerText = 'Connected to peer';
  
  elActionConnect.style.display = 'none';
  elActionTransfer.style.display = 'block';

  conn.on('data', (data) => {
    if (data.type === 'file') {
      const blob = new Blob([data.file]);
      const url = URL.createObjectURL(blob);
      addReceivedFile(data.name, data.size, url);
    } else if (data.type === 'progress') {
      updateProgress(data.progress);
    }
  });

  conn.on('close', () => {
    resetToReady();
  });
}

// Disconnect and reset
function resetToReady() {
  if (currentConnection) {
    currentConnection.close();
  }
  currentConnection = null;
  
  elConnDot.style.background = 'var(--red)';
  elConnText.style.color = 'var(--text-muted)';
  elConnText.innerText = 'Waiting for connection...';
  
  elActionConnect.style.display = 'block';
  elActionTransfer.style.display = 'none';
  
  elBtnConnect.disabled = false;
  elBtnConnectIcon.setAttribute('data-lucide', 'wifi');
  elBtnConnectText.innerText = 'Connect';
  lucide.createIcons();
  
  resetFileSelection();
}

// Format size
function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Event Listeners

// Input link handling
elLinkInput.addEventListener('input', (e) => {
  elLinkInput.value = elLinkInput.value.toUpperCase();
  elBtnConnect.disabled = elLinkInput.value.length === 0;
});

// Connect form submit
document.getElementById('connect-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const targetId = elLinkInput.value.trim();
  if (!targetId || !peer) return;

  elBtnConnect.disabled = true;
  elBtnConnectIcon.setAttribute('data-lucide', 'loader-2');
  elBtnConnectIcon.classList.add('animate-spin');
  elBtnConnectText.innerText = 'Connecting...';
  lucide.createIcons();

  const conn = peer.connect(targetId);
  conn.on('open', () => {
    handleConnection(conn);
  });
});

// Disconnect button
elBtnDisconnect.addEventListener('click', () => {
  resetToReady();
});

// Dropzone selection
elDropzone.addEventListener('click', () => {
  elFileInput.click();
});

elFileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    selectedFile = e.target.files[0];
    elDropEmpty.style.display = 'none';
    elDropSelected.style.display = 'flex';
    elDropzone.classList.add('drag-over');
    
    elSelectedFileName.innerText = selectedFile.name;
    elSelectedFileSize.innerText = formatSize(selectedFile.size);
    
    elBtnSend.style.display = 'flex';
  }
});

function resetFileSelection() {
  selectedFile = null;
  elFileInput.value = '';
  elDropEmpty.style.display = 'flex';
  elDropSelected.style.display = 'none';
  elDropzone.classList.remove('drag-over');
  elBtnSend.style.display = 'none';
  elProgPanel.style.display = 'none';
}

// Send file
elBtnSend.addEventListener('click', () => {
  if (!currentConnection || !selectedFile) return;

  elBtnSend.style.display = 'none';
  elProgPanel.style.display = 'block';
  updateProgress(10);

  // Simulate network delay for UI before sending
  setTimeout(() => {
    currentConnection.send({
      type: 'file',
      file: selectedFile,
      name: selectedFile.name,
      size: selectedFile.size
    });
    updateProgress(100);

    setTimeout(() => {
      resetFileSelection();
    }, 2000);
  }, 500);
});

function updateProgress(percent) {
  elProgFill.style.width = percent + '%';
  elProgPercent.innerText = percent + '%';
  
  if (percent === 100) {
    elProgSpinner.style.display = 'none';
    elProgLabel.innerText = 'Transfer Complete!';
  } else {
    elProgSpinner.style.display = 'block';
    elProgLabel.innerText = 'Sending...';
  }
}

// Received Files UI
function addReceivedFile(name, size, url) {
  elReceivedSection.style.display = 'block';
  
  const div = document.createElement('div');
  div.className = 'file-info-bar';
  div.innerHTML = `
    <div class="file-icon-wrap" style="width: 42px; height: 42px;">
      <i data-lucide="file" style="width: 20px; height: 20px;"></i>
    </div>
    <div class="file-details">
      <p class="file-name">${name}</p>
      <p class="file-size-orig">${formatSize(size)}</p>
    </div>
    <a href="${url}" download="${name}" class="btn-compress" style="width: auto; padding: 10px 16px; font-size: 0.85rem;">
      <i data-lucide="download" style="width: 14px; height: 14px;"></i>
      Save
    </a>
  `;
  
  elReceivedList.appendChild(div);
  lucide.createIcons();
}

// Boot
initPeer();
