'use client';

import { useParams } from 'next/navigation';

export default function ComprobantePage() {
  const params = useParams<{ id: string }>();

  const handleDescargar = () => {
    const contenido = `
      COMPROBANTE DE PAGO
      
      
      
    `;

    const blob = new Blob([contenido], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `comprobante_${params.id}.pdf`;
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Comprobante de pago</h1>

      {/* Placeholder :p!!*/}
      <div className="p-4 border rounded-xl bg-white">
        <p>Pedido ID: {params.id}</p>
        <p>Datos del pago (placeholder)</p>
      </div>

      {/* Botón descargar */}
      <button
        onClick={handleDescargar}
        className="w-full bg-black text-white py-3 rounded-xl"
      >
        Descargar PDF
      </button>
    </div>
  );
}