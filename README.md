# 🚀 GUÍA COMPLETA - SISTEMA GUOR V2

## 📌 Descripción del Proyecto

**SWGUOR ** es un **sistema integral de gestión administrativa para la industria textil**. 

### ¿Qué permite hacer?
✅ Gestionar catálogo de productos  
✅ Administrar pedidos y cotizaciones  
✅ Controlar inventario y stock  
✅ Gestionar clientes y vendedores  
✅ Administrar talleres externos  
✅ Generar reportes y estadísticas  
✅ Sistema de roles y permisos  
✅ Dashboard en tiempo real  
✅ Chat con IA integrado  

### Tech Stack
- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth + JWT
- **UI Framework**: Tailwind CSS + Shadcn UI
- **Backend**: Next.js API Routes + Server Actions
- **IA**: Groq + Anthropic
- **Exportación**: Excel (XLSX) + PDF

---

## ✅ Requisitos Previos

Antes de empezar, **debes tener instalado**:

| Requisito | Versión | Descargar |
|-----------|---------|-----------|
| Node.js | v18+ | [nodejs.org](https://nodejs.org/) |
| npm | 9+ | (viene con Node.js) |
| Git | Cualquiera | [git-scm.com](https://git-scm.com/) (opcional) |

### Verificar que tengas todo
```bash
node --version
npm --version
git --version
```

### Crear cuenta en Supabase
1. Ve a [supabase.com](https://supabase.com/)
2. Crea una cuenta (gratis)
3. Crea un nuevo proyecto

---

## 🔧 INSTALACIÓN PASO A PASO

### 1️⃣ Descargar el Proyecto

**Opción A - Desde Git:**
```bash
git clone <tu-repositorio-url>
cd sistema-guor-v2
```

**Opción B - Desde ZIP:**
1. Descarga el archivo ZIP
2. Extrae en tu carpeta de proyectos
3. Abre terminal en esa carpeta

### 2️⃣ Instalar Dependencias

```bash
npm install
```

⏱️ **Tiempo**: 3-5 minutos (primera vez)

**¿Qué hace?** Descarga todas las librerías necesarias (React, Next.js, Supabase, etc.)

### 3️⃣ Crear Archivo .env.local

En la **raíz del proyecto**, crea un archivo llamado `.env.local`:

```
.env.local
↓
(este archivo en la carpeta principal, junto a package.json)
```

**Contenido del archivo:**
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# IA API Keys (Opcional)
GROQ_API_KEY=gsk_...
ANTHROPIC_API_KEY=sk-ant-...
```

### 🔐 Cómo obtener las claves de Supabase

1. **Entra a tu proyecto** en supabase.com
2. Ve a **Settings** (abajo a la izquierda)
3. Selecciona **API** en el menú

**Busca estos valores:**

| En la web | En tu .env.local |
|-----------|------------------|
| **Project URL** | `NEXT_PUBLIC_SUPABASE_URL` |
| **anon public** (en la sección Anon key) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **service_role** (en la sección Service role) | `SUPABASE_SERVICE_ROLE_KEY` |

**Ejemplo:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xyzabcd123.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4️⃣ Crear las Tablas en Supabase

Tu base de datos necesita estas tablas:

**Accede a tu proyecto en Supabase:**
1. Dashboard → SQL Editor
2. Ejecuta estos comandos:

```sql
-- Tabla: usuarios
CREATE TABLE usuarios (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  email VARCHAR UNIQUE NOT NULL,
  nombre VARCHAR NOT NULL,
  rol VARCHAR DEFAULT 'recepcionista',
  estado BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla: categorias
CREATE TABLE categorias (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nombre VARCHAR UNIQUE NOT NULL,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla: productos
CREATE TABLE productos (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nombre VARCHAR NOT NULL,
  descripcion TEXT,
  sku VARCHAR UNIQUE NOT NULL,
  precio FLOAT NOT NULL,
  stock INT DEFAULT 0,
  stock_minimo INT DEFAULT 400,
  categoria_id BIGINT NOT NULL REFERENCES categorias(id),
  imagen VARCHAR,
  estado VARCHAR DEFAULT 'activo',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla: pedidos
CREATE TABLE pedidos (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  numero VARCHAR UNIQUE NOT NULL,
  cliente_id BIGINT REFERENCES clientes(id),
  estado VARCHAR DEFAULT 'pendiente',
  total FLOAT DEFAULT 0,
  fecha_entrega TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla: clientes
CREATE TABLE clientes (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nombre VARCHAR NOT NULL,
  email VARCHAR,
  telefono VARCHAR,
  direccion TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## ▶️ EJECUTAR EL PROYECTO

### En Desarrollo (Recomendado)

```bash
npm run dev
```

**Espera a ver:**
```
✓ Next.js 16.0.10
✓ Ready in 2.5s
✓ Local: http://localhost:3000
```

### Abrir en Navegador

```
http://localhost:3000
```

**Deberías ver la página de login.**

### Detener el servidor

Presiona `Ctrl + C` en la terminal

---

## 🔑 PRIMER ACCESO - LOGIN

### Crear tu Usuario Administrativo

**En Supabase:**
1. Ve a **Authentication** → **Users**
2. Click **Add user** (arriba a la derecha)
3. Completa:
   - Email: `admin@ejemplo.com`
   - Password: Una contraseña fuerte

4. Luego ve a **SQL Editor** y ejecuta:
```sql
INSERT INTO usuarios (email, nombre, rol) 
VALUES ('admin@ejemplo.com', 'Administrador', 'administrador');
```

### Ingresa a la aplicación

1. Ve a `http://localhost:3000/admin/login`
2. Usa: 
   - Email: `admin@ejemplo.com`
   - Password: (la que creaste)
3. ¡Deberías ver el Dashboard!

---

## 📊 Estructura del Proyecto

```
sistema-guor-v2/
├── src/
│   ├── app/
│   │   ├── admin/                          # Panel Administrativo
│   │   │   ├── login/                     # Página de login
│   │   │   ├── Panel-Administrativo/      # Menú principal
│   │   │   │   ├── dashboard/             # 📊 Dashboard principal
│   │   │   │   ├── productos/             # 📦 Gestión de productos
│   │   │   │   ├── pedidos/               # 📋 Gestión de pedidos
│   │   │   │   ├── clientes/              # 👥 Base de datos de clientes
│   │   │   │   ├── usuarios/              # 👤 Gestión de usuarios
│   │   │   │   ├── inventario/            # 📊 Control de stock
│   │   │   │   ├── categorias/            # 🏷️ Categorías de productos
│   │   │   │   ├── talleres/              # 🏭 Talleres externos
│   │   │   │   ├── ventas/                # 💰 Reportes
│   │   │   │   ├── cotizaciones/          # 📄 Cotizaciones
│   │   │   │   ├── notifiaciones/         # 🔔 Notificaciones
│   │   │   │   ├── pagos/                 # 💳 Gestión de pagos
│   │   │   │   ├── despachos/             # 🚚 Control de envíos
│   │   │   │   └── confecciones/          # 👗 Confecciones
│   │   │   └── acceso-denegado/           # 🚫 Página de acceso denegado
│   │   ├── api/                           # API Routes
│   │   │   ├── admin/
│   │   │   ├── productos/
│   │   │   ├── pedidos/
│   │   │   └── chat/
│   │   └── (public)/                      # Páginas públicas
│   │
│   ├── components/                        # Componentes reutilizables
│   │   ├── admin/                        # Componentes de admin
│   │   ├── ui/                           # UI Components (shadcn)
│   │   └── chatbot/                      # Chat IA
│   │
│   ├── lib/
│   │   ├── hooks/                        # Custom Hooks
│   │   ├── supabase/                     # Config de Supabase
│   │   ├── utils/                        # Funciones útiles
│   │   ├── constants/                    # Constantes
│   │   └── cache.ts                      # Sistema de caché
│   │
│   ├── types/                            # TypeScript Types
│   ├── config/                           # Configuración
│   └── middleware.ts                     # Middleware de auth
│
├── prisma/                               # Schema (si usas Prisma)
├── public/                               # Archivos estáticos
├── .env.local                            # Variables de entorno ⚠️
├── package.json                          # Dependencias
├── next.config.ts                        # Config de Next.js
└── tsconfig.json                         # Config de TypeScript
```

---

## 🎯 Características Principales

### 📦 Productos
- ✅ Ver todos los productos
- ✅ Crear nuevos productos
- ✅ Editar productos existentes
- ✅ Eliminar productos
- ✅ Buscar por nombre o SKU
- ✅ Filtrar por categoría y estado
- ✅ Ajustar stock
- ✅ Exportar a Excel
- ✅ Exportar a PDF
- ✅ Importar desde Excel

### 📋 Pedidos
- ✅ Ver lista de pedidos
- ✅ Crear nuevos pedidos
- ✅ Seguimiento de estado
- ✅ Asignar a talleres
- ✅ Cambiar fecha de entrega
- ✅ Historial de cambios

### 👥 Clientes
- ✅ Base de datos completa
- ✅ Información de contacto
- ✅ Historial de compras
- ✅ Segmentación por vendedor

### 👤 Usuarios
- ✅ Crear usuarios
- ✅ Asignar roles
- ✅ Cambiar contraseña
- ✅ Activar/desactivar usuarios

### 📊 Dashboard
- ✅ Estadísticas en tiempo real
- ✅ Gráficos de ventas
- ✅ Alertas de stock bajo
- ✅ KPIs principales

---

## 🔐 Roles y Permisos

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| **administrador** | Control total | Todos los módulos |
| **diseñador** | Crea diseños | Productos, Pedidos, Dashboard |
| **representante_taller** | Representa taller | Pedidos, Dashboard |
| **cortador** | Especialista textil | Solo sus pedidos |
| **ayudante** | Asistencia general | Pedidos, Dashboard |
| **recepcionista** | Recibe pedidos | Pedidos, Clientes, Dashboard |

---

## ⚙️ Comandos Útiles

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Inicia en desarrollo |
| `npm run build` | Compila para producción |
| `npm start` | Inicia servidor de producción |
| `npm run lint` | Revisa errores de código |

---

## 🐛 Solución de Problemas

### Error: "NEXT_PUBLIC_SUPABASE_URL is undefined"
```bash
✓ Verifica que exista .env.local
✓ Reinicia el servidor: npm run dev
✓ Asegúrate de que las claves sean correctas
```

### Error: "Cannot connect to database"
```bash
✓ Verifica que tengas internet
✓ Revisa tus claves de Supabase
✓ Verifica que las tablas existan
```

### Error: "Port 3000 already in use"
```bash
npm run dev -- -p 3001
```

### Los cambios no se ven
```bash
rm -rf .next
npm run dev
```

---

## 🚀 Deploy a Producción

### Opción 1: Vercel (Recomendado)

1. Sube a GitHub
2. Ve a [vercel.com](https://vercel.com)
3. Conecta tu repositorio
4. Configura variables de entorno
5. Deploy automático

### Opción 2: Tu Servidor

```bash
npm run build
npm start
```

---

## 📚 Documentación Adicional

- 📄 [README.md](README.md) - Descripción general
- 📄 [README_PRODUCTOS.md](README_PRODUCTOS.md) - Guía del módulo de Productos
- 📄 [CONEXION_SUPABASE_PRODUCTOS.md](CONEXION_SUPABASE_PRODUCTOS.md) - Detalles técnicos
- 📄 [VERIFICACION_PRODUCTOS.md](VERIFICACION_PRODUCTOS.md) - Checklist de pruebas

---

## 💡 Tips Importante

### En Desarrollo
- ✅ Usa las DevTools (F12) para ver errores
- ✅ Revisa la consola del navegador
- ✅ Los cambios se recargan automáticamente

### Seguridad
- ⚠️ **NUNCA** compartas tu `.env.local`
- ⚠️ **NUNCA** hagas commit de `.env.local`
- ⚠️ Usa variables diferentes para desarrollo y producción
- ✅ Revisa que `.gitignore` incluya `.env.local`

### Base de Datos
- ✅ Realiza backups regularmente
- ✅ Usa transacciones en operaciones críticas
- ✅ Monitorea el uso en Supabase

---

## ✨ Próximos Pasos

### Una vez instalado:
1. ✅ Accede al dashboard
2. ✅ Crea algunos productos de prueba
3. ✅ Explora los módulos
4. ✅ Ajusta la configuración
5. ✅ Invita a otros usuarios

---

## 🤝 Soporte y Ayuda

Si encuentras problemas:
1. Revisa los logs en la terminal
2. Abre la consola del navegador (F12)
3. Verifica tu `.env.local`
4. Consulta la documentación adicional

---

## 📞 Información del Proyecto

| Item | Valor |
|------|-------|
| Nombre | Sistema GUOR V2 |
| Versión | 0.1.0 |
| Estado | En Desarrollo |
| Node.js | v18+ |
| npm | 9+ |
| Framework | Next.js 15 |

---

## ✅ Checklist Final

Antes de empezar, asegúrate de:

- [ ] Node.js v18+ instalado
- [ ] npm actualizado
- [ ] Cuenta en Supabase creada
- [ ] Proyecto en Supabase configurado
- [ ] `.env.local` creado con claves correctas
- [ ] Tablas creadas en base de datos
- [ ] `npm install` ejecutado
- [ ] `npm run dev` funcionando
- [ ] Puedes acceder a `http://localhost:3000`

---

## 🎉 ¡Listo!

**Para empezar ahora mismo:**

```bash
npm install
npm run dev
```

Luego abre en el navegador:
```
http://localhost:3000/admin/login
```

**¡Bienvenido a SWGUOR!** 🚀
