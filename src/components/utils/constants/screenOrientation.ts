// Define a custom interface that extends the existing ScreenOrientation interface
export default interface CustomScreenOrientation extends ScreenOrientation {
    lock(
      orientation:
        | "portrait"
        | "landscape"
        | "portrait-primary"
        | "portrait-secondary"
        | "landscape-primary"
        | "landscape-secondary"
    ): Promise<void>;
  }