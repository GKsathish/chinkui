declare function createUnityInstance(
    canvas: HTMLCanvasElement,
    config: any,
    onProgress?: (progress: number) => void
  ): Promise<any>;
  