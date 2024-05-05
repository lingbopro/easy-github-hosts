# Easy GitHub Hosts

## 介绍

这是一个用 `Node.js` 制作的程序，用于自动将 **GitHub 相关域名的 IP 地址**添加到 `HOSTS` 文件中，达到**在大陆快速访问 GitHub** 的目的。  
（闲的没事写的，代码好看不了一点`(ˉ▽ˉ；)...`）

## 使用方法

### 1. 安装 Node.js

如果你没有安装 `Node.js`，请到 [Node.js 官网](//nodejs.org/en/download) 下载 Node.js。  
PS：测试时使用的是 `Node.js v20.11.1`。

### 2. 克隆存储库

在终端中使用 git 克隆存储库：

```shell
git clone https://github.com/lingbopro/easy-github-hosts.git
```

### 3.安装依赖项

在终端中执行：

```shell
npm install
```

### 4. 运行

在克隆的文件夹内运行：

```shell
node main.js
```

有 3 种可选的选项，详见[选项](#选项)。  
 如果写入失败，请尝试以管理员运行（Windows），或者以超级用户权限执行（`sudo`，Linux/Mac）  
 _（PS：测试的时候只测了 `Windows`，`Linux` 不保证完全可行）_

### 5. 完事！

## 选项

可以在运行时在命令中增加可选的选项（见下）

### --debug

启用调试模式（会输出更详细的信息）。

```shell
node main.js --debug
```

### --noedit

不编辑 HOSTS 文件，只是输出增加条目后的内容。

```shell
node main.js --noedit
```

### --diff

不修改文件，只输出更改了的内容（必须和 [`--noedit`](#noedit) 选项一同使用）。

```shell
node main.js --noedit --diff
```

## TODO

[ ] 完善域名列表
[ ] 将写入 `HOSTS` 文件的代码和获取 IP 的代码分离
[ ] 使其可以用于所有这样的网站
[ ] 把代码整的美观一些

## 开源说明

此项目是一个开源项目。此项目使用 [MIT 开源许可](LICENCE)。  
根据许可，你可以对该项目进行传播、分发、修改以及二次发布，包括个人和商业用途，且无需标明存储库等信息。

## 贡献须知

_~~我自己写的代码都又臭又长，还要什么贡献须知(bushi~~_  
就一件事，用 [Prettier](//prettier.cn)  

## 其它

啊？
