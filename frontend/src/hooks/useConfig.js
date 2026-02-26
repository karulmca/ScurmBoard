/**
 * useConfig.js
 * ─────────────────────────────────────────────────────────────────────────────
 * React hook that returns the effective configuration for a given org.
 *
 * • Returns DEFAULT_CONFIG synchronously on the first render (no flash of
 *   empty dropdowns).
 * • Fetches /api/config once per org-scope and caches the result in a
 *   module-level Map — subsequent mounts reuse the cached data.
 * • Call  invalidateConfigCache(orgId?)  after saving new config values so
 *   the next render triggers a fresh fetch.
 */

import { useState, useEffect } from "react";
import { DEFAULT_CONFIG } from "../constants.js";

const API_BASE = "http://localhost:3000/api";

// ── Module-level cache (keyed by String(orgId) or "global") ─────────────────
const _cache    = new Map();   // key → resolved config object
const _promises = new Map();   // key → pending Promise

function cacheKey(orgId) {
  return orgId != null ? String(orgId) : "global";
}

/**
 * Merge API response on top of DEFAULT_CONFIG so that any keys missing from
 * the server response still fall back to the local default.
 */
function mergeConfig(data) {
  return { ...DEFAULT_CONFIG, ...data };
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Invalidate the cached config for an org (or all caches if no arg).
 * Call this after a successful POST /api/config to force a fresh fetch.
 */
export function invalidateConfigCache(orgId = null) {
  if (orgId === null) {
    _cache.clear();
    _promises.clear();
  } else {
    const key = cacheKey(orgId);
    _cache.delete(key);
    _promises.delete(key);
  }
}

/**
 * useConfig(orgId?)
 *
 * Returns the live config object.  Defaults are served immediately; the API
 * result updates the state asynchronously.
 *
 * @param {number|null} orgId  Pass the current org's id for per-org overrides,
 *                             or omit / pass null for global defaults.
 * @returns {object}  Config object with keys matching backend DEFAULTS.
 */
export function useConfig(orgId = null) {
  const key = cacheKey(orgId);

  // If we already have a cached result, skip the loading dance entirely.
  const [config, setConfig] = useState(() => _cache.get(key) ?? DEFAULT_CONFIG);

  useEffect(() => {
    // Already cached — just ensure state is fresh (handles orgId changes)
    if (_cache.has(key)) {
      setConfig(_cache.get(key));
      return;
    }

    // Kick off a fetch (or reuse an in-flight promise)
    if (!_promises.has(key)) {
      const url = orgId != null
        ? `${API_BASE}/config?org_id=${orgId}`
        : `${API_BASE}/config`;

      const promise = fetch(url)
        .then((r) => {
          if (!r.ok) throw new Error(`Config fetch failed: ${r.status}`);
          return r.json();
        })
        .then((data) => {
          const merged = mergeConfig(data);
          _cache.set(key, merged);
          return merged;
        })
        .catch(() => {
          // On error, cache + use defaults so we don't retry on every mount
          _cache.set(key, DEFAULT_CONFIG);
          return DEFAULT_CONFIG;
        });

      _promises.set(key, promise);
    }

    _promises.get(key).then((data) => setConfig(data));
  }, [key]); // re-run only when orgId changes

  return config;
}
