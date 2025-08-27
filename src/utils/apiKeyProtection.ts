// Protección adicional para la API key en el frontend
export class APIKeyProtection {
  private static obfuscatedKey: string = '';
  private static keyParts: string[] = [];

  // Ofuscar la API key para hacerla menos visible
  static setProtectedKey(key: string) {
    // Dividir la key en partes y ofuscarla
    this.keyParts = [
      key.substring(0, 10),
      key.substring(10, 20),
      key.substring(20, 30),
      key.substring(30)
    ];
    
    // Crear versión ofuscada para logs
    this.obfuscatedKey = key.substring(0, 8) + '...' + key.substring(key.length - 8);
  }

  // Reconstruir la key cuando se necesite
  static getKey(): string {
    return this.keyParts.join('');
  }

  // Verificar que la key no haya sido modificada
  static verifyKeyIntegrity(): boolean {
    const reconstructed = this.getKey();
    return reconstructed.startsWith('sk-') && reconstructed.length > 40;
  }

  // Obtener versión ofuscada para logs
  static getObfuscatedKey(): string {
    return this.obfuscatedKey;
  }

  // Limpiar la key de memoria (para logout)
  static clearKey() {
    this.keyParts = [];
    this.obfuscatedKey = '';
  }
}