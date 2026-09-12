'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { submitFormEntry } from '../../lib/submitFormEntry';

export default function DiscussProjectsPage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    projectType: 'Boutique Hotel / Resort',
    scope: '50-100 Rooms / Keys',
    location: '',
    timeline: 'Within 3-6 Months',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refId, setRefId] = useState('');

  // Prefill if logged in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || '',
        email: prev.email || user.email || '',
        company: prev.company || user.company || '',
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formPayload = {
      form_type: 'discuss_projects',
      full_name: formData.name,
      company: formData.company,
      email: formData.email,
      phone: formData.phone,
      project_type: formData.projectType,
      notes: `Scope: ${formData.scope}\nLocation: ${formData.location}\nTimeline: ${formData.timeline}\n\nProject Brief:\n${formData.message}`,
      source_page: typeof window !== 'undefined' ? window.location.pathname : '/discuss-projects',
      source_title: 'Turnkey Consultation (Discuss Projects)',
      user_id: user?.id || 0,
      account_status: user ? 'Registered Customer' : 'Guest',
    };

    let generatedRef = '';

    try {
      const subRes = await submitFormEntry(formPayload);
      if (subRes.referenceId) {
        generatedRef = subRes.referenceId;
      }
    } catch (err) {
      console.warn('Error submitting discuss-projects inquiry:', err);
    }

    if (!generatedRef) {
      generatedRef = 'PRJ-' + Math.floor(100000 + Math.random() * 900000);
    }

    setRefId(generatedRef);
    setIsSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div style={{ backgroundColor: '#FFFFFF', color: '#111111', minHeight: '100vh', padding: '36px 0 80px' }}>
      <div className="wrap">
        {/* BREADCRUMBS */}
        <div className="crumbs" style={{ marginBottom: 24 }}>
          <Link href="/">Home</Link> / <span style={{ fontWeight: 600 }}>Discuss Projects</span>
        </div>

        {/* HERO SECTION */}
        <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: 40, marginBottom: 48 }}>
          <span className="mono" style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3)', display: 'block', marginBottom: 12 }}>
            TURNKEY CONTRACT CONSULTATION
          </span>
          <h1 className="disp" style={{ fontSize: 'clamp(32px, 4.5vw, 56px)', fontWeight: 400, color: 'var(--ink)', margin: 0, lineHeight: 1.15 }}>
            Discuss Your Next Project
          </h1>
          <p style={{ fontSize: 17, color: 'var(--ink-2)', maxWidth: '68ch', marginTop: 16, lineHeight: 1.6 }}>
            From 150-key luxury desert resorts and coastal boutique hotels to bespoke private estates, our technical engineering studio in Udaipur &amp; Jodhpur translates your architectural blueprints into repeatable, export-grade handcrafted furniture.
          </p>
        </div>

        {/* MAIN 2-COL CONTENT */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '48px', alignItems: 'start' }} className="two">
          {/* LEFT: Capabilities & Direct Connect */}
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 20 }}>
              How We Partner With You
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 40 }}>
              <div style={{ padding: '20px 24px', background: '#F9F8F5', borderRadius: 'var(--r-md)', border: '1px solid #ECE7DE' }}>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>1. CAD Approvals &amp; Shop Drawings</div>
                <p style={{ fontSize: 14, color: '#555555', lineHeight: 1.55, margin: 0 }}>
                  We review your render concepts, elevation drawings, and BOQ sheets to produce technical joinery drawings, timber grain layouts, and Martindale-tested fabric options within 72 hours.
                </p>
              </div>

              <div style={{ padding: '20px 24px', background: '#F9F8F5', borderRadius: 'var(--r-md)', border: '1px solid #ECE7DE' }}>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>2. Physical Material &amp; Finish Swatches</div>
                <p style={{ fontSize: 14, color: '#555555', lineHeight: 1.55, margin: 0 }}>
                  Kiln-seasoned teak, acacia, sheesham wood blocks, custom PU stains, bone inlay patterns, and antiqued brass hardware samples dispatched directly to your design studio.
                </p>
              </div>

              <div style={{ padding: '20px 24px', background: '#F9F8F5', borderRadius: 'var(--r-md)', border: '1px solid #ECE7DE' }}>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>3. Mockup Room &amp; Prototype Delivery</div>
                <p style={{ fontSize: 14, color: '#555555', lineHeight: 1.55, margin: 0 }}>
                  Fast-track sample room prototyping within 21 days for hotel ownership and architectural review before volume batch production.
                </p>
              </div>

              <div style={{ padding: '20px 24px', background: '#F9F8F5', borderRadius: 'var(--r-md)', border: '1px solid #ECE7DE' }}>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>4. Containerized Logistics &amp; Installation</div>
                <p style={{ fontSize: 14, color: '#555555', lineHeight: 1.55, margin: 0 }}>
                  FOB / CIF export to over 24 countries with humidity-sealed protective packaging, container consolidation, and on-site assembly guides.
                </p>
              </div>
            </div>

            {/* DIRECT HOTLINES */}
            <div style={{ padding: 24, background: '#111111', color: '#FFFFFF', borderRadius: 'var(--r-md)' }}>
              <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 8, fontWeight: 600 }}>
                Direct Project Concierge
              </div>
              <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 12 }}>
                Speak directly with our senior contract specifiers
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <a
                  href="https://wa.me/919829000000?text=Hi,%20I%20would%20like%20to%20discuss%20a%20turnkey%20furniture%20project"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: '#25D366',
                    color: '#FFFFFF',
                    padding: '10px 18px',
                    borderRadius: 6,
                    fontSize: 13.5,
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  💬 Chat on WhatsApp
                </a>
                <a
                  href="mailto:trade@orbitexpocrafts.com?subject=New%20Project%20Inquiry"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'rgba(255,255,255,0.12)',
                    color: '#FFFFFF',
                    padding: '10px 18px',
                    borderRadius: 6,
                    fontSize: 13.5,
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  ✉️ Email Specifications
                </a>
              </div>
            </div>
          </div>

          {/* RIGHT: Inquiry Form */}
          <div style={{ background: '#FFFFFF', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: '36px 32px', boxShadow: 'var(--shadow-sm)' }}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '48px 16px' }}>
                <div style={{ fontSize: 44, marginBottom: 16 }}>✓</div>
                <h3 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }}>Project Brief Received</h3>
                {refId && (
                  <div style={{ display: 'inline-block', background: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: 4, padding: '4px 12px', fontSize: 13, fontWeight: 700, color: '#1F2937', marginBottom: 16 }}>
                    Reference ID: <code>{refId}</code>
                  </div>
                )}
                <p style={{ fontSize: 15, color: '#555555', lineHeight: 1.6, maxWidth: '42ch', margin: '0 auto 24px' }}>
                  Thank you for submitting your project specifications. A dedicated contract manager will review your brief and reach out within 24 hours with drawings &amp; initial estimates.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setRefId('');
                  }}
                  style={{
                    background: '#111111',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 6,
                    padding: '10px 24px',
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  Submit Another Project
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>
                  Project Specification Brief
                </h2>
                <p style={{ fontSize: 13.5, color: '#666666', margin: '-10px 0 10px' }}>
                  Fill in the details below and our engineering team will get in touch with technical specs and estimates.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Architect Sarah Jenkins"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #CCC', fontSize: 14 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
                      Company / Studio *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jenkins Design Associates"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #CCC', fontSize: 14 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
                      Business Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="sarah@design.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #CCC', fontSize: 14 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
                      Phone / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #CCC', fontSize: 14 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
                      Project Typology
                    </label>
                    <select
                      value={formData.projectType}
                      onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #CCC', fontSize: 14, background: '#FFF' }}
                    >
                      <option>Boutique Hotel / Resort</option>
                      <option>Fine Dining / Restaurant / Bar</option>
                      <option>Luxury Private Residence / Villa</option>
                      <option>Corporate Office / Commercial</option>
                      <option>Bespoke Retail / Showroom</option>
                      <option>Turnkey Fit-Out</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
                      Estimated Scope / Size
                    </label>
                    <select
                      value={formData.scope}
                      onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #CCC', fontSize: 14, background: '#FFF' }}
                    >
                      <option>Under 20 Keys / Rooms</option>
                      <option>20-50 Keys / Rooms</option>
                      <option>50-100 Keys / Rooms</option>
                      <option>100+ Keys / Volume Package</option>
                      <option>Full Villa / Estate Package</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
                      Project Location (City / Country)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dubai, UAE / London, UK"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #CCC', fontSize: 14 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
                      Target Timeline
                    </label>
                    <select
                      value={formData.timeline}
                      onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #CCC', fontSize: 14, background: '#FFF' }}
                    >
                      <option>Urgent (&lt; 2 Months)</option>
                      <option>Within 3-6 Months</option>
                      <option>6-12 Months</option>
                      <option>Concept / Planning Phase</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
                    Scope Details, BOQ or Questions
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Tell us about the pieces required (e.g. headboards, wardrobes, dining sets, inlay consoles) or paste link to Google Drive / Dropbox specs..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #CCC', fontSize: 14, resize: 'vertical' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    background: '#111111',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 6,
                    padding: '14px 24px',
                    fontSize: 14.5,
                    fontWeight: 600,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s ease',
                    marginTop: 6,
                  }}
                >
                  {isSubmitting ? 'Sending Project Specifications...' : 'Send Project Specifications →'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
