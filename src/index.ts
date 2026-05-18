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
  /** 自相交时的提示消息 */
  selfIntersectionErrorMessage?: string;
  /** 自相交检测到时的回调函数 */
  onSelfIntersectionError?: (message: string) => void;
  [key: string]: any;
}

const DEFAULT_ERROR_MESSAGE = '绘制面出现自相交，请重新绘制';
const DBLCLICK_ERROR_MESSAGE = '绘制面存在自相交，请继续绘制';
const DRAWEND_ERROR_MESSAGE = '绘制面存在自相交，无法完成绘制，请继续绘制或按ESC取消';

/**
 * 判断两条线段是否相交（跨立实验）
 * ccw 函数提取到外层，避免每次调用重新创建
 */
function ccw(A: any, B: any, C: any): boolean {
  return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
}

function segmentsIntersect(p1: any, p2: any, p3: any, p4: any): boolean {
  return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
}

function sharesEndpoint(p1: any, p2: any, p3: any, p4: any): boolean {
  return (p1.x === p3.x && p1.y === p3.y) ||
         (p1.x === p4.x && p1.y === p4.y) ||
         (p2.x === p3.x && p2.y === p3.y) ||
         (p2.x === p4.x && p2.y === p4.y);
}

function segmentsIntersectSafe(p1: any, p2: any, p3: any, p4: any): boolean {
  if (sharesEndpoint(p1, p2, p3, p4)) return false;
  return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
}

/**
 * 自定义 DrawTool，包装 maptalks DrawTool
 * 添加功能：在绘制面过程中检测自相交，如果出现自相交则回退到上一个点
 */
export class SelfIntersectionDrawTool {

  private _drawTool: any;
  options: SelfIntersectionDrawToolOptions;
  private _selfIntersectionHandler: any;
  private _hasSelfIntersection: boolean = false;

  constructor(options: SelfIntersectionDrawToolOptions) {
    const opts = Object.assign({}, { enableSelfIntersectionCheck: false }, options);
    this._drawTool = new maptalks.DrawTool(opts);
    this.options = this._drawTool.options;
    this._selfIntersectionHandler = this._checkSelfIntersection.bind(this);
  }

  /**
   * 触发警告
   */
  private _fireWarning(message: string): void {
    this._drawTool._fireEvent('selfintersectionwarning', { type: 'selfintersectionwarning', message });
    this.options.onSelfIntersectionError?.(message);
  }

  /**
   * 获取当前错误消息
   */
  private _getErrorMessage(defaultMsg: string): string {
    return this.options.selfIntersectionErrorMessage || defaultMsg;
  }

  /**
   * 从坐标中提取环
   */
  private _getRing(coordinates: any[]): any[] | null {
    if (!coordinates || !Array.isArray(coordinates)) return null;

    if (typeof (coordinates[0] as any).x === 'number') {
      return coordinates;
    }

    if (Array.isArray(coordinates[0]) && Array.isArray(coordinates[0])) {
      return coordinates[0];
    }

    return null;
  }

  /**
   * 绑定自相交检测事件
   */
  private _bindSelfIntersectionEvents(): void {
    this._drawTool.off('drawvertex', this._selfIntersectionHandler);

    if (!this.options.enableSelfIntersectionCheck) return;

    const mode = this.getMode();
    if (mode === 'polygon' || mode === 'freeHandPolygon') {
      this._drawTool.on('drawvertex', this._selfIntersectionHandler);
    }
  }

  /**
   * 绑定结束绘制拦截器
   */
  private _bindEndDrawInterceptor(): void {
    // 拦截双击
    this._drawTool.on('dblclick', (param: any) => {
      if (this._hasSelfIntersection) {
        param.domEvent.stopPropagation();
        param.domEvent.preventDefault();
        this._fireWarning(this._getErrorMessage(DBLCLICK_ERROR_MESSAGE));
      }
    });

    // 拦截绘制结束
    this._drawTool.on('drawend', (param: any) => {
      if (!param.geometry || !this._hasSelfIntersection) return;

      param.geometry.remove();
      this._hasSelfIntersection = false;
      this._fireWarning(this._getErrorMessage(DRAWEND_ERROR_MESSAGE));
    });
  }

  // ========== DrawTool 方法的代理 ==========

  addTo(map: any): this {
    this._drawTool.addTo(map);
    this._bindSelfIntersectionEvents();
    this._bindEndDrawInterceptor();
    return this;
  }

  getMode(): string {
    return this._drawTool.getMode();
  }

  setMode(mode: string): this {
    this._drawTool.setMode(mode);
    this._hasSelfIntersection = false;
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

  // ========== 自相交检测 ==========

  getCurrentCoordinates(): any[] | null {
    return this.getCurrentGeometry()?.getCoordinates() || null;
  }

  isSelfIntersecting(coordinates: any[]): boolean {
    if (!coordinates || coordinates.length === 0) return false;

    const ring = this._getRing(coordinates);
    if (!ring || ring.length < 4) return false;

    const n = ring.length;
    for (let i = 0; i < n; i++) {
      const a1 = ring[i];
      const a2 = ring[(i + 1) % n];

      for (let j = 2; j < n; j++) {
        if (Math.abs(i - j) <= 1) continue;
        if ((i === 0 && j === n - 1) || (j === 0 && i === n - 1)) continue;

        if (segmentsIntersectSafe(a1, a2, ring[j], ring[(j + 1) % n])) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * 检测并处理自相交
   */
  private _checkSelfIntersection(): void {
    const coordinates = this.getCurrentCoordinates();
    if (!coordinates) return;

    if (this.isSelfIntersecting(coordinates)) {
      this._removeLastVertex();
      this._hasSelfIntersection = true;
      this._fireWarning(this._getErrorMessage(DEFAULT_ERROR_MESSAGE));
    } else {
      this._hasSelfIntersection = false;
    }
  }

  /**
   * 移除最后一个顶点
   */
  private _removeLastVertex(): void {
    const geometry = this.getCurrentGeometry();
    if (!geometry) return;

    const coords = geometry.getCoordinates();
    if (!coords || coords.length === 0) return;

    const clickCoords = this._drawTool._clickCoords;
    if (!clickCoords || clickCoords.length === 0) return;

    clickCoords.pop();
    this._drawTool._historyPointer = clickCoords.length;

    const ring = this._getRing(coords);
    if (ring?.length) {
      ring.pop();
      geometry.setCoordinates(coords);
    }

    const registerMode = this._drawTool._getRegisterMode();
    registerMode.update(this._drawTool.getMap().getProjection(), clickCoords, geometry);
  }
}

// UMD 环境下暴露为 window.DrawToolCustomizable
if (typeof window !== 'undefined') {
  (window as any).DrawToolCustomizable = SelfIntersectionDrawTool;
}

export default SelfIntersectionDrawTool;