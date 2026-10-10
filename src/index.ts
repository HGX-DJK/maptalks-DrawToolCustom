/* eslint-disable @typescript-eslint/no-explicit-any */

import * as maptalks from 'maptalks';

/**
 * 二维平面点坐标接口
 */
export interface Point2D {
  x: number;
  y: number;
  [key: string]: any;
}

/**
 * 自定义 DrawTool 选项配置
 */
export interface SelfIntersectionDrawToolOptions {
  mode?: string;
  symbol?: any;
  once?: boolean;
  autoPanAtEdge?: boolean;
  blockGeometryEvents?: boolean;
  zIndex?: number;
  doubleClickZoom?: boolean;
  ignoreMouseleave?: boolean;
  enableAltitude?: boolean;
  interactive?: boolean;
  edgeAutoComplete?: boolean;
  transformCoordinate?: any;
  /** 是否启用自相交检测，默认 false */
  enableSelfIntersectionCheck?: boolean;
  /** 自相交时的提示消息 */
  selfIntersectionErrorMessage?: string;
  /** 自相交检测到时的回调函数 */
  onSelfIntersectionError?: (message: string) => void;
  [key: string]: any;
}

const DEFAULT_ERROR_MESSAGE = '出现自相交，已自动回退到上一个点';
const DRAWEND_ERROR_MESSAGE = '存在自相交，无法完成绘制，请继续调整或按ESC取消';
const EPSILON = 1e-9;

/**
 * 计算三点方向（叉乘）
 * @returns 0: 共线, 1: 顺时针, 2: 逆时针
 */
export function orientation(p: Point2D, q: Point2D, r: Point2D): number {
  const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  if (Math.abs(val) < EPSILON) return 0;
  return val > 0 ? 1 : 2;
}

/**
 * 判断点 q 是否在线段 pr 上（前提是 p, q, r 共线）
 */
export function onSegment(p: Point2D, q: Point2D, r: Point2D): boolean {
  return (
    q.x <= Math.max(p.x, r.x) + EPSILON &&
    q.x >= Math.min(p.x, r.x) - EPSILON &&
    q.y <= Math.max(p.y, r.y) + EPSILON &&
    q.y >= Math.min(p.y, r.y) - EPSILON
  );
}

/**
 * 判断两点是否在容差内重合
 */
export function isSamePoint(p1: Point2D, p2: Point2D): boolean {
  return Math.abs(p1.x - p2.x) < EPSILON && Math.abs(p1.y - p2.y) < EPSILON;
}

/**
 * 判断两线段是否共享端点
 */
export function sharesEndpoint(p1: Point2D, p2: Point2D, p3: Point2D, p4: Point2D): boolean {
  return isSamePoint(p1, p3) || isSamePoint(p1, p4) || isSamePoint(p2, p3) || isSamePoint(p2, p4);
}

/**
 * 判断两条线段是否相交（自动排除共享相邻端点的情况，支持严格处理共线与T型相交）
 */
export function segmentsIntersect(p1: Point2D, p2: Point2D, p3: Point2D, p4: Point2D): boolean {
  // 连续相邻边共享端点不属于非法相交
  if (sharesEndpoint(p1, p2, p3, p4)) {
    return false;
  }

  // 包围盒快速剔除 (AABB)
  if (
    Math.min(p1.x, p2.x) > Math.max(p3.x, p4.x) + EPSILON ||
    Math.max(p1.x, p2.x) < Math.min(p3.x, p4.x) - EPSILON ||
    Math.min(p1.y, p2.y) > Math.max(p3.y, p4.y) + EPSILON ||
    Math.max(p1.y, p2.y) < Math.min(p3.y, p4.y) - EPSILON
  ) {
    return false;
  }

  const o1 = orientation(p1, p2, p3);
  const o2 = orientation(p1, p2, p4);
  const o3 = orientation(p3, p4, p1);
  const o4 = orientation(p3, p4, p2);

  // 一般相交（跨立实验）
  if (o1 !== o2 && o3 !== o4) {
    return true;
  }

  // 特殊情况：共线且重叠
  if (o1 === 0 && onSegment(p1, p3, p2)) return true;
  if (o2 === 0 && onSegment(p1, p4, p2)) return true;
  if (o3 === 0 && onSegment(p3, p1, p4)) return true;
  if (o4 === 0 && onSegment(p3, p2, p4)) return true;

  return false;
}

/**
 * 检测多边形闭合环是否自相交（无向边对检测，严格避免重复比较）
 */
export function checkRingSelfIntersection(points: Point2D[]): boolean {
  if (!points || points.length < 4) return false;

  // 统一去除末尾可能已闭合的重复首点
  const ring = [...points];
  if (ring.length > 1 && isSamePoint(ring[0], ring[ring.length - 1])) {
    ring.pop();
  }

  const n = ring.length;
  if (n < 4) return false;

  for (let i = 0; i < n - 1; i++) {
    const a1 = ring[i];
    const a2 = ring[(i + 1) % n];

    for (let j = i + 1; j < n; j++) {
      // 相邻边跳过
      if (j === i + 1) continue;
      // 首尾闭合边跳过
      if (i === 0 && j === n - 1) continue;

      const b1 = ring[j];
      const b2 = ring[(j + 1) % n];

      if (segmentsIntersect(a1, a2, b1, b2)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * 检测折线线段是否自相交
 */
export function checkPolylineSelfIntersection(points: Point2D[]): boolean {
  if (!points || points.length < 4) return false;
  const n = points.length;

  for (let i = 0; i < n - 2; i++) {
    const a1 = points[i];
    const a2 = points[i + 1];

    for (let j = i + 2; j < n - 1; j++) {
      const b1 = points[j];
      const b2 = points[j + 1];

      if (segmentsIntersect(a1, a2, b1, b2)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * 统一解析并归一化各种格式的几何对象或坐标数据
 * 支持：GeoJSON Feature / Geometry、maptalks Geometry、原生 [x, y] 数组或 Coordinate 结构
 */
export function normalizeCoordinates(
  input: any,
  defaultMode: string = 'polygon'
): { points: Point2D[]; mode: string } | null {
  if (!input) return null;
  let target = input;
  let mode = (defaultMode || 'polygon').toLowerCase();

  // 1. GeoJSON Feature
  if (target.type === 'Feature' && target.geometry) {
    target = target.geometry;
  }

  // 2. GeoJSON Geometry
  if (target.type && target.coordinates) {
    const geoType = String(target.type).toLowerCase();
    if (geoType === 'polygon') {
      mode = 'polygon';
      target = target.coordinates[0];
    } else if (geoType === 'linestring') {
      mode = 'linestring';
      target = target.coordinates;
    } else if (geoType === 'multipolygon' && Array.isArray(target.coordinates[0])) {
      mode = 'polygon';
      target = target.coordinates[0][0];
    }
  }

  // 3. maptalks.Geometry 实例
  if (typeof target.getCoordinates === 'function') {
    if (typeof target.getType === 'function') {
      const gType = String(target.getType()).toLowerCase();
      if (gType.indexOf('line') > -1) mode = 'linestring';
      if (gType.indexOf('polygon') > -1) mode = 'polygon';
    }
    target = target.getCoordinates();
  }

  // 4. 嵌套数组降维解包
  while (Array.isArray(target) && target.length > 0 && Array.isArray(target[0])) {
    if (
      typeof target[0][0] === 'number' &&
      target[0].length >= 2 &&
      typeof target[0][1] === 'number'
    ) {
      break;
    }
    target = target[0];
  }

  if (!Array.isArray(target) || target.length === 0) return null;

  // 5. 映射为标准 Point2D 数组
  const points: Point2D[] = [];
  for (let i = 0; i < target.length; i++) {
    const p = target[i];
    if (Array.isArray(p) && typeof p[0] === 'number' && typeof p[1] === 'number') {
      points.push({ x: p[0], y: p[1] });
    } else if (p && typeof p.x === 'number' && typeof p.y === 'number') {
      points.push({ x: p.x, y: p.y });
    }
  }

  if (points.length === 0) return null;

  return { points, mode };
}

/**
 * 静态自相交检测纯函数
 * 供纯数据校验、GeoJSON 校验或表单校验直接调用，无需实例化地图工具
 * @param geometryOrCoordinates GeoJSON、maptalks Geometry 或坐标数组
 * @param mode 绘制或几何类型：'polygon' (默认) 或 'linestring'
 * @returns boolean 是否自相交
 */
export function isSelfIntersecting(
  geometryOrCoordinates: any,
  mode?: string
): boolean {
  const result = normalizeCoordinates(geometryOrCoordinates, mode || 'polygon');
  if (!result || result.points.length < 4) return false;

  const resolvedMode = (mode || result.mode).toLowerCase();
  if (resolvedMode === 'linestring') {
    return checkPolylineSelfIntersection(result.points);
  }
  return checkRingSelfIntersection(result.points);
}

/**
 * 带自相交检测的 DrawTool
 * 继承自 maptalks.DrawTool，天然具备所有原生方法（如 remove, on, off, once, fire, undo 等）与生命周期管理
 */
export class SelfIntersectionDrawTool extends maptalks.DrawTool {
  declare options: SelfIntersectionDrawToolOptions;
  private _selfIntersectionHandler: (param: any) => void;
  private _eventsBound: boolean = false;

  /**
   * 静态工具方法：直接检测指定几何对象或坐标是否自相交（无需初始化地图实例）
   */
  public static isSelfIntersecting(
    geometryOrCoordinates: any,
    mode?: string
  ): boolean {
    return isSelfIntersecting(geometryOrCoordinates, mode);
  }

  /**
   * 静态工具方法：归一化坐标结构
   */
  public static normalizeCoordinates(
    input: any,
    defaultMode?: string
  ): { points: Point2D[]; mode: string } | null {
    return normalizeCoordinates(input, defaultMode);
  }

  constructor(options?: SelfIntersectionDrawToolOptions) {
    const opts = Object.assign({ enableSelfIntersectionCheck: false }, options);
    super(opts);
    this._selfIntersectionHandler = this._checkSelfIntersection.bind(this);
  }

  /**
   * 触发自相交警告事件与用户回调
   */
  private _fireWarning(message: string): void {
    const payload = { type: 'selfintersectionwarning', message };
    if (typeof (this as any)._fireEvent === 'function') {
      (this as any)._fireEvent('selfintersectionwarning', payload);
    } else if (typeof this.fire === 'function') {
      this.fire('selfintersectionwarning', payload);
    }
    this.options?.onSelfIntersectionError?.(message);
  }

  /**
   * 获取当前提示消息
   */
  private _getErrorMessage(defaultMsg: string): string {
    return this.options?.selfIntersectionErrorMessage || defaultMsg;
  }

  /**
   * 绑定自相交检测监听
   */
  private _bindSelfIntersectionEvents(): void {
    if (this._eventsBound) {
      this.off('drawvertex', this._selfIntersectionHandler);
      this._eventsBound = false;
    }

    if (!this.options?.enableSelfIntersectionCheck) return;

    const mode = this.getMode();
    if (this._isSupportedMode(mode)) {
      this.on('drawvertex', this._selfIntersectionHandler);
      this._eventsBound = true;
    }
  }

  /**
   * 解绑自相交检测监听
   */
  private _unbindSelfIntersectionEvents(): void {
    if (this._eventsBound) {
      this.off('drawvertex', this._selfIntersectionHandler);
      this._eventsBound = false;
    }
  }

  /**
   * 判断当前模式是否支持检测
   */
  private _isSupportedMode(mode: string): boolean {
    if (!mode) return false;
    const m = mode.toLowerCase();
    return m === 'polygon' || m === 'freehandpolygon' || m === 'linestring';
  }

  /**
   * 添加到地图
   */
  addTo(map: any): this {
    super.addTo(map);
    this._bindSelfIntersectionEvents();
    return this;
  }

  /**
   * 从地图上移除并销毁监听器
   */
  remove(): this {
    this._unbindSelfIntersectionEvents();
    super.remove();
    return this;
  }

  /**
   * 切换模式
   */
  setMode(mode: string): this {
    super.setMode(mode);
    this._bindSelfIntersectionEvents();
    return this;
  }

  /**
   * 获取当前正在绘制的图形坐标
   */
  getCurrentCoordinates(): any {
    const geom = this.getCurrentGeometry ? this.getCurrentGeometry() : null;
    return geom && typeof (geom as any).getCoordinates === 'function'
      ? (geom as any).getCoordinates()
      : null;
  }

  /**
   * 实例方法：判断当前工具中或外部传入的几何数据是否发生自相交
   * @param geometryOrCoordinates 可选，默认检测当前绘制中的 Geometry 坐标
   */
  isSelfIntersecting(geometryOrCoordinates?: any): boolean {
    const target = geometryOrCoordinates !== undefined
      ? geometryOrCoordinates
      : this.getCurrentCoordinates();
    return isSelfIntersecting(target, this.getMode());
  }

  /**
   * 顶点添加（drawvertex）时的自相交检测与回退
   */
  private _checkSelfIntersection(): void {
    const coordinates = this.getCurrentCoordinates();
    if (!coordinates) return;

    if (this.isSelfIntersecting(coordinates)) {
      // 原生安全撤销上一个点，保持历史记录完全一致
      this.undo();
      this._fireWarning(this._getErrorMessage(DEFAULT_ERROR_MESSAGE));
    }
  }

  /**
   * 重写 endDraw，在结束绘制（双击或编程结束）时拦截自相交闭合
   */
  endDraw(param?: any): this {
    if (this.options?.enableSelfIntersectionCheck) {
      const mode = this.getMode();
      if (this._isSupportedMode(mode)) {
        const coordinates = this.getCurrentCoordinates();
        if (coordinates && this.isSelfIntersecting(coordinates)) {
          this._fireWarning(this._getErrorMessage(DRAWEND_ERROR_MESSAGE));
          return this; // 阻止非法闭合图形完成绘制
        }
      }
    }
    super.endDraw(param);
    return this;
  }
}

// 挂载命名空间与静态工具方法
(SelfIntersectionDrawTool as any).SelfIntersectionDrawTool = SelfIntersectionDrawTool;
(SelfIntersectionDrawTool as any).default = SelfIntersectionDrawTool;
(SelfIntersectionDrawTool as any).isSelfIntersecting = isSelfIntersecting;
(SelfIntersectionDrawTool as any).normalizeCoordinates = normalizeCoordinates;
(SelfIntersectionDrawTool as any).segmentsIntersect = segmentsIntersect;
(SelfIntersectionDrawTool as any).checkRingSelfIntersection = checkRingSelfIntersection;
(SelfIntersectionDrawTool as any).checkPolylineSelfIntersection = checkPolylineSelfIntersection;

// 兼容全局挂载与 UMD 模块直接通过构造函数或命名空间调用
if (typeof window !== 'undefined') {
  (window as any).giserMaptalksDrawTool = SelfIntersectionDrawTool;
}

export default SelfIntersectionDrawTool;