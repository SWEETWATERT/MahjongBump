const TILE_LIBRARY = [
  { id: "wan1", label: "1万", image: "/assets/tiles/wan1.png", color: "#1f2320" },
  { id: "wan2", label: "2万", image: "/assets/tiles/wan2.png", color: "#1f2320" },
  { id: "wan3", label: "3万", image: "/assets/tiles/wan3.png", color: "#1f2320" },
  { id: "wan4", label: "4万", image: "/assets/tiles/wan4.png", color: "#1f2320" },
  { id: "wan5", label: "5万", image: "/assets/tiles/wan5.png", color: "#1f2320" },
  { id: "tiao1", label: "幺鸡", image: "/assets/tiles/tiao1.png", color: "#118b4d" },
  { id: "tiao2", label: "二条", image: "/assets/tiles/tiao2.png", color: "#118b4d" },
  { id: "tiao3", label: "三条", image: "/assets/tiles/tiao3.png", color: "#118b4d" },
  { id: "tong1", label: "一筒", image: "/assets/tiles/tong1.png", color: "#c9342f" },
  { id: "tong2", label: "二筒", image: "/assets/tiles/tong2.png", color: "#c9342f" },
  { id: "east", label: "东", image: "/assets/tiles/east.png", color: "#242424" },
  { id: "south", label: "南", image: "/assets/tiles/south.png", color: "#242424" },
  { id: "west", label: "西", image: "/assets/tiles/west.png", color: "#242424" },
  { id: "north", label: "北", image: "/assets/tiles/north.png", color: "#242424" },
  { id: "red", label: "中", image: "/assets/tiles/red.png", color: "#d12d2a" },
  { id: "green", label: "发", image: "/assets/tiles/green.png", color: "#118b4d" },
  { id: "white", label: "白", image: "/assets/tiles/white.png", color: "#343434" }
];

function byId(id) {
  return TILE_LIBRARY.find((tile) => tile.id === id) || TILE_LIBRARY[0];
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function getRect(layout, tile, scale) {
  const baseX = layout.padding + tile.col * (layout.tileWidth + layout.gap);
  const baseY = layout.padding + tile.row * (layout.tileHeight + layout.gap);
  const width = layout.tileWidth * (scale || 1);
  const height = layout.tileHeight * (scale || 1);
  return {
    x: baseX - (width - layout.tileWidth) / 2,
    y: baseY - (height - layout.tileHeight) / 2,
    width,
    height,
    centerX: baseX + layout.tileWidth / 2,
    centerY: baseY + layout.tileHeight / 2
  };
}

function drawTile(ctx, tile, layout, options) {
  const state = options || {};
  const meta = byId(tile.tileId);
  const removeScale = tile.removing ? Math.max(0.2, 1 - tile.removeProgress * 0.72) : 1;
  const tapScale = state.selected || state.hinted ? 1.08 : 1;
  const rect = getRect(layout, tile, removeScale * tapScale);
  const alpha = tile.removing ? Math.max(0, 1 - tile.removeProgress) : 1;
  const radius = Math.max(8, layout.tileWidth * 0.18);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowBlur = state.selected || state.hinted ? 22 : 9;
  ctx.shadowColor = state.selected ? "rgba(255, 248, 132, 0.95)" :
    state.hinted ? "rgba(123, 244, 174, 0.9)" : "rgba(0, 0, 0, 0.26)";
  ctx.shadowOffsetY = state.selected || state.hinted ? 0 : 6;

  roundedRect(ctx, rect.x, rect.y, rect.width, rect.height, radius);
  const body = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.height);
  body.addColorStop(0, "#ffffff");
  body.addColorStop(0.62, "#fffaf0");
  body.addColorStop(1, "#ead7aa");
  ctx.fillStyle = body;
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  roundedRect(ctx, rect.x + 4, rect.y + 4, rect.width - 8, rect.height * 0.34, radius * 0.72);
  const shine = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.height * 0.42);
  shine.addColorStop(0, "rgba(255, 255, 255, 0.9)");
  shine.addColorStop(1, "rgba(255, 255, 255, 0.05)");
  ctx.fillStyle = shine;
  ctx.fill();

  roundedRect(ctx, rect.x + 2, rect.y + 2, rect.width - 4, rect.height - 7, radius - 2);
  ctx.strokeStyle = state.selected ? "#fff176" : state.hinted ? "#81f0ac" : "#e5d5b6";
  ctx.lineWidth = state.selected || state.hinted ? 4 : 2;
  ctx.stroke();

  const image = state.image;
  if (image) {
    const pad = Math.max(7, layout.tileWidth * 0.14);
    ctx.drawImage(image, rect.x + pad, rect.y + pad, rect.width - pad * 2, rect.height - pad * 2);
  }

  ctx.font = `800 ${Math.max(20, Math.floor(rect.width * 0.36))}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.88)";
  ctx.strokeText(meta.label, rect.centerX, rect.centerY);
  ctx.fillStyle = meta.color;
  ctx.fillText(meta.label, rect.centerX, rect.centerY);
  ctx.restore();
}

module.exports = {
  TILE_LIBRARY,
  byId,
  getRect,
  drawTile,
  roundedRect
};
