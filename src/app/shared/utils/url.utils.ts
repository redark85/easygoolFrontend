/**
 * Utilidades para manejo de URLs
 */

/**
 * Convierte URLs HTTP a HTTPS para evitar Mixed Content en producción
 */
export function ensureHttps(url: string): string {
  if (!url) return url;
  
  // Si ya es HTTPS, retornar tal como está
  if (url.startsWith('https://')) {
    return url;
  }
  
  // Si es HTTP, convertir a HTTPS
  if (url.startsWith('http://')) {
    return url.replace(/^http:\/\//, 'https://');
  }
  
  // Si es una URL relativa o no tiene protocolo, retornar tal como está
  return url;
}

/**
 * Valida si una URL es segura para usar en producción HTTPS
 */
export function isSecureUrl(url: string): boolean {
  if (!url) return false;
  
  // URLs relativas son seguras
  if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
    return true;
  }
  
  // URLs data: son seguras
  if (url.startsWith('data:')) {
    return true;
  }
  
  // URLs blob: son seguras
  if (url.startsWith('blob:')) {
    return true;
  }
  
  // Solo URLs HTTPS son seguras en producción
  return url.startsWith('https://');
}

/**
 * Convierte URLs de Cloudinary HTTP a HTTPS
 */
export function convertCloudinaryToHttps(url: string): string {
  if (!url) return url;
  
  // Específicamente para Cloudinary
  if (url.includes('res.cloudinary.com') && url.startsWith('http://')) {
    return url.replace(/^http:\/\//, 'https://');
  }
  
  return ensureHttps(url);
}
