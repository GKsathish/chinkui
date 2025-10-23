declare function createUnityInstance(
    canvas: HTMLCanvasElement,
    window: any,
    config: any,
    onProgress?: (progress: number) => void
  ): Promise<any>;
  