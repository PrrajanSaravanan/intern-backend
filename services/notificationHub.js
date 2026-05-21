/** In-memory SSE clients keyed by user id */
const clients = new Map();

const addClient = (userId, res) => {
  const key = String(userId);
  if (!clients.has(key)) clients.set(key, new Set());
  clients.get(key).add(res);
};

const removeClient = (userId, res) => {
  const key = String(userId);
  const set = clients.get(key);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) clients.delete(key);
};

const pushToUser = (userId, payload) => {
  const set = clients.get(String(userId));
  if (!set) return;
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const res of set) {
    try {
      res.write(data);
      if (typeof res.flush === 'function') res.flush();
    } catch {
      set.delete(res);
    }
  }
};

const closeAll = () => {
  for (const set of clients.values()) {
    for (const res of set) {
      try { res.end(); } catch { /* ignore */ }
    }
  }
  clients.clear();
};

module.exports = { addClient, removeClient, pushToUser, closeAll };
