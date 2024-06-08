#!/usr/bin/env node

"use strict";

const fs = require("fs");
const path = require("path");

const appName = "Easy GitHub Hosts";
const sites = [
    // 理论上只需要包含二级域名，子域名的IP会从二级域名查询
    // 但是为什么githubusercontent.com查不到呢...
    "avatars.githubusercontent.com",
    "ghcr.io",
    "gist.githubusercontent.com",
    "github.blog",
    "github.com",
    "github.community",
    "github.dev",
    "github.githubassets.com",
    "github.io",
    "githubassets.com",
    "githubstatus.com",
    "githubusercontent.com",
    "images.githubusercontent.com",
    "insights.githubusercontent.com",
    "objects.githubusercontent.com",
    "pages.github.com",
    "raw.github.com",
    "raw.githubusercontent.com",
    "user-images.githubusercontent.com",
    // Add other sites here
];


/**
 * @function getIP
 * 获取网站IP
 * @param {string} host - 网站的主机名
 * @returns {Promise<string>} - 返回网站的 IP 地址
 */
async function getIP(host) {
    let url = `http://ip-api.com/json/${host}?fields=status,message,query`;
    console.log(`${appName}: Getting IP for '${host}' ( ${url} )`);
    try {
        // 做到了0依赖，开心:)
        const response = await fetch(url, {
            method: 'GET',
        });
        if (response.ok) {
            const data = await response.json();
            if (data.status == 'success') {
                const ip = data.query;
                console.log(`${appName}: Got IP for '${host}' : ${ip}`);
                return ip;
            }
            else {
                console.log(`${appName}: ERROR - API returned an error message:\n${data.message}`);
                return "";
            }
        }
        else {
            if (response.headers['X-R1'] <= 0) {
                console.log(`${appName}: ERROR - The API call limit is reached`);
                console.log(`${appName}: ERROR - Try again in at least ${response.headers['X-Ttl']} seconds`);
                throw new Error('API call limit reached');
            }
            console.log(`${appName}: ERROR - returned an HTTP error code:\n${response.status} (${response.statusText})`);
            return "";
        }
    } catch (error) {
        console.log(`${appName}: ERROR - An error occurred while getting IP for '${host}' :`);
        console.error(error);
        return "";
    }
}

/**
 * @function getIPs
 * 获取所有网站的 IP 地址
 * @param {Boolean} - 是否缓存IP列表
 * @returns {Promise<Array>} - 返回包含所有网站 IP 地址的数组
 */
async function getIPs(cache = true) {
    let promises = sites.map(async (site) => {
        try {
            let ip = await getIP(site);
        return { host: site, ip: ip };
        }
        catch (err) {
            if (err.message == 'API call limit reached') {
                exit(1);
            }
            else {
                throw err;
            }
        }
    });
    let IPs = await Promise.all(promises)

    if (cache) {
        cacheIPs(IPs);
    }
    else {
        console.info(`${appName}: will not cache IPs`);
    }
    return IPs;
}

/**
 * @function cacheIPs
 * 缓存IP列表
 * @param {Array} IPs - IP列表
 */
function cacheIPs(IPs) {
    console.log(`${appName}: Caching IPs...`);
    let now = Date.now();
    let cache = {
        time: now,
        IPs: IPs,
    };
    let json = JSON.stringify(cache);
    try {
        if (!fs.existsSync(path.join(__dirname, "files/cache"))) {
            fs.mkdirSync(path.join(__dirname, "files/cache"), {
                recursive: true,
            });
        }
        fs.writeFileSync(path.join(__dirname, "files/cache/cache.json"), json);
        console.info(`${appName}: Successfully cached IPs`);
    }
    catch (error) {
        console.error(`${appName}: ERROR - An error occurred while caching IPs :`);
        console.error(error);
    }
}

/**
 * @function readCache
 * 读取缓存
 * @returns {Array} 缓存的IP列表 
 */
function readCache() {
    try {
        if (fs.existsSync(path.join(__dirname, "files/cache/cache.json"))) {
            let data = fs.readFileSync(path.join(__dirname, "files/cache/cache.json"));
            let cache = JSON.parse(data);
            let now = Date.now();
            if (now - cache.time < 60 * 60 * 3) { // 保留3小时内的缓存
                let flag = true;
                for (let record in cache.IPs) { // 验证缓存格式
                    if (!(typeof record.host === "string" && typeof record.ip === "string")) {
                        flag = false;
                        break;
                    }
                }
                if (flag) {
                    return cache.IPs;
                }
                else {
                    console.info(`${appName}: cache file corrupted, ignore it`);
                    return null;
                }
            }
            else {
                console.info(`${appName}: cache file expired, ignore it`);
                return null;
            }
        }
        else {
            console.info(`${appName}: cache file not exist, ignore it`);
            return null;
        }
    }
    catch (error) {
        console.error(`${appName}: ERROR - An error occurred while reading cache:`);
        console.error(error);
        return null;
    }
}

module.exports = { getIPs, readCache };
