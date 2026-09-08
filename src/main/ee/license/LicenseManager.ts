export class LicenseManager {
  public getStatus() { return { isPro: false, tier: 'free' as const, maxServers: 1 } }
  public async activate(_key: string, _email?: string) { return { success: false, message: 'License activation is only available in Enterprise Edition' } }
  public async deactivate() {}
}
