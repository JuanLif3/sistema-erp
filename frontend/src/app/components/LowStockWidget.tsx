import { useEffect, useState } from 'react';
import axios from 'axios';
import { AlertTriangle, ArrowRight } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  stock: number;
}

export default function LowStockWidget({ onNavigate }: { onNavigate: () => void }) {
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);

useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('erp_token');
        // 👇 AGREGAR ESTA LÍNEA
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        
        // 👇 USAR API_URL
        const response = await axios.get(`${API_URL}/api/products`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Filtramos en el front por simplicidad (stock <= 5)
        const critical = response.data.filter((p: Product) => p.stock <= 5).slice(0, 5);
        setLowStockProducts(critical);
      } catch (error) {
        console.error("Error cargando stock", error);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <AlertTriangle className="text-amber-500" size={20} />
          Alertas de Stock
        </h3>
        <button onClick={onNavigate} className="text-xs text-brand-600 font-medium hover:underline">
          Ver Inventario
        </button>
      </div>

      <div className="flex-1 space-y-4">
        {lowStockProducts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
            <p>¡Todo en orden! ✅</p>
            <p>No hay stock crítico.</p>
          </div>
        ) : (
          lowStockProducts.map(product => (
            <div key={product.id} className="flex justify-between items-center p-3 bg-amber-50 rounded-lg border border-amber-100">
              <span className="text-sm font-medium text-slate-700 truncate max-w-[150px]">
                {product.name}
              </span>
              <span className="text-xs font-bold text-amber-700 bg-white px-2 py-1 rounded border border-amber-200">
                {product.stock} un.
              </span>
            </div>
          ))
        )}
      </div>
      
      {lowStockProducts.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-100">
          <button onClick={onNavigate} className="w-full flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-brand-600 transition-colors">
            Gestionar Reabastecimiento <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}