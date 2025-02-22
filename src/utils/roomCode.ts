export class RoomCodeGenerator {
    private static readonly CODE_LENGTH = 6;
    private static readonly ALLOWED_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing characters like I, O, 0, 1
    private static readonly PREFIX = 'UNO';
    private static usedCodes = new Set<string>();
  
    public static generateRoomCode(username: string): string {
      const timestamp = Date.now();
      const userInitial = username.charAt(0).toUpperCase();
      
      let code: string;
      do {
        // Generate random part
        const randomPart = Array.from(
          { length: this.CODE_LENGTH - 1 }, 
          () => this.ALLOWED_CHARS[Math.floor(Math.random() * this.ALLOWED_CHARS.length)]
        ).join('');
  
        // Combine parts to create unique code
        code = `${this.PREFIX}-${userInitial}${randomPart}`;
      } while (this.usedCodes.has(code));
  
      // Add to used codes
      this.usedCodes.add(code);
  
      // Clear old codes periodically (optional)
      if (this.usedCodes.size > 10000) {
        this.usedCodes.clear();
      }
  
      return code;
    }
  
    public static isValidRoomCode(code: string): boolean {
      const pattern = new RegExp(`^${this.PREFIX}-[A-Z][${this.ALLOWED_CHARS}]{${this.CODE_LENGTH - 1}}$`);
      return pattern.test(code);
    }
  
    public static releaseRoomCode(code: string): void {
      this.usedCodes.delete(code);
    }
  }