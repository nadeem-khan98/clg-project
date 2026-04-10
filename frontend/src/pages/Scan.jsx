import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import BarcodeScanner from "../components/BarcodeScanner";
import ProductCard from "../components/ProductCard";
import api from "../services/api";
import Layout from "../components/Layout";
import { ArrowLeft, Loader2 } from "lucide-react";

const Scan = () => {
  const navigate = useNavigate();
  const [scannedProduct, setScannedProduct] = useState(null);
  const [loadingMsg, setLoadingMsg] = useState("");

  const handleScanSuccess = async (barcode) => {
    setLoadingMsg(`Searching for product ${barcode}...`);
    try {
      const { data } = await api.get(`/scan/${barcode}`);
      setScannedProduct(data);
    } catch (error) {
      alert("Product not found");
    } finally {
      setLoadingMsg("");
    }
  };

  const handleAddSuccess = () => {
    navigate("/diet-plan");
  };

  return (
    <Layout>
      <div className="fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button 
            onClick={() => navigate(-1)} 
            className="btn btn-ghost" 
            style={{ padding: '8px', borderRadius: '50%' }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="gradient-text">Scan Product</h1>
        </div>

        {!scannedProduct ? (
          <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
            <BarcodeScanner onScanSuccess={handleScanSuccess} />
            {loadingMsg && (
              <div style={{ padding: '24px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <Loader2 className="animate-spin" size={20} />
                <span>{loadingMsg}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="fade-in">
            <ProductCard
              product={scannedProduct}
              onAddSuccess={handleAddSuccess}
              onCancel={() => setScannedProduct(null)}
            />
          </div>
        )}

        <p style={{ marginTop: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Point your camera at a barcode to automatically fetch nutritional data.
        </p>
      </div>
    </Layout>
  );
};

export default Scan;
