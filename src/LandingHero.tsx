import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";

type Copy = any;

export default function LandingHero({ copy, locale }: { copy: Copy; locale: "zh" | "en" }) {
  const [open, setOpen] = useState(false);
  const links = [
    { label: copy.navigation.work, href: "#work" },
    { label: copy.navigation.about, href: "#about" },
    { label: copy.navigation.resume, href: copy.resume.href, download: true },
    { label: copy.navigation.contact, href: "#contact" },
  ];
  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);
  return <header className="home-header">
    <a className="home-brand" href="#top" aria-label={copy.brand.name}><strong>{copy.brand.name}</strong><span>{copy.brand.role}</span></a>
    <nav className="home-nav" aria-label={copy.navigation.mainLabel}>{links.map((link) => <a key={link.href} href={link.href} download={link.download}>{link.label}</a>)}</nav>
    <nav className="home-header-meta language-switch" aria-label={copy.navigation.languageLabel}><span className="header-rule" /><a href="/" aria-current={locale === "zh" ? "page" : undefined}>中文</a><span aria-hidden="true">|</span><a href="/en" aria-current={locale === "en" ? "page" : undefined}>EN</a></nav>
    <button className={`menu-button${open ? " is-open" : ""}`} type="button" aria-controls="mobile-navigation" aria-expanded={open} aria-label={open ? copy.navigation.closeMenu : copy.navigation.openMenu} onClick={() => setOpen(!open)}>{open ? <X size={21} /> : <Menu size={21} />}</button>
    <nav id="mobile-navigation" className={`mobile-nav${open ? " is-open" : ""}`} aria-label={copy.navigation.mobileLabel} aria-hidden={!open}>{links.map((link) => <a key={link.href} href={link.href} download={link.download} tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}>{link.label}<ArrowUpRight size={15} /></a>)}<div className="mobile-language-switch" aria-label={copy.navigation.languageLabel}><a href="/" aria-current={locale === "zh" ? "page" : undefined} tabIndex={open ? 0 : -1}>中文</a><span aria-hidden="true">|</span><a href="/en" aria-current={locale === "en" ? "page" : undefined} tabIndex={open ? 0 : -1}>EN</a></div></nav>
  </header>;
}
