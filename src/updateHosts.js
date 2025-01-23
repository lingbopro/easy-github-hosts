#!/usr/bin/env node

import fs from "fs";
import os from "os";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";
import { getIPs, readCache, checkIPv4 } from "./ipFetcher.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appName = "Easy GitHub Hosts";
const debug = process.argv.includes("--debug");
const noedit = process.argv.includes("--noedit");
const diff = noedit && process.argv.includes("--diff");
const nocache = process.argv.includes("--nocache");

/**
 * 解析一条 HOSTS 记录
 * @param {string} record - 一条记录
 * @returns {object} - 解析后的数据（不带行号）.
 */
function parseHostsRecord(record) {
    if (debug) {
        console.log(`${appName}: (debug) Parsing HOSTS record: ${record}`);
    }
    if (record.startsWith("#")) {
        return { type: "comment", value: record };
    }

    const parts = record.split(/\s+/);
    const ip = parts[0];
    const hosts = parts.slice(1);

    if (checkIPv4(ip)) {
        return { type: "record", ip, hosts };
    } else {
        return { type: "invalid", value: record };
    }
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
 * Updates the HOSTS file.
 */
export async function updateHosts() {
    console.log(`${appName}: Starting`);

    const windowsDir = process.env.WINDIR || "C:\\Windows";
    const hostsPath = os.type().includes("Windows")
        ? path.join(windowsDir, "System32", "drivers", "etc", "hosts")
        : "/etc/hosts";

    try {
        let hostsContent = fs.readFileSync(hostsPath, 'utf-8');
        console.log(`${appName}: Successfully read HOSTS file`);

        const lines = getLines(hostsContent);

        let IPs = [];
        if (!nocache) {
            const cache = readCache();
            IPs = cache ? cache : await getIPs();
        } else {
            IPs = await getIPs();
        }

        if (IPs.length === 0) {
            console.error(`${appName}: No IPs found to update HOSTS file.`);
            process.exit(1);
        }

        let newHostsContent = '';
        const availableIPs = IPs.filter(ipRecord => checkIPv4(ipRecord.ip));

        lines.forEach(line => {
            const parsed = parseHostsRecord(line);
            if (!availableIPs.some(record => record.host === parsed.host)) {
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

            rl.question(`${appName}: Are you sure you want to update the HOSTS file? (yes/no) `, answer => {
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

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    updateHosts();
}