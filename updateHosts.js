#!/usr/bin/env node

"use strict";

const fs = require("fs");
const os = require("os");
const readline = require("readline");
const { getIPs } = require("./ipFetcher");

const appName = "Easy GitHub Hosts";
const debug = process.argv.indexOf("--debug") !== -1;
const noedit = process.argv.indexOf("--noedit") !== -1;
const diff = noedit && process.argv.indexOf("--diff") !== -1;
let hostsContent;
let records = [];

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
        if (isNaN(i) || Number(i) > 255 || Number(i) < 0 || (i[0] === "0" && i.length !== 1)) {
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
        return { ip: "", host: "", description: record?.slice(1) };
    }
    if (splitRecord.length < 3) {
        return { ip: "", host: "", description: record ?? "" };
    }
    splitRecord.forEach(function (currentValue, index) {
        if (currentValue !== "") {
            params.push(currentValue);
        }
    });
    if (debug) {
        console.debug(`${appName}: (debug) record params: ${params}`);
    }
    return { ip: params[0], host: params[1], description: params[2]?.slice(1) };
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
        hosts += `${currentValue.ip}${currentValue.ip != "" ? " " : ""}` +
                 `${currentValue.host}${currentValue.host != "" ? " " : ""}` +
                 `${currentValue.description ? "#" + currentValue.description : ""}\n`;
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

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * @function updateHosts
 * 主函数，更新 HOSTS 文件
 */
function updateHosts() {
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
                process.exit(1);
            } else {
                console.log(`${appName}: Success opened HOSTS file`);
                fs.read(data, (err, bytes, data) => {
                    if (err) {
                        console.log(`${appName}: ERROR - Error reading HOSTS file:`);
                        console.log(err);
                        console.log(`${appName}: Please try running this program as Administrator (or super user).`);
                        console.log(`${appName}: If the error occurred again, please report an issue at https://github.com/lingbopro/easy-github-hosts/issues`);
                        process.exit(1);
                    } else {
                        console.log(`${appName}: Success read HOSTS file (${bytes} bytes)`);
                        hostsContent = data.toString();
                        records = getHostsRecords(hostsContent);
                        console.log(`${appName}: Got ${records.length} records from HOSTS file`);
                        getIPs()
                            .catch((err) => {
                                console.log(`${appName}: ERROR - Error getting IP:`);
                                console.log(err);
                                console.log(`${appName}: Please make sure you have a stable internet connection, and try again.`);
                                console.log(`${appName}: If the error occurred again, please report an issue at https://github.com/lingbopro/easy-github-hosts/issues`);
                                process.exit(1);
                            })
                            .then((IPs) => {
                                IPs = sortArrayByItemProperty(IPs, "host");
                                let newRecords = diff ? [] : JSON.parse(JSON.stringify(records)); 
                                IPs.forEach(function (currentValue) {
                                    if (checkIPv4(currentValue.ip)) {
                                        let recordIndex = getHostsRecordIndexByHost(newRecords, currentValue.host);
                                        if (recordIndex !== -1) {
                                            newRecords[recordIndex].ip = currentValue.ip;
                                        } else {
                                            newRecords.push({ ip: currentValue.ip, host: currentValue.host, description: "" });
                                        }
                                    }
                                });
                                newRecords = sortArrayByItemProperty(newRecords, "line");
                                const newHostsContent = genHosts(newRecords);
                                if (noedit) {
                                    console.log(newHostsContent);
                                    if (diff) {
                                        process.exit(0);
                                    } else {
                                        fs.writeFile(hostsPath, newHostsContent, (err) => {
                                            if (err) {
                                                console.log(`${appName}: ERROR - Error writing HOSTS file:`);
                                                console.log(err);
                                                console.log(`${appName}: Please try running this program as Administrator (or super user).`);
                                                console.log(`${appName}: If the error occurred again, please report an issue at https://github.com/lingbopro/easy-github-hosts/issues`);
                                                process.exit(1);
                                            } else {
                                                console.log(`${appName}: Successfully updated HOSTS file`);
                                                process.exit(0);
                                            }
                                        });
                                    }
                                } else {
                                    rl.question(`${appName}: Are you sure you want to update the hosts file? (yes/no) `, (answer) => {
                                        if (answer.toLowerCase() === "yes") {
                                            fs.writeFile(hostsPath, newHostsContent, (err) => {
                                                if (err) {
                                                    console.log(`${appName}: ERROR - Error writing HOSTS file:`);
                                                    console.log(err);
                                                    console.log(`${appName}: Please try running this program as Administrator (or super user).`);
                                                    console.log(`${appName}: If the error occurred again, please report an issue at https://github.com/lingbopro/easy-github-hosts/issues`);
                                                    process.exit(1);
                                                } else {
                                                    console.log(`${appName}: Successfully updated HOSTS file`);
                                                    process.exit(0);
                                                }
                                            });
                                        } else {
                                            console.log(`${appName}: Update cancelled`);
                                            process.exit(0);
                                        }
                                    });
                                }
                            });
                    }
                });
            }
        });
    } catch (err) {
        console.log(`${appName}: ERROR - An unexpected error occurred:`);
        console.log(err);
        console.log(`${appName}: Please try running this program as Administrator (or super user).`);
        console.log(`${appName}: If the error occurred again, please report an issue at https://github.com/lingbopro/easy-github-hosts/issues`);
        process.exit(1);
    }
}

module.exports = { updateHosts };
