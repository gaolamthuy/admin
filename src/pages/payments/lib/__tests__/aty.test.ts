import { describe, expect, it } from 'vitest';
import { isAtyPayment, normalizeRefText } from '../aty';

describe('isAtyPayment', () => {
  it('match người gửi NGUYEN HONG TRUC (aty thu khoa huan)', () => {
    expect(
      isAtyPayment(
        'FT26260750474280,NGUYEN HONG TRUC,TKH TT GAO 6-20/8/26-170926'
      )
    ).toBe(true);
  });

  it('match người gửi NGUYEN VAN NGHIA (aty q12) kể cả khi mô tả không có ATY', () => {
    expect(
      isAtyPayment('FT26264969177204,NGUYEN VAN NGHIA,chuyen tien gao thang 9')
    ).toBe(true);
  });

  it('match keyword ATY/TKH có dấu', () => {
    expect(isAtyPayment('FT1,TRAN A,aty tkh tt gao 21th5- 5th6')).toBe(true);
    expect(isAtyPayment('FT2,TRAN A,Thủ Khoa Huân thanh toán')).toBe(true);
  });

  it('không match KH000445 (khách trả chậm nhưng không phải aty)', () => {
    expect(
      isAtyPayment('FT26265268879155,CHAU NHUT HAO,KOVQR071TGM36O KH000445 C')
    ).toBe(false);
  });

  it('không match giao dịch thường', () => {
    expect(
      isAtyPayment('FT26265172750166,LE HONG QUANG,LE HONG QUANG transfers')
    ).toBe(false);
    expect(isAtyPayment(null)).toBe(false);
    expect(isAtyPayment('')).toBe(false);
  });
});

describe('normalizeRefText', () => {
  it('bỏ dấu + uppercase', () => {
    expect(normalizeRefText('Thủ Khoa Huân')).toBe('THU KHOA HUAN');
    expect(normalizeRefText(undefined)).toBe('');
  });
});
