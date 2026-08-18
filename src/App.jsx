import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Copy, Download, Mail, Phone, X } from "lucide-react";
import { useForm, ValidationError } from "@formspree/react";
import LandingHero from "./LandingHero";
import { locales } from "./locales";
import useHomeMotion from "./useHomeMotion";
import "./home-v2.css";

const contact = { email: "ddshynh2025@163.com", phone: "18595386369" };

function ProjectChapter({ project, index, copy }) {
  const imageClass = project.id === "01" ? "project-visual workout-visual" : "project-visual";
  return (
    <article className={`project-chapter ${index % 2 ? "project-chapter-reverse" : ""}`} data-home-motion-project>
      <div className="chapter-visual-wrap">
        <div className="chapter-index" aria-hidden="true">{project.id}</div>
        <div className={imageClass}>
          <img src={project.image} alt={project.coverAlt} loading={index === 0 ? "eager" : "lazy"} />
          {project.imageSecondary && <img className="secondary-visual" src={project.imageSecondary} alt="" loading="lazy" />}
        </div>
      </div>
      <div className="chapter-copy">
        <div className="chapter-meta"><span>{project.status}</span><span>{project.type}</span></div>
        <h2>{project.title}</h2>
        <p className="chapter-question">{project.question}</p>
        <dl className="chapter-details">
          <div><dt>{copy.projectLabels.contribution}</dt><dd>{project.role}</dd></div>
          <div><dt>{copy.projectLabels.focus}</dt><dd>{project.tags.join(" · ")}</dd></div>
        </dl>
        <a className="case-entry" href={project.link}>{copy.projectLabels.open}<ArrowUpRight size={18} /></a>
      </div>
    </article>
  );
}

function HomeHero({ copy }) {
  return (
    <section className="home-hero hero-v4" id="top" data-home-hero>
      <div className="hero-v4-layout">
        <div className="hero-v4-identity"><h1>Chang Li</h1><p className="hero-v4-role">{copy.hero.identityRole}</p><p className="hero-v4-ai">{copy.hero.identityBackground}</p></div>
        <div className="hero-v4-visual" aria-hidden="true"><img src="/assets/home/hero-signature-v1.png" alt="" /></div>
        <div className="hero-v4-support"><p>{copy.hero.intro}</p><div className="hero-actions"><a className="solid-link" href="#work">{copy.hero.primaryCta}<ArrowUpRight size={17} /></a></div></div>
      </div>
    </section>
  );
}

function SelectedWorkIntro({ copy }) {
  const sectionRef = useRef(null);
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof window === "undefined") return undefined;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches || !("IntersectionObserver" in window)) { section.classList.add("is-visible"); return undefined; }
    section.classList.add("is-reveal-ready");
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { section.classList.add("is-visible"); observer.disconnect(); } }, { threshold: 0.24, rootMargin: "0px 0px -8% 0px" });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);
  return <section className="selected-work-intro" id="work" ref={sectionRef} aria-labelledby="selected-work-title"><div className="selected-work-intro-grid"><p className="selected-work-label" data-selected-work-reveal>SELECTED WORK</p><div className="selected-work-framing"><h2 id="selected-work-title" data-selected-work-reveal>{copy.work.title}</h2><p className="selected-work-sequence" data-selected-work-reveal>DIGITAL <span aria-hidden="true">→</span> PHYSICAL <span aria-hidden="true">→</span> HUMAN</p></div></div></section>;
}

function ContactForm({ copy, onSubmittingChange }) {
  const [formState, formspreeSubmit] = useForm("mdengpwe");
  const formRef = useRef(null);

  const handleSubmit = (event) => {
    onSubmittingChange(true);
    formspreeSubmit(event);
  };

  useEffect(() => {
    onSubmittingChange(formState.submitting);
  }, [formState.submitting, onSubmittingChange]);

  useEffect(() => {
    if (formState.succeeded) formRef.current?.reset();
  }, [formState.succeeded]);

  if (formState.succeeded) {
    return (
      <div className="contact-form-success" role="status" aria-live="polite">
        <strong>{copy.contact.successCta}</strong>
        <p>{copy.contact.successDescription}</p>
      </div>
    );
  }

  return (
    <form ref={formRef} className="contact-form" onSubmit={handleSubmit}>
      <label><span>{copy.contact.nameLabel}</span><input name="name" type="text" autoComplete="name" required /><ValidationError className="contact-field-error" prefix={copy.contact.nameLabel} field="name" errors={formState.errors} /></label>
      <label><span>{copy.contact.companyLabel}</span><input name="company" type="text" autoComplete="organization" /><ValidationError className="contact-field-error" prefix={copy.contact.companyLabel} field="company" errors={formState.errors} /></label>
      <label><span>{copy.contact.emailLabel}</span><input name="email" type="email" autoComplete="email" required /><ValidationError className="contact-field-error" prefix={copy.contact.emailLabel} field="email" errors={formState.errors} /></label>
      <label><span>{copy.contact.messageLabel}</span><textarea name="message" rows="5" required /><ValidationError className="contact-field-error" prefix={copy.contact.messageLabel} field="message" errors={formState.errors} /></label>
      <div className="contact-form-footer">
        <button className="solid-link" type="submit" disabled={formState.submitting}>{formState.submitting ? copy.contact.sendingCta : copy.contact.messageCta}</button>
        {formState.errors && <p className="contact-form-notice contact-form-error" role="alert">{copy.contact.submitError}</p>}
      </div>
    </form>
  );
}

function ContactSection({ copy }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [modalSession, setModalSession] = useState(0);
  const dialogRef = useRef(null);
  const openButtonRef = useRef(null);
  const copyTimerRef = useRef(null);

  useEffect(() => () => window.clearTimeout(copyTimerRef.current), []);

  useEffect(() => {
    if (!isModalOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const dialog = dialogRef.current;
    const getFocusable = () => dialog?.querySelectorAll('button, input, textarea, [href]');
    getFocusable()?.[0]?.focus();
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (!isSubmittingRef.current) setIsModalOpen(false);
        return;
      }
      const focusable = getFocusable();
      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      openButtonRef.current?.focus();
    };
  }, [isModalOpen]);

  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText("18595386369");
      setIsCopied(true);
      window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setIsCopied(false), 1800);
    } catch {
      setIsCopied(false);
    }
  };

  const closeModal = () => {
    if (isSubmittingRef.current) return;
    setIsModalOpen(false);
  };

  const openModal = () => {
    setModalSession((session) => session + 1);
    setIsModalOpen(true);
  };

  const handleSubmittingChange = (submitting) => {
    isSubmittingRef.current = submitting;
    setIsSubmitting(submitting);
  };

  return (
    <section className="contact-v2" id="contact">
      <div className="contact-index">03 / 03</div>
      <div className="contact-layout">
        <div className="contact-intro">
          <p className="eyebrow">{copy.contact.kicker}</p>
          <h2>{copy.contact.title}</h2>
          <a className="outline-link contact-resume-link" href={copy.resume.href} download>
            {copy.hero.resumeCta}<Download size={16} />
          </a>
        </div>
        <div className="contact-methods" aria-label={copy.contact.detailsLabel}>
          <article className="contact-method">
            <div className="contact-method-heading"><Mail size={17} /><span>EMAIL</span></div>
            <p className="contact-value">{contact.email}</p>
            <button ref={openButtonRef} className="solid-link contact-message-button" type="button" onClick={openModal}>
              {copy.contact.messageCta}
            </button>
          </article>
          <article className="contact-method">
            <div className="contact-method-heading"><Phone size={17} /><span>{copy.contact.phoneLabel}</span></div>
            <p className="contact-value">{contact.phone}</p>
            <div className="contact-phone-actions">
              <button className="outline-link contact-copy-button" type="button" onClick={copyPhone} aria-live="polite">
                <Copy size={15} />{isCopied ? copy.contact.copiedCta : copy.contact.copyCta}
              </button>
            </div>
          </article>
        </div>
      </div>
      <footer><span>{copy.footer.role}</span><span>{copy.footer.copyright}</span></footer>

      {isModalOpen && (
        <div className="contact-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && !isSubmittingRef.current && closeModal()}>
          <div ref={dialogRef} className="contact-modal" role="dialog" aria-modal="true" aria-busy={isSubmitting} aria-labelledby="contact-modal-title">
            <div className="contact-modal-header">
              <div><p className="eyebrow">{copy.contact.modalKicker}</p><h3 id="contact-modal-title">{copy.contact.modalTitle}</h3></div>
              <button className="contact-modal-close" type="button" onClick={closeModal} aria-label={copy.contact.closeLabel}><X size={20} /></button>
            </div>
            <ContactForm key={modalSession} copy={copy} onSubmittingChange={handleSubmittingChange} />
          </div>
        </div>
      )}
    </section>
  );
}

function HomeContent({ copy }) {
  return <>
    <HomeHero copy={copy} /><SelectedWorkIntro copy={copy} />
    <section className="work-v2">{copy.projects.map((project, index) => <ProjectChapter key={project.id} project={project} index={index} copy={copy} />)}</section>
    <section className="background-v2" id="about"><div className="section-lead"><p className="eyebrow">{copy.about.kicker}</p><h2>{copy.about.title}</h2></div><div className="background-grid"><div><p className="column-label">{copy.about.capabilitiesLabel}</p><ul>{copy.capabilities.map((item) => <li key={item}>{item}</li>)}</ul></div><div><p className="column-label">{copy.about.educationLabel}</p><ul className="education-list">{copy.education.map((item) => <li key={item.title}><strong>{item.title}</strong><span>{item.detail}</span></li>)}</ul></div></div></section>
    <ContactSection copy={copy} />
  </>;
}

function getLocaleFromPath() {
  if (typeof window === "undefined") return "zh";
  return window.location.pathname === "/en" || window.location.pathname.startsWith("/en/") ? "en" : "zh";
}
export default function App() {
  const [locale] = useState(getLocaleFromPath);
  const copy = locales[locale] || locales.zh;
  const homeMotionRef = useHomeMotion();
  useEffect(() => { document.documentElement.lang = locale === "en" ? "en" : "zh-CN"; document.title = copy.meta.title; const m = document.head.querySelector('meta[name="description"]'); if (m) m.setAttribute("content", copy.meta.description); }, [copy, locale]);
  return <main className="home-v2" ref={homeMotionRef}><LandingHero copy={copy} locale={locale} /><HomeContent copy={copy} /></main>;
}
