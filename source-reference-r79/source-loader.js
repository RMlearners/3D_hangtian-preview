// Static browser loader for MapleEve's pinned Space City .dmap packages.
// Key material stays in the upstream source and is fetched at runtime.
const revision = '794c1a95ca7cebe9b12f53ce34b391fb92b39b17';
const upstream = `https://cdn.jsdelivr.net/gh/MapleEve/DF3dMapTool@${revision}/`;

async function checkedFetch(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response;
}

let keyPromise;
async function getKey() {
  if (!keyPromise) keyPromise = (async () => {
    const source = await (await checkedFetch(upstream + 'apps/web/src/engine/dmapKey.ts')).text();
    const groups = [...source.matchAll(/const (SEGMENT_HEX|TABLE_HEX) = \[([\s\S]*?)\] as const;/g)];
    if (groups.length !== 2) throw new Error('上游密钥格式已变化');
    const arrays = Object.fromEntries(groups.map(([, name, body]) =>
      [name, [...body.matchAll(/"([0-9a-f]{16})"/g)].map(([, hex]) =>
        Uint8Array.from(hex.match(/../g), pair => parseInt(pair, 16)))]));
    if (arrays.SEGMENT_HEX?.length !== 4 || arrays.TABLE_HEX?.length !== 4)
      throw new Error('上游密钥材料不完整');
    const mixed = new Uint8Array(32);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 8; j++)
      mixed[i * 8 + j] = arrays.SEGMENT_HEX[i][j] ^ arrays.TABLE_HEX[i][j];
    return crypto.subtle.importKey('raw', await crypto.subtle.digest('SHA-256', mixed),
      {name: 'AES-GCM'}, false, ['decrypt']);
  })();
  return keyPromise;
}

export async function loadChunk(name) {
  if (!/^c_\d+_-?\d+_l[02]\.dmap$/.test(name)) throw new Error('无效分块名称');
  const bytes = new Uint8Array(await (await checkedFetch(
    upstream + 'apps/web/public/assets/spacecenter/chunks/' + name)).arrayBuffer());
  const view = new DataView(bytes.buffer);
  if (new TextDecoder().decode(bytes.subarray(0, 4)) !== 'DMAP' || view.getUint32(4, true) !== 1)
    throw new Error('不支持的数据包版本');
  const header = bytes.subarray(0, 24);
  const bundle = new Uint8Array(await crypto.subtle.decrypt({
    name: 'AES-GCM', iv: header.subarray(12, 24), additionalData: header, tagLength: 128
  }, await getKey(), bytes.subarray(24)));
  const glb = new DataView(bundle.buffer);
  if (new TextDecoder().decode(bundle.subarray(0, 4)) !== 'glTF' || glb.getUint32(8, true) !== bundle.length)
    throw new Error('无效的几何数据包');
  let entries, binary;
  for (let offset = 12; offset + 8 <= bundle.length;) {
    const size = glb.getUint32(offset, true), type = glb.getUint32(offset + 4, true);
    const data = bundle.subarray(offset + 8, offset + 8 + size);
    if (type === 0x4e4f534a) entries = JSON.parse(new TextDecoder().decode(data)).dmapc.entries;
    if (type === 0x004e4942) binary = data;
    offset += 8 + size;
  }
  const entry = entries?.find(item => item.name === 'chunk.glb');
  if (!entry || !binary || entry.byteOffset + entry.byteLength > binary.length)
    throw new Error('分块中缺少有效几何');
  return binary.slice(entry.byteOffset, entry.byteOffset + entry.byteLength).buffer;
}

