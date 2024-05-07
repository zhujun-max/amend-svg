<template>
  <div>
    <input
      type="file"
      accept=".svg"
      @change="handleFileUpload"
      ref="fileInput"
      style="display: none"
    />
    <!-- 操作栏 -->
    <div class="topBUt">
      <button @click="triggerFileUpload">导入SVG文件</button>
      <button @click="copeSvg()">导出修改后的svg</button>
      <input
        type="text"
        v-model="Svgname"
        style="width: 20vw; margin-right: 4vw"
        placeholder="默认保存名"
      />
      <button @click="basics()" class="basicsXiu">基础修改</button>
      <div
        v-for="(item, index) in colew"
        :key="index"
        :style="'background-color:' + item"
        class="div12"
        @click="cclier(item)"
      >
        {{ colorClass[item].slice(2, -2) }}
      </div>
      <span>线条颜色：</span>
      <div
        v-for="item in clomne"
        :key="item"
        :style="'background-color:' + item"
        class="div12"
        @click="cclier(item)"
      >
      </div>
      <svg style="width: 8vh; height: 8vh" xmlns="http://www.w3.org/2000/svg">
        <g v-html="sanseSvg" id="sanId"></g>
      </svg>
      <!-- <div v-html="sanseSvg" ></div> -->
    </div>
    <!-- svg -->
    <div id="svg-dialog__body">
      <div
        class="boxpo"
        style="position: relative"
        ref="svgContainer"
        @mousedown="startSelection"
        @mouseup="updateSelection"
      >
        <div
          class="selection-box"
          :style="selecFrame.selectionStyle"
          v-if="selecFrame.isSelecting"
        ></div>
        <div v-if="svgContent" v-html="newSvgContent" id="svg-trigger"></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      svgContent: null,
      newSvgContent: null,
      Svgname: "",
      svgContentSrc: null,
      embedLoading: false, // 加载
      SVGTitle: "", // 窗口标题
      currentSvg: null, // SVG地址
      oldTargetNode: [], // 记录点击的节点
      jumpSVGData: {}, // 记录跳转的数据
      // 新加的选中区域
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0,
      selectedLines: [], // 存储选中线条的引用或ID
      threeModel: [],
      colew: [
        "rgb(240,65,85)",
        "rgb(128,0,128)",
        "rgb(255,255,0)",
        "rgb(128,128,128)",
        "rgb(0,0,139)",
        "rgb(185,72,66)",
      ],
      clomne: [
        "rgb(0,0,255)",
        "rgb(128,128,128)",
        // "rgb(0,0,0)",
        "rgb(0,255,255)",
      ],
      // 选中的线条
      newSelectedLines: [],
      // 选中的组件
      newSelectedModel: [],
      // 选中框的实现
      selecFrame: {
        isSelecting: false,
        selectionStyle: {
          position: "absolute",
          left: "0px",
          top: "0px",
          width: "0px",
          height: "0px",
          backgroundColor: "rgba(255, 0, 0, 0.3)",
          border: "1px solid red",
        },
      },
      colorClass: {
        "rgb(240,65,85)": "kv110kV",
        "rgb(128,0,128)": "kv220kV",
        "rgb(255,255,0)": "kv35kV",
        "rgb(128,128,128)": "kv0kV",
        "rgb(0,0,139)": "kv6kV",
        "rgb(185,72,66)": "kv10kV",
      },
      svgDoc: "",
      sanseSvg: "",
      sanseColor: "",
    };
  },
  methods: {
    // 按下坐标：
    startSelection(event) {
      this.startX =
        event.clientX - this.$refs.svgContainer.getBoundingClientRect().left;
      this.startY =
        event.clientY - this.$refs.svgContainer.getBoundingClientRect().top;
      console.log("按下坐标：", this.startX, this.startY);
      // 绘制选中框
      this.selecFrame.isSelecting = true;
      window.addEventListener("mousemove", this.updateSelecmove);
    },
    updateSelecmove(event) {
      this.endX =
        event.clientX - this.$refs.svgContainer.getBoundingClientRect().left;
      this.endY =
        event.clientY - this.$refs.svgContainer.getBoundingClientRect().top;
      // 根据startX, startY, endX, endY确定选中的线条，并更新selectedLines
      const left = Math.min(this.startX, this.endX);
      const top = Math.min(this.startY, this.endY);
      const Mleft = Math.max(this.startX, this.endX);
      const Mtop = Math.max(this.startY, this.endY);

      const width = Math.abs(this.endX - this.startX);
      const height = Math.abs(this.endY - this.startY);
      this.selecFrame.selectionStyle.left = left + "px";
      this.selecFrame.selectionStyle.top = top + "px";

      this.selecFrame.selectionStyle.width = width + "px";
      this.selecFrame.selectionStyle.height = height + "px";
    },
    // 弹起坐标：
    updateSelection(event) {
      const left = Math.min(this.startX, this.endX);
      const top = Math.min(this.startY, this.endY);
      const Mleft = Math.max(this.startX, this.endX);
      const Mtop = Math.max(this.startY, this.endY);
      this.newSelectedLines = this.getIntersectingLines(left, top, Mleft, Mtop);
      this.newSelectedModel = this.getIntersectingmodel(left, top, Mleft, Mtop);
      console.log("选中的内容", this.newSelectedLines, this.newSelectedModel);
      window.removeEventListener("mousemove", this.updateSelecmove);
    },
    // 返回选中区域的线条
    getIntersectingLines(startX, startY, endX, endY) {
      console.log("选中的线条", startX, startY, endX, endY);
      const intersectingLines = [];
      // 1. 拿到所有的线条
      const lines = this.svgDoc.querySelectorAll("path");
      // console.log('线条',lines)
      // 定义一个函数来检查点是否在矩形内(希望可以不用全在框中，只要有一半区域在就行)
      function isPointInRect(x, y) {
        // console.log(x,y,startX,endX,startY,endY)
        return x >= startX && x <= endX && y >= startY && y <= endY;
      }
      // 返回线条的起点和终点坐标
      function parsePath(pathString) {
        const commands = pathString.match(/[ML]/g);
        const parameters = pathString.match(/-?\d+(?:\.\d+)?/g).map(Number);
        const lineSegments = {};

        let currentX = 0,
          currentY = 0; // 初始坐标

        for (let i = 0; i < commands.length; i++) {
          const cmd = commands[i];
          let nextX, nextY;

          if (cmd === "M") {
            // moveto 命令设置新的当前点
            if (
              i === 0 ||
              (parameters[i * 2 - 2] !== currentX &&
                parameters[i * 2 - 1] !== currentY)
            ) {
              // 只有在坐标变化时才添加线段（忽略连续的相同坐标）
              // lineSegments.push({
              //   startX: currentX,
              //   startY: currentY,
              //   endX: parameters[i * 2],
              //   endY: parameters[i * 2 + 1],
              // });
              (lineSegments["startX"] = parameters[i * 2]),
                (lineSegments["startY"] = parameters[i * 2 + 1]);
            }
            currentX = parameters[i * 2];
            currentY = parameters[i * 2 + 1];
          } else if (cmd === "L") {
            // lineto 命令从当前点到新点绘制线段
            nextX = parameters[i * 2] + (cmd === "l" ? currentX : 0);
            nextY = parameters[i * 2 + 1] + (cmd === "l" ? currentY : 0);
            lineSegments["endX"] = nextX;
            lineSegments["endY"] = nextY;
            currentX = nextX;
            currentY = nextY;
          }
        }

        return lineSegments;
      }

      // 定义一个函数来检查线段是否与矩形相交
      function doesLineIntersectRect(line) {
        // 获取线段的两个端点坐标
        const pathData = line.getAttribute("d"); // 获取 d 属性
        const points = parsePath(pathData); // 解析路径并获取点
        // console.log(points);
        // 检查线段的两个端点是否在矩形内
        if (
          isPointInRect(points.startX, points.startY) ||
          isPointInRect(points.endX, points.endY)
        ) {
          return true; // 如果一个端点在矩形内，则线段与矩形相交
        }
        return false; // 如果没有找到相交情况，则返回 false
      }
      // console.log("所有的线条", lines);
      // 2. 遍历所有线条并检查是否相交
      for (const line of lines) {
        if (doesLineIntersectRect(line)) {
          intersectingLines.push(line);
        }
      }

      return intersectingLines;
    },
    getIntersectingmodel(startX, startY, endX, endY) {
      const intersectin = [];
      // 1. 拿到所有的线条
      const Model = this.svgDoc.querySelectorAll("use");
      // console.log('线条',lines)
      // 定义一个函数来检查点是否在矩形内
      function isPointInRect(x, y) {
        // console.log(x,y,startX,endX,startY,endY)
        return x >= startX && x <= endX && y >= startY && y <= endY;
      }
      // 定义一个函数来检查线段是否与矩形相交
      function doesLineIntersectRect(v) {
        // 获取线段的两个端点坐标
        const sx = v.getAttribute("x"); // 获取 d 属性
        const sy = v.getAttribute("y"); // 获取 d 属性
        const ex = sx + v.getAttribute("width"); // 获取 d 属性
        const ey = sy + v.getAttribute("height"); // 获取 d 属性

        // 检查线段的两个端点是否在矩形内
        if (isPointInRect(sx, sy) || isPointInRect(ex, ey)) {
          return true; // 如果一个端点在矩形内，则线段与矩形相交
        }
        return false; // 如果没有找到相交情况，则返回 false
      }
      for (const mode of Model) {
        if (doesLineIntersectRect(mode)) {
          intersectin.push(mode);
        }
      }
      return intersectin;
    },
    // 选中颜色 修改组件和线条``
    cclier(v) {
      console.log("选中颜色", v, this.sanseColor);
      if (this.sanseColor) {
        // 修改三色组件
        console.log("11112", this.colorClass[v]);
        // 修改svg组件中的颜色
        this.threeModel.forEach((useElement) => {
          // console.log(useElement)
          // 获取 xlink:href 属性的值
          var xlinkHref = useElement.getAttributeNS(
            "http://www.w3.org/1999/xlink",
            "href"
          );

          // 检查 xlink:href 属性是否存在且以 #Transformer3: 开头
          if (xlinkHref && xlinkHref.startsWith(this.sanseColor)) {
            console.log("发广告广告", useElement);
            useElement.setAttribute("class", this.colorClass[v]);
          }
        });
        this.newSvgContent = new XMLSerializer().serializeToString(this.svgDoc);
        // 修改顶部三色组件颜色
        let circle = document.getElementById("sanId");
        const alf = circle.querySelectorAll("use");
        alf.forEach((useElement) => {
          // console.log('租金',useElement)
          // 获取 xlink:href 属性的值
          var xlinkHref = useElement.getAttributeNS(
            "http://www.w3.org/1999/xlink",
            "href"
          );

          // 检查 xlink:href 属性是否存在且以 #Transformer3: 开头
          if (xlinkHref && xlinkHref.startsWith(this.sanseColor)) {
            // console.log('发广告广告',useElement);
            useElement.setAttribute("class", this.colorClass[v]);
          }
        });
        this.sanseColor = "";
        // console.log(alf,'gggd')
        return;
      }
      // 修改线条颜色
      this.newSelectedLines.forEach((lineId) => {
        lineId.setAttribute("stroke", v); // 改变选中线条的颜色
      });
      // 修改组件颜色
      this.newSelectedModel.forEach((lineId) => {
        lineId.setAttribute("class", this.colorClass[v]); // 改变选中线条的颜色
      });
      this.selecFrame = this.$options.data().selecFrame;

      this.newSvgContent = new XMLSerializer().serializeToString(this.svgDoc);
      this.newSelectedLines = [];
      this.newSelectedModel = [];
    },
    // 基础修改
    basics() {
      // 1. 删除所有多余文字
      const arrtex = [
        "国网冀北秦皇岛集控站设备监视系统",
        "变电站主页",
        "光字牌索引图",
        "二次网络结构",
        "交直流系统",
        "故障录波",
        "事件列表",
        "智能联动",
        "在线监视",
        "照明控制",
        "动环监控",
        "安全防卫",
        "消防监视",
        "区域用电负荷",
        "实际有功总加",
      ];
      const elements1 = this.svgDoc.querySelectorAll("#Text_Layer>text");
      // 选中删除内容
      arrtex.forEach((cc) => {
        elements1.forEach((textElement) => {
          if (cc === textElement.textContent.trim()) {
            // 删除当前标签
            textElement.parentNode.removeChild(textElement);
            return;
          }
        });
      });

      // 2.删除所有图片
      const elements2 = this.svgDoc.querySelectorAll("#Other_Layer>image");
      elements2.forEach((textElement) => {
        // 删除当前标签
        textElement.parentNode.removeChild(textElement);
      });
      // 3. 修改背景颜色
      const elements3 = this.svgDoc.querySelectorAll("#Head_Layer>rect");
      elements3.forEach(function (element) {
        element.setAttribute("fill", "rgb(0,47,71)"); // 设置填充颜色为蓝色
      });
      // 4.修改遮挡背景
      const elements4 = this.svgDoc.querySelectorAll("#Link_Layer>g>path");
      elements4.forEach((v) => {
        // 获取d属性的内容
        const dAttributeContent = v.getAttribute("d");
        // 使用空格切割字符串
        const pathCommands = dAttributeContent.split(" ");
        // 检查长度
        if (pathCommands.length >= 9) {
          v.style["fill"] = "none";
        }
      });
      // 5. 删除组件内的颜色
      const elements5 = this.svgDoc.querySelectorAll("defs>symbol>*");

      elements5.forEach((element) => {
        // 获取stroke属性的内容
        element.setAttribute("stroke", "");
        // const dAttributeContent = v.getAttribute("stroke");
      });
      this.newSvgContent = new XMLSerializer().serializeToString(this.svgDoc);
    },
    triggerFileUpload() {
      this.$refs.fileInput.click();
    },
    // 引入一个svg
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (file && file.type === "image/svg+xml") {
        const reader = new FileReader();
        this.Svgname = this.repName(file.name);
        reader.onload = (e) => {
          this.svgContent = e.target.result;
          this.newSvgContent = e.target.result;
          this.svgContentSrc = URL.createObjectURL(file);
          this.$nextTick(() => {
            const parser = new DOMParser();
            // 解析SVG字符串为DOM对象
            this.svgDoc = parser.parseFromString(
              this.newSvgContent,
              "image/svg+xml"
            );
            // 删除可以跳转的标签
            const ahref = this.svgDoc.querySelectorAll("a");
            ahref.forEach((v) => {
              v.removeAttribute("xlink:href");
            });
            //  三色组件无法修改颜色。通过其他方式
            const Model = this.svgDoc.querySelectorAll("use");
            const threeColourModel = [];
            Model.forEach(function (useElement) {
              // 获取 xlink:href 属性的值
              var xlinkHref = useElement.getAttributeNS(
                "http://www.w3.org/1999/xlink",
                "href"
              );

              // 检查 xlink:href 属性是否存在且以 #Transformer3: 开头
              if (xlinkHref && xlinkHref.startsWith("#Transformer3:")) {
                console.log(useElement.href.animVal);
                threeColourModel.push(useElement);
              }
            });
            this.threeModel = threeColourModel;

            // 三、获取三色组件。显示到顶部，用于修改颜色
            if (this.threeModel.length) {
              const parent1 = this.threeModel[0].parentElement;
              const parent2 = parent1 ? parent1.parentElement : null;
              console.log("获取三色组件：", parent2);
              var parent3 = parent2.cloneNode(true); // 深度克隆，包括所有子元素
              const alf = parent3.querySelectorAll("use");
              alf.forEach((v) => {
                v.setAttribute("y", "50");
                v.setAttribute("x", "50");
                v.setAttribute("style", "pointer-events: bounding-box;");
                v.setAttribute(
                  "transform",
                  "rotate(0,770,808) scale(1,1) translate(-50,-48)"
                );
              });
              this.sanseSvg = new XMLSerializer().serializeToString(parent3);
              // 添加点击事件监听器
              var circle = document.getElementById("sanId");
              var that = this;
              circle.addEventListener("click", function (event) {
                console.log("Circle clicked!", event.target.href.animVal);

                that.sanseColor = event.target.href.animVal;
                // console.log("三色组件颜色：", that);
              });
            }
          });
        };
        reader.readAsText(file);
      } else {
        alert("请选择一个有效的SVG文件");
      }
    },
    // 修改名称
    repName(filename) {
      // 移除前缀 "CD." 和后缀 ".fac"
      const nameWithoutPrefixSuffix = filename
        .replace(/^CD\./, "")
        .replace(/\.fac\.svg$/, "");
      // 替换下划线为点，并添加新前缀 "简易修改版" 和新后缀 ".svg"
      const newName = `${nameWithoutPrefixSuffix.replace(/_/g, ".")}.svg`;
      return newName;
    },
    // 导出svg
    copeSvg() {
      if(!this.newSvgContent){
        alert('请先导入svg文件');
        return
      }
      // 创建一个Blob对象
      const blob = new Blob([this.newSvgContent], {
        type: "image/svg+xml;charset=utf-8",
      });

      // 创建一个数据URL
      const url = URL.createObjectURL(blob);

      // 创建一个链接元素
      const link = document.createElement("a");
      link.href = url;
      link.download = this.repName(this.Svgname); // 设置下载的文件名

      // 触发下载
      document.body.appendChild(link);
      link.click();

      // 清理
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
    },
  },
};
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
.boxsho {
  width: 100vw;
  overflow: hidden;
  > div {
    width: 40%;
    // height: 90vh;
    float: left;
    > pre {
      width: 100%;
      height: 400px;
      border: 2px solid;
      overflow: auto;
    }
  }
}
#svg-dialog__body {
  // height: 900px;
  width: 100%;
  position: relative;
  margin-top: 4vh;
  #svg-trigger {
    position: absolute;
    top: 0;
    left: 0;
    user-select: none;
  }
}
.div12 {
  width: 3vh;
  height: 3vh;
  border: 1px solid;
  cursor: pointer;
  color: #fff;
  font-size: 1vh;
  text-align: center;
  word-wrap: break-word;
  border: 1px solid #ccc;
  margin-right: 0.4vw !important;
}
.selection-box {
  z-index: 9;
  pointer-events: none; /* 防止选中框影响鼠标事件 */
}
.basicsXiu {
  width: 5vw;
  height: 3.4vh;
}
.topBUt {
  position: fixed;
  height: 5vh;
  width: 100vw;
  top: 0;
  left: 0;
  z-index: 99;
  background-color: #fff;
  display: flex;
  > * {
    font-size: 1.5vh;
    margin-right: 2vh;
  }
  > input,
  button {
    height: 4vh !important;
  }
}
.threeMode {
  width: 3vh;
  height: 3vh;
  // border: 1px solid;
  position: relative;
  > div {
    position: absolute;
    border: 1px solid;
    width: 2vh;
    height: 2vh;
    border-radius: 50%;
    cursor: pointer;
  }
  > .m0 {
    top: 0;
    left: 25%;
  }
  > .m1 {
    top: 50%;
    left: 0;
  }
  > .m2 {
    top: 50%;
    left: 50%;
  }
}
</style>
