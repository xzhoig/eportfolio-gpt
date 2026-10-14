/* Vanilla JavaScript. No framework, build tool, network request or server required. */
(() => {
  "use strict";
  const root = document.documentElement;
  root.classList.add("js");
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [
    ...parent.querySelectorAll(selector),
  ];
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );
  const toast = $(".toast");
  let toastTimer;
  function showToast(message) {
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("show");
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3600);
  }

  // Theme persists across all seven pages; storage restrictions never break the site.
  const themeButton = $("[data-theme-toggle]");
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
  let preferredTheme;
  try {
    preferredTheme = localStorage.getItem("nelson-theme");
  } catch (_) {
    /* Private browsing. */
  }
  let explicitTheme = preferredTheme === "dark" || preferredTheme === "light";
  function applyTheme(theme) {
    root.dataset.theme = theme;
    if (themeButton) {
      themeButton.setAttribute(
        "aria-label",
        `Switch to ${theme === "dark" ? "light" : "dark"} theme`,
      );
      themeButton.setAttribute("aria-pressed", String(theme === "dark"));
      $("[data-sun]", themeButton).hidden = theme !== "dark";
      $("[data-moon]", themeButton).hidden = theme === "dark";
    }
  }
  applyTheme(
    explicitTheme ? preferredTheme : systemTheme.matches ? "dark" : "light",
  );
  themeButton?.addEventListener("click", () => {
    const theme = root.dataset.theme === "dark" ? "light" : "dark";
    explicitTheme = true;
    applyTheme(theme);
    try {
      localStorage.setItem("nelson-theme", theme);
    } catch (_) {
      /* Theme still works. */
    }
  });
  systemTheme.addEventListener("change", (event) => {
    if (!explicitTheme) applyTheme(event.matches ? "dark" : "light");
  });

  // Mobile menu: Escape, outside click, focus loop and breakpoint reset.
  const menuButton = $("[data-menu-toggle]");
  const menuIcon = $("svg path", menuButton || document);
  const nav = $("#site-nav");
  const mobileWidth = window.matchMedia("(max-width: 900px)");
  function closeMenu(returnFocus = false) {
    nav?.classList.remove("is-open");
    document.body.classList.remove("menu-open");
    menuButton?.setAttribute("aria-expanded", "false");
    menuButton?.setAttribute("aria-label", "Open navigation menu");
    menuIcon?.setAttribute("d", "M4 7h16M4 12h16M4 17h16");
    if (returnFocus) menuButton?.focus();
  }
  menuButton?.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute(
      "aria-label",
      isOpen ? "Close navigation menu" : "Open navigation menu",
    );
    document.body.classList.toggle("menu-open", isOpen);
    menuIcon?.setAttribute(
      "d",
      isOpen ? "M6 6l12 12M6 18L18 6" : "M4 7h16M4 12h16M4 17h16",
    );
    if (isOpen) $("a", nav)?.focus();
  });
  nav?.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });
  document.addEventListener("click", (event) => {
    if (
      nav?.classList.contains("is-open") &&
      !event.target.closest(".nav-shell")
    )
      closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (!nav?.classList.contains("is-open")) return;
    if (event.key === "Escape") {
      closeMenu(true);
      return;
    }
    if (event.key === "Tab") {
      const links = $$("a", nav);
      const first = links[0],
        last = menuButton;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
  mobileWidth.addEventListener("change", () => closeMenu());

  // Reveal on scroll, while preserving visible content without JavaScript.
  if ("IntersectionObserver" in window && !prefersReducedMotion.matches) {
    root.classList.add("reveal-enabled");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px 20px 0px" },
    );
    $$(".reveal").forEach((element) => observer.observe(element));
    // If reduced motion is enabled later, reveal every section immediately.
    prefersReducedMotion.addEventListener("change", (event) => {
      if (event.matches) {
        root.classList.remove("reveal-enabled");
        observer.disconnect();
      }
    });
  }

  // Missing user photo intentionally falls back to a designed initials portrait.
  $$(".portrait-photo").forEach((photo) => {
    const revealPhoto = () => {
      if (photo.naturalWidth > 0) photo.classList.add("is-loaded");
    };
    photo.addEventListener("load", revealPhoto);
    photo.addEventListener("error", () => {
      photo.hidden = true;
    });
    if (photo.complete) {
      if (photo.naturalWidth > 0) revealPhoto();
      else photo.hidden = true;
    }
  });

  // Project and skill category filters announce their selected state.
  $$("[data-filter-group]").forEach((group) => {
    const buttons = $$("[data-filter]", group);
    const target = document.getElementById(group.dataset.filterGroup);
    if (!target) return;
    const cards = $$("[data-category]", target);
    const count = document.querySelector(`[data-count-for="${target.id}"]`);
    buttons.forEach((button) =>
      button.addEventListener("click", () => {
        const category = button.dataset.filter;
        buttons.forEach((item) =>
          item.setAttribute("aria-pressed", String(item === button)),
        );
        let visible = 0;
        cards.forEach((card) => {
          const matches =
            category === "all" ||
            card.dataset.category.split(" ").includes(category);
          card.hidden = !matches;
          if (matches) {
            visible += 1;
            card.classList.add("is-visible");
          }
        });
        if (count)
          count.textContent = `${visible} ${visible === 1 ? "project" : "projects"} shown`;
        const announcement = $("#filter-status");
        if (announcement)
          announcement.textContent = `${visible} ${target.id === "skills-grid" ? "skills" : "projects"} shown: ${button.textContent.trim()}.`;
      }),
    );
  });

  // Native dialogs provide focus trapping, keyboard support and descriptive case studies.
  let dialogTrigger;
  $$("[data-open-dialog]").forEach((button) =>
    button.addEventListener("click", () => {
      const dialog = document.getElementById(button.dataset.openDialog);
      if (!dialog) return;
      dialogTrigger = button;
      dialog.showModal();
      document.body.classList.add("dialog-open");
    }),
  );
  $$(".project-dialog").forEach((dialog) => {
    $("[data-close-dialog]", dialog)?.addEventListener("click", () =>
      dialog.close(),
    );
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        const rect = dialog.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          dialog.close();
      }
    });
    dialog.addEventListener("close", () => {
      document.body.classList.remove("dialog-open");
      dialogTrigger?.focus();
    });
  });

  // Copy contact address; older/file-based browsers get a safe selection fallback.
  $$("[data-copy-email]").forEach((button) =>
    button.addEventListener("click", async () => {
      const email = "s25201381@mail.sfu.edu.hk";
      try {
        if (navigator.clipboard && window.isSecureContext)
          await navigator.clipboard.writeText(email);
        else {
          const field = document.createElement("textarea");
          field.value = email;
          field.setAttribute("readonly", "");
          field.style.position = "fixed";
          field.style.left = "-9999px";
          document.body.append(field);
          field.select();
          const success = document.execCommand("copy");
          field.remove();
          if (!success) throw new Error("Clipboard unavailable");
        }
        showToast("Email address copied. Let’s connect!");
      } catch (_) {
        showToast("Copy this address: " + email);
      }
      button.focus();
    }),
  );
  $("[data-print]")?.addEventListener("click", () => window.print());

  // Scroll progress and a compact back-to-top control, throttled via animation frame.
  const progress = $(".reading-progress");
  const siteHeader = $(".site-header");
  const backToTop = $("[data-back-to-top]");
  let ticking = false;
  function updateScroll() {
    siteHeader?.classList.toggle("is-scrolled", window.scrollY > 12);
    const distance = root.scrollHeight - window.innerHeight;
    if (progress)
      progress.style.width = `${distance > 0 ? Math.min(100, Math.max(0, (window.scrollY / distance) * 100)) : 0}%`;
    backToTop?.classList.toggle("is-visible", window.scrollY > 500);
    ticking = false;
  }
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScroll);
        ticking = true;
      }
    },
    { passive: true },
  );
  window.addEventListener("resize", updateScroll);
  updateScroll();
  backToTop?.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion.matches ? "instant" : "smooth",
    });
    $(".brand")?.focus({ preventScroll: true });
  });
})();
