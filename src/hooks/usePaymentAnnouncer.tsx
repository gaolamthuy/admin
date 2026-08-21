/**
 * Hook to announce payment via voice
 *
 * @module hooks/usePaymentAnnouncer
 */

import { useCallback } from 'react';
import { toast } from 'sonner';
import { tts } from '@/lib/tts';
import { numberToVietnamese } from '@/lib/numberToVietnamese';
import { mapProviderName } from '@/lib/providerMapper';
import { isMuted } from '@/pages/soundbox/components/MuteToggle';
import { CheckCircle2 } from 'lucide-react';
import type { Payment } from '@/types/payment';

const NOTIFICATION_SOUND =
  '/sounds/universfield-new-notification-050-494248.mp3';

function playNotificationSound(): Promise<void> {
  return new Promise(resolve => {
    const audio = new Audio(NOTIFICATION_SOUND);
    audio.onended = () => resolve();
    audio.onerror = () => resolve();
    audio.play().catch(() => resolve());
  });
}

export function usePaymentAnnouncer() {
  const announcePayment = useCallback(async (payment: Payment) => {
    if (isMuted()) {
      console.log('🔇 SoundBox is muted, skipping announcement');
      return;
    }

    if (!payment.amount || payment.amount <= 0) {
      console.warn('⚠️ Invalid payment amount:', payment.amount);
      return;
    }

    const providerName = mapProviderName(payment.provider);
    const amountInVietnamese = numberToVietnamese(payment.amount);
    const announcement = `${providerName} đã nhận ${amountInVietnamese} đồng.`;

    console.log(`🔔 Announcing: ${announcement}`);

    toast.success(`${providerName}`, {
      description: `${payment.amount?.toLocaleString('vi-VN')} VND`,
      icon: <CheckCircle2 className="h-5 w-5" />,
      duration: 5000,
    });

    try {
      await playNotificationSound();
      await tts.speak(announcement);
    } catch (err) {
      console.error('❌ TTS failed, no fallback available:', err);
    }
  }, []);

  return { announcePayment };
}
