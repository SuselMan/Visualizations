declare module 'three/examples/jsm/controls/OrbitControls.js' {
  import { Camera, EventDispatcher, MOUSE, TOUCH, Vector3, Renderer } from 'three';
  export class OrbitControls extends EventDispatcher {
    constructor(object: Camera, domElement?: HTMLElement);
    object: Camera;
    domElement: HTMLElement;
    enabled: boolean;
    target: Vector3;
    minDistance: number;
    maxDistance: number;
    enableDamping: boolean;
    dampingFactor: number;
    enableZoom: boolean;
    zoomSpeed: number;
    minPolarAngle: number;
    maxPolarAngle: number;
    minAzimuthAngle: number;
    maxAzimuthAngle: number;
    enableRotate: boolean;
    rotateSpeed: number;
    enablePan: boolean;
    panSpeed: number;
    update(): void;
    dispose(): void;
    listenToKeyEvents(domElement: HTMLElement): void;
    saveState(): void;
    reset(): void;
  }
}

declare module 'three/examples/jsm/controls/TransformControls.js' {
  import { Camera, EventDispatcher, Object3D } from 'three';
  export class TransformControls extends EventDispatcher {
    constructor(object: Camera, domElement?: HTMLElement);
    attach(object: Object3D): void;
    detach(): void;
    setMode(mode: 'translate' | 'rotate' | 'scale'): void;
    setSize(size: number): void;
    dispose(): void;
  }
}

declare module 'three-stdlib' {
  import { Camera, EventDispatcher, Object3D, Vector3 } from 'three';
  export class OrbitControls extends EventDispatcher {
    constructor(object: Camera, domElement?: HTMLElement);
    enabled: boolean;
    target: Vector3;
    enableDamping: boolean;
    dampingFactor: number;
    enableZoom: boolean;
    enablePan: boolean;
    update(): void;
    dispose(): void;
  }
  export class TransformControls extends EventDispatcher {
    constructor(object: Camera, domElement?: HTMLElement);
    attach(object: Object3D): void;
    detach(): void;
    setMode(mode: 'translate' | 'rotate' | 'scale'): void;
    setSize(size: number): void;
    visible: boolean;
    dispose(): void;
  }
}


