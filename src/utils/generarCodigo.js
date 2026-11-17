// src/utils/generarCodigo.js
export function generarCodigo(prefijo = 'P') {
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `${prefijo}${timestamp}${random}`;
}
