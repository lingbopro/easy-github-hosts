#!/usr/bin/env node

import fs from "fs";
import path from "path";
import http from "http";
import https from "https";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
];

/**
 * Makes an HTTPS request and returns the response as JSON.
 * @param {string} url - The URL to fetch.
 * @returns {Promise<Object>} - The JSON response.
 */
function httpGet(url) {
    return new Promise((resolve, reject) => {
        const lib = url.startsWith("https") ? https : http;
        lib.get(url, (res) => {
            let data = "";

            res.on("data", (chunk) => {
                data += chunk;
            });

            res.on("end", () => {
                try {
                    resolve(JSON.parse(data));
                } catch (error) {
                    reject(new Error("Failed to parse response JSON."));
                }
            });
        }).on("error", (err) => {
            reject(err);
        });
    });
}

/**
 * @function getIP
 * 获取网站IP
 * @param {string} host - 网站的主机名
 * @returns {Promise<string>} - 返回网站的 IP 地址
 */
export async function getIP(host) {
    const url = `http://ip-api.com/json/${host}?fields=status,message,query`; // Use HTTP for free API
    console.log(`${appName}: Getting IP for '${host}' ( ${url} )`);
    try {
        const data = await httpGet(url);
        if (data.status === "success") {
            const ip = data.query;
            console.log(`${appName}: Got IP for '${host}' : ${ip}`);
            return ip;
        } else {
            console.log(`${appName}: ERROR - API returned an error message: ${data.message}`);
            return "";
        }
    } catch (error) {
        console.log(`${appName}: ERROR - An error occurred while getting IP for '${host}':`);
        console.error(error);
        return "";
    }
}

/**
 * @function getIPs
 * 获取所有网站的 IP 地址
 * @param {Boolean} cache - 是否缓存IP列表
 * @returns {Promise<Array>} - 返回包含所有网站 IP 地址的数组
 */
export async function getIPs(cache = true) {
    const promises = sites.map(async (site) => {
        try {
            const ip = await getIP(site);
            return { host: site, ip };
        } catch (err) {
            if (err.message === "API call limit reached") {
                process.exit(1);
            } else {
                throw err;
            }
        }
    });
    const IPs = await Promise.all(promises);

    if (cache) {
        cacheIPs(IPs);
    } else {
        console.info(`${appName}: Skipping IP caching`);
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
    const now = Date.now();
    const cache = { time: now, IPs };
    const json = JSON.stringify(cache);
    try {
        const cacheDir = path.join(__dirname, "files/cache");
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }
        fs.writeFileSync(path.join(cacheDir, "cache.json"), json);
        console.info(`${appName}: Successfully cached IPs`);
    } catch (error) {
        console.error(`${appName}: ERROR - Failed to cache IPs:`);
        console.error(error);
    }
}

/**
 * @function readCache
 * 读取缓存
 * @returns {Array|null} 缓存的IP列表 
 */
export function readCache() {
    try {
        const cachePath = path.join(__dirname, "files/cache/cache.json");
        if (fs.existsSync(cachePath)) {
            const data = fs.readFileSync(cachePath);
            const cache = JSON.parse(data);
            const now = Date.now();

            if (now - cache.time < 60 * 60 * 3 * 1000) {
                const isValid = cache.IPs.every((record) => typeof record.host === "string" && typeof record.ip === "string");
                return isValid ? cache.IPs : null;
            } else {
                console.info(`${appName}: Cache expired`);
                return null;
            }
        } else {
            console.info(`${appName}: Cache file not found`);
            return null;
        }
    } catch (error) {
        console.error(`${appName}: ERROR - Failed to read cache:`);
        console.error(error);
        return null;
    }
}

/**
 * @function checkIPv4
 * Validates IPv4 format.
 * @param {string} IP - IP address.
 * @returns {boolean} Whether the IP is valid.
 */
export function checkIPv4(IP) {
    const parts = IP.split(".");
    return parts.length === 4 && parts.every((part) => !isNaN(part) && Number(part) >= 0 && Number(part) <= 255);
}