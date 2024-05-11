#!/usr/bin/env node

"use strict";

const readline = require("readline");
const fs = require("fs");
const os = require("os");
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
];
const debug = process.argv.indexOf("--debug") !== -1;
const noedit = process.argv.indexOf("--noedit") !== -1;
const diff = noedit && process.argv.indexOf("--diff") !== -1;
let hostsContent;
let records = [];
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
 * @function checkIPv4
 * 检查给定的字符串是否为 IPv4 地址
 * @param {string} IP - 要检查的字符串
 * @returns {boolean} - 如果是有效的 IPv4 地址则返回 true，否则返回 false
 */
function checkIPv4(IP) {
    let arr = IP.split(".");
    if (arr.length !== 4) return false;
    for (let i of arr) {
        if (
            isNaN(i) ||
            Number(i) > 255 ||
            Number(i) < 0 ||
            (i[0] === "0" && i.length !== 1)
        ) {
            return false;
        }
    }
    return true;
}

/**
 * @function parseHostsRecord
 * 解析一条 HOSTS 记录
 * @param {string} record - 一条记录
 * @returns {object} - 解析后的数据（不带行号）
 */
function parseHostsRecord(record) {
    if (debug) {
        console.log(`${appName}: (debug) Parsing HOSTS record: ${record}`);
    }
    let splitRecord = record.split(" ");
    let params = [];
    if (record.startsWith("#")) {
        return {
            ip: "",
            host: "",
            description: record?.slice(1),
        };
    }
    if (splitRecord.length < 3) {
        return {
            ip: "",
            host: "",
            description: record ?? "",
        };
    }
    splitRecord.forEach(function (currentValue, index) {
        if (currentValue !== "") {
            params.push(currentValue);
        }
    });
    if (debug) {
        console.debug(`${appName}: (debug) record params: ${params}`);
    }
    return {
        ip: params[0],
        host: params[1],
        description: params[2]?.slice(1),
    };
}

/**
 * @function getHostsRecords
 * 解析 HOSTS 中的所有记录
 * @param {string} content - HOSTS 的内容
 * @returns {array} - 解析后的数据（带行号）
 */
function getHostsRecords(content) {
    content = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\x00/g, "");
    let splitContent = content.split(/\r?\n/);
    let records = [];
    splitContent.forEach(function (currentValue, index) {
        let thisRecord = parseHostsRecord(currentValue);
        if (thisRecord.ip != "" || thisRecord.description != "") {
            thisRecord.line = index + 1;
            records.push(thisRecord);
        }
    });
    return records;
}

/**
 * @function getHostsRecordIndexByHost
 * 根据域名查找 HOSTS 记录，返回第一个匹配项的索引
 * @param {array} records - 记录列表
 * @param {string} host - 域名
 * @returns {number} - 在记录列表中的索引
 */
function getHostsRecordIndexByHost(records, host) {
    for (let i = 0; i < records.length; i++) {
        if (records[i].host == host) {
            return i;
        }
    }
    return -1;
}

/**
 * @function genHosts
 * 生成 HOSTS
 * @param {array} records - 记录列表
 * @returns {string} - 生成的 HOSTS
 */
function genHosts(records) {
    let hosts = "";
    records.forEach(function (currentValue, index) {
        hosts += `${currentValue.ip}${currentValue.ip != "" ? " " : ""}${currentValue.host}${currentValue.host != "" ? " " : ""}${currentValue.description ? "#" + currentValue.description : ""}\n`;
    });
    return hosts;
}

/**
 * @function sortArrayByItemProperty
 * 根据数组中每个对象的属性排序数组
 * @param {array} array - 数组
 * @param {string} prop - 属性名
 * @returns {array} - 排序后的数组
 */
function sortArrayByItemProperty(array, prop) {
    for (let a = 0; a < array.length; a++) {
        for (let b = a + 1; b < array.length; b++) {
            if (array[a][prop] > array[b][prop]) {
                let temp = array[a];
                array[a] = array[b];
                array[b] = temp;
            }
        }
    }
    return array;
}

/**
 * @function getIPs
 * 获取所有网站的 IP 地址
 * @param {array} currentValue - 当前网站主机名
 * @returns {Promise<void>}
 */
async function getIPs(currentValue) {
    let ip = await getIP(currentValue);
    IPs.push({
        host: currentValue,
        ip: ip,
    });
}

console.log(`${appName}: Starting`);

// 判断操作系统，选择相应的 hosts 文件路径
const hostsPath = os.type().search("Windows") !== -1 ? "C:\\Windows\\System32\\drivers\\etc\\hosts" : "/etc/hosts";

try {
    fs.open(hostsPath, "r+", (err, data) => {
        if (err) {
            console.log(`${appName}: ERROR - Error opening HOSTS file:`);
            console.log(err);
            console.log(`${appName}: Please try running this program as Administrator (or super user).`);
            console.log(`${appName}: If the error occurred again, please report an issue at https://github.com/lingbopro/easy-github-hosts/issues`);
        } else {
            console.log(`${appName}: Success opened HOSTS file`);
            fs.read(data, (err, bytes, data) => {
                if (err) {
                    console.log(`${appName}: ERROR - Error reading HOSTS file:`);
                    console.log(err);
                    console.log(`${appName}: Please try running this program as Administrator (or super user).`);
                    console.log(`${appName}: If the error occurred again, please report an issue at https://github.com/lingbopro/easy-github-hosts/issues`);
                } else {
                    console.log(`${appName}: Success read HOSTS file (${bytes} bytes)`);
                    hostsContent = data.toString();
                    records = getHostsRecords(hostsContent);
                    console.log(`${appName}: Got ${records.length} records from HOSTS file`);
                    console.log(`${appName}: Getting IPs for ${sites.length} sites`);
                    let promises = [];
                    sites.forEach(function (currentValue, index) {
                        promises.push(getIPs(currentValue, index));
                    });
                    Promise.all(promises)
                        .catch((err) => {
                            console.log(`${appName}: ERROR - Error getting IP:`);
                            console.log(err);
                            console.log(`${appName}: Please make sure you have a stable internet connection, and try again.`);
                            console.log(`${appName}: If the error occurred again, please report an issue at https://github.com/lingbopro/easy-github-hosts/issues`);
                        })
                        .then(() => {
                            IPs = sortArrayByItemProperty(IPs, "host");
                            newRecords = diff ? [] : JSON.parse(JSON.stringify(records));
                            IPs.forEach(function (currentValue, index) {
                                if (checkIPv4(currentValue.ip)) {
                                    let recordIndex = getHostsRecordIndexByHost(
                                        newRecords,
                                        currentValue.host
                                    );
                                    if (recordIndex != -1) {
                                        newRecords.splice(recordIndex, 1);
                                    }
                                    newRecords.push({
                                        ip: currentValue.ip,
                                        host: currentValue.host,
                                        description: " " + appName,
                                    });
                                } else {
                                    console.log(`${appName}: WARNING - '${currentValue.ip}' (for ${currentValue.host}) is not a valid IPv4 address, just skip it`);
                                    console.log(`${appName}: This address (${currentValue.host}) may not exist, if you are sure it does not exist, please report an issue at https://github.com/lingbopro/easy-github-hosts/issues`);
                                }
                            });
                            newHostsContent = genHosts(newRecords);
                            if (debug || noedit) {
                                console.debug(`${appName}: ${(debug && !noedit) ? "(debug) " : ""}${diff ? "Differences between new and old HOSTS file" : "New HOSTS file content"}:`);
                                console.debug(`${appName}: ${(debug && !noedit) ? "(debug) " : ""}============================================================`);
                                console.debug(newHostsContent);
                                console.debug(`${appName}: ${(debug && !noedit) ? "(debug) " : ""}============================================================`);
                            }
                            if (!noedit) {
                                console.log(`${appName}: Writing new HOSTS file`);
                                fs.writeFile(hostsPath, newHostsContent, (err) => {
                                    if (err) {
                                        console.log(`${appName}: ERROR - Error writing new HOSTS file:`);
                                        console.log(err);
                                        console.log(`${appName}: Please try running this program as Administrator (or super user).`);
                                        console.log(`${appName}: If the error occurred again, please report an issue at https://github.com/lingbopro/easy-github-hosts/issues`);
                                    } else {
                                        console.log(`${appName}: Success write new HOSTS file`);
                                        console.log(`${appName}: Thanks for using this program!`);
                                        console.log(`${appName}: repo: https://github.com/lingbopro/easy-github-hosts`);
                                        console.log(`${appName}: If you have any questions or suggestions, please report an issue at https://github.com/lingbopro/easy-github-hosts/issues`);
                                        console.log(`${appName}: If you want to contribute, please send a pull request at https://github.com/lingbopro/easy-github-hosts/pulls`);
                                        console.log(`${appName}: Happy coding!`);
                                    }
                                });
                            } else {
                                console.log(`${appName}: Skipped writing new HOSTS file`);
                            }
                        });
                }
            });
        }
    });
} catch (error) {
    console.log(`${appName}: ERROR - An error occurred:`);
    console.error(error);
    console.log(`${appName}: Please check your system permissions and ensure the HOSTS file is accessible.`);
    console.log(`${appName}: If the error persists, please report an issue at https://github.com/lingbopro/easy-github-hosts/issues`);
}

// 不长但臭
