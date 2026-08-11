import { useEffect } from "react";

let animationLibrariesPromise;

function loadAnimationLibraries() {
  if (!animationLibrariesPromise) {
    animationLibrariesPromise = Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
    ]).then(([gsapModule, scrollTriggerModule]) => {
      const gsap = gsapModule.default;
      const ScrollTrigger = scrollTriggerModule.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);
      return { gsap, ScrollTrigger };
    });
  }

  return animationLibrariesPromise;
}

export default function usePortfolioAnimations() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    let ctx;
    let isCancelled = false;
    let idleCallbackId = 0;
    let timeoutId = 0;

    const initAnimations = () => {
      loadAnimationLibraries().then(({ gsap, ScrollTrigger }) => {
        if (isCancelled) return;

        ctx = gsap.context(() => {
      const easeOut = "expo.out";

      if (document.querySelector(".hero-title-line")) {
        gsap.set(".hero-title-line", {
          clipPath: "inset(0% 0% 100% 0%)",
          transformOrigin: "left bottom",
          yPercent: 90,
          scaleY: 0.68,
        });

        gsap.set(".js-hero-kicker, .js-hero-lead, .js-hero-actions", {
          autoAlpha: 0,
          y: 28,
          filter: "blur(10px)",
        });

        gsap.set(".site-header", {
          autoAlpha: 0,
          y: -34,
          filter: "blur(14px)",
        });

        gsap.set(".js-hero-media", {
          autoAlpha: 0,
          clipPath: "inset(12% 0% 12% 22%)",
          scale: 0.96,
          transformOrigin: "right center",
        });

        gsap.set(".hero-scene-image", {
          scale: 1.14,
          xPercent: 4,
          transformOrigin: "center center",
        });

        gsap.set(".js-hero-spotlight, .js-hero-workbar", {
          autoAlpha: 0,
          y: 52,
          filter: "blur(14px)",
        });

        gsap.set(".js-hero-workbar-item", {
          autoAlpha: 0,
          y: 34,
        });

        const heroTimeline = gsap.timeline({
          defaults: { ease: easeOut },
          delay: 0.08,
        });

        heroTimeline
          .to(".opening-curtain", {
            clipPath: "inset(0% 0% 100% 0%)",
            duration: 1.18,
            ease: "power4.inOut",
          })
          .to(
            ".site-header",
            {
              autoAlpha: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 1,
            },
            "-=0.58"
          )
          .set(".site-header", { clearProps: "transform,filter,opacity,visibility" })
          .to(
            ".hero-title-line",
            {
              clipPath: "inset(0% 0% 0% 0%)",
              yPercent: 0,
              scaleY: 1,
              duration: 1.18,
              stagger: 0.14,
            },
            "-=0.42"
          )
          .set(".hero-title-line", { clearProps: "clipPath" })
          .to(
            ".js-hero-kicker",
            {
              autoAlpha: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 0.9,
            },
            "-=1.12"
          )
          .to(
            ".js-hero-media",
            {
              autoAlpha: 1,
              clipPath: "inset(0% 0% 0% 0%)",
              scale: 1,
              duration: 1.34,
            },
            "-=0.96"
          )
          .to(
            ".hero-scene-image",
            {
              scale: 1,
              xPercent: 0,
              duration: 1.75,
            },
            "-=1.32"
          )
          .to(
            ".js-hero-lead, .js-hero-actions",
            {
              autoAlpha: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 0.96,
              stagger: 0.13,
            },
            "-=0.78"
          )
          .to(
            ".js-hero-spotlight",
            {
              autoAlpha: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 1.08,
            },
            "-=0.78"
          )
          .to(
            ".js-hero-workbar",
            {
              autoAlpha: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 0.9,
            },
            "-=0.78"
          )
          .to(
            ".js-hero-workbar-item",
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.86,
              stagger: 0.09,
            },
            "-=0.56"
          )
          .set(
            ".js-hero-kicker, .js-hero-lead, .js-hero-actions, .js-hero-media, .js-hero-spotlight, .js-hero-workbar, .js-hero-workbar-item",
            { clearProps: "opacity,visibility,transform,filter,clipPath" }
          );
      }

      gsap.utils.toArray(".js-animate-section").forEach((section) => {
        const title = section.querySelector(".js-section-title");
        const cards = section.querySelectorAll(".js-card");
        const imageReveals = section.querySelectorAll(".js-image-reveal");

        if (title) {
          gsap.fromTo(
            title,
            {
              autoAlpha: 0,
              clipPath: "inset(0% 0% 100% 0%)",
              y: 120,
              scaleY: 0.72,
              transformOrigin: "left bottom",
            },
            {
              autoAlpha: 1,
              clipPath: "inset(0% 0% 0% 0%)",
              y: 0,
              scaleY: 1,
              duration: 1.16,
              ease: easeOut,
              onComplete: () =>
                gsap.set(title, { clearProps: "clipPath,transform,opacity,visibility" }),
              scrollTrigger: {
                trigger: section,
                start: "top 76%",
                once: true,
              },
            }
          );
        }

        if (cards.length) {
          gsap.fromTo(
            cards,
            {
              autoAlpha: 0,
              y: 86,
              scale: 0.94,
              filter: "blur(16px)",
            },
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              filter: "blur(0px)",
              duration: 1,
              ease: "power3.out",
              stagger: 0.13,
              onComplete: () =>
                gsap.set(cards, { clearProps: "opacity,visibility,transform,filter" }),
              scrollTrigger: {
                trigger: section,
                start: "top 70%",
                once: true,
              },
            }
          );
        }

        imageReveals.forEach((item) => {
          gsap.fromTo(
            item,
            {
              clipPath: "inset(0% 100% 0% 0%)",
              scale: 0.98,
            },
            {
              clipPath: "inset(0% 0% 0% 0%)",
              scale: 1,
              duration: 1.2,
              ease: "expo.inOut",
              onComplete: () => gsap.set(item, { clearProps: "clipPath,transform" }),
              scrollTrigger: {
                trigger: item,
                start: "top 78%",
                once: true,
              },
            }
          );
        });
      });

      gsap.utils.toArray(".js-parallax-image").forEach((image) => {
        const trigger = image.closest("section") || image;
        gsap.fromTo(
          image,
          { yPercent: -5, scale: 1.08 },
          {
            yPercent: 5,
            scale: 1.02,
            ease: "none",
            scrollTrigger: {
              trigger,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.8,
            },
          }
        );
      });

      ScrollTrigger.refresh();
        });
      });
    };

    if ("requestIdleCallback" in window) {
      idleCallbackId = window.requestIdleCallback(initAnimations, { timeout: 1200 });
    } else {
      timeoutId = window.setTimeout(initAnimations, 320);
    }

    return () => {
      isCancelled = true;
      if (idleCallbackId) window.cancelIdleCallback(idleCallbackId);
      if (timeoutId) window.clearTimeout(timeoutId);
      ctx?.revert();
    };
  }, []);
}
