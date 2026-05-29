import { ANON_KEY, SESS_KEY } from "./constants.js";
import { storageGet, storageSet } from "./storage.js";

export function randomId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export function getAnonymousId() {
  let id = storageGet(ANON_KEY);
  if (!id) {
    id = randomId("anon");
    storageSet(ANON_KEY, id);
  }
  return id;
}

export function getSessionId() {
  let id = storageGet(SESS_KEY);
  if (!id) {
    id = randomId("sess");
    storageSet(SESS_KEY, id);
  }
  return id;
}

export function newSessionId() {
  const id = randomId("sess");
  storageSet(SESS_KEY, id);
  return id;
}
