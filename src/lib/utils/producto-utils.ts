export function generateSKU(nombre: string, categoriaNombre: string, id: string | number): string {
  // Obtener primeras 3 letras del nombre
  const abrProd = nombre.trim().substring(0, 3).toUpperCase();
  // Obtener primeras 3 letras de la categoría
  const abrCat = categoriaNombre.trim().substring(0, 3).toUpperCase();
  // Limpiar el ID (si es UUID, tomar los últimos 4 dígitos; si es serial, usarlo tal cual)
  const shortId = id.toString().includes('-') 
    ? id.toString().split('-').pop()?.substring(0, 4) 
    : id;

  return `${abrProd}-${abrCat}-${shortId}`;
}