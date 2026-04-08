import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const BarcodeScanner = ({ onScanSuccess }) => {
  const scannerRef = useRef(null);
  const isRunningRef = useRef(false);
  const mountedRef = useRef(true);

  const [uiState, setUiState] = useState('Initializing camera...'); 
  const [errorMessage, setErrorMessage] = useState('');

  const cleanupScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning || isRunningRef.current) {
          await scannerRef.current.stop();
        }
      } catch (e) {
        console.warn("[DEBUG] Cleanup stop error:", e);
      }
      try {
        await scannerRef.current.clear();
      } catch (e) {
        console.warn("[DEBUG] Cleanup clear error:", e);
      }
      scannerRef.current = null;
    }
    isRunningRef.current = false;
  };

  const startStreamWithFallback = async (facingModeConstraint) => {
    if (!mountedRef.current) return false;

    try {
      console.log(`[DEBUG] Attempting to start camera with facingMode: ${facingModeConstraint}`);
      
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      
      await scannerRef.current.start(
        { facingMode: facingModeConstraint },
        config,
        async (decodedText) => {
          if (mountedRef.current && isRunningRef.current) {
             console.log(`[DEBUG] Barcode scanned successfully: ${decodedText}`);
             await cleanupScanner();
             onScanSuccess(decodedText, () => {
               // Parent can re-invoke start if necessary
             });
          }
        },
        () => {} // Suppress noisy frame processing alerts
      );

      return true; // Success
    } catch (err) {
      console.warn(`[DEBUG] Failed to start with facingMode: ${facingModeConstraint}`, err);
      return false; // Failed
    }
  };

  const startScanner = async () => {
    if (!mountedRef.current) return;
    if (isRunningRef.current) return;

    if (mountedRef.current) {
      setUiState('Initializing camera...');
      setErrorMessage('');
    }

    console.log("[DEBUG] Starting scanner process hook...");
    await cleanupScanner();

    if (!mountedRef.current) return;
    
    let failsafeTimeout;
    let startedSuccessfully = false;

    try {
      scannerRef.current = new Html5Qrcode("reader");
      isRunningRef.current = true;

      // 2. TIMEOUT FAILSAFE (3 SECONDS)
      failsafeTimeout = setTimeout(async () => {
        if (mountedRef.current && !startedSuccessfully) {
          console.error("[DEBUG] Camera start timed out after 3 seconds");
          await cleanupScanner();
          if (mountedRef.current) {
            setUiState('Camera failed');
            setErrorMessage('Camera took too long to start. Please close other camera apps and retry.');
          }
        }
      }, 3000);

      // 3. FORCE SIMPLE CAMERA CONSTRAINTS
      // Try 'environment' (back camera) FIRST
      let success = await startStreamWithFallback("environment");
      
      // Fallback to 'user' (front camera) IF environment fails
      if (!success && mountedRef.current && isRunningRef.current) {
        console.log("[DEBUG] Environment camera failed, trying fallback to 'user'");
        success = await startStreamWithFallback("user");
      }

      clearTimeout(failsafeTimeout);

      // 8. PREVENT STUCK STATE
      if (success && mountedRef.current) {
        startedSuccessfully = true;
        console.log("[DEBUG] Camera ready and active.");
        setUiState('Camera ready');
      } else if (mountedRef.current) {
        throw new Error("Both back and front cameras failed to initialize.");
      }

    } catch (err) {
      clearTimeout(failsafeTimeout);
      console.error("[DEBUG] Total camera initialization failure:", err);
      
      await cleanupScanner();
      
      if (mountedRef.current) {
        setUiState('Camera failed');
        setErrorMessage('Could not open video stream. Please ensure permissions are granted.');
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    
    const startObj = setTimeout(() => {
      startScanner();
    }, 300);

    return () => {
      mountedRef.current = false;
      clearTimeout(startObj);
      cleanupScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="glass-panel" style={{ textAlign: 'center', padding: '16px' }}>
      <h3 style={{ marginBottom: '16px' }}>Scan Barcode</h3>
      
      {/* 5. PROPER UI STATES */}
      {uiState !== 'Camera ready' && (
        <p style={{ color: uiState === 'Camera failed' ? 'var(--danger-color)' : 'var(--accent-color)', fontWeight: 'bold' }}>
          {uiState}
        </p>
      )}
      
      {/* 6. RETRY BUTTON */}
      {uiState === 'Camera failed' && errorMessage && (
        <div style={{ marginBottom: '16px' }}>
          <div className="warning-box" style={{ marginBottom: '16px', textAlign: 'left' }}>
            {errorMessage}
          </div>
          <button className="btn" onClick={() => startScanner()} style={{ width: '100%' }}>
            Retry Camera
          </button>
        </div>
      )}
      
      <div 
        id="reader" 
        style={{ 
          width: '100%', 
          maxWidth: '400px', 
          margin: '0 auto', 
          background: uiState === 'Camera failed' ? 'transparent' : '#fff', 
          color: '#000', 
          borderRadius: '8px', 
          overflow: 'hidden',
          display: uiState === 'Camera failed' ? 'none' : 'block'
        }}
      ></div>
      
      {uiState === 'Camera ready' && (
        <p style={{ marginTop: '16px', fontSize: '0.9em', color: 'var(--text-muted)' }}>
          Target a food product barcode steadily in the box.
        </p>
      )}
    </div>
  );
};

export default BarcodeScanner;
