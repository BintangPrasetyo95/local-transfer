import { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import { Send, Upload, Link, Loader2, File, Wifi, Link2, SlidersHorizontal, Download } from 'lucide-react';
import './App.css';

function generateShortId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function App() {
  const [peerId, setPeerId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [peer, setPeer] = useState(null);
  const [connection, setConnection] = useState(null);
  const [status, setStatus] = useState('initializing'); // initializing, ready, connecting, connected
  const [files, setFiles] = useState([]);
  const [receivedFiles, setReceivedFiles] = useState([]);
  const [transferProgress, setTransferProgress] = useState(0);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    const newId = generateShortId();
    const newPeer = new Peer(newId);

    newPeer.on('open', (id) => {
      setPeerId(id);
      setStatus('ready');
    });

    newPeer.on('connection', (conn) => {
      handleConnection(conn);
    });

    newPeer.on('error', (err) => {
      console.error(err);
      setStatus('ready');
      alert('Error: ' + err.type);
    });

    setPeer(newPeer);

    return () => {
      newPeer.destroy();
    };
  }, []);

  const handleConnection = (conn) => {
    setStatus('connected');
    setConnection(conn);

    conn.on('data', (data) => {
      if (data.type === 'file') {
        const blob = new Blob([data.file]);
        const url = URL.createObjectURL(blob);
        setReceivedFiles(prev => [...prev, { name: data.name, url, size: data.size }]);
      } else if (data.type === 'progress') {
        setTransferProgress(data.progress);
      }
    });

    conn.on('close', () => {
      setStatus('ready');
      setConnection(null);
      setTransferProgress(0);
    });
  };

  const connectToPeer = (e) => {
    e.preventDefault();
    if (!targetId || !peer) return;
    
    setStatus('connecting');
    const conn = peer.connect(targetId.toUpperCase());
    
    conn.on('open', () => {
      handleConnection(conn);
    });
  };

  const handleFileSelect = (e) => {
    if (e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
    }
  };

  const sendFile = () => {
    if (!connection || files.length === 0) return;

    const file = files[0];
    
    setTransferProgress(10);
    
    setTimeout(() => {
      connection.send({
        type: 'file',
        file: file,
        name: file.name,
        size: file.size
      });
      setTransferProgress(100);
      
      setTimeout(() => {
        setTransferProgress(0);
        setFiles([]);
      }, 2000);
    }, 500);
  };

  const disconnect = () => {
    if (connection) {
      connection.close();
    }
    setStatus('ready');
    setConnection(null);
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      {/* Background orbs */}
      <div className="bg-orb orb1"></div>
      <div className="bg-orb orb2"></div>
      <div className="bg-orb orb3"></div>

      <div className="app-container">
        {/* Header */}
        <header className="header">
          <div className="logo">
            <div className="logo-icon">
              <img src="/icon.svg" style={{ width: '100%', height: '100%' }} alt="Logo" />
            </div>
            <span className="logo-text">
              <span className="logo-owner">BintangPrasetyo's</span> <span className="logo-accent">Local File Transfer</span>
            </span>
          </div>
          <div className="header-badge">Instant Transfer</div>
        </header>

        {/* Hero */}
        <section className="hero">
          <h1 className="hero-title">Securely Beam <span className="gradient-text">Local Files</span></h1>
          <p className="hero-subtitle">Connect instantly and transfer files over Wi-Fi directly peer-to-peer—all done in your browser.</p>
        </section>

        {/* Main Card */}
        <main className="main-card glass">
          
          <div className="layout-grid">
            
            {/* Left Column: Connection Info */}
            <div>
              {status === 'initializing' ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent)', margin: '0 auto 10px' }} />
                  <p style={{ color: 'var(--text-muted)' }}>Generating secure ID...</p>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <p className="setting-label" style={{ justifyContent: 'center', marginBottom: '8px' }}>Your Receiving ID</p>
                  <div className="id-badge">
                    {peerId}
                  </div>
                  
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: status === 'connected' ? 'var(--green)' : 'var(--text-muted)' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: status === 'connected' ? 'var(--green)' : 'var(--red)' }}></div>
                    {status === 'connected' ? 'Connected to peer' : 'Waiting for connection...'}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Actions */}
            <div>
              {status !== 'connected' && (
                <form onSubmit={connectToPeer}>
                  <div className="setting-group">
                    <label className="setting-label" htmlFor="link-input">
                      <Link size={14} />
                      Connect to Device
                    </label>
                    <div className="size-input-group">
                      <input 
                        type="text" 
                        id="link-input" 
                        className="size-input" 
                        placeholder="e.g. A1B2C3" 
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                        maxLength={6}
                        required
                        autoComplete="off"
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn-compress" disabled={status === 'connecting' || !targetId}>
                    {status === 'connecting' ? <Loader2 className="animate-spin" size={18} /> : <Wifi size={18} />}
                    {status === 'connecting' ? 'Connecting...' : 'Connect'}
                  </button>
                </form>
              )}

              {status === 'connected' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Send Files</h2>
                    <button onClick={disconnect} className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.75rem' }}>
                      Disconnect
                    </button>
                  </div>
                  
                  <div 
                    className={`dropzone ${files.length > 0 ? 'drag-over' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileSelect} 
                      style={{ display: 'none' }} 
                    />
                    
                    {files.length > 0 ? (
                      <>
                        <div className="file-icon-wrap">
                          <File size={24} />
                        </div>
                        <div>
                          <p className="drop-title">{files[0].name}</p>
                          <p className="drop-sub">{formatSize(files[0].size)}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="file-icon-wrap" style={{ background: 'rgba(255,200,0,0.1)', color: 'var(--accent)' }}>
                          <Upload size={24} />
                        </div>
                        <div>
                          <p className="drop-title">Click to select</p>
                          <p className="drop-sub">Any file up to 50MB</p>
                        </div>
                      </>
                    )}
                  </div>

                  {files.length > 0 && transferProgress === 0 && (
                    <button onClick={sendFile} className="btn-compress" style={{ marginTop: '16px' }}>
                      <Send size={18} />
                      Send File
                    </button>
                  )}
                  
                  {transferProgress > 0 && (
                    <div className="progress-panel" style={{ marginTop: '16px', paddingTop: '16px' }}>
                      <div className="progress-header">
                        <div className="progress-status">
                          {transferProgress < 100 && <div className="spinner"></div>}
                          <span id="progressLabel">{transferProgress === 100 ? 'Transfer Complete!' : 'Sending...'}</span>
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent2)' }}>{transferProgress}%</span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${transferProgress}%` }}></div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Received Files */}
          {receivedFiles.length > 0 && (
            <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px' }}>Received Files</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {receivedFiles.map((file, idx) => (
                  <div key={idx} className="file-info-bar">
                    <div className="file-icon-wrap" style={{ width: 42, height: 42 }}>
                      <File size={20} />
                    </div>
                    <div className="file-details">
                      <p className="file-name">{file.name}</p>
                      <p className="file-size-orig">{formatSize(file.size)}</p>
                    </div>
                    <a href={file.url} download={file.name} className="btn-compress" style={{ width: 'auto', padding: '10px 16px', fontSize: '0.85rem' }}>
                      <Download size={14} />
                      Save
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* How it works */}
        <section className="how-it-works">
          <h2 className="section-title">How It Works</h2>
          <div className="steps-grid">
            <div className="step-card glass">
              <div className="step-num">01</div>
              <div className="step-icon">
                <Link2 size={32} />
              </div>
              <h3>Pair Devices</h3>
              <p>Enter the 6-character ID shown on the receiving device.</p>
            </div>
            <div className="step-card glass">
              <div className="step-num">02</div>
              <div className="step-icon">
                <SlidersHorizontal size={32} />
              </div>
              <h3>Select File</h3>
              <p>Choose any file you want to send from your local drive.</p>
            </div>
            <div className="step-card glass">
              <div className="step-num">03</div>
              <div className="step-icon">
                <Download size={32} />
              </div>
              <h3>Receive</h3>
              <p>Get your file instantly without using cloud servers.</p>
            </div>
          </div>
        </section>

        <footer className="footer">
          <p>BintangPrasetyo's WebSend &middot; All processing done <strong>100% in your browser</strong>.</p>
        </footer>
      </div>
    </>
  );
}

export default App;
