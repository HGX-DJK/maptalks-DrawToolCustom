/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * 声明 maptalks 全局变量（UMD 模式下）
 */
declare const maptalks: any;

/**
 * 自定义 DrawTool 选项
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
  /** 自相交时的提示消息，默认 "绘制面出现自相交，请重新绘制" */
  selfIntersectionErrorMessage?: string;
  /** 自相交检测到时的回调函数，可用于自定义提示UI */
  onSelfIntersectionError?: (message: string) => void;
  [key: string]: any;
}

/**
 * 自定义 DrawTool，包装 maptalks DrawTool
 * 添加功能：在绘制面过程中检测自相交，如果出现自相交则回退到上一个点
 */
export class SelfIntersectionDrawTool {

  private _drawTool: any;
  options: SelfIntersectionDrawToolOptions;
  private _selfIntersectionHandler: any;

  constructor(options: SelfIntersectionDrawToolOptions) {
    const opts = Object.assign({}, { enableSelfIntersectionCheck: false }, options);
    this._drawTool = new maptalks.DrawTool(opts);
    this.options = this._drawTool.options;
    this._selfIntersectionHandler = this._checkSelfIntersection.bind(this);
  }

  /**
   * 绑定自相交检测事件
   */
  private _bindSelfIntersectionEvents(): void {
    this._drawTool.off('drawvertex', this._selfIntersectionHandler);

    if (!this.options.enableSelfIntersectionCheck) {
      return;
    }

    const mode = this.getMode();
    if (mode === 'polygon' || mode === 'freeHandPolygon') {
      this._drawTool.on('drawvertex', this._selfIntersectionHandler);
    }
  }

  // ========== DrawTool 所有方法的代理 ==========

  addTo(map: any): this {
    this._drawTool.addTo(map);
    this._bindSelfIntersectionEvents();
    return this;
  }

  getMode(): string {
    return this._drawTool.getMode();
  }

  setMode(mode: string): this {
    this._drawTool.setMode(mode);
    this._bindSelfIntersectionEvents();
    return this;
  }

  getSymbol(): any {
    return this._drawTool.getSymbol();
  }

  setSymbol(symbol: any): this {
    this._drawTool.setSymbol(symbol);
    return this;
  }

  getCurrentGeometry(): any {
    return this._drawTool.getCurrentGeometry();
  }

  undo(): this {
    this._drawTool.undo();
    return this;
  }

  redo(): this {
    this._drawTool.redo();
    return this;
  }

  endDraw(param?: any): this {
    this._drawTool.endDraw(param);
    return this;
  }

  on(eventType: string, handler: any): this {
    this._drawTool.on(eventType, handler);
    return this;
  }

  off(eventType: string, handler: any): this {
    this._drawTool.off(eventType, handler);
    return this;
  }

  enable(): this {
    this._drawTool.enable();
    return this;
  }

  disable(): this {
    this._drawTool.disable();
    return this;
  }

  isEnabled(): boolean {
    return this._drawTool.isEnabled();
  }

  getMap(): any {
    return this._drawTool.getMap();
  }

  addCoordinate(coordinate: any): this {
    this._drawTool.addCoordinate(coordinate);
    return this;
  }

  getTempGeometry(): any {
    return this._drawTool.getTempGeometry();
  }

  setLayerZIndex(zIndex: number): this {
    this._drawTool.setLayerZIndex(zIndex);
    return this;
  }

  // ========== 自相交检测方法 ==========

  /**
   * 获取当前正在绘制的几何图形的坐标数组
   */
  getCurrentCoordinates(): any[] | null {
    const geometry = this.getCurrentGeometry();
    if (!geometry) return null;
    return geometry.getCoordinates() || null;
  }

  /**
   * 检测 polygon 坐标数组是否自相交
   * 使用线段相交检测算法（跨立实验）
   * @param coordinates - polygon 的坐标数组
   * @returns boolean - 是否自相交
   */
  isSelfIntersecting(coordinates: any[]): boolean {
    if (!coordinates || coordinates.length === 0) return false;

    // 获取坐标环
    let ring = coordinates;
    if (Array.isArray(coordinates[0])) {
      // 可能是 [[x,y], [x,y], ...] 或 [[x,y], [x,y], ...] (带环嵌套)
      if (typeof (coordinates[0] as any).x === 'number') {
        // [[x,y], [x,y], ...] 格式
        ring = coordinates;
      } else if (Array.isArray(coordinates[0][0])) {
        // 嵌套环格式，取第一个环
        ring = coordinates[0];
      }
    }

    if (!Array.isArray(ring) || ring.length < 4) return false;

    const n = ring.length;

    // 检查每条边与非相邻边是否相交
    for (let i = 0; i < n; i++) {
      const a1 = ring[i];
      const a2 = ring[(i + 1) % n];

      for (let j = 2; j < n - 1; j++) {
        // 跳过相邻边
        if (Math.abs(i - j) <= 1) continue;
        // 首尾边
        if ((i === 0 && j === n - 1) || (j === 0 && i === n - 1)) continue;

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
   * 检测自相交并处理
   */
  private _checkSelfIntersection(event: any): void {
    const coordinates = this.getCurrentCoordinates();
    if (!coordinates) return;

    if (this.isSelfIntersecting(coordinates)) {
      const errorMessage = this.options.selfIntersectionErrorMessage || '绘制面出现自相交，请重新绘制';

      // 回退到上一个点
      this.undo();

      // 触发警告事件
      this._drawTool._fireEvent('selfintersectionwarning', {
        type: 'selfintersectionwarning',
        message: errorMessage
      });

      // 调用自定义回调
      if (typeof this.options.onSelfIntersectionError === 'function') {
        this.options.onSelfIntersectionError(errorMessage);
      }
    }
  }
}

/**
 * 判断两条线段是否相交（跨立实验）
 */
function segmentsIntersect(p1: any, p2: any, p3: any, p4: any): boolean {
  function ccw(A: any, B: any, C: any): boolean {
    return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
  }
  return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
}

export default SelfIntersectionDrawTool;
