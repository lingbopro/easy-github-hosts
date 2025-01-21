#!/usr/bin/env node

"use strict";

const { updateHosts } = require("./updateHosts.js");
const { restoreHosts } = require("./restoreHosts.js");

const appName = "Easy GitHub Hosts";

/**
 * 主函数，处理命令行参数并执行相应的操作
 */
function main() {
    let argv = process.argv.slice(2);

    // 过滤掉 Node.js 特定的标志
    argv = argv.filter(arg => !arg.startsWith('--inspect') && !arg.startsWith('--inspect-brk'));

    // 如果没有提供任何参数，输出错误信息和使用说明
    if (argv.length === 0) {
        console.error(`${appName}: ERROR - No arguments provided.`);
        console.info(`${appName}: Usage: node main.js <command>`);
        console.info(`${appName}: Commands:`);
        console.info(`${appName}:  - update: Update the HOSTS file with GitHub IPs`);
        console.info(`${appName}:  - restore: Restore the HOSTS file from backup`);
        console.info(`${appName}: Example: node main.js update`);
        process.exit(1);
    }

    // 获取命令行参数中的第一个命令
    const command = argv[0];

    // 根据命令执行相应的函数
    switch (command) {
        case "update":
            updateHosts();
            break;
        case "restore":
            restoreHosts();
            break;
        default:
            // 如果命令未知，输出错误信息和使用说明
            console.error(`${appName}: ERROR - Unknown command: ${command}`);
            console.info(`${appName}: Usage: node main.js <command>`);
            console.info(`${appName}: Commands:`);
            console.info(`${appName}:  - update: Update the HOSTS file with GitHub IPs`);
            console.info(`${appName}:  - restore: Restore the HOSTS file from backup`);
            process.exit(1);
    }
}

// 执行主函数
main();
