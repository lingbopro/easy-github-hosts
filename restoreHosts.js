#!/usr/bin/env node

"use strict";

const fs = require("fs");
const os = require("os");

const appName = "Easy GitHub Hosts";

/**
 * 恢复 HOSTS 文件的备份
 */
function restoreHosts() {
    console.log(`${appName}: Starting restoration`);

    const hostsPath = os.type().includes("Windows") ? "C:\\Windows\\System32\\drivers\\etc\\hosts" : "/etc/hosts";
    const backupPath = `${hostsPath}.backup`;

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

module.exports = { restoreHosts };

if (require.main === module) {
    restoreHosts();
}
