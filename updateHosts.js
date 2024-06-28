#!/usr/bin/env node

"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const readline = require("readline");
const { getIPs, readCache } = require("./ipFetcher.js");

const appName = "Easy GitHub Hosts";
const debug = process.argv.includes("--debug");
const noedit = process.argv.includes("--noedit");
const diff = noedit && process.argv.includes("--diff");
const nocache = process.argv.includes("--nocache");

/**
 * 检查给定的字符串是否为有效的 IPv4 地址
 * @param {string} IP - 要检查的字符串
 * @returns {boolean} - 如果是有效的 IPv4 地址则返回 true，否则返回 false
 */
function checkIPv4(IP) {
    const parts = IP.split(".");
    return parts.length === 4 && parts.every(part => !isNaN(part) && Number(part) >= 0 && Number(part) <= 255);
}

/**
 * 解析一条 HOSTS 记录
 * @param {string} record - 一条记录
 * @returns {object} - 解析后的数据（不带行号）
 */
function parseHostsRecord(record) {
    if (debug) {
        console.log(`${appName}: (debug) Parsing HOSTS record: ${record}`);
    }
    if (record.startsWith("#")) {
        return { ip: "", host: "", description: record.slice(1).trim() };
    }

    const parts = record.split(/\s+/);
    if (parts.length < 2) {
        return { ip: "", host: "", description: record.trim() };
    }

    return { ip: parts[0], host: parts[1], description: parts.slice(2).join(' ').replace(/^#/, '').trim() };
}

/**
 * 获取逐行的信息
 * @param {string} content 内容
 * @returns {array} 行信息
 */
function getLines(content) {
    content = content.replace(/\r\n/g, '\n').replace(/\x00/g, '');
    return content.split('\n');
}

/**
 * 创建 HOSTS 文件的备份
 * @param {string} hostsPath - HOSTS 文件路径
 * @returns {string} - 备份文件路径
 */
function createBackup(hostsPath) {
    const backupPath = path.join(__dirname, 'files/backup', `hostsfile.backup`);
    try {
        if (!fs.existsSync(path.join(__dirname, "files/backup"))) {
            fs.mkdirSync(path.join(__dirname, "files/backup"), { recursive: true });
        }
        fs.copyFileSync(hostsPath, backupPath);
        console.log(`${appName}: Created backup at ${backupPath}`);
        return backupPath;
    } catch (err) {
        if (err.code === 'EPERM') {
            console.error(`${appName}: ERROR - Permission denied while creating backup. Please run this program as Administrator (or super user).`);
        } else {
            console.error(`${appName}: ERROR - Error creating backup:`, err);
        }
        process.exit(1);
    }
}

/**
 * 在数组中寻找第一个属性等于指定值的子项的下标，找不到返回-1
 * @param {array} array 数组
 * @param {string} property 属性名
 * @param {*} find 查找的内容
 * @returns {number} 下标
 */
function findByItemProperty(array, property, find) {
    for (let i = 0; i < array.length; i++) {
        if (array[i][property] === find) {
            return i;
        }
    }
    return -1;
}

/**
 * 主函数，更新 HOSTS 文件
 */
async function updateHosts() {
    console.log(`${appName}: Starting`);

    const hostsPath = os.type().includes("Windows") ? "C:\\Windows\\System32\\drivers\\etc\\hosts" : "/etc/hosts";

    try {
        let hostsContent = fs.readFileSync(hostsPath, 'utf-8');
        console.log(`${appName}: Successfully read HOSTS file`);

        const lines = getLines(hostsContent);
        // records = getHostsRecords(hostsContent); // 获取 HOSTS 记录
        // console.log(`${appName}: Got ${records.length} records from HOSTS file`);

        let IPs = [];
        if (!nocache) {
            let cache = readCache();
            if (cache === null) {
                IPs = await getIPs();
            } else {
                IPs = cache;
            }
        } else {
            try {
                IPs = await getIPs(!nocache);
            } catch (err) {
                console.error(`${appName}: ERROR - Error fetching IPs:`, err);
                process.exit(1);
        }
        }

        if (IPs.length === 0) {
            IPs = await getIPs(true);
            console.log(`${appName}: Read IPs from the internet`);
            }

        if (IPs.length === 0) {
            IPs = await getIPs(true);
            console.log(`${appName}: Read IPs from the internet`);
        }

        let newHostsContent = '';
        let availableIPs = IPs.filter(ipRecord => checkIPv4(ipRecord.ip));

        lines.forEach(line => {
            let parsed = parseHostsRecord(line);
            if (findByItemProperty(availableIPs, 'host', parsed.host) === -1) {
                newHostsContent += line + '\n';
            }
        });

        availableIPs.forEach(value => {
            newHostsContent += `${value.ip} ${value.host} # Easy GitHub Hosts\n`;
        });

        if (noedit) {
            console.log(`${appName}: HOSTS Content:`);
            console.log(newHostsContent);
            if (diff) process.exit(0);
        } else {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            rl.question(`${appName}: Are you sure you want to update the hosts file? (yes/no) `, answer => {
                if (answer.toLowerCase() === 'yes') {
                    createBackup(hostsPath);
                    try {
                        fs.writeFileSync(hostsPath, newHostsContent, 'utf-8');
                        console.log(`${appName}: Successfully updated HOSTS file`);
                    } catch (err) {
                        if (err.code === 'EPERM') {
                            console.error(`${appName}: ERROR - Permission denied while writing to HOSTS file. Please run this program as Administrator (or super user).`);
                        } else {
                            console.error(`${appName}: ERROR - Error writing HOSTS file:`, err);
                        }
                        process.exit(1);
                    }
                } else {
                    console.log(`${appName}: Update cancelled`);
                }
                rl.close();
                process.exit(0);
            });
        }
    } catch (err) {
        console.error(`${appName}: ERROR - Error reading HOSTS file:`, err);
        process.exit(1);
    }
}

module.exports = { updateHosts };

if (require.main === module) {
    updateHosts();
}
