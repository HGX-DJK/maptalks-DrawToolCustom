# maptalks-drawtool-selfintersect

继承 maptalks DrawTool，添加在绘制面过程中检测自相交的功能。

## 安装

```bash
npm install
npm run build
```

## 使用方法

```javascript
import { SelfIntersectionDrawTool } from 'maptalks-drawtool-selfintersect';
import DrawTool from 'maptalks';

// 创建实例
const drawTool = new SelfIntersectionDrawTool({
  mode: 'polygon',
  enableSelfIntersectionCheck: true  // 启用自相交检测
}).addTo(map);

// 监听自相交警告事件
drawTool.on('selfintersectionwarning', function(e) {
  console.log(e.message); // '绘制面出现自相交，请重新绘制'
  // 显示提示 UI
});

// 监听绘制完成
drawTool.on('drawend', function(param) {
  layer.addGeometry(param.geometry);
});
```

## API

### SelfIntersectionDrawToolOptions

继承自 `DrawToolOptions`，新增选项：

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| enableSelfIntersectionCheck | boolean | false | 是否启用自相交检测 |

### 方法

#### `isSelfIntersecting(coordinates)`
检测坐标数组是否自相交

#### `getCurrentCoordinates()`
获取当前正在绘制的几何图形的坐标数组

#### `enableSelfIntersectionCheck`
启用/禁用自相交检测
