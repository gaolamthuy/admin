const PROVIDER_MAP: Record<string, string> = {
  'com.techcombank.notiapp': 'Techcombank',
  'com.mservice.momotransfer': 'MoMo',
  'com.acb.acbb.prod': 'ACB',
  'com.vcb': 'Vietcombank',
  TCB: 'Techcombank',
  ACB: 'ACB',
  MoMo: 'MoMo',
  MB: 'MB Bank',
  VPBank: 'VPBank',
  BIDV: 'BIDV',
  VietinBank: 'VietinBank',
};

const FALLBACK_PATTERNS: [RegExp, string][] = [
  [/techcom/, 'Techcombank'],
  [/momo/, 'MoMo'],
  [/acb/, 'ACB'],
  [/vcb|vietcom/, 'Vietcombank'],
];

export function mapProviderName(provider: string | null): string {
  if (!provider) return 'Ngân hàng';

  const exact = PROVIDER_MAP[provider];
  if (exact) return exact;

  const lower = provider.toLowerCase();
  for (const [pattern, name] of FALLBACK_PATTERNS) {
    if (pattern.test(lower)) return name;
  }

  return provider;
}
