'use client';

import { User, Mail, Phone, Shield, CheckCircle2, Calendar } from "lucide-react";
import type { Database } from '@/types/database';

type Usuario = Database['public']['Tables']['usuarios']['Row'];

interface UserInfoCardProps {
  usuario: Usuario;
  avatarUrl: string;
  nombreCompleto: string;
  email: string;
  telefono: string | number | null;
}

export function UserInfoCard({
  usuario,
  avatarUrl,
  nombreCompleto,
  email,
  telefono,
}: UserInfoCardProps) {
  return (
    <div className="lg:col-span-1">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="h-24 bg-gradient-to-br from-gray-100 to-gray-200" />

        <div className="relative px-6 pb-6">
          {/* Avatar */}
          <div className="flex flex-col items-center -mt-12 mb-6">
            <div className="relative group">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                  <User className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>

            <h3 className="font-medium text-lg text-gray-900 mt-4 mb-1">
              {nombreCompleto}
            </h3>
            <p className="text-sm text-gray-500 flex items-center gap-1.5">
              <Mail className="w-4 h-4" />
              {email}
            </p>
            {telefono && (
              <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                <Phone className="w-4 h-4" />
                {telefono}
              </p>
            )}
          </div>

          {/* User Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Shield className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Rol</p>
                <p className="text-sm font-medium text-gray-900 capitalize">
                  {usuario.rol?.replace('_', ' ')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Estado</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 capitalize">
                  {usuario.estado}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Miembro desde</p>
                <p className="text-sm font-medium text-gray-900">
                  {usuario.created_at
                    ? new Date(usuario.created_at).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'Sin fecha'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
