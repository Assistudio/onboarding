import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, differenceInDays } from 'date-fns';
import { it } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), 'dd/MM/yyyy', { locale: it });
}

export function daysUntilRenewal(renewalDate: Date | string): number {
  return differenceInDays(new Date(renewalDate), new Date());
}

export function renewalUrgency(renewalDate: Date | string): 'green' | 'yellow' | 'red' {
  const days = daysUntilRenewal(renewalDate);
  if (days < 0) return 'red';
  if (days <= 30) return 'yellow';
  return 'green';
}

export function policyCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    AUTO: 'Auto',
    CASA: 'Casa',
    VITA: 'Vita',
    SALUTE: 'Salute',
    INFORTUNI: 'Infortuni',
    IMPRESA: 'Impresa',
    TUTELA_LEGALE: 'Tutela Legale',
    VIAGGIO: 'Viaggio',
    ALTRO: 'Altro',
  };
  return labels[category] ?? category;
}

export function contactRequestStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    RECEIVED: 'Ricevuta',
    IN_PROGRESS: 'In lavorazione',
    CLOSED: 'Chiusa',
  };
  return labels[status] ?? status;
}

export function policyStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ACTIVE: 'Attiva',
    EXPIRING: 'In scadenza',
    RENEWED: 'Rinnovata',
    CANCELLED: 'Cancellata',
  };
  return labels[status] ?? status;
}
