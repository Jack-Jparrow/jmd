<!--
 * @Author: Jack Jparrow
 * @Date: 2022-05-19 08:59:39
 * @LastEditTime: 2022-05-30 09:37:17
 * @LastEditors: Jack Jparrow
 * @Description: 
-->

<template>
	<div id="app">
		<header class="head">
			<img src='./assets/logo1.png' alt=" " id="appLogo" />
			<span>Alkaidmd{{filePath?' - ' + filePath.split("/")[filePath.split("/").length - 1]:''}}</span>
			<button class="topRightButton" id="closeButton" @click="closeWindow">
				<i class="el-icon-close" />
			</button>
			<button class="topRightButton" id="restoreSizeButton" @click="resizeWindow">
				<i :class="maxSize?'el-icon-copy-document':'el-icon-full-screen'" />
			</button>
			<button class="topRightButton" id="minimizeButton" @click="minWindow">
				<i class="el-icon-minus" />
			</button>
		</header>
		<div class="body">
			<!-- 菜单 -->
			<div class="toolbars">
				<el-dropdown size="mini" trigger="click" placement="bottom-start" @command="fileCommand">
          <button>文件操作</button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="open">打开...</el-dropdown-item>
            <el-dropdown-item command="save" :disabled="rawText===''" :divided="true">另存为...</el-dropdown-item>
            <el-dropdown-item command="html" :disabled="rawText===''" :divided="true">以HTML输出</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
			</div>

			<!-- mavon-editor -->
			<div class="main" v-loading="outputing" element-loading-text="outputing..." element-loading-spinner="el-icon-loading" element-loading-background="rgba(0, 0, 0, 0.8)">
				<mavon-editor style="height: 100%; width: 100%;" :toolbars="markdownOption" v-model="rawText" ref="md" @save="save" />
			</div>

		</div>
	</div>
</template>

<script>
const electron = window.require('electron'); // 导入 electron

export default {
	name: "App",
	
  data() {
		return {
			maxSize: false, // 当前窗口是否最大化
      rawText: "", // markdown 源码
			outputing: false, // 正在导出
      markdownOption: { // mavon-editor 配置
				bold: true, // 粗体
				italic: true, // 斜体
				header: true, // 标题
				underline: true, // 下划线
				strikethrough: true, // 中划线
				mark: true, // 标记
				superscript: true, // 上角标
				subscript: true, // 下角标
				quote: true, // 引用
				ol: true, // 有序列表
				ul: true, // 无序列表
				link: true, // 链接
				imagelink: true, // 图片链接
				code: true, // code
				table: true, // 表格
				fullscreen: false, // 全屏编辑
				readmodel: false, // 沉浸式阅读
				htmlcode: false, // 展示html源码
				help: true, // 帮助
				/* 1.3.5 */
				undo: true, // 上一步
				redo: true, // 下一步
				trash: true, // 清空
				save: true, // 保存（触发events中的save事件）
				/* 1.4.2 */
				navigation: true, // 导航目录
				/* 2.1.8 */
				alignleft: true, // 左对齐
				aligncenter: true, // 居中
				alignright: true, // 右对齐
				/* 2.2.1 */
				subfield: false, // 单双栏模式
				preview: false, // 预览
			},

      save() {
        if (this.filePath) { // 如果此时打开的是本地文件，则进行保存操作
          window.electron.ipcRenderer.send(
            "saveFile",
            this.filePath,
            this.rawText
          );
        } else if (this.rawText) { // 否则进行另存为操作
          window.electron.ipcRenderer.send("saveNewFile", this.rawText);
        }
      },
      
		};
	},

  methods: {
		closeWindow() {
			electron.ipcRenderer.send("close");
		},
		minWindow() {
			electron.ipcRenderer.send("min"); // 通过 ipcRenderer 发送 min 消息
		},
		resizeWindow() {
			electron.ipcRenderer.send("max"); // 通过 ipcRenderer 发送 max 消息
		},

    fileCommand(command) {
			switch (command) {
				case "open": { // 打开 markdown 文件
					electron.ipcRenderer.send("openFile");
					break;
				}
				case "save": { // 另存为
					if (this.rawText) {
						electron.ipcRenderer.send("saveNewFile", this.rawText);
					}
					break;
				}
				case "html": { // 导出 html 文件
					this.outputing = true;
					let filename = "";
					if (this.filePath) {
						filename =
							this.filePath.split("\\")[
								this.filePath.split("\\").length - 1
							];
						filename = filename.substring(
							0,
							filename.lastIndexOf(".")
						);
					}
					electron.ipcRenderer.send(
						"saveAsHtml",
						filename,
						this.$refs.md.d_render
					);
					break;
				}
			}
		},

    initIpcRenderers() {
			electron.ipcRenderer.on("resize", (event, params) => {
				if (this.maxSize !== params) {
					this.maxSize = params;
					localStorage.setItem("maxSize", params);
				}
			});
			electron.ipcRenderer.on("openedFile", (e, status, path, data) => {
				if (status === 0) {
					this.filePath = path;
					this.rawText = data;
					this.initRawText = data;
				} else {
					console.log("读取失败");
				}
			});
		}
	},
	created() {
		this.initIpcRenderers();
	}
    
};
</script>

<style>
* {
	margin: 0%;
}

#app {
	width: 100vw;
	height: 100vh;
	overflow:hidden;
}

/* 应用图标 */
#appLogo {
	width: 2.5em;
	height: 2.5em;
	vertical-align: top; /* 这里只要不是 baseline 就行，防止 img 与 span 垂直方向不在同一水平线上 */
}

/* 绘制一个好看一点的滚动条 */
/* ::-webkit-scrollbar {
	width: 6px;
  background-color: #f07e1f;
} */

::-webkit-scrollbar-thumb {
	background-color: #a8a8a8;
	border-radius: 3px;
}

.head {
  user-select: none;
  -webkit-app-region: drag;
	width: 100vw;
	font-size: 12px;
	height: 2.5em;
	line-height: 2.5em;
	background-image: linear-gradient(to right, #fe7171 0%, #fab7b7 75%); /* 绘制渐变 */
  /*background-color: #f07e1f;*/
  -webkit-user-drag: none;
	position: relative;
	z-index: 9999; /* 防止其他 dom 元素覆盖在顶部边栏上方 */
}

.topRightButton {
  -webkit-app-region: no-drag;
	float: right;
	height: 2.25em;
	width: 3em;
	line-height: 2.5em;
	border: none;
	background: rgba(0, 0, 0, 0);
	outline: none;
}

.topRightButton:hover {
	cursor: pointer;
}

#minimizeButton:hover {
	background-color: #ffaaaa;
}

#restoreSizeButton:hover {
	background-color: #ff6666;
	color: white;
}

#closeButton:hover {
	background-color: #ff0000;
	color: white;
}
</style>
