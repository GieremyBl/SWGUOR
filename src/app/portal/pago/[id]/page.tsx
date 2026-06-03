'use client';

import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const PAISES_SUDAMERICA = ['Perú', 'Argentina', 'Bolivia'];

const METODOS_PAGO = [
  {
    id: 'yape',
    nombre: 'Yape',
    descripcion: 'Pago inmediato con código QR',
    imagen: '/images/yape.png',
  },
  {
    id: 'tarjeta',
    nombre: 'Tarjeta',
    descripcion: 'Visa, Mastercard',
    imagen: '/images/visa.png',
  },
  {
    id: 'transferencia',
    nombre: 'Transferencia',
    descripcion: 'BCP, Interbank, BBVA',
    imagen: '/images/transferencia.png',
  },
];

export default function PagoPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const totalBase = Number(searchParams.get('total')) || 0;
  const cantidad = Number(searchParams.get('cantidad')) || 1;
  const nombre = searchParams.get('nombre') || 'Producto';
  const [cupon, setCupon] = useState('');
  const [descuento, setDescuento] = useState(0);

  const totalFinal = totalBase - descuento;

  const [metodo, setMetodo] = useState(
    searchParams.get('metodo') || ''
  );

  const [datosEntrega, setDatosEntrega] = useState({
    pais: 'Perú',
    departamento: '',
    distrito: '',
    direccion: '',
    referencia: '',
  });

  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success' as 'success' | 'error',
  });

  const mostrarToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });

    setTimeout(() => {
      setToast({ ...toast, show: false });
    }, 2500);
  };

  const handleAplicarCupon = () => {
    if (cupon.toLowerCase() === 'fifi10') {
      setDescuento(10);
      mostrarToast('Cupón aplicado', 'success');
    } else {
      setDescuento(0);
      mostrarToast('Cupón inválido', 'error');
    }
  };

  const handleConfirmar = () => {
    mostrarToast('Pago ', 'success');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">

      {/*TOAST */}
      {toast.show && (
        <div
          className={cn(
            'fixed top-6 right-6 z-50 px-6 py-3 rounded-xl text-white font-bold shadow-lg transition-all',
            toast.type === 'success'
              ? 'bg-green-500'
              : 'bg-red-500'
          )}
        >
          {toast.message}
        </div>
      )}

      <div className="grid grid-cols-3 gap-8 max-w-6xl mx-auto">

        {/* IZQUIERDA */}
        <div className="col-span-2 space-y-6">

          {/* DIRECCIÓN */}
          <div className="bg-white p-6 rounded-2xl shadow">
            <h2 className="font-black text-lg mb-4 text-slate-500">
              Dirección
            </h2>

            <select className="w-full mb-3 p-3 border rounded-xl text-slate-500">
              {PAISES_SUDAMERICA.map((pais) => (
                <option key={pais}>{pais}</option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Departamento" className="p-3 border rounded-xl text-slate-500" />
              <input placeholder="Distrito" className="p-3 border rounded-xl text-slate-500" />
            </div>

            <input placeholder="Dirección" className="w-full mt-3 p-3 border rounded-xl text-slate-500" />
            <input placeholder="Referencia" className="w-full mt-3 p-3 border rounded-xl text-slate-500" />
          </div>

          {/* PROMOCIONES */}
          <div className="bg-white p-6 rounded-2xl shadow">
            <h2 className="font-black text-lg mb-4 text-slate-500">
              Promociones
            </h2>

            <div className="flex gap-3">
              <input
                value={cupon}
                onChange={(e) => setCupon(e.target.value)}
                placeholder="Ingresa tu cupón"
                className="flex-1 p-3 border rounded-xl text-slate-500"
              />

              <button
                onClick={handleAplicarCupon}
                className="px-4 rounded-xl bg-[#231e1d] text-[#e4c28a] font-bold"
              >
                Aplicar
              </button>
            </div>
          </div>

          {/* MÉTODO */}
          <div className="bg-white p-6 rounded-2xl shadow">
            <h2 className="font-black text-lg mb-4 text-slate-500">
              Método de pago
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {METODOS_PAGO.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMetodo(m.id)}
                  className={cn(
                    'p-4 rounded-xl border flex items-center gap-3',
                    metodo === m.id
                      ? 'border-black'
                      : 'border-gray-200'
                  )}
                >
                  <Image src={m.imagen} alt={m.nombre} width={30} height={30} />
                  <p className="text-slate-500 font-bold">{m.nombre}</p>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* DERECHA */}
        <div className="bg-white p-6 rounded-2xl shadow h-fit sticky top-8">
          <h2 className="font-black text-lg mb-4 text-slate-500">
            Mis prendas (1)
          </h2>

          <div className="flex justify-between text-sm mb-3 text-slate-500">
              <span>{nombre} x{cantidad}</span>
              <span>S/ {totalBase}</span>
            </div>

          {descuento > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Descuento</span>
              <span>-S/ {descuento}</span>
            </div>
          )}

          <hr className="my-3" />

          <div className="flex justify-between font-black text-lg mt-2 text-[#231e1d]">
            <span>Total a pagar</span>
            <span>S/ {totalFinal}</span>
          </div>

          <button
            onClick={handleConfirmar}
            className="w-full mt-6 py-3 rounded-xl bg-[#231e1d] text-[#e4c28a] font-bold"
          >
            Pagar
          </button>
        </div>

      </div>
    </div>
  );
}