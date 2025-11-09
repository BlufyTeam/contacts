// hooks/useContactExtras.ts
"use client";

import { useEffect, useState } from "react";

export type ExtrasMap = Record<string, Record<string, string>>;
export type ContactExtrasApi = {
  map: ExtrasMap;
  get: (contactId: string) => Record<string, string>;
  setField: (contactId: string, key: string, value: string) => void;
  removeField: (contactId: string, key: string) => void;
  clearContact: (contactId: string) => void;
};

const STORAGE_KEY = "contact_extras_v1";

export default function useContactExtras(): ContactExtrasApi {
  const [map, setMap] = useState<ExtrasMap>({});

  // load once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMap(JSON.parse(raw));
    } catch (e) {
      console.error("useContactExtras: failed to parse localStorage", e);
    }
  }, []);

  // persist on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch (e) {
      console.error("useContactExtras: failed to save to localStorage", e);
    }
  }, [map]);

  // sync across tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setMap(e.newValue ? JSON.parse(e.newValue) : {});
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const get = (id: string) => map[id] ?? {};
  const setField = (id: string, key: string, value: string) =>
    setMap((prev) => {
      const copy = { ...prev };
      copy[id] = { ...(copy[id] ?? {}), [key]: value };
      return copy;
    });
  const removeField = (id: string, key: string) =>
    setMap((prev) => {
      const copy = { ...prev };
      if (!copy[id]) return copy;
      const { [key]: _, ...rest } = copy[id];
      if (Object.keys(rest).length) copy[id] = rest;
      else delete copy[id];
      return copy;
    });
  const clearContact = (id: string) =>
    setMap((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });

  return { map, get, setField, removeField, clearContact };
}
