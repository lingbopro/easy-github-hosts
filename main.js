#!/usr/bin/env node

"use strict";

const { updateHosts } = require("./updateHosts.js");
const { restoreHosts } = require("./restoreHosts.js");

const appName = "Easy GitHub Hosts";

function main() {
    let argv = process.argv.slice(2);

    // Filter out Node.js specific flags
    argv = argv.filter(arg => !arg.startsWith('--inspect') && !arg.startsWith('--inspect-brk'));

    if (argv.length === 0) {
        console.error(`${appName}: ERROR - No arguments provided.`);
        console.info(`${appName}: Usage: node main.js <command>`);
        console.info(`${appName}: Commands:`);
        console.info(`${appName}:  - update: Update the HOSTS file with GitHub IPs`);
        console.info(`${appName}:  - restore: Restore the HOSTS file from backup`);
        process.exit(1);
    }

    const command = argv[0];

    switch (command) {
        case "update":
            updateHosts();
            break;
        case "restore":
            restoreHosts();
            break;
        default:
            console.error(`${appName}: ERROR - Unknown command: ${command}`);
            console.info(`${appName}: Usage: node main.js <command>`);
            console.info(`${appName}: Commands:`);
            console.info(`${appName}:  - update: Update the HOSTS file with GitHub IPs`);
            console.info(`${appName}:  - restore: Restore the HOSTS file from backup`);
            process.exit(1);
    }
}

if (require.main === module) {
    main();
}
