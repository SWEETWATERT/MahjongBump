export function playSelectEffect(key) {
  pulse(key, "select-pop");
}

export function playMatchEffect(keys) {
  keys.forEach((key) => pulse(key, "match-pop"));
}

export function playShuffleEffect() {
  document.querySelector('[data-ui="board"]')?.animate(
    [
      { transform: "scale(0.985)", filter: "brightness(1.06)" },
      { transform: "scale(1)", filter: "brightness(1)" }
    ],
    {
      duration: 220,
      easing: "cubic-bezier(.2,.8,.2,1)"
    }
  );
}

function pulse(key, className) {
  const element = document.querySelector(`[data-key="${key}"]`);
  if (!element) return;
  element.classList.remove(className);
  window.requestAnimationFrame(() => {
    element.classList.add(className);
  });
}
