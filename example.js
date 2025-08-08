#!/usr/bin/env node

/**
 * 简单的使用示例
 * 演示如何在项目中集成和使用 auto-version-tool
 */

const { AutoVersionTool } = require('./dist');

async function main() {
  try {
    console.log('🚀 Auto Version Tool 示例');
    console.log('='.repeat(50));

    // 创建工具实例
    const tool = new AutoVersionTool();

    // 显示当前状态
    console.log('📊 当前状态:');
    await tool.showStatus('main');

    console.log('\n' + '='.repeat(50));
    console.log('💡 提示:');
    console.log('1. 运行 "auto-version init" 创建配置文件');
    console.log('2. 运行 "auto-version bump" 更新版本');
    console.log('3. 运行 "auto-version bump --dry-run" 预览更改');
    console.log('4. 运行 "auto-version status" 查看状态');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    
    if (error.message.includes('不是git仓库')) {
      console.log('\n💡 解决方案:');
      console.log('1. 确保在git仓库目录中运行此工具');
      console.log('2. 如果是新项目，先运行 "git init"');
    }
  }
}

if (require.main === module) {
  main();
}
