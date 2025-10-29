# Build From Source

In this section, we introduce how to setup the 3DAC web app from source. There are two ways to setup the web app, namely the ***development mode*** and the ***production mode***. To deploy the app without modifying its features, the production mode is recommended. Otherwise please setup the app in the development mode.

:::{note}
This tutorial only starts the web app. To start the full 3DAC system, middlewares and backend services like orchestrator, web backend also need to be deployed. We recommend using the docker compose to start all services, check [here](../getting_started/quick_start.md#md-start-service) for more details.
:::

## Development Build

### Install Dependencies

The web app source files are located at `app`. The `package.json` contains dependencies to build the app, which can be installed using Node Package Manager([npm](https://www.npmjs.com/)) or [pnpm](https://github.com/pnpm/pnpm), a performant alternative. The installation instructions of nvm can be found [here](https://heynode.com/tutorial/install-nodejs-locally-nvm/). The app is built using `Node.js 18.18`. Once you have `Node.js` correctly configured, install the `pnpm`:

```shell
npm install -g pnpm
```

Then, install node packages:

```shell
# make sure that your current working directory is project root
cd dlp3d.ai

# install node packages using configuration in package.json
pnpm install
```

### Setup SSL Certificates

#### Why HTTPS?

The web app uses microphone of your device. Modern browsers, for security reasons, only allow access to device hardware in **secure contexts**, such as microphones and cameras.

| Address Type | Example | Access Allowed |
| :--- | :--- | :--- |
| localhost (HTTP) | `http://localhost` or `http://127.0.0.1` | ✅ development exception |
| LAN IP (HTTP) | `http://192.168.x.x` | ❌ non-secure context |
| LAN IP (HTTPS) | `https://192.168.x.x` | ✅ requires trust self-signed certificate |
| Public HTTPS Domain | `https://example.com` | ✅ requires valid certificate |

#### Generate Certificate

Make sure that you have [openssl](https://github.com/openssl/openssl) installed. Then, execute the following command:

```shell
# make sure that your current working directory is project root
cd dlp3d.ai

# create a new directory certificates
mkdir ssl

# generate certificates using openssl
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout ssl/key.pem \
  -out ssl/cert.pem \
  -days 365

# follow the instructions to complete the certificate generation
```

The generated certificates will be organized as:

```text
dlp3d.ai/ssl/
├── cert.pem  ← Certificate file
└── key.pem   ← Private key file
```

### Run Web App

If you deploy and test the app on the same device, i.e., localhost, SSL certificates are not needed. However, if you deploy the app on one device and test it on other devices(LAN IP), a SSL certificate is required.

#### Localhost

```shell
pnpm run dev
```
To create a web app window, open the browser and visit `https://127.0.0.1:3000`.

#### LAN IP

```shell
pnpm run dev_ws
```

To create a web app window, open the browser and visit `https://${YOUR_IP_ADDRESS}`. For the first time visit, the browser may raise an error indicating that the connection is not private. This is because we're using a self-signed certificate. To bypass the issue, click the `Advanced` button and click `Proceed to 127.0.0.1 (unsafe)`:

<div style="text-align: center;">
  <img src="../../_static/en/getting_started/insecure_connection.jpg" style="width: 100%; max-width: 100%;">
  <p><em>Insecure Connection Error</em></p>
</div>

Once trusted, the site is considered by the browser as a "secure context".

## Production Build

For the production build, the web app is compiled into a static web page. You can build the app via CLI or with docker image.

### CLI Build

To generate a production build via CLI:

```shell
# make sure that your current working directory is project root
cd dlp3d.ai

# build the web page
pnpm run build
```

The build outputs will be stored in the `.next` directory. To deploy the web page:

```shell
pnpm start
```

The web page will be served at `http://localhost:3000`.

### Docker Build

To generate a production build via docker:

```shell
# make sure that your current working directory is project root
cd dlp3d.ai

# build the docker image and add tag
docker build -f ./dockerfiles/web/Dockerfile . -t dlp3d_web:dev
```

This will automatically build a docker image tagged as `dlp3d_web:dev`. To start the docker image:

```shell
docker run dlp3d_web:dev -p 3000:3000
```

The web page will be served at `http://localhost:3000`.
