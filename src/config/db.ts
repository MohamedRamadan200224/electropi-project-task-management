import mongoose from 'mongoose';
import dns from 'node:dns';
import { ENV } from './env';

/**
 * `mongodb+srv://` URIs require a DNS SRV lookup. Some local resolvers — a
 * 127.0.0.1 stub, a VPN, or an IPv6 link-local router — refuse SRV queries and
 * fail with `querySrv ECONNREFUSED`. If the configured resolver can't answer
 * the SRV record, fall back to public DNS (keeping existing servers as backup).
 */
async function ensureSrvResolvable(uri: string): Promise<void> {
  if (!uri.startsWith('mongodb+srv://')) return;
  const host = uri.split('@')[1]?.split('/')[0]?.split('?')[0];
  if (!host) return;
  try {
    await dns.promises.resolveSrv(`_mongodb._tcp.${host}`);
  } catch {
    dns.setServers(['8.8.8.8', '1.1.1.1', ...dns.getServers()]);
  }
}

export async function connectDB(): Promise<void> {
  await ensureSrvResolvable(ENV.MONGO_URI);
  await mongoose.connect(ENV.MONGO_URI);
  console.log('MongoDB connected');
}
