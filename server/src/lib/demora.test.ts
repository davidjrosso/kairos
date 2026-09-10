import { test } from "node:test";
import assert from "node:assert/strict";
import { esDemorado, UMBRAL_DEMORA_MS } from "./demora";

const AHORA = new Date("2026-09-10T12:00:00.000Z").getTime();

test("un pedido nuevo de hace 23 horas no está demorado", () => {
  const creado = new Date(AHORA - (UMBRAL_DEMORA_MS - 60 * 60 * 1000));
  assert.equal(esDemorado({ estado: "nuevo", createdAt: creado }, AHORA), false);
});

test("un pedido nuevo de hace 25 horas está demorado", () => {
  const creado = new Date(AHORA - UMBRAL_DEMORA_MS - 60 * 60 * 1000);
  assert.equal(esDemorado({ estado: "nuevo", createdAt: creado }, AHORA), true);
});

test("un pedido respondido de hace 25 horas no está demorado", () => {
  const creado = new Date(AHORA - UMBRAL_DEMORA_MS - 60 * 60 * 1000);
  assert.equal(esDemorado({ estado: "respondido", createdAt: creado }, AHORA), false);
});

test("un pedido descartado de hace 25 horas no está demorado", () => {
  const creado = new Date(AHORA - UMBRAL_DEMORA_MS - 60 * 60 * 1000);
  assert.equal(esDemorado({ estado: "descartado", createdAt: creado }, AHORA), false);
});
