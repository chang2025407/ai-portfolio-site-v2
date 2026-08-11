import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";

type Copy = any;

export default function LandingHero({ copy }: { copy: Copy }) {
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
    <nav className="home-nav" aria-label="主导航">{links.map((link) => <a key={link.href} href={link.href} download={link.download}>{link.label}</a>)}</nav>
    <div className="home-header-meta"><span className="header-rule" /><span>{copy === undefined ? "" : "ZH"}</span></div>
    <button className={`menu-button${open ? " is-open" : ""}`} type="button" aria-controls="mobile-navigation" aria-expanded={open} aria-label={open ? "关闭菜单" : "打开菜单"} onClick={() => setOpen(!open)}>{open ? <X size={21} /> : <Menu size={21} />}</button>
    <nav id="mobile-navigation" className={`mobile-nav${open ? " is-open" : ""}`} aria-label="移动端主导航" aria-hidden={!open}>{links.map((link) => <a key={link.href} href={link.href} download={link.download} tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}>{link.label}<ArrowUpRight size={15} /></a>)}</nav>
  </header>;
}
