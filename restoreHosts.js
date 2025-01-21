#!/usr/bin/env node

"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");

const appName = "Easy GitHub Hosts";

/**
 * 恢复 HOSTS 文件的备份
 */
function restoreHosts() {
    console.log(`${appName}: Starting restoration`);

    console.log(`${appName}: Windows directory: ${process.env.WINDIR || "C:\\Windows"}`);

    // 获取 Windows 目录路径，如果没有设置 WINDIR 环境变量，则使用默认路径 "C:\\Windows"
    const windowsDir = process.env.WINDIR || "C:\\Windows";

    // 根据操作系统类型设置 hosts 文件路径
    const hostsPath = os.type().includes("Windows") ? path.join(windowsDir, "System32", "drivers", "etc", "hosts") : "/etc/hosts";

    // 设置备份文件路径
    const backupPath = path.join(__dirname, 'files/backup', `hostsfile.backup`);

    // 检查备份文件是否存在
    if (!fs.existsSync(backupPath)) {
        console.error(`${appName}: ERROR - Backup file not found: ${backupPath}`);
        process.exit(1);
    }

    try {
        // 复制备份文件到 hosts 文件路径
        fs.copyFileSync(backupPath, hostsPath);
        console.log(`${appName}: Successfully restored HOSTS file from backup`);
        process.exit(0);
    } catch (err) {
        // 捕获并处理复制过程中的错误
        console.error(`${appName}: ERROR - An unexpected error occurred while restoring:`, err);
        process.exit(1);
    }
}

module.exports = { restoreHosts };

// 如果当前模块是主模块，则执行 restoreHosts 函数
if (require.main === module) {
    restoreHosts();
}
