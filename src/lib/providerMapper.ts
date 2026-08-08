/**
 * Provider name mapper
 * Maps provider codes to display names for Vietnamese announcement
 *
 * @module lib/providerMapper
 */

export function mapProviderName(provider: string | null): string {
  const providerMap: Record<string, string> = {
    VCB: 'Vietcombank',
    TCB: 'Techcombank',
    ACB: 'ACB',
    MoMo: 'MoMo',
    MB: 'MB Bank',
    VPBank: 'VPBank',
    BIDV: 'BIDV',
    'VietinBank': 'VietinBank',
  };

  return providerMap[provider || ''] || provider || 'Ngân hàng';
}