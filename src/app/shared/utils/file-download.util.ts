/**
 * Utilidad para descargar archivos desde el directorio public
 */
export class FileDownloadUtil {
  
  /**
   * Descarga un archivo desde una ruta específica
   * @param filePath Ruta del archivo en el directorio public (ej: 'docs/Equipo.xlsx')
   * @param fileName Nombre con el que se descargará el archivo (ej: 'Equipo')
   * @param fileExtension Extensión del archivo (ej: 'xlsx', 'pdf', 'docx')
   * @returns Promise<boolean> - true si la descarga fue exitosa
   */
  static async downloadFile(
    filePath: string, 
    fileName: string, 
    fileExtension: string
  ): Promise<boolean> {
    try {
      // Construir la URL completa del archivo
      const fileUrl = `/${filePath}`;
      
      // Realizar fetch del archivo
      const response = await fetch(fileUrl);
      
      if (!response.ok) {
        throw new Error(`Error al descargar el archivo: ${response.status} ${response.statusText}`);
      }
      
      // Obtener el blob del archivo
      const blob = await response.blob();
      
      // Crear URL temporal para el blob
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Crear elemento anchor temporal para la descarga
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = `${fileName}.${fileExtension}`;
      downloadLink.style.display = 'none';
      
      // Agregar al DOM, hacer click y remover
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Limpiar URL temporal
      window.URL.revokeObjectURL(blobUrl);
      
      return true;
    } catch (error) {
      console.error('Error downloading file:', error);
      return false;
    }
  }
  
  /**
   * Descarga específicamente el archivo de ejemplo de equipos
   * @returns Promise<boolean> - true si la descarga fue exitosa
   */
  static async downloadTeamExampleFile(): Promise<boolean> {
    return this.downloadFile('docs/Equipo.xlsx', 'Equipo', 'xlsx');
  }
  
  /**
   * Obtiene el tipo MIME basado en la extensión del archivo
   * @param extension Extensión del archivo
   * @returns string - Tipo MIME correspondiente
   */
  static getMimeType(extension: string): string {
    const mimeTypes: { [key: string]: string } = {
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'xls': 'application/vnd.ms-excel',
      'pdf': 'application/pdf',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'doc': 'application/msword',
      'txt': 'text/plain',
      'csv': 'text/csv'
    };
    
    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }
  
  /**
   * Valida si una extensión de archivo es soportada
   * @param extension Extensión del archivo
   * @returns boolean - true si es soportada
   */
  static isSupportedExtension(extension: string): boolean {
    const supportedExtensions = ['xlsx', 'xls', 'pdf', 'docx', 'doc', 'txt', 'csv'];
    return supportedExtensions.includes(extension.toLowerCase());
  }
}
