export function createUI(handlers) {
  const board = document.querySelector('[data-ui="board"]');
  const fields = {
    level: document.querySelector('[data-ui="level"]'),
    coins: document.querySelector('[data-ui="coins"]'),
    remaining: document.querySelector('[data-ui="remaining"]'),
    score: document.querySelector('[data-ui="score"]'),
    steps: document.querySelector('[data-ui="steps"]'),
    combo: document.querySelector('[data-ui="combo"]'),
    message: document.querySelector('[data-ui="message"]')
  };
  const nextButton = document.querySelector('[data-action="next"]');

  board.addEventListener("click", (event) => {
    const tile = event.target.closest("[data-key]");
    if (tile) handlers.onTilePress(tile.dataset.key);
  });

  document.querySelector('[data-action="shuffle"]').addEventListener("click", handlers.onShuffle);
  document.querySelector('[data-action="restart"]').addEventListener("click", handlers.onRestart);
  nextButton.addEventListener("click", handlers.onNext);

  return {
    render(state) {
      fields.level.textContent = state.level;
      fields.coins.textContent = state.coins;
      fields.remaining.textContent = state.remaining;
      fields.score.textContent = state.score;
      fields.steps.textContent = state.steps;
      fields.combo.textContent = state.combo;
      fields.message.textContent = state.message;
      fields.message.classList.toggle("is-win", state.status === "win");

      nextButton.textContent = state.nextEnabled ? "下一关" : "消完过关";
      nextButton.disabled = !state.nextEnabled;

      const cols = Math.max(...state.board.map((cell) => cell.col)) + 1;
      board.style.setProperty("--cols", cols);
      board.innerHTML = state.board.map(renderCell).join("");
    }
  };
}

function renderCell(cell) {
  if (cell.empty) {
    return `<button class="cell empty" data-key="${cell.key}" aria-label="空格"></button>`;
  }

  const classes = ["cell", "tile", `suit-${cell.suit}`];
  if (cell.selected) classes.push("selected");
  if (cell.hint) classes.push("hint");

  return `
    <button class="${classes.join(" ")}" data-key="${cell.key}" aria-label="${cell.name}">
      <img src="${cell.image}" alt="${cell.name}" draggable="false" />
    </button>
  `;
}
