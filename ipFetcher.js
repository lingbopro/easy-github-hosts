#!/usr/bin/env node

"use strict";

const axios = require("axios");
const cheerio = require("cheerio");

const appName = "Easy GitHub Hosts";
const sites = [
    "actions.github.com",
    "actions.githubusercontent.com",
    "api.github.com",
    "apps.codespaces.githubusercontent.com",
    "assets-cdn.githubusercontent.com",
    "assets.github.com",
    "avatar.githubusercontent.com",
    "avatars0.githubusercontent.com",
    "avatars1.githubusercontent.com",
    "avatars2.githubusercontent.com",
    "avatars3.githubusercontent.com",
    "avatars4.githubusercontent.com",
    "avatars5.githubusercontent.com",
    "avatars6.githubusercontent.com",
    "avatars7.githubusercontent.com",
    "avatars8.githubusercontent.com",
    "camo.githubusercontent.com",
    "copilot.github.com",
    "desktop.github.com",
    "developer.github.com",
    "docs.github.com",
    "ghcr.io",
    "gist.github.com",
    "gist.githubusercontent.com",
    "github.blog",
    "github.com",
    "github.community",
    "github.dev",
    "githubstatus.com",
    "help.github.com",
    "images.githubusercontent.com",
    "insights.githubusercontent.com",
    "objects.githubusercontent.com",
    "pages.github.com",
    "raw.github.com",
    "raw.githubusercontent.com",
    "user-images.githubusercontent.com",
    // Add other sites here
];

let IPs = [];

/**
 * @function getIP
 * 获取网站IP
 * @param {string} host - 网站的主机名
 * @returns {Promise<string>} - 返回网站的 IP 地址
 */
async function getIP(host) {
    let url = `https://acme-check.com/?domain=${host}`;
    console.log(`${appName}: Getting IP for '${host}' ( ${url} )`);
    try {
        const response = await axios.get(url);
        const html = response.data;
        const $ = cheerio.load(html);
        const ip = $("body > main > section.container-fluid.info-section > div > div > div:nth-child(1) > h4").text();
        console.log(`${appName}: Got IP for '${host}' : ${ip}`);
        return ip;
    } catch (error) {
        console.log(`${appName}: ERROR - An error occurred while getting IP for '${host}' :`);
        console.error(error);
        return "";
    }
}

/**
 * @function getIPs
 * 获取所有网站的 IP 地址
 * @returns {Promise<Array>} - 返回包含所有网站 IP 地址的数组
 */
async function getIPs() {
    let promises = sites.map(async (site) => {
        let ip = await getIP(site);
        return { host: site, ip: ip };
    });

    return Promise.all(promises);
}

module.exports = { getIPs };
