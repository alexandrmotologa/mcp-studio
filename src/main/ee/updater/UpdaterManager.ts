export class UpdaterManager {
  constructor(_w?: any) {}
  public setWindow(_w: any) {}
  public async checkForUpdates() { return { status: 'idle' as const } }
  public quitAndInstall() {}
  public getStatus() { return { status: 'idle' as const } }
  public dispose() {}
}
