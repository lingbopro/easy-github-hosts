#!/usr/bin/env node

"use strict";

const fs = require("fs");
const os = require("os");
const axios = require("axios");
const cheerio = require("cheerio");

const appName = "Easy GitHub Hosts";
// TODO: 完善域名列表
// 要设置的GitHub域名列表
// 其实是搜来的（我：GitHub竟然有这么多子域名！）
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
const debug = process.argv.indexOf("--debug") != -1;
const noedit = process.argv.indexOf("--noedit") != -1;
const diff = noedit && process.argv.indexOf("--diff") != -1;
var hostsContent;
var records = [];
var IPs = [];
var newRecords = [];
var newHostsContent = "";

/**
 * 获取网站IP
 * @param {string} host
 * @returns {string}
 */
async function getIP(host) {
    // 由于我访问不上ipaddress.com，所以就不用它了
    let url = `https://acme-check.com/?domain=${host}`;
    console.log(`${appName}: Getting IP for '${host}' ( ${url} )`);
    try {
        const response = await axios.get(url);
        const html = response.data;
        const $ = cheerio.load(html);
        const ip = $(
            "body > main > section.container-fluid.info-section > div > div > div:nth-child(1) > h4"
        ).text(); // DevTools复制出来的selector (
        console.log(`${appName}: Got IP for '${host}' : ${ip}`);
        return ip;
    } catch (error) {
        console.log(
            `${appName}: ERROR - An error occurred while getting IP for '${host}' :`
        );
        console.error(error);
        return "";
    }
}
/**
 * 检查给定的字符串是否为IPv4地址
 * @param {string} IP 要检查的字符串
 * @returns {boolean} 是否为IPv4地址
 */
function checkIPv4(IP) {
    let arr = IP.split(".");
    if (arr.length !== 4) return false;
    for (let i of arr) {
        if (
            Object.is(Number(i), NaN) ||
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
 * 解析一条HOSTS记录
 * @param {string} record 一条记录
 * @returns {object} 解析后的数据(不带行号)
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
 * 解析HOSTS中的所有记录
 * @param {string} content HOSTS的内容
 * @returns {array} 解析后的数据(带行号)
 */
function getHostsRecords(content) {
    // 解决换行符问题
    content = content.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
    // 不知道为什么字符串末尾老是有很多的\x00，所以就把它去除
    content = content.replaceAll("\x00", "");
    // 分行
    let splitContent = content.split(/[\r\n]/);
    let records = [];
    // 解析
    splitContent.forEach(function (currentValue, index) {
        let thisRecord = parseHostsRecord(currentValue);
        // if (thisRecord.ip != '') {
        //     thisRecord.line = index + 1;
        //     records.push(thisRecord);
        // }
        if (thisRecord.ip != "" || thisRecord.description != "") {
            thisRecord.line = index + 1;
            records.push(thisRecord);
        }
    });
    return records;
}
/**
 * 根据域名查找HOSTS记录，返回第一个匹配项的索引
 * @param {array} records 记录列表
 * @param {string} host 域名
 * @returns {number} 在记录列表中的索引
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
 * 生成HOSTS
 * @param {array} records 记录列表
 * @returns {string} 生成的HOSTS
 */
function genHosts(records) {
    let hosts = "";
    records.forEach(function (currentValue, index) {
        hosts += `${currentValue.ip}${currentValue.ip != "" ? " " : ""}${
            currentValue.host
        }${currentValue.host != "" ? " " : ""}${
            currentValue.description ? "#" + currentValue.description : ""
        }\n`;
    });
    return hosts;
}
/**
 * 根据数组中每个对象的属性排序数组
 * @param {array} array 数组
 * @param {string} prop 属性名
 * @returns {array} 排序后的数组
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

async function getIPs(currentValue) {
    let ip = await getIP(currentValue);
    IPs.push({
        host: currentValue,
        ip: ip,
    });
}

console.log(`${appName}: Starting`);
// 对每个系统都做判断太麻烦了，干脆直接判断是否为Windows
// TODO: 完善系统判断功能
const hostsPath =
    os.type().search("Windows") != -1
        ? "C:\\Windows\\System32\\drivers\\etc\\hosts"
        : "/etc/hosts";

// 打开HOSTS文件
console.log(`${appName}: Opening HOSTS file`);
fs.open(hostsPath, "r+", (err, data) => {
    if (err) {
        // 错误处理
        console.log(`${appName}: ERROR - Error opening HOSTS file:`);
        console.log(err);
        console.log(
            `${appName}: Please try running this program as Administrator (or super user).`
        );
        console.log(
            `${appName}: If the error occurred again, please report an issue at https://github.com/lingbopro/easy-github-hosts/issues`
        );
    } else {
        console.log(`${appName}: Success opened HOSTS file`);
        //读取HOSTS
        console.log(`${appName}: Reading HOSTS file`);
        fs.read(data, (err, bytes, data) => {
            if (err) {
                // 错误处理
                console.log(`${appName}: ERROR - Error reading HOSTS file:`);
                console.log(err);
                console.log(
                    `${appName}: Please try running this program as Administrator (or super user).`
                );
                console.log(
                    `${appName}: If the error occurred again, please report an issue at https://github.com/lingbopro/easy-github-hosts/issues`
                );
            } else {
                console.log(
                    `${appName}: Success read HOSTS file (${bytes} bytes)`
                );
                hostsContent = data.toString();
                // 调试用
                if (debug) {
                    console.debug(`${appName}: (debug) HOSTS file content:`);
                    console.debug(
                        `${appName}: (debug) ============================================================`
                    );
                    console.debug(hostsContent);
                    console.debug(
                        `${appName}: (debug) ============================================================`
                    );
                }
                // 获取和解析数据
                records = getHostsRecords(hostsContent);
                console.log(
                    `${appName}: Got ${records.length} records from HOSTS file`
                );
                // 调试用
                if (debug) {
                    console.debug(`${appName}: (debug) Parsed records:`);
                    console.debug(
                        `${appName}: (debug) ============================================================`
                    );
                    console.debug(records);
                    console.debug(
                        `${appName}: (debug) ============================================================`
                    );
                }
                // 获取IP
                console.log(
                    `${appName}: Getting IPs for ${sites.length} sites`
                );
                let promises = [];
                sites.forEach(function (currentValue, index) {
                    promises.push(getIPs(currentValue, index));
                });
                Promise.all(promises)
                    .catch((err) => {
                        console.log(`${appName}: ERROR - Error getting IP:`);
                        console.log(err);
                        console.log(
                            `${appName}: Please make sure you have a stable internet connection, and try again.`
                        );
                        console.log(
                            `${appName}: If the error occurred again, please report an issue at https://github.com/lingbopro/easy-github-hosts/issues`
                        );
                    })
                    .then(() => {
                        IPs = sortArrayByItemProperty(IPs, "host");
                        if (debug) {
                            console.debug(`${appName}: (debug) IPs:`);
                            console.debug(
                                `${appName}: (debug) ============================================================`
                            );
                            console.debug(IPs);
                            console.debug(
                                `${appName}: (debug) ============================================================`
                            );
                        }
                        // 生成新的HOSTS
                        newRecords = diff
                            ? []
                            : JSON.parse(JSON.stringify(records)); // 深拷贝
                        IPs.forEach(function (currentValue, index) {
                            if (checkIPv4(currentValue.ip)) {
                                let recordIndex = getHostsRecordIndexByHost(
                                    newRecords,
                                    currentValue.host
                                );
                                if (recordIndex != -1) {
                                    // 把原来的删了
                                    // 由于直接修改原来的会导致排序乱掉，就删掉原来的
                                    // 这样还能使得记录不冲突
                                    newRecords.splice(recordIndex, 1);
                                }
                                newRecords.push({
                                    ip: currentValue.ip,
                                    host: currentValue.host,
                                    description: " " + appName,
                                });
                            } else {
                                console.log(
                                    `${appName}: WARNING - '${currentValue.ip}' (for ${currentValue.host}) is not a valid IPv4 address, just skip it`
                                );
                                console.log(
                                    `${appName}: This address (${currentValue.host}) may not exist, if you are sure it does not exist, please report an issue at https://github.com/lingbopro/easy-github-hosts/issues`
                                );
                            }
                        });
                        newHostsContent = genHosts(newRecords);
                        // 调试用
                        if (debug || noedit) {
                            console.debug(
                                `${appName}: ${
                                    debug && !noedit ? "(debug) " : ""
                                }${
                                    diff
                                        ? "Differences between new and old HOSTS file"
                                        : "New HOSTS file content"
                                }:`
                            );
                            console.debug(
                                `${appName}: ${
                                    debug && !noedit ? "(debug) " : ""
                                }============================================================`
                            );
                            console.debug(newHostsContent);
                            console.debug(
                                `${appName}: ${
                                    debug && !noedit ? "(debug) " : ""
                                }============================================================`
                            );
                        }
                        // 写入新的HOSTS
                        if (!noedit) {
                            console.log(`${appName}: Writing new HOSTS file`);
                            fs.writeFile(hostsPath, newHostsContent, (err) => {
                                if (err) {
                                    // 错误处理
                                    console.log(
                                        `${appName}: ERROR - Error writing new HOSTS file:`
                                    );
                                    console.log(err);
                                    console.log(
                                        `${appName}: Please try running this program as Administrator (or super user).`
                                    );
                                    console.log(
                                        `${appName}: If the error occurred again, please report an issue at https://github.com/lingbopro/easy-github-hosts/issues`
                                    );
                                } else {
                                    console.log(
                                        `${appName}: Success write new HOSTS file`
                                    );
                                    console.log(
                                        `${appName}: Thanks for using this program!`
                                    );
                                    console.log(
                                        `${appName}: repo: https://github.com/lingbopro/easy-github-hosts`
                                    );
                                    console.log(
                                        `${appName}: If you have any questions or suggestions, please report an issue at https://github.com/lingbopro/easy-github-hosts/issues`
                                    );
                                    console.log(
                                        `${appName}: If you want to contribute, please send a pull request at https://github.com/lingbopro/easy-github-hosts/pulls`
                                    );
                                    console.log(`${appName}: Happy coding!`);
                                }
                            });
                        } else {
                            console.log(
                                `${appName}: Skipped writing new HOSTS file`
                            );
                        }
                    });
            }
        });
    }
    // 事后：我怎么会写这种又臭又长的回调函数。。。
});

// Prettier万岁！(bushi