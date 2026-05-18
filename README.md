# maptalks-drawtool-customizable

基于 maptalks DrawTool 的扩展插件，添加绘制面时自相交检测功能。

## 功能特性

- 绘制多边形时自动检测自相交
- 检测到自相交时自动回退到上一个点
- 阻止双击结束自相交的绘制
- 自定义错误提示消息和 UI

## 安装

```bash
npm install maptalks-drawtool-customizable
```

## 使用方式

### 1. npm 引入（ES Module / CommonJS）

```bash
npm install maptalks-drawtool-customizable
```

```javascript
// ES Module
import { SelfIntersectionDrawTool } from 'maptalks-drawtool-customizable';

// CommonJS
const { SelfIntersectionDrawTool } = require('maptalks-drawtool-customizable');

// 使用
const drawTool = new SelfIntersectionDrawTool({
    mode: 'polygon',
    enableSelfIntersectionCheck: true,
    selfIntersectionErrorMessage: '多边形不能自相交',
    onSelfIntersectionError: function(message) {
        alert(message);
    }
}).addTo(map);
```

### 2. CDN script 标签引入

```html
<script src="https://cdn.jsdelivr.net/npm/maptalks@1.0.0/dist/maptalks.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/maptalks-drawtool-customizable/dist/maptalks-drawtool-customizable.umd.js"></script>

<script>
    const drawTool = new DrawToolCustomizable({
        mode: 'polygon',
        enableSelfIntersectionCheck: true,
        selfIntersectionErrorMessage: '多边形不能自相交',
        onSelfIntersectionError: function(message) {
            alert(message);
        }
    }).addTo(map);
</script>
```

## 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| mode | string | null | 绘制模式：polygon, linestring, point 等 |
| enableSelfIntersectionCheck | boolean | false | 是否启用自相交检测 |
| selfIntersectionErrorMessage | string | '绘制面出现自相交，请重新绘制' | 自相交时的提示消息 |
| onSelfIntersectionError | function | null | 自相交时的回调函数，可用于自定义提示 UI |

其他选项继承自 [maptalks DrawTool](http://maptalks.org/maptalks.js/api/classes/draw.DrawTool.html)。

## 方法

| 方法 | 说明 |
|------|------|
| addTo(map) | 添加到地图 |
| setMode(mode) | 设置绘制模式 |
| getMode() | 获取当前模式 |
| enable() | 启用绘制工具 |
| disable() | 禁用绘制工具 |
| undo() | 回退到上一个点 |
| redo() | 重做 |
| on(event, handler) | 绑定事件 |
| off(event, handler) | 解绑事件 |
| getCurrentGeometry() | 获取当前正在绘制的几何图形 |
| getCurrentCoordinates() | 获取当前坐标数组 |
| isSelfIntersecting(coordinates) | 检测坐标是否自相交 |

## 事件

| 事件 | 说明 |
|------|------|
| drawstart | 开始绘制 |
| drawvertex | 添加顶点 |
| drawend | 完成绘制 |
| selfintersectionwarning | 检测到自相交时触发 |

## 示例

### 基础用法

```javascript
const drawTool = new SelfIntersectionDrawTool({
    mode: 'polygon',
    enableSelfIntersectionCheck: true
}).addTo(map);

drawTool.on('drawend', function(param) {
    console.log('绘制完成', param.geometry);
});
```

### 自定义提示 UI

```javascript
const drawTool = new SelfIntersectionDrawTool({
    mode: 'polygon',
    enableSelfIntersectionCheck: true,
    selfIntersectionErrorMessage: '多边形不能自相交，请重新绘制',
    onSelfIntersectionError: function(message) {
        // 自定义提示样式
        const toast = document.createElement('div');
        toast.className = 'custom-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
    }
}).addTo(map);
```

### 监听警告事件

```javascript
const drawTool = new SelfIntersectionDrawTool({
    mode: 'polygon',
    enableSelfIntersectionCheck: true
}).addTo(map);

drawTool.on('selfintersectionwarning', function(e) {
    console.log('警告:', e.message);
});
```

## 完整示例 HTML

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>maptalks-drawtool-customizable 示例</title>
    <script src="https://cdn.jsdelivr.net/npm/maptalks@1.0.0/dist/maptalks.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/maptalks-drawtool-customizable/dist/maptalks-drawtool-customizable.umd.js"></script>
    <style>
        #map { width: 100%; height: 100%; }
        #message {
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(220, 53, 69, 0.95);
            color: white;
            padding: 15px 30px;
            border-radius: 6px;
            display: none;
            z-index: 2000;
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <div id="message"></div>

    <script>
        const map = new maptalks.Map('map', {
            center: [120.5, 31.3],
            zoom: 10,
            baseLayer: new maptalks.TileLayer('base', {
                urlTemplate: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            })
        });

        const layer = new maptalks.VectorLayer('v').addTo(map);

        const drawTool = new DrawToolCustomizable({
            mode: 'polygon',
            symbol: {
                lineColor: '#4a8af4',
                lineWidth: 2,
                polygonFill: '#4a8af4'
            },
            enableSelfIntersectionCheck: true,
            selfIntersectionErrorMessage: '多边形不能自相交，请重新绘制',
            onSelfIntersectionError: function(message) {
                const el = document.getElementById('message');
                el.textContent = message;
                el.style.display = 'block';
                setTimeout(() => el.style.display = 'none', 2500);
            }
        }).addTo(map);

        drawTool.on('drawend', function(param) {
            if (param.geometry) {
                layer.addGeometry(param.geometry);
            }
        });
    </script>
</body>
</html>
```

## 目录结构

```
├── dist/
│   ├── maptalks-drawtool-customizable.cjs.js   # CommonJS
│   ├── maptalks-drawtool-customizable.esm.js   # ES Module
│   ├── maptalks-drawtool-customizable.umd.js   # UMD (script标签用)
│   └── index.d.ts                         # TypeScript 类型定义
├── src/
│   └── index.ts                          # 源代码
├── package.json
├── rollup.config.js
└── tsconfig.json
```

## 本地构建

```bash
# 安装依赖
npm install

# 构建
npm run build

# 监听模式
npm run dev
```