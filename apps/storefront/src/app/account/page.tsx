import { commerce } from '../../../store.config';
import { User, Package, LogOut, Lock, Mail } from 'lucide-react';
import Link from 'next/link';

export default async function AccountPage() {
  let customer = null;

  try {
    customer = await commerce.customer.me();
  } catch (err) {
    customer = null;
  }

  if (!customer) {
    return (
      <div className="container" style={{ maxWidth: '480px', margin: '60px auto' }}>
        <div className="glass-panel" style={{ padding: '36px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, textAlign: 'center', marginBottom: '8px' }}>
            Customer Sign In
          </h1>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '28px', fontSize: '0.9rem' }}>
            Access your order history, profile, and saved addresses
          </p>

          <form action="/account" method="GET" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Username or Email
              </label>
              <input type="text" name="username" required className="glass-panel" style={{ width: '100%', padding: '12px 14px', color: '#fff' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Password
              </label>
              <input type="password" name="password" required className="glass-panel" style={{ width: '100%', padding: '12px 14px', color: '#fff' }} />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}>
              <Lock size={16} /> Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Welcome, {customer.firstName || customer.username}</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage your WooCommerce account and view past orders</p>
        </div>
        <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
        {/* Order History */}
        <div style={{ flexGrow: 1 }}>
          <div className="glass-panel" style={{ padding: '28px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Package size={20} className="gradient-text" /> Order History
            </h2>

            {customer.orders && customer.orders.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {customer.orders.map((ord: any) => (
                  <div key={ord.id} className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 700 }}>Order #{ord.id}</span>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ord.date}</p>
                    </div>
                    <div>
                      <span className="badge badge-sale">{ord.status}</span>
                      <p style={{ fontWeight: 700, marginTop: '4px', textAlign: 'right' }}>${ord.total.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No orders placed yet.</p>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div>
          <div className="glass-panel" style={{ padding: '28px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <User size={20} className="gradient-text" /> Profile Details
            </h2>

            <p><strong>Email:</strong> {customer.email}</p>
            <p style={{ marginTop: '8px' }}><strong>Username:</strong> {customer.username}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
