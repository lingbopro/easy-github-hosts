#!/usr/bin/env node

import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appName = "Easy GitHub Hosts";

/**
 * 恢复 HOSTS 文件的备份
 */
export function restoreHosts() {
    console.log(`${appName}: Starting restoration`);

    // 之前为什么要用hosts路径作为文件名呢... 嗨嗨嗨，你问我？
    const windowsDir = process.env.WINDIR || "C:\\Windows";

    const hostsPath = os.type().includes("Windows") 
        ? path.join(windowsDir, "System32", "drivers", "etc", "hosts")
        : "/etc/hosts";

    const backupPath = path.join(__dirname, 'files/backup', `hostsfile.backup`);

    if (!fs.existsSync(backupPath)) {
        console.error(`${appName}: ERROR - Backup file not found: ${backupPath}`);
        process.exit(1);
    }

    try {
        fs.copyFileSync(backupPath, hostsPath);
        console.log(`${appName}: Successfully restored HOSTS file from backup`);
        process.exit(0);
    } catch (err) {
        console.error(`${appName}: ERROR - An unexpected error occurred while restoring:`, err);
        process.exit(1);
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    restoreHosts();
}