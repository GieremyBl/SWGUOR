import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('--- Diagnóstico de Datos para Botica Juan ---');
  
  // Buscar clientes que contengan "Botica" o "Juan"
  const clientes = await prisma.clientes.findMany({
    where: {
      OR: [
        { razon_social: { contains: 'Botica', mode: 'insensitive' } },
        { nombre_comercial: { contains: 'Botica', mode: 'insensitive' } },
      ],
    },
  });

  if (clientes.length === 0) {
    console.log('No se encontró ningún cliente con ese nombre.');
    return;
  }

  for (const c of clientes) {
    console.log(`\nCliente: ID=${c.id}, Razón Social="${c.razon_social}", RUC=${c.ruc}`);
    
    // Contar cotizaciones por estado
    const cots = await prisma.cotizaciones.findMany({
      where: { cliente_id: c.id },
    });
    console.log(`Total cotizaciones: ${cots.length}`);
    const cotsPorEstado = cots.reduce((acc: any, curr: any) => {
      acc[curr.estado] = (acc[curr.estado] || 0) + 1;
      return acc;
    }, {});
    console.log('Cotizaciones por estado:', cotsPorEstado);

    // Contar pedidos por estado
    const peds = await prisma.pedidos.findMany({
      where: { cliente_id: c.id },
    });
    console.log(`Total pedidos: ${peds.length}`);
    const pedsPorEstado = peds.reduce((acc: any, curr: any) => {
      acc[curr.estado] = (acc[curr.estado] || 0) + 1;
      return acc;
    }, {});
    console.log('Pedidos por estado:', pedsPorEstado);
    
    // Ver los últimos 3 pedidos
    console.log('Últimos 3 pedidos en la DB:');
    peds.slice(0, 3).forEach(p => {
      console.log(`  - ID=${p.id}, Estado=${p.estado}, Total=${p.total}, Creado=${p.created_at}`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
