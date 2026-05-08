export const TILE_TYPES = [
  tile("wan1", "1万", "wan", "wan1.png"),
  tile("wan2", "2万", "wan", "wan2.png"),
  tile("wan3", "3万", "wan", "wan3.png"),
  tile("wan4", "4万", "wan", "wan4.png"),
  tile("tiao1", "幺鸡", "tiao", "tiao1.png"),
  tile("tiao2", "二条", "tiao", "tiao2.png"),
  tile("tiao3", "三条", "tiao", "tiao3.png"),
  tile("tong1", "一筒", "tong", "tong1.png"),
  tile("tong2", "二筒", "tong", "tong2.png"),
  tile("east", "东", "wind", "east.png"),
  tile("south", "南", "wind", "south.png"),
  tile("red", "中", "dragon", "red.png"),
  tile("green", "发", "dragon", "green.png"),
  tile("white", "白", "dragon", "white.png")
];

export function getTileType(tileId) {
  const tileType = TILE_TYPES.find((item) => item.id === tileId);
  if (!tileType) {
    throw new Error(`Unknown tile type: ${tileId}`);
  }
  return tileType;
}

export function makeTileCell(row, col, tileId, index) {
  if (!tileId) {
    return {
      key: `${row}-${col}`,
      row,
      col,
      empty: true
    };
  }

  const tileType = getTileType(tileId);
  return {
    key: `${row}-${col}`,
    row,
    col,
    id: `${tileId}-${index}`,
    tileId,
    name: tileType.name,
    suit: tileType.suit,
    image: tileType.image,
    empty: false,
    selected: false,
    hint: false
  };
}

function tile(id, name, suit, fileName) {
  return {
    id,
    name,
    suit,
    image: `./assets/tiles/${fileName}`
  };
}
