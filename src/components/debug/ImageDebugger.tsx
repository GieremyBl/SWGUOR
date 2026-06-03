'use client';

import { useState } from 'react';
import { getSupabaseImageUrl } from '@/lib/utils/supabase-image-utils';

/**
 * Componente de Debug para verificar URLs de imágenes desde Supabase
 * Úsalo para verificar si las imágenes se cargan correctamente
 */
interface ImageDebugInfo {
  originalPath: string;
  supabaseUrl: string | null;
  isAccessible: boolean;
  error?: string;
  responseStatus?: number;
  responseTime?: number;
}

export default function ImageDebugger() {
  const [debugInfo, setDebugInfo] = useState<ImageDebugInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const testImageUrl = async (imagePath: string) => {
    const startTime = performance.now();
    const supabaseUrl = getSupabaseImageUrl(imagePath, 'productos');

    try {
      if (!supabaseUrl) {
        setDebugInfo((prev) => [
          ...prev,
          {
            originalPath: imagePath,
            supabaseUrl: null,
            isAccessible: false,
            error: 'No se pudo construir URL de Supabase',
          },
        ]);
        return;
      }

      const response = await fetch(supabaseUrl, {
        method: 'HEAD',
        mode: 'cors',
      });

      const responseTime = performance.now() - startTime;

      setDebugInfo((prev) => [
        ...prev,
        {
          originalPath: imagePath,
          supabaseUrl,
          isAccessible: response.ok,
          responseStatus: response.status,
          responseTime: Math.round(responseTime),
        },
      ]);
    } catch (error) {
      const responseTime = performance.now() - startTime;

      setDebugInfo((prev) => [
        ...prev,
        {
          originalPath: imagePath,
          supabaseUrl,
          isAccessible: false,
          error: error instanceof Error ? error.message : 'Error desconocido',
          responseTime: Math.round(responseTime),
        },
      ]);
    }
  };

  const handleTestSingleImage = async () => {
    setLoading(true);
    setDebugInfo([]);

    // Prueba con una ruta de ejemplo
    await testImageUrl('test-image.jpg');

    setLoading(false);
  };

  const handleTestMultipleImages = async () => {
    setLoading(true);
    setDebugInfo([]);

    // Prueba con mehrere rutas de ejemplo
    const testPaths = [
      'test-image.jpg',
      'producto1/imagen.jpg',
      'categorias/vestidos/banner.jpg',
    ];

    for (const path of testPaths) {
      await testImageUrl(path);
    }

    setLoading(false);
  };

  return (
    <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Debug: Verificador de Imágenes Supabase</h2>

      <p className="text-gray-600 mb-6">
        Esta herramienta ayuda a verificar si tus imágenes en Supabase Storage se están cargando correctamente.
      </p>

      {/* Botones de acción */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={handleTestSingleImage}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Probando...' : 'Probar imagen única'}
        </button>
        <button
          onClick={handleTestMultipleImages}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Probando...' : 'Probar múltiples imágenes'}
        </button>
      </div>

      {/* Resultados */}
      {debugInfo.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Resultados:</h3>

          {debugInfo.map((info, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 ${
                info.isAccessible
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="mb-2">
                <p className="font-mono text-sm text-gray-700">
                  <strong>Path original:</strong> {info.originalPath}
                </p>
              </div>

              {info.supabaseUrl && (
                <div className="mb-2">
                  <p className="font-mono text-xs text-gray-600 break-all">
                    <strong>URL generada:</strong>{' '}
                    <a href={info.supabaseUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {info.supabaseUrl}
                    </a>
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    info.isAccessible ? 'bg-green-600' : 'bg-red-600'
                  }`}
                ></div>
                <span className={info.isAccessible ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
                  {info.isAccessible ? '✓ Accesible' : '✗ No accesible'}
                </span>
              </div>

              {info.responseStatus && (
                <p className="text-sm text-gray-600 mt-2">
                  <strong>Estado HTTP:</strong> {info.responseStatus}
                </p>
              )}

              {info.responseTime && (
                <p className="text-sm text-gray-600">
                  <strong>Tiempo de respuesta:</strong> {info.responseTime}ms
                </p>
              )}

              {info.error && (
                <p className="text-sm text-red-700 mt-2">
                  <strong>Error:</strong> {info.error}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Información de configuración */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Información de Configuración:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ Supabase URL está configurada: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Sí' : 'No'}</li>
          <li>✓ Supabase Anon Key está configurada: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Sí' : 'No'}</li>
          <li>
            Próximo paso: Asegúrate de tener{' '}
            <strong>buckets públicos</strong> en tu Supabase Storage
          </li>
        </ul>
      </div>
    </div>
  );
}
