import * as fs from 'fs';
import * as path from 'path';

export class FileUtils {
  /**
   * 检查文件是否存在
   */
  static exists(filePath: string): boolean {
    try {
      return fs.existsSync(filePath);
    } catch {
      return false;
    }
  }

  /**
   * 安全地读取JSON文件
   */
  static readJsonFile<T = any>(filePath: string): T | null {
    try {
      if (!this.exists(filePath)) {
        return null;
      }
      
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * 安全地写入JSON文件
   */
  static writeJsonFile(filePath: string, data: any, formatted: boolean = true): boolean {
    try {
      const content = formatted 
        ? JSON.stringify(data, null, 2) + '\n'
        : JSON.stringify(data);
      
      // 确保目录存在
      const dir = path.dirname(filePath);
      if (!this.exists(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(filePath, content, 'utf-8');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 安全地读取文本文件
   */
  static readTextFile(filePath: string): string | null {
    try {
      if (!this.exists(filePath)) {
        return null;
      }
      
      return fs.readFileSync(filePath, 'utf-8');
    } catch {
      return null;
    }
  }

  /**
   * 安全地写入文本文件
   */
  static writeTextFile(filePath: string, content: string): boolean {
    try {
      const dir = path.dirname(filePath);
      if (!this.exists(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(filePath, content, 'utf-8');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 备份文件
   */
  static backupFile(filePath: string, suffix: string = '.bak'): string | null {
    try {
      if (!this.exists(filePath)) {
        return null;
      }
      
      const backupPath = filePath + suffix;
      fs.copyFileSync(filePath, backupPath);
      return backupPath;
    } catch {
      return null;
    }
  }

  /**
   * 创建目录（递归）
   */
  static ensureDir(dirPath: string): boolean {
    try {
      if (!this.exists(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取文件的修改时间
   */
  static getModifiedTime(filePath: string): Date | null {
    try {
      if (!this.exists(filePath)) {
        return null;
      }
      
      const stats = fs.statSync(filePath);
      return stats.mtime;
    } catch {
      return null;
    }
  }

  /**
   * 检查路径是否为目录
   */
  static isDirectory(path: string): boolean {
    try {
      return fs.statSync(path).isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * 检查路径是否为文件
   */
  static isFile(path: string): boolean {
    try {
      return fs.statSync(path).isFile();
    } catch {
      return false;
    }
  }

  /**
   * 获取文件大小（字节）
   */
  static getFileSize(filePath: string): number | null {
    try {
      if (!this.exists(filePath)) {
        return null;
      }
      
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch {
      return null;
    }
  }

  /**
   * 列出目录中的文件
   */
  static listFiles(dirPath: string, extension?: string): string[] {
    try {
      if (!this.exists(dirPath) || !this.isDirectory(dirPath)) {
        return [];
      }
      
      const files = fs.readdirSync(dirPath);
      
      if (extension) {
        return files.filter(file => path.extname(file) === extension);
      }
      
      return files;
    } catch {
      return [];
    }
  }

  /**
   * 递归查找文件
   */
  static findFiles(dirPath: string, pattern: RegExp): string[] {
    const results: string[] = [];
    
    try {
      if (!this.exists(dirPath) || !this.isDirectory(dirPath)) {
        return results;
      }
      
      const files = fs.readdirSync(dirPath);
      
      for (const file of files) {
        const fullPath = path.join(dirPath, file);
        
        if (this.isDirectory(fullPath)) {
          results.push(...this.findFiles(fullPath, pattern));
        } else if (pattern.test(file)) {
          results.push(fullPath);
        }
      }
    } catch {
      // 忽略错误
    }
    
    return results;
  }
}
