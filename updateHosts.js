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
    return content.replace(/\r\n/g, '\n').replace(/\x00/g, '').split('\n');
}

/**
 * 创建 HOSTS 文件的备份
 * @param {string} hostsPath - HOSTS 文件路径
 * @returns {string} - 备份文件路径
 */
function createBackup(hostsPath) {
    const backupPath = path.join(__dirname, 'files/backup', 'hostsfile.backup'); // 读取HOSTS文件内容
    try {
        const backupDir = path.dirname(backupPath);
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
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
    return array.findIndex(item => item[property] === find);
}

/**
 * 主函数，更新 HOSTS 文件
 */
async function updateHosts() {
    console.log(`${appName}: Starting`);

    const hostsPath = os.type().includes("Windows") ? "C:\\Windows\\System32\\drivers\\etc\\hosts" : "/etc/hosts";

    try {
        const hostsContent = fs.readFileSync(hostsPath, 'utf-8');
        console.log(`${appName}: Successfully read HOSTS file`);

        const lines = getLines(hostsContent);
        // records = getHostsRecords(hostsContent); // 获取 HOSTS 记录
        // console.log(`${appName}: Got ${records.length} records from HOSTS file`);

        let IPs = [];
        if (!nocache) {
            const cache = readCache();
            if (cache !== null) {
                IPs = cache;
                console.log(`${appName}: Read IPs from cache`);
            }
        }

        if (IPs.length === 0) {
            IPs = await getIPs(true);
            console.log(`${appName}: Read IPs from the internet`);
        }

        const backupPath = createBackup(hostsPath);

        const records = lines.map(parseHostsRecord);

        let noModify = false;

        records.forEach(record => {
            const index = findByItemProperty(IPs, 'host', record.host);
            if (index !== -1 && IPs[index].ip && checkIPv4(IPs[index].ip)) {
                record.ip = IPs[index].ip;
            } else if (index !== -1) {
                noModify = true;
            }
        });

        const newLines = records.map(record => {
            if (record.ip) {
                return `${record.ip} ${record.host} # ${record.description}`;
            } else if (record.host) {
                return `${record.host} ${record.description}`;
            } else {
                return `#${record.description}`;
            }
        });

        const newContent = newLines.join(os.EOL);

        if (noedit || noModify) {
            if (diff) {
                console.log(`${appName}: Showing diff`);
                const rl = readline.createInterface({
                    input: fs.createReadStream(hostsPath),
                    output: process.stdout,
                    terminal: false
                });

                rl.on('line', (line) => {
                    if (!newContent.includes(line)) {
                        console.log(`- ${line}`);
                    }
                });

                rl.on('close', () => {
                    newLines.forEach(line => {
                        if (!hostsContent.includes(line)) {
                            console.log(`+ ${line}`);
                        }
                    });
                });
            } else {
                console.log(`${appName}: Update is ready but will not be performed`);
            }
        } else {
            fs.writeFileSync(hostsPath, newContent, 'utf-8');
            console.log(`${appName}: HOSTS file updated successfully`);
        }
    } catch (error) {
        if (error.code === 'EPERM') {
            console.error(`${appName}: ERROR - Permission denied. Please run this program as Administrator (or super user).`);
        } else {
            console.error(`${appName}: ERROR - An error occurred:`, error);
        }
        process.exit(1);
    }
}

module.exports = { updateHosts };

if (require.main === module) {
    updateHosts();
}