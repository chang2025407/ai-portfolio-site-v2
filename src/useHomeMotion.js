import { useLayoutEffect, useRef } from "react";

const PROJECT_OBSERVER_OPTIONS = {
  threshold: 0.18,
  rootMargin: "0px 0px -10% 0px",
};

export default function useHomeMotion() {
  const rootRef = useRef(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === "undefined") return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const projects = [...root.querySelectorAll("[data-home-motion-project]")];
    let observer;

    const showProjectsImmediately = () => {
      observer?.disconnect();
      root.classList.remove("home-scroll-motion-ready");
      projects.forEach((project) => project.classList.add("is-visible"));
    };

    if (reducedMotion.matches) {
      showProjectsImmediately();
      return undefined;
    }

    root.classList.add("home-motion-ready");

    if (!("IntersectionObserver" in window)) {
      showProjectsImmediately();
      return () => root.classList.remove("home-motion-ready");
    }

    try {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      }, PROJECT_OBSERVER_OPTIONS);

      projects.forEach((project) => observer.observe(project));
      root.classList.add("home-scroll-motion-ready");
    } catch {
      showProjectsImmediately();
    }

    const handleMotionPreference = (event) => {
      if (!event.matches) return;
      root.classList.remove("home-motion-ready");
      showProjectsImmediately();
    };

    reducedMotion.addEventListener?.("change", handleMotionPreference);

    return () => {
      observer?.disconnect();
      reducedMotion.removeEventListener?.("change", handleMotionPreference);
      root.classList.remove("home-motion-ready", "home-scroll-motion-ready");
    };
  }, []);

  return rootRef;
}
