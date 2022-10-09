# prmfilesite

Site for uploading and storing files on server for free. Built using Vue 3.

## Project Setup

```sh
npm install
```

In order to have fully functional project you will need <a href="https://github.com/Zeptosec/PrmFilesApi.git">PrmFilesApi</a> so you can have your own server to communicate to and you will need <a href="https://github.com/Rob--W/cors-anywhere.git">cors-anywhere</a> server as well so that you can download files that are larger than 8MB directly to browser.<br>
After that setup is simple you just need to setup the .env file with all the necessary variables and you are good to go.

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```
