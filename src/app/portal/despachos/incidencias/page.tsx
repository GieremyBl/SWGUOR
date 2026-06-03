'use client';

import { useState } from 'react';
import { X, Upload, AlertCircle, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function ReportarIncidenciaPage() {
  const [loading, setLoading] = useState(false);

  // En un caso real, obtendríamos el ID de la URL
  const despachoId = "DES-8821"; 

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulación de envío
    setTimeout(() => {
      setLoading(false);
      alert("Incidencia enviada con éxito");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        
        {/* Cabecera con botón volver */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Link href="/portal/despachos" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ChevronLeft size={20} className="text-slate-500" />
            </Link>
            <h1 className="text-xl font-bold text-slate-900">Reportar Incidencia</h1>
          </div>
          <Link href="/portal/despachos" className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Caja azul con el ID del Despacho (Igual a tu prototipo) */}
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
            <p className="text-blue-700 text-sm">
              Despacho: <span className="font-bold">{despachoId}</span>
            </p>
          </div>

          {/* Tipo de Incidencia */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Tipo de Incidencia <span className="text-red-500">*</span>
            </label>
            <select required className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">Selecciona una opción</option>
              <option value="retraso">Retraso en la entrega</option>
              <option value="danado">Producto dañado / mal estado</option>
              <option value="incompleto">Pedido incompleto</option>
            </select>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Descripción del Problema <span className="text-red-500">*</span>
            </label>
            <textarea 
              required
              rows={4}
              placeholder="Describe detalladamente el problema que experimentaste..."
              className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          {/* Subida de Archivos */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Adjuntar Evidencia (Opcional)
            </label>
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
              <Upload className="text-slate-400 mb-2" size={32} />
              <p className="text-sm text-slate-600 font-medium">Haz clic para subir una imagen o PDF</p>
              <p className="text-xs text-slate-400 mt-1">Formatos soportados: JPG, PNG, PDF (máx. 5MB)</p>
            </div>
          </div>

          {/* Botones (Igual a tu prototipo) */}
          <div className="flex gap-4 pt-4">
            <Link 
              href="/portal/despachos"
              className="flex-1 py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-center transition-colors"
            >
              Cancelar
            </Link>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-200 disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar Reporte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
