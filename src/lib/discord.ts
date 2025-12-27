import { supabase } from './supabase';

interface DiscordEmbed {
  title: string;
  description?: string;
  color: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  timestamp?: string;
}

async function sendWebhook(url: string, embeds: DiscordEmbed[]) {
  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ embeds }),
    });
  } catch (error) {
    console.error('Discord webhook error:', error);
  }
}

export async function notifySale(userName: string, total: number, paymentMethod: string) {
  const { data: webhooks } = await supabase
    .from('discord_webhooks')
    .select('url')
    .eq('is_active', true)
    .in('event_type', ['sales', 'all']);

  if (!webhooks || webhooks.length === 0) return;

  const embed: DiscordEmbed = {
    title: '💰 Nouvelle Vente',
    description: `Vente enregistrée par ${userName}`,
    color: 0xff6a2b,
    fields: [
      { name: 'Montant', value: `${total.toFixed(2)}$`, inline: true },
      { name: 'Paiement', value: paymentMethod, inline: true },
    ],
    timestamp: new Date().toISOString(),
  };

  for (const webhook of webhooks) {
    await sendWebhook(webhook.url, [embed]);
  }
}

export async function notifyClockIn(userName: string) {
  const { data: webhooks } = await supabase
    .from('discord_webhooks')
    .select('url')
    .eq('is_active', true)
    .in('event_type', ['shifts', 'all']);

  if (!webhooks || webhooks.length === 0) return;

  const embed: DiscordEmbed = {
    title: '🟢 Prise de Service',
    description: `${userName} a pris son service`,
    color: 0x00ff00,
    timestamp: new Date().toISOString(),
  };

  for (const webhook of webhooks) {
    await sendWebhook(webhook.url, [embed]);
  }
}

export async function notifyClockOut(userName: string, hours: number) {
  const { data: webhooks } = await supabase
    .from('discord_webhooks')
    .select('url')
    .eq('is_active', true)
    .in('event_type', ['shifts', 'all']);

  if (!webhooks || webhooks.length === 0) return;

  const embed: DiscordEmbed = {
    title: '🔴 Fin de Service',
    description: `${userName} a terminé son service`,
    color: 0xff0000,
    fields: [
      { name: 'Durée', value: `${hours.toFixed(2)}h`, inline: true },
    ],
    timestamp: new Date().toISOString(),
  };

  for (const webhook of webhooks) {
    await sendWebhook(webhook.url, [embed]);
  }
}

export async function notifyLowStock(productName: string, stock: number) {
  const { data: webhooks } = await supabase
    .from('discord_webhooks')
    .select('url')
    .eq('is_active', true)
    .in('event_type', ['stock', 'all']);

  if (!webhooks || webhooks.length === 0) return;

  const embed: DiscordEmbed = {
    title: '⚠️ Stock Faible',
    description: `Le produit ${productName} a un stock faible`,
    color: 0xffa500,
    fields: [
      { name: 'Stock restant', value: `${stock}`, inline: true },
    ],
    timestamp: new Date().toISOString(),
  };

  for (const webhook of webhooks) {
    await sendWebhook(webhook.url, [embed]);
  }
}
