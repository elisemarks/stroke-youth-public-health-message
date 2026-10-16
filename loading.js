// Load in stages after the loading screen has had a chance to paint.
(() => {
  const screen = document.getElementById("loading-screen");
  const message = document.getElementById("loading-message");
  const continueButton = document.getElementById("loading-continue");
  const page = [...document.querySelectorAll("main, footer, .skip")];
  document.documentElement.classList.add("effects-loading");
  page.forEach((element) => (element.inert = true));
  let dismissed = false;
  let watchdog;
  const paint = () =>
    new Promise((resolve) => {
      const timer = setTimeout(resolve, 150);
      requestAnimationFrame(() =>
        setTimeout(() => {
          clearTimeout(timer);
          resolve();
        }, 0),
      );
    });
  const finish = () => {
    if (dismissed) return;
    dismissed = true;
    clearTimeout(watchdog);
    page.forEach((element) => (element.inert = false));
    document.documentElement.classList.remove("effects-loading");
    screen.classList.add("is-ready");
    setTimeout(
      () => (screen.hidden = true),
      matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 350,
    );
    if (document.activeElement === continueButton)
      document.querySelector(".skip").focus({ preventScroll: true });
  };
  const load = (source, timeout = 20000) =>
    new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = source;
      const timer = setTimeout(() => {
        script.remove();
        reject(new Error(`Timed out loading ${source}`));
      }, timeout);
      script.onload = () => {
        clearTimeout(timer);
        resolve();
      };
      script.onerror = () => {
        clearTimeout(timer);
        reject(new Error(`Could not load ${source}`));
      };
      document.body.appendChild(script);
    });
  continueButton.addEventListener("click", finish);
  watchdog = setTimeout(() => {
    if (dismissed) return;
    message.textContent =
      "Loading is taking longer than usual. You can continue to the page while it finishes.";
    message.hidden = false;
    continueButton.hidden = false;
  }, 20000);
  (async () => {
    try {
      await paint();
      await load("assets/front-noise-colors.js");
      await paint();
      try {
        await load("assets/brain-meshes.js");
        await load("assets/brain3d.bundle.js");
      } catch (error) {
        console.warn("Using the lightweight animation:", error.message);
        window.BrainModel = null;
      }
      await paint();
      await load("app.js");
      await window.effectsReady;
      await paint();
      finish();
    } catch (error) {
      console.error("Effects loading failed:", error);
      clearTimeout(watchdog);
      if (dismissed) return;
      message.textContent =
        "Some visual effects could not load. You can still read the page.";
      message.hidden = false;
      continueButton.hidden = false;
    }
  })();
})();
