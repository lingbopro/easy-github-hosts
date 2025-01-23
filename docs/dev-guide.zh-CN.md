# Easy GitHub Hosts - 开发指南

本文档为希望理解、修改或为 Easy GitHub Hosts 项目做出贡献的开发者提供了一份详细的指南。  

## 目录

- [Easy GitHub Hosts - 开发指南](#easy-github-hosts---开发指南)
  - [目录](#目录)
  - [项目结构](#项目结构)
  - [代码概述](#代码概述)
    - [ipFetcher.js](#ipfetcherjs)
    - [updateHosts.js](#updatehostsjs)
    - [restoreHosts.js](#restorehostsjs)
    - [main.js](#mainjs)
  - [贡献](#贡献)

## 项目结构

该项目的结构如下：

easy-github-hosts/  
├──.github/  
│   ├── ISSUE_TEMPLATE/  
│   ├── bug_report.md  
│   └── feature_request.md  
├── docs/  
│   ├── CONTRIBUTING.en-US.md  
│   ├── dev-guide.en-US.md  
│   └── dev-guide.zh-CN.md  
├── files/  
│   ├── backup/  
│   └── cache/  
├── easy-github-hosts/  
│   ├── main.js  
│   ├── ipFetcher.js  
│   ├── updateHosts.js  
│   ├── restoreHosts.js  
│   ├── package.json  
│   ├── package-lock.json  
├── LICENSE  
├── README.md  

- `.github/`: 与 GitHub 相关的文件。  
  - `ISSUE_TEMPLATE/`: 包含问题模板文件。  
    - `bug_report.md`: 是的！用于报告 bug 的问题。  
    - `feature_request.md`: 是的！用于功能请求的问题。  
- `docs/`: 包含文档文件。  
  <!-- - `README.md`: 提供通用信息和使用说明。 -->
  - `dev-guide.en-US.md`: 开发指南（英文）。  
  - `dev-guide.zh-CN.md`: 本开发指南（中文）。  
- `files/`: 包含此程序生成的文件。  
  - `backup/`: 包含 HOSTS 文件的备份。  
  - `cache/`: 包含 IP 缓存。  
- `easy-github-hosts/`: 主程序文件。
  - `ipFetcher.js`: 包含从 GitHub 相关域获取 IP 地址的函数。  
  - `main.js`: 该程序的主入口点。  
  - `package.json`: 管理项目依赖项和脚本。  
  - `restoreHosts.js`: 包含还原原始 `hosts` 文件的函数。  
  - `updateHosts.js`: 包含使用新 IP 地址更新 `hosts` 文件的函数。  

## 代码概述

### ipFetcher.js

此文件包含从 fetch 获取 GitHub 相关域的 IP 地址的逻辑：  

`getIP(host)`: 获取给定主机的 IP 地址。  
`getIPs(cache)`: 获取所有预定义的 GitHub 相关域的 IP 地址。如果 `cache` 参数为 true，它还将缓存所有 IP 地址。  
`cacheIPs(IPs)`: 将给定的 IP 地址缓存到文件中。  
`readCache()`: 读取缓存的 IP 地址。  

### updateHosts.js

此文件包含更新 hosts 文件的逻辑：  

`checkIPv4(IP)`: 检查字符串是否为有效的 IPv4 地址。  
`parseHostsRecord(record)`: 解析 hosts 文件中的单个记录。  
`createBackup(hostsPath)`: 创建 hosts 文件的备份。  
`updateHosts()`: 更新 hosts 文件的主函数。  
`getLines(content)`: 获取 `content` 的行。  
`findByItemProperty(array, property, find)`: 在 `array` 中查找第一个属性 `property` 等于 `find` 的项。  

### restoreHosts.js

此文件包含从备份还原原始 hosts 文件的逻辑：  

`restoreHosts()`: 还原 hosts 文件的主函数，从备份中还原。  

### main.js

此文件充当程序的入口点。它导入并运行 updateHosts.js 中的 updateHosts 函数。  

## 贡献

欢迎您的贡献！请遵循以下指南：

Fork 存储库。  
为您的功能或 bug 修复创建一个新分支。  
为您的更改编写代码。  
使用 [Prettier](https://prettier.cn) 格式化您的代码。  
使用描述性消息提交您的更改。  
将您的分支推送到您的 fork。  
向主存储库提交拉取请求 **(dev 分支)**。  
