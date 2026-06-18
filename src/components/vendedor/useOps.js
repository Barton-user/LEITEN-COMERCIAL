"use client";
import { useState, useEffect } from "react";

// Une las oportunidades del servidor con las creadas en la sesión (localStorage).
export function useOps(serverOps) {
  const [nuevas, setNuevas] = useState([]);
  useEffect(() => {
    try { setNuevas(JSON.parse(localStorage.getItem("opsNuevas") || "[]")); } catch (e) {}
  }, []);
  return [...nuevas, ...serverOps];
}
