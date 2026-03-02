import { z } from "zod";

/* ======================================================
   TYPES DE RESSOURCES
====================================================== */

export const RESOURCE_TYPES = [
  "Fiche",
  "Kit clé en main",
  "Projet",
  "Article",
  "Vidéo",
] as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number];
export const RESOURCE_TYPES_ENUM = z.enum(RESOURCE_TYPES);


/* ======================================================
   TEMPS DE PRÉPARATION
====================================================== */

export const PREP_TIMES = [
  "0–15 min",
  "15–30 min",
  "30–60 min",
  "1–2h",
  "+2h",
] as const;

export type PrepTime = (typeof PREP_TIMES)[number];
export const PREP_TIMES_ENUM = z.enum(PREP_TIMES);


/* ======================================================
   DURÉES D’ANIMATION
====================================================== */

export const DURATIONS = [
  "30 min",
  "1-2h",
  "Demi-journée",
  "Journée",
] as const;

export type Duration = (typeof DURATIONS)[number];
export const DURATIONS_ENUM = z.enum(DURATIONS);


/* ======================================================
   TRANCHES D’ÂGE
====================================================== */

export const AGE_RANGES = [
  "3-5 ans",
  "6-11 ans",
  "12-18 ans",
  "Tous âges",
] as const;

export type AgeRange = (typeof AGE_RANGES)[number];
export const AGE_RANGES_ENUM = z.enum(AGE_RANGES);
