document.addEventListener("DOMContentLoaded", () => {
  // Sticky header
  const header = document.querySelector(".header");
  const onScroll = () =>
    header && header.classList.toggle("scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll);

  // Mobile nav
  const toggle = document.querySelector(".nav__toggle");
  const menu = document.getElementById("nav-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    menu.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        menu.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      })
    );
  }

  // Smooth scroll for on-page anchors
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const id = link.getAttribute("href").slice(1);
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        history.pushState(null, "", "#" + id);
      }
    });
  });

  // Reveal on scroll
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

  // Year (if you add #year anywhere)
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // -----------------------------
  // Contact Form (Formspree AJAX)
  // -----------------------------
  const form = document.getElementById("contactForm");
  const toast = document.getElementById("toast");

  function showError(input, message) {
    const small = input?.closest(".form__field")?.querySelector(".error");
    if (small) small.textContent = message || "";
    if (input) input.setAttribute("aria-invalid", message ? "true" : "false");
  }

  function validate() {
    if (!form) return false;
    let ok = true;

    const name = form.name;
    const email = form.email;
    const topic = form.topic; // optional on some pages
    const message = form.message;
    const hp = form.company; // honeypot

    // Honeypot: if filled, bail silently
    if (hp && hp.value.trim() !== "") return false;

    if (!name?.value.trim()) {
      showError(name, "Please enter your name");
      ok = false;
    } else showError(name, "");
    if (
      !email?.value.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)
    ) {
      showError(email, "Invalid email");
      ok = false;
    } else showError(email, "");
    if (topic && !topic.value) {
      showError(topic, "Choose a request type");
      ok = false;
    } else if (topic) showError(topic, "");
    if (!message?.value.trim()) {
      showError(message, "Add a message");
      ok = false;
    } else showError(message, "");

    return ok;
  }

  function showToast(text, duration = 3000) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), duration);
  }

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn ? btn.textContent : null;
    const endpoint = form.getAttribute("action"); // should be your Formspree endpoint
    if (!endpoint) {
      // Fallback: open mail client if no action is set
      const data = new FormData(form);
      const name = encodeURIComponent(data.get("name") || "");
      const email = encodeURIComponent(data.get("email") || "");
      const topic = encodeURIComponent(data.get("topic") || "General");
      const message = encodeURIComponent(data.get("message") || "");
      const to = "james.shotton73@gmail.com";
      const subject = `[jswebdesign] ${decodeURIComponent(
        topic
      )} - ${decodeURIComponent(name)}`;
      const body = `Name: ${decodeURIComponent(
        name
      )}%0AEmail: ${decodeURIComponent(email)}%0ATopic: ${decodeURIComponent(
        topic
      )}%0A%0A${decodeURIComponent(message)}`;
      window.location.href = `mailto:${to}?subject=${encodeURIComponent(
        subject
      )}&body=${body}`;
      showToast("Opening your email client…");
      form.reset();
      return;
    }

    try {
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Sending…";
      }

      const data = new FormData(form);
      data.append("_subject", "[jswebdesign] New enquiry");

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data,
      });

      if (res.ok) {
        form.reset();
        showToast("Thank you! Your message has been sent.");
      } else {
        const err = await res.json().catch(() => ({}));
        const msg =
          err?.errors?.[0]?.message ||
          "Something went wrong. Please email me directly.";
        showToast(msg, 4000);
      }
    } catch (err) {
      showToast("Network error. Please try again or email me directly.", 4000);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = originalText || "Send";
      }
    }
  });
});
