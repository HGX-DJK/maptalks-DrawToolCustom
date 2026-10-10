const assert = require('assert');
const maptalks = require('maptalks');
const {
  SelfIntersectionDrawTool,
  segmentsIntersect,
  checkRingSelfIntersection,
  checkPolylineSelfIntersection,
  normalizeCoordinates,
  isSelfIntersecting,
  orientation,
  onSegment
} = require('../dist/giser-maptalks-drawtool.cjs.js');

console.log('🧪 开始运行自动化单元测试...');

// 1. 线段相交测试
{
  // 基础十字相交
  assert.strictEqual(
    segmentsIntersect({ x: 0, y: 0 }, { x: 2, y: 2 }, { x: 0, y: 2 }, { x: 2, y: 0 }),
    true,
    '测试 1.1 失败: 十字交叉应该相交'
  );

  // 共享端点不属于非法相交
  assert.strictEqual(
    segmentsIntersect({ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 0 }),
    false,
    '测试 1.2 失败: 共享端点不应判定为非法相交'
  );

  // 平行不相交
  assert.strictEqual(
    segmentsIntersect({ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 2, y: 1 }),
    false,
    '测试 1.3 失败: 平行线不应相交'
  );

  // T型相交（点落在另一线段上）
  assert.strictEqual(
    segmentsIntersect({ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }),
    true,
    '测试 1.4 失败: T型接触应判定为相交'
  );

  // 共线部分重叠
  assert.strictEqual(
    segmentsIntersect({ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 0 }, { x: 3, y: 0 }),
    true,
    '测试 1.5 失败: 共线重叠应判定为相交'
  );

  console.log('  ✅ 1. 基础线段相交测试通过');
}

// 2. 多边形闭合环检测
{
  // 正常凸四边形（未闭合输入）
  const rect = [
    { x: 0, y: 0 }, { x: 0, y: 2 }, { x: 2, y: 2 }, { x: 2, y: 0 }
  ];
  assert.strictEqual(checkRingSelfIntersection(rect), false, '测试 2.1 失败: 矩形不应自相交');

  // 正常凸四边形（首尾闭合输入）
  const rectClosed = [
    { x: 0, y: 0 }, { x: 0, y: 2 }, { x: 2, y: 2 }, { x: 2, y: 0 }, { x: 0, y: 0 }
  ];
  assert.strictEqual(checkRingSelfIntersection(rectClosed), false, '测试 2.2 失败: 闭合矩形不应自相交');

  // 正常凹多边形
  const concave = [
    { x: 0, y: 0 }, { x: 0, y: 4 }, { x: 4, y: 4 }, { x: 4, y: 2 },
    { x: 2, y: 2 }, { x: 2, y: 1 }, { x: 4, y: 1 }, { x: 4, y: 0 }
  ];
  assert.strictEqual(checkRingSelfIntersection(concave), false, '测试 2.3 失败: 合法凹多边形不应自相交');

  // 沙漏型（领结形）自相交四边形
  const bowtie = [
    { x: 0, y: 0 }, { x: 0, y: 2 }, { x: 2, y: 0 }, { x: 2, y: 2 }
  ];
  assert.strictEqual(checkRingSelfIntersection(bowtie), true, '测试 2.4 失败: 沙漏形必须判定为自相交');

  console.log('  ✅ 2. 多边形闭合环检测测试通过');
}

// 3. 折线（LineString）检测
{
  const lineSafe = [
    { x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 0 }, { x: 3, y: 1 }
  ];
  assert.strictEqual(checkPolylineSelfIntersection(lineSafe), false, '测试 3.1 失败: 正常折线不应相交');

  const lineCross = [
    { x: 0, y: 0 }, { x: 2, y: 2 }, { x: 0, y: 2 }, { x: 2, y: 0 }
  ];
  assert.strictEqual(checkPolylineSelfIntersection(lineCross), true, '测试 3.2 失败: 交叉折线应判定为自相交');

  // 测试 DrawTool 实例在 linestring 模式下的 isSelfIntersecting
  const drawToolLine = new SelfIntersectionDrawTool({
    mode: 'linestring',
    enableSelfIntersectionCheck: true
  });
  assert.strictEqual(drawToolLine.isSelfIntersecting(lineCross), true, '测试 3.3 失败: DrawTool 在 linestring 模式下应判定交叉');
  assert.strictEqual(drawToolLine.isSelfIntersecting(lineSafe), false, '测试 3.4 失败: DrawTool 在 linestring 模式下不应误报');

  console.log('  ✅ 3. 折线自相交检测测试通过');
}

// 4. 类继承与实例生命周期
{
  const drawTool = new SelfIntersectionDrawTool({
    mode: 'polygon',
    enableSelfIntersectionCheck: true
  });

  assert.strictEqual(drawTool instanceof maptalks.DrawTool, true, '测试 4.1 失败: 必须是 maptalks.DrawTool 实例');
  assert.strictEqual(typeof drawTool.addTo, 'function', '测试 4.2 失败: 必须具备 addTo 方法');
  assert.strictEqual(typeof drawTool.remove, 'function', '测试 4.3 失败: 必须具备 remove 方法');
  assert.strictEqual(typeof drawTool.undo, 'function', '测试 4.4 失败: 必须具备 undo 方法');
  assert.strictEqual(typeof drawTool.redo, 'function', '测试 4.5 失败: 必须具备 redo 方法');
  assert.strictEqual(typeof drawTool.endDraw, 'function', '测试 4.6 失败: 必须具备 endDraw 方法');

  console.log('  ✅ 4. 类继承与生命周期接口测试通过');
}

// 5. 静态工具方法与纯数据/GeoJSON 表单校验测试
{
  // 5.1 纯数字坐标数组 (非自相交矩形 vs 自相交沙漏)
  const validCoords = [[0, 0], [0, 2], [2, 2], [2, 0], [0, 0]];
  const bowtieCoords = [[0, 0], [0, 2], [2, 0], [2, 2], [0, 0]];

  assert.strictEqual(SelfIntersectionDrawTool.isSelfIntersecting(validCoords), false, '测试 5.1 失败: 合法坐标数组误报');
  assert.strictEqual(SelfIntersectionDrawTool.isSelfIntersecting(bowtieCoords), true, '测试 5.2 失败: 静态方法未能检测出沙漏坐标自相交');
  assert.strictEqual(isSelfIntersecting(bowtieCoords), true, '测试 5.3 失败: 纯函数未能检测出沙漏坐标自相交');

  // 5.2 GeoJSON Polygon 校验
  const geojsonValid = {
    type: 'Polygon',
    coordinates: [[[120.0, 30.0], [120.1, 30.0], [120.1, 30.1], [120.0, 30.1], [120.0, 30.0]]]
  };
  const geojsonBowtie = {
    type: 'Polygon',
    coordinates: [[[120.0, 30.0], [120.0, 30.2], [120.2, 30.0], [120.2, 30.2], [120.0, 30.0]]]
  };

  assert.strictEqual(SelfIntersectionDrawTool.isSelfIntersecting(geojsonValid), false, '测试 5.4 失败: GeoJSON 合法多边形误报');
  assert.strictEqual(SelfIntersectionDrawTool.isSelfIntersecting(geojsonBowtie), true, '测试 5.5 失败: GeoJSON 沙漏多边形漏检');

  // 5.3 GeoJSON LineString 校验
  const geojsonLineCross = {
    type: 'LineString',
    coordinates: [[0, 0], [2, 2], [0, 2], [2, 0]]
  };
  const geojsonLineSafe = {
    type: 'LineString',
    coordinates: [[0, 0], [1, 1], [2, 0], [3, 1]]
  };
  assert.strictEqual(SelfIntersectionDrawTool.isSelfIntersecting(geojsonLineCross), true, '测试 5.6 失败: GeoJSON 交叉折线漏检');
  assert.strictEqual(SelfIntersectionDrawTool.isSelfIntersecting(geojsonLineSafe), false, '测试 5.7 失败: GeoJSON 安全折线误报');

  // 5.4 maptalks.Geometry 实例校验
  const maptalksPoly = new maptalks.Polygon([[[0, 0], [0, 2], [2, 0], [2, 2], [0, 0]]]);
  const maptalksLine = new maptalks.LineString([[0, 0], [2, 2], [0, 2], [2, 0]]);
  assert.strictEqual(SelfIntersectionDrawTool.isSelfIntersecting(maptalksPoly), true, '测试 5.8 失败: maptalks Polygon 实例漏检');
  assert.strictEqual(SelfIntersectionDrawTool.isSelfIntersecting(maptalksLine), true, '测试 5.9 失败: maptalks LineString 实例漏检');

  console.log('  ✅ 5. 静态工具方法与纯数据/GeoJSON 校验测试通过');
}

console.log('\n🎉 所有测试均已顺利通过！');
