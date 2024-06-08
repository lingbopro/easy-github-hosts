# Easy GitHub Hosts

## 介绍

这是一个用 `Node.js` 制作的程序，用于自动将 **GitHub 相关域名的 IP 地址**添加到 `HOSTS` 文件中，达到**在大陆快速访问 GitHub** 的目的。  
（闲的没事写的，代码好看不了一点`(ˉ▽ˉ；)...`）

## 使用方法

### 1. 安装 Node.js

如果你没有安装 `Node.js`，请到 [Node.js 官网](https://nodejs.org/en/download) 下载 Node.js。  
PS：测试时使用的是 `Node.js v20.11.1`。

### 2. 克隆存储库

在终端中使用 git 克隆存储库：

```shell
git clone https://github.com/lingbopro/easy-github-hosts.git
```

### 3.安装依赖项

~~_在终端中执行：_~~
~~_npm install_~~

**自 [v1.4.0](https://github.com/lingbopro/easy-github-hosts/releases/tag/v1.4.0) 之后，我们已经实现了0依赖项，因此不用再安装了 `:)`**  

### 4. 运行

在克隆的文件夹内运行以下命令  

1. 确保你有执行权限（Windows 无需执行）：
   ```shell
   chmod +x main.js updateHosts.js ipFetcher.js
   ```
2. 然后运行主程序：  
   ```shell
   node main.js
   ```
   或者（Windows 不可用）：  
   ```shell
   ./main.js
   ```


有 4 种可选的选项，详见[选项](#选项)。  
 如果写入失败，请尝试以管理员运行（Windows），或者以超级用户权限执行（`sudo`，Linux/Mac）  
 _（PS：测试的时候只测了 `Windows`，`Linux` 不保证完全可行）_
 _（另一位开发只测试了Linux,其他的就交给大怨种了）_

### 5. 完事！

#### 什么？你想改回你的Hosts文件？
~~hahaha，你别想改回去了~~

##### 恢复hosts文件

要从备份中恢复原始的`hosts`文件，请按以下步骤操作：

1. **运行恢复命令**：使用以下命令恢复您的`hosts`文件。

    ```sh
    npm run restore
    ```

2. **完成**：程序将在原始`hosts`文件恢复完成后通知您。

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

不修改文件，只输出更改了的内容（必须和 [`--noedit`](#--noedit) 选项一同使用）。

```shell
node main.js --noedit --diff
```

### --nocache

不读取 IP 缓存，也不写入缓存

```shell
node main.js --nocache
```

## TODO

- [ ] 完善域名列表   
- [ ] 增加更多的 IP 源
- [ ] 使其可以用于所有这样的网站  
- [ ] 优化代码,增加可读性  
- [x] 实现0依赖项  <!-- hhh,加上即完成 -->
- [ ] 简化步骤，试图让用户一键配置，跑完代码  
- [ ] 对于Linux的支持  

## 开源说明

此项目是一个开源项目。此项目使用 [MIT 开源许可](LICENCE)。  
根据许可，你可以对该项目进行传播、分发、修改以及二次发布，包括个人和商业用途，且无需标明存储库等信息。

## 贡献须知

见 [开发指南](./docs/dev-guide.zh-CN.md#贡献)。  

## 其它

啊？
