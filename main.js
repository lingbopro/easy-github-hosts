#!/usr/bin/env node

"use strict";

const { updateHosts } = require("./updateHosts.js");
const { restoreHosts } = require("./restoreHosts.js");

const appName = "Easy GitHub Hosts";

const cmd = process.argv[2];

(async () => {
    switch (cmd) {
        case "--restore":
            console.log(`${appName}: Command --restore detected`);
            restoreHosts();
            break;
        case "--update":
        default:
            console.log(`${appName}: Command --update detected or no command provided`);
            await updateHosts();
            break;
    }
})();
