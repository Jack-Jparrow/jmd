/*
 * @Author: Jack Jparrow
 * @Date: 2022-05-19 09:12:22
 * @LastEditTime: 2022-05-29 15:37:34
 * @LastEditors: Jack Jparrow
 * @Description: 
 */
'use strict'

import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
const isDevelopment = process.env.NODE_ENV !== 'production'
import { app, protocol, BrowserWindow, dialog } from 'electron'
import fs from 'fs-extra'; // 使用fs模块
import path from 'path';

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

async function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    webPreferences: {
      
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
      webSecurity: false, // 禁用同源政策
	    nodeIntegration: true, // 启用 Node 集成
	    contextIsolation: false, // 禁用上下文隔离
    }
  })

  //接收渲染进程的信息
	const ipc = require('electron').ipcMain;

	// 接到 'min' 信息
	ipc.on('min', function () {
		win.minimize(); // 窗口最小化
	});

	// 接到 'max' 信息
	ipc.on('max', function () {
		if (win.isMaximized()) { // 判断窗口是否最大化
			win.unmaximize(); // 窗口取消最大化
		} else {
			win.maximize(); // 窗口最大化
		}
	});
	ipc.on('close', function () {
		win.destroy(); // 摧毁窗口
	})

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }

  win.on('resize', () => {
		win.webContents.send('resize', win.isMaximized())
	})

  ipc.on('saveNewFile', (event, data) => {
    dialog.showSaveDialog({ // 通过 dialog 模块打开 保存文件 对话框
      title: "文件另存为",
      defaultPath: path.join(__dirname, `${data.replace(/\\|\/|\?|\？|\*|\"|\“|\”|\'|\‘|\’|\<|\>|\{|\}|\[|\]|\【|\】|\：|\:|\、|\^|\$|\!|\~|\`|\|/g, '').substring(0, 10)}.md`), // 默认文件保存路径
      filters: [
        { name: 'Markdown File', extensions: ['md', 'markdown', 'mmd', 'mkd', 'mdwn', 'mdown', 'mdx', 'mdtxt', 'apib', 'rmarkdown', 'rmd', 'txt', 'text'] }
      ], // 文件类型过滤器，只保留为 markdown 文件
    }).then((res) => {
      if (res && res.filePath) {
        fs.writeFile(res.filePath, data, "utf8", (err) => {
          if (err) {
            win.webContents.send('savedNewFile', -1);
          } else { // 写入成功，返回保存路径
            win.webContents.send('savedNewFile', 0, res.filePath);
          }
        })
      }
    })
  })
  
  ipc.on('saveAsHtml', (event, filename, data) => {
    let htmlpath;
    if (filename) { // 如果当前文件存在，直接用文件名作为 html 的文件名
      htmlpath = path.join(__dirname, filename)
    } else { // 否则从渲染的 html 文本中提取
      htmlpath = path.join(__dirname, `${data.replace(/\\|\/|\?|\？|\*|\"|\“|\”|\'|\‘|\’|\<|\>|\{|\}|\[|\]|\【|\】|\：|\:|\、|\^|\$|\!|\~|\`|\|/g, '').substring(0, 10)}.html`)
    }
    dialog.showSaveDialog({
      title: "导出为HTML",
      defaultPath: htmlpath,
      filters: [
        { name: 'HTML', extensions: ['html'] }
      ],
    }).then((res) => {
      if (res) {
        if (res.canceled) {
          mainWindow.webContents.send('savedAsHtml', -1);
        } else if (res.filePath) {
          const title = res.filePath.split('\\')[res.filePath.split('\\').length - 1]
          // 此处写入基本的 html 代码，其中包含了需要的 css 样式文件
          let html = `<!doctype html>\n<html>\n<head>\n<meta charset='UTF-8'><meta name='viewport' content='width=device-width initial-scale=1'>\n<link href="https://cdn.bootcss.com/github-markdown-css/2.10.0/github-markdown.min.css" rel="stylesheet">\n<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.3.1/styles/github.min.css" id="md-code-style">\n<title>${title}</title>\n</head>\n<body>\n<div class="markdown-body">\n${data}\n</div>\n</body>\n</html>`
          fs.writeFile(res.filePath, html, "utf8", (err) => {
            if (err) {
              mainWindow.webContents.send('savedAsHtml', 1, err);
            } else {
              mainWindow.webContents.send('savedAsHtml', 0);
            }
          })
        }
      }
    })
  })
  
  ipc.on('saveFile', (event, path, data) => {
    fs.writeFile(path, data, "utf8", (err) => {
      if (err) {
        win.webContents.send('savedFile', -1);
      } else {
        win.webContents.send('savedFile', 0);
      }
    })
  })
  

  ipc.on("openFile", () => {
		dialog.showOpenDialog({ // 通过 dialog 模块显示 “打开文件” 对话框
			properties: ['openFile'], // 参数选择打开文件
			filters: [
				{ name: 'Markdown File', extensions: ['md', 'markdown', 'mmd', 'mkd', 'mdwn', 'mdown', 'mdx', 'mdtxt', 'apib', 'rmarkdown', 'rmd', 'txt', 'text'] }
			], // 文件类型过滤器，只留下 markdown 文件
		}).then((res) => {
			if (res && res.filePaths && res.filePaths.length > 0) { // 如果选择了文件
				fs.readFile(res.filePaths[0], "utf8", (err, data) => { // 通过 fs-extra 读取文件内容
					if (err) { // 读取失败
						win.webContents.send('openedFile', -1)
					} else { // 读取成功，将内容发送给 vue 项目
						win.webContents.send('openedFile', 0, res.filePaths[0], data)
					}
				})
			}
		})
	})

}

async function created() {
	// 当 vue 页面创建完成后直接进行事件监听
	electron.ipcRenderer.on("resize", (event, params) => {
		if (this.maxSize !== params) {
			this.maxSize = params;
			localStorage.setItem("maxSize", params);
		}
	})
}


// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}

