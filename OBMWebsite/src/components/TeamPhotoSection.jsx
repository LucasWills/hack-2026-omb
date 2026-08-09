import { useState } from 'react';
import teamPhotoPlaceholder from '../assets/shinji.jpeg';
import useScrollReveal from './useScrollReveal';

export default function TeamPhotoSection() {
  const [ref, isVisible] = useScrollReveal();
  // Hover handles focus-pull on desktop; touch devices get an explicit tap
  // toggle instead, since :hover doesn't exist for them (brief section 11).
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div
      id="about"
      className={`content-section team-photo-section-bg reveal ${isVisible ? 'is-visible' : ''}`}
      ref={ref}
    >
      {/* Two-column composition: the cinemascope photo anchors the left, the
          copy stacks on the right. Reorganised (not trimmed) so the whole
          section resolves inside one desktop viewport — the previous stacked
          layout put a full-width 2.39:1 photo above the text, which alone
          consumed most of the screen. Collapses to a single column on
          narrow/short viewports, where vertical scrolling is fine. */}
      <div className="about-layout">
        {/* Cinemascope (2.39:1) presentation — see .team-photo-container */}
        <div
          className={`team-photo-container ${isFocused ? 'is-focused' : ''}`}
          onClick={() => setIsFocused((v) => !v)}
          role="button"
          tabIndex={0}
          aria-pressed={isFocused}
          aria-label="Tap to bring photo into focus"
        >
          <img
            src={teamPhotoPlaceholder}
            alt="One Man Band team at UCLA Hack 2026"
            className="team-photo-img"
          />
          <div className="photo-caption">
            <span className="photo-caption-title">Team 1: One Man Band</span>
            <span className="photo-caption-sub">UCLA Hack 2026</span>
          </div>
        </div>

        <div className="about-copy">
          <h2 className="section-main-title about-title">Behind the Works</h2>
          <span className="about-title-rule" aria-hidden="true"></span>
          <p className="about-lede">
            One Man Band is a collective of three engineering individuals specializing in creating unique instruments designed to be tested, refined, and ultimately played live.
          </p>

          <div className="engineering-description">
            <p>
              Engineering an instrument from scratch means keeping the signal clean, designing a circuit that physically fits, and working within the limits of our materials. What works on paper rarely works first try — so most of the job is testing, troubleshooting, and iterating until it's reliable enough to play live.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}