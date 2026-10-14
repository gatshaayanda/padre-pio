"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

function requestInstall() {
  window.dispatchEvent(new Event("padre-pio-install"));
}

export default function HomePage() {
  const entranceVideoRef = useRef<HTMLVideoElement | null>(null);
  const [showEntranceVideo, setShowEntranceVideo] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    const dataSaver = Boolean(connection?.saveData) || connection?.effectiveType === "slow-2g" || connection?.effectiveType === "2g";
    if (!reducedMotion && !dataSaver) setShowEntranceVideo(true);
  }, []);

  useEffect(() => {
    if (!showEntranceVideo) return;
    const video = entranceVideoRef.current;
    if (video) void video.play().catch(() => setShowEntranceVideo(false));
  }, [showEntranceVideo]);
  return (
    <main className="padreSite">
      <div className="padreTopline">
        <span>PADRE PIO MEDICAL CENTRE</span>
        <span className="padreToplineLocation"><span aria-hidden="true">●</span> GABORONE WEST · BOTSWANA</span>
      </div>

      <header className="padreHeader">
        <Link href="/" className="padreBrand" aria-label="Padre Pio Medical Centre home">
          <span className="padreBrandMark" aria-hidden="true">✚</span>
          <span><strong>PADRE PIO</strong><small>MEDICAL CENTRE</small></span>
        </Link>
        <nav className="padreNav" aria-label="Main navigation">
          <a href="#visit">Find the clinic</a>
          <a href="#care">Patient information</a>
        </nav>
        <button className="padreInstallLink" type="button" onClick={requestInstall}>Add to home screen <span aria-hidden="true">↗</span></button>
      </header>

      <section className="padreHero" aria-labelledby="padre-hero-title">
        <div className="padreHeroCopy">
          <span className="padreEyebrow"><span aria-hidden="true">✳</span> YOUR LOCAL CLINIC, MADE EASIER TO REACH</span>
          <h1 id="padre-hero-title">Care starts<br />with <em>finding us.</em></h1>
          <p className="padreHeroIntro">A simpler front door to Padre Pio Medical Centre. Get familiar with the entrance, find our location, and prepare to contact reception.</p>
          <div className="padreHeroActions">
            <Link className="padreButton padreButtonPrimary" href="/appointments/request">Request an appointment <span aria-hidden="true">↗</span></Link>
            <a className="padreButton padreButtonSecondary" href="#visit">Find the clinic <span aria-hidden="true">↓</span></a>
          </div>
          <p className="padreHeroFineprint">Appointment requests are reviewed by the clinic. Sending a request does not confirm a booking.</p>
        </div>

        <div className="padreEntranceFrame">
          <div className="padreEntranceFrameTop"><span>THE WAY IN</span><span>01 / ARRIVAL</span></div>
          <div className="padreEntranceVideo">
            {showEntranceVideo && <video ref={entranceVideoRef} muted loop playsInline preload="metadata" aria-hidden="true" disablePictureInPicture>
              <source src="/videos/padre.mp4" type="video/mp4" />
            </video>}
            <div className="padreVideoShade" />
            <div className="padreVideoCaption">
              <span className="padreLiveDot" aria-hidden="true" />
              <span><strong>{showEntranceVideo ? "Recognise the entrance" : "Your visit starts here"}</strong><small>{showEntranceVideo ? "A familiar landmark before you arrive." : "Video paused to respect motion or data settings."}</small></span>
            </div>
          </div>
          <div className="padreEntranceFrameBottom"><span>PADRE PIO · GABORONE WEST</span><span aria-hidden="true">✳</span></div>
        </div>
        <div className="padreHeroOrnament" aria-hidden="true">P.</div>
      </section>

      <section className="padreQuickStrip" aria-label="Patient essentials">
        <div><span className="padreQuickIcon" aria-hidden="true">⌖</span><span><small>LOCATION</small><strong>Gaborone West Phase 1</strong></span></div>
        <div><span className="padreQuickIcon" aria-hidden="true">↗</span><span><small>YOUR NEXT STEP</small><strong>Request, then await a reply</strong></span></div>
        <div><span className="padreQuickIcon" aria-hidden="true">♡</span><span><small>MADE FOR PATIENTS</small><strong>Simple on your phone</strong></span></div>
      </section>

      <section className="padreVisitSection" id="visit">
        <div className="padreVisitHeading">
          <span className="padreEyebrow">PLAN YOUR VISIT</span>
          <h2>Know where<br /><em>you’re going.</em></h2>
          <p>We’re at Plot 16739, Gaborone West Phase 1, Gaborone, Botswana.</p>
          <a className="padreTextLink" href="https://www.google.com/maps/search/?api=1&query=Padre+Pio+Medical+Centre+Plot+16739+Gaborone+West+Phase+1+Gaborone+Botswana" target="_blank" rel="noreferrer">Open directions in Google Maps <span aria-hidden="true">↗</span></a>
        </div>
        <div className="padreVisitCard">
          <div className="padreVisitCardArt" aria-hidden="true">
            <div className="padreMapPath padreMapPathOne" />
            <div className="padreMapPath padreMapPathTwo" />
            <div className="padreMapPin"><span>✚</span></div>
            <div className="padreMapLabel">GABORONE WEST</div>
          </div>
          <div className="padreVisitCardFooter"><span><small>ADDRESS</small><strong>Plot 16739 · Phase 1</strong></span><span className="padreVisitCardArrow" aria-hidden="true">↗</span></div>
        </div>
      </section>

      <section className="padreCareSection" id="care">
        <div><span className="padreEyebrow">BEFORE YOU VISIT</span><h2>A clearer next step.</h2></div>
        <div className="padreCareGrid">
          <article><span className="padreCareNumber">01</span><h3>Request a time</h3><p>Send your preferred date and time to reception for review. Wait for the clinic to confirm before treating it as booked.</p><Link href="/appointments/request">Start a request <span aria-hidden="true">↗</span></Link></article>
          <article><span className="padreCareNumber">02</span><h3>Find your way</h3><p>Use the address and map directions to plan your journey to the clinic entrance.</p><a href="#visit">View location <span aria-hidden="true">↗</span></a></article>
          <article><span className="padreCareNumber">03</span><h3>Get the details</h3><p>Clinic hours, services and reception contact options will be shown here once verified by the practice.</p><span className="padreCarePending">Details being verified</span></article>
        </div>
      </section>

      <footer className="padreFooter">
        <Link href="/" className="padreBrand"><span className="padreBrandMark" aria-hidden="true">✚</span><span><strong>PADRE PIO</strong><small>MEDICAL CENTRE</small></span></Link>
        <p>Plot 16739, Gaborone West Phase 1, Gaborone, Botswana</p>
        <span className="padreFooterNote">This website is not an emergency service. If you may be experiencing a medical emergency, seek urgent local medical help.</span>
      </footer>
    </main>
  );
}
