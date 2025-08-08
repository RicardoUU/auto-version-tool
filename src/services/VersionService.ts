import * as fs from 'fs';
import * as path from 'path';
import semver from 'semver';
import { Config } from '../types/Config';

export class VersionService {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  async getCurrentVersion(): Promise<string> {
    const packageJsonPath = path.resolve(this.config.files.packageJson);
    
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error(`package.json 文件不存在: ${packageJsonPath}`);
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      return packageJson.version || '0.0.0';
    } catch (error) {
      throw new Error(`读取 package.json 失败: ${error}`);
    }
  }

  bumpVersion(currentVersion: string, type: 'major' | 'minor' | 'patch'): string {
    const cleanVersion = semver.clean(currentVersion);
    if (!cleanVersion) {
      throw new Error(`无效的版本号: ${currentVersion}`);
    }

    const newVersion = semver.inc(cleanVersion, type);
    if (!newVersion) {
      throw new Error(`无法升级版本: ${currentVersion} -> ${type}`);
    }

    return newVersion;
  }

  async updateVersion(newVersion: string): Promise<void> {
    // 更新 package.json
    await this.updatePackageJson(newVersion);

    // 如果配置了独立的版本文件，也要更新
    if (this.config.files.versionFile) {
      await this.updateVersionFile(newVersion);
    }
  }

  private async updatePackageJson(newVersion: string): Promise<void> {
    const packageJsonPath = path.resolve(this.config.files.packageJson);
    
    try {
      const content = fs.readFileSync(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(content);
      
      packageJson.version = newVersion;
      
      // 保持原有的格式化风格
      const updatedContent = JSON.stringify(packageJson, null, 2) + '\n';
      fs.writeFileSync(packageJsonPath, updatedContent, 'utf-8');
      
      console.log(`✅ 已更新 package.json 版本至 ${newVersion}`);
    } catch (error) {
      throw new Error(`更新 package.json 失败: ${error}`);
    }
  }

  private async updateVersionFile(newVersion: string): Promise<void> {
    if (!this.config.files.versionFile) return;
    
    const versionFilePath = path.resolve(this.config.files.versionFile);
    
    try {
      // 创建版本文件内容
      const versionContent = this.generateVersionFileContent(newVersion);
      fs.writeFileSync(versionFilePath, versionContent, 'utf-8');
      
      console.log(`✅ 已更新版本文件 ${this.config.files.versionFile}`);
    } catch (error) {
      throw new Error(`更新版本文件失败: ${error}`);
    }
  }

  private generateVersionFileContent(version: string): string {
    const timestamp = new Date().toISOString();
    
    // 根据文件扩展名生成不同格式的内容
    const ext = path.extname(this.config.files.versionFile!);
    
    switch (ext) {
      case '.json':
        return JSON.stringify({
          version,
          buildTime: timestamp,
          buildNumber: this.generateBuildNumber()
        }, null, 2);
        
      case '.js':
        return `export const VERSION = '${version}';
export const BUILD_TIME = '${timestamp}';
export const BUILD_NUMBER = '${this.generateBuildNumber()}';
`;
        
      case '.ts':
        return `export const VERSION = '${version}';
export const BUILD_TIME = '${timestamp}';
export const BUILD_NUMBER = '${this.generateBuildNumber()}';
`;
        
      default:
        return `${version}\n`;
    }
  }

  private generateBuildNumber(): string {
    // 生成基于时间戳的构建号
    return Date.now().toString();
  }

  isValidVersion(version: string): boolean {
    return semver.valid(version) !== null;
  }

  compareVersions(version1: string, version2: string): number {
    return semver.compare(version1, version2);
  }

  getNextVersions(currentVersion: string): { 
    patch: string; 
    minor: string; 
    major: string; 
  } {
    return {
      patch: this.bumpVersion(currentVersion, 'patch'),
      minor: this.bumpVersion(currentVersion, 'minor'),
      major: this.bumpVersion(currentVersion, 'major')
    };
  }

  async validateVersionBump(currentVersion: string, targetVersion: string): Promise<boolean> {
    // 检查目标版本是否有效
    if (!this.isValidVersion(targetVersion)) {
      return false;
    }

    // 检查目标版本是否大于当前版本
    return this.compareVersions(targetVersion, currentVersion) > 0;
  }

  async getVersionHistory(): Promise<Array<{ version: string; date: string }>> {
    // 这个方法可以通过读取git标签来获取版本历史
    // 暂时返回空数组，在后续可以和GitService配合实现
    return [];
  }

  generatePreReleaseVersion(baseVersion: string, identifier: string = 'alpha'): string {
    const prereleaseVersion = semver.inc(baseVersion, 'prerelease', identifier);
    if (!prereleaseVersion) {
      throw new Error(`无法生成预发布版本: ${baseVersion}`);
    }
    return prereleaseVersion;
  }

  isPreRelease(version: string): boolean {
    const parsed = semver.parse(version);
    return !!(parsed && parsed.prerelease.length > 0);
  }

  getVersionComponents(version: string): {
    major: number;
    minor: number;
    patch: number;
    prerelease?: string[];
  } {
    const parsed = semver.parse(version);
    if (!parsed) {
      throw new Error(`无效的版本号: ${version}`);
    }

    return {
      major: parsed.major,
      minor: parsed.minor,
      patch: parsed.patch,
      prerelease: parsed.prerelease.length > 0 ? parsed.prerelease as string[] : undefined
    };
  }
}
