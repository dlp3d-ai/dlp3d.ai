# 从源码构建

在本节中，我们将介绍如何从源码开始构建3DAC Web应用。我们提供两种方式构建Web应用：***开发模式***和***生产模式***。如果要在不修改功能的情况下部署应用，建议使用生产模式。否则，请在开发模式下构建应用。

:::{note}
本教程仅提供Web应用构建说明。要启动完整的3DAC系统，还需要部署中间件和后端服务，如orchestrator、web后端。我们建议使用docker compose启动所有服务，详细内容请查看[这里](../getting_started/quick_start.md#md-start-service)。
:::

## 开发构建

### 安装依赖

Web应用的源码文件位于`app`目录。`package.json`包含构建应用所需的依赖项，可以使用Node Package Manager([npm](https://www.npmjs.com/))或其高性能替代[pnpm](https://github.com/pnpm/pnpm)进行安装。nvm的安装说明请参见[这里](https://heynode.com/tutorial/install-nodejs-locally-nvm/)。应用使用`Node.js 18.18`构建。正确配置`Node.js`后，安装`pnpm`：

```shell
npm install -g pnpm
```

然后，安装所需的依赖：

```shell
# 确保当前工作目录为项目根目录
cd dlp3d.ai

# 使用package.json中的配置安装依赖
pnpm install
```

### 设置SSL证书

#### 为什么需要HTTPS？

Web应用需要使用您设备的麦克风。出于安全考虑，现代浏览器只允许在**安全上下文**中访问设备硬件，例如麦克风和摄像头。

| 地址类型 | 示例 | 允许访问 |
| :--- | :--- | :--- |
| 本机地址 (HTTP) | `http://localhost` 或 `http://127.0.0.1` | ✅ 开发环境例外 |
| 局域网IP (HTTP) | `http://192.168.x.x` | ❌ 非安全上下文 |
| 局域网IP (HTTPS) | `https://192.168.x.x` | ✅ 需要信任自签名证书 |
| 公共 HTTPS 域名 | `https://example.com` | ✅ 需要有效证书 |

#### 生成证书

确保已安装[openssl](https://github.com/openssl/openssl)。然后，执行以下命令：

```shell
# 确保当前工作目录为项目根目录
cd dlp3d.ai

# 创建证书目录
mkdir ssl

# 使用 openssl 生成证书
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout ssl/key.pem \
  -out ssl/cert.pem \
  -days 365

# 按照提示完成证书生成
```

生成的证书将组织如下：

```text
dlp3d.ai/ssl/
├── cert.pem  ← 证书文件
└── key.pem   ← 私钥文件
```

### 运行Web应用

如果您在同一设备上部署和测试应用（即localhost），则不需要SSL证书。但是，如果您在一台设备上部署应用并在其他设备上测试（局域网IP），则需要SSL证书。

#### 本机地址

```shell
pnpm run dev
```

要创建Web应用窗口，请打开浏览器并访问`https://127.0.0.1:3000`。

#### 局域网

```shell
pnpm run dev_ws
```

要创建Web应用窗口，请打开浏览器并访问`https://${YOUR_IP_ADDRESS}`。首次访问时，浏览器可能会提示连接不安全。这是因为我们使用的是自签名证书。要绕过此问题，请点击`Advanced`按钮，然后点击`Proceed to 127.0.0.1 (unsafe)`：

<div style="text-align: center;">
  <img src="../_static/en/getting_started/insecure_connection.jpg" style="width: 100%; max-width: 100%;">
  <p><em>不安全连接错误</em></p>
</div>

一旦被信任，站点将被浏览器视为"安全上下文"。

## 生产构建

对于生产构建，Web应用会被编译成静态网页。您可以通过CLI或使用docker镜像构建应用。

### 命令行构建

要通过命令行构建项目：

```shell
# 确保当前工作目录为项目根目录
cd dlp3d.ai

# 构建网页
pnpm run build
```

构建输出将存储在`.next`目录中。要部署网页：

```shell
pnpm start
```

网页将在`http://localhost:3000`提供服务。

### Docker构建

要通过docker生成生产构建：

```shell
# 确保当前工作目录为项目根目录
cd dlp3d.ai

# 构建 docker 镜像并添加标签
docker build -f ./dockerfiles/web/Dockerfile . -t dlp3d_web:dev
```

这将自动构建一个标记为`dlp3d_web:dev`的docker镜像。要启动docker镜像：

```shell
docker run dlp3d_web:dev -p 3000:3000
```

网页将在`http://localhost:3000`提供服务。

