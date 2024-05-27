#!/usr/bin/env node

"use strict";

const fs = require("fs");
const os = require("os");
const readline = require("readline");
const { getIPs } = require("./ipFetcher");

const appName = "Easy GitHub Hosts";
const debug = process.argv.includes("--debug");
const noedit = process.argv.includes("--noedit");
const diff = noedit && process.argv.includes("--diff");

let hostsContent;  // 这里恢复变量声明
let records = [];  // 这里恢复变量声明

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
 * 解析 HOSTS 文件中的所有记录
 * @param {string} content - HOSTS 文件的内容
 * @returns {array} - 解析后的记录数组（带行号）
 */
function getHostsRecords(content) {
    return content.split(/\r?\n/)
        .map((line, index) => ({ ...parseHostsRecord(line), line: index + 1 }))
        .filter(record => record.ip || record.description);
}

/**
 * 根据域名查找 HOSTS 记录的索引
 * @param {array} records - 记录列表
 * @param {string} host - 域名
 * @returns {number} - 在记录列表中的索引，找不到返回 -1
 */
function getHostsRecordIndexByHost(records, host) {
    return records.findIndex(record => record.host === host);
}

/**
 * 生成 HOSTS 文件的内容
 * @param {array} records - 记录列表
 * @returns {string} - 生成的 HOSTS 文件内容
 */
function genHosts(records) {
    return records.map(record => `${record.ip} ${record.host} ${record.description ? '#' + record.description : ''}`).join('\n');
}

/**
 * 创建 HOSTS 文件的备份
 * @param {string} hostsPath - HOSTS 文件路径
 * @returns {string} - 备份文件路径
 */
function createBackup(hostsPath) {
    const backupPath = `${hostsPath}.backup`;
    try {
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
 * 主函数，更新 HOSTS 文件
 */
async function updateHosts() {
    console.log(`${appName}: Starting`);

    const hostsPath = os.type().includes("Windows") ? "C:\\Windows\\System32\\drivers\\etc\\hosts" : "/etc/hosts";

    try {
        hostsContent = fs.readFileSync(hostsPath, 'utf-8'); // 读取 HOSTS 文件内容
        console.log(`${appName}: Successfully read HOSTS file`);

        records = getHostsRecords(hostsContent); // 获取 HOSTS 记录
        console.log(`${appName}: Got ${records.length} records from HOSTS file`);

        const IPs = await getIPs();
        const newRecords = diff ? [] : [...records];

        IPs.forEach(ipRecord => {
            if (checkIPv4(ipRecord.ip)) {
                const index = getHostsRecordIndexByHost(newRecords, ipRecord.host);
                if (index !== -1) {
                    newRecords[index].ip = ipRecord.ip;
                } else {
                    newRecords.push({ ...ipRecord, description: "" });
                }
            }
        });

        const newHostsContent = genHosts(newRecords);

        if (noedit) {
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
                            console.error(`${appName}: ERROR - Permission denied while writing HOSTS file. Please run this program as Administrator (or super user).`);
                        } else {
                            console.error(`${appName}: ERROR - Error writing new HOSTS file:`, err);
                        }
                        process.exit(1);
                    }
                } else {
                    console.log(`${appName}: Update cancelled`);
                }
                rl.close();
            });
        }
    } catch (err) {
        if (err.code === 'EPERM') {
            console.error(`${appName}: ERROR - Permission denied while accessing HOSTS file. Please run this program as Administrator (or super user).`);
        } else {
            console.error(`${appName}: ERROR - An unexpected error occurred:`, err);
        }
        process.exit(1);
    }
}

module.exports = { updateHosts };
