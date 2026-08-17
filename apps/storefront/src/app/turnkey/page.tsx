'use client';

import React from 'react';
import Link from 'next/link';

export default function TurnkeyPage() {
  return (
    <>
      <section className="hero">
        <img
          className="heroimg"
          src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80"
          alt="Turnkey Works"
        />
        <div className="wrap" style={{ paddingBottom: 78 }}>
          <span className="eyebrow mono">
            <i /> For hotels · restaurants · offices · developers
          </span>
          <h1 className="disp">
            One contract. <em>One accountable partner.</em>
          </h1>
          <p className="lede">
            Most projects lose money in the gaps — between designer and factory, factory and transporter, transporter and site. ORBIT closes all of them. You sign once, and we carry the piece from drawing to installed and snag-free.
          </p>
          <div className="stats">
            <div>
              <strong>Design</strong>
              <span>drawing & 3D</span>
            </div>
            <div>
              <strong>Engineer</strong>
              <span>value & BOQ</span>
            </div>
            <div>
              <strong>Manufacture</strong>
              <span>in-house, one roof</span>
            </div>
            <div>
              <strong>Install</strong>
              <span>site team & handover</span>
            </div>
          </div>
        </div>
      </section>

      <section className="blk">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="mono">Capability</span>
              <h2 className="disp">Nine disciplines that usually need nine vendors.</h2>
              <p>
                Everything below happens inside our own works. That is what makes a single date, a single quality standard and a single invoice possible.
              </p>
            </div>
          </div>

          <div className="caps">
            {[
              ['Design & Detailing', 'Concept development, GA drawings, shop drawings and 3D visualisation from your brief or your architect\'s.'],
              ['Prototyping', 'A physical first-article built, photographed and shipped for approval before a single bulk unit is cut.'],
              ['Panel Processing', 'CNC beam saw, edge banding and drilling for casegoods, wardrobes and fixed joinery at scale.'],
              ['Solid Wood Works', 'Seasoning, kiln drying, moulding and hand carving in sheesham, teak, mango and acacia.'],
              ['Metal Fabrication', 'MS, SS and brass fabrication with in-house powder coating, PVD and antique finishing.'],
              ['Upholstery', 'Frame-up upholstery, foam profiling, fabric and leather cutting, deep buttoning and channel work.'],
              ['Surface Finishing', 'Spray booths for PU, NC, melamine and water-based systems; low-VOC options throughout.'],
              ['Logistics & Export', 'Export packing, container stuffing plans, documentation, IEC and door-to-door freight.'],
              ['Site Installation', 'Deployed install crews, assembly, levelling, snag lists closed before handover sign-off.'],
            ].map((c, i) => (
              <div key={i} className="cap">
                <span className="n">0{i + 1}</span>
                <h4>{c[0]}</h4>
                <p>{c[1]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="blk tight" style={{ background: 'var(--surface-2)' }}>
        <div className="wrap">
          <div className="sec-head">
            <div>
              <span className="mono">Engagement models</span>
              <h2 className="disp">Three ways to work with us.</h2>
            </div>
          </div>

          <div className="caps">
            {[
              [
                'Full Turnkey',
                'You hand over a room list and a date. We design, cost, make, ship and install everything loose and fixed.',
                'Best for hotel groups, restaurant chains, developers',
              ],
              [
                'Manufacture to Drawing',
                'Your designer owns the design. We own the making, the finish standard and the delivery date.',
                'Best for architects and interior firms',
              ],
              [
                'Catalogue & Bulk Supply',
                'Pick from our range, adjust size or finish, order in volume against a repeating schedule.',
                'Best for retailers, exporters, procurement teams',
              ],
            ].map((c, i) => (
              <div key={i} className="cap" style={{ borderTop: '4px solid var(--brand)' }}>
                <h4 style={{ fontSize: 21, marginBottom: 10 }}>{c[0]}</h4>
                <p style={{ marginBottom: 14 }}>{c[1]}</p>
                <span className="mono" style={{ color: 'var(--brand)' }}>
                  {c[2]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="blk">
        <div className="wrap">
          <div className="band">
            <img
              className="bandimg"
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"
              alt=""
              loading="lazy"
            />
            <div>
              <h2 className="disp">Send us the BOQ.</h2>
              <p>
                Upload a room schedule, drawing set or even a photo. You get feasibility within 24 hours and a costed proposal within the week.
              </p>
            </div>
            <div className="acts">
              <Link href="/contact" className="btn btn-dark btn-lg" style={{ justifyContent: 'center' }}>
                Start a project enquiry
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              <Link href="/contact" className="btn btn-ghost btn-lg" style={{ justifyContent: 'center' }}>
                Book a factory visit
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
