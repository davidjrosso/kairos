import { test } from "node:test";
import assert from "node:assert/strict";
import { detectarTelefono } from "./deteccion";

test("detecta teléfono con código de país y separadores", () => {
  const r = detectarTelefono(
    "Hola buenas, tengo una perdida de agua en la cocina. Mi numero es +54 9 11 3456-7890, me pueden pasar a ver?"
  );
  assert.equal(r?.telefono, "5491134567890");
});

test("detecta teléfono local con guion, sin código de área", () => {
  const r = detectarTelefono("Se corto la luz en casa, llamame al 15-3456-7890 porfa");
  assert.equal(r?.telefono, "153456789" + "0");
});

test("detecta teléfono pegado sin separadores", () => {
  const r = detectarTelefono("11987654321 necesito un electricista urgente");
  assert.equal(r?.telefono, "11987654321");
});

test("no confunde una fecha con un teléfono", () => {
  const r = detectarTelefono("Podrian venir el 10-09-2026 a la tarde?");
  assert.equal(r, null);
});

test("no detecta nada en un texto sin datos", () => {
  const r = detectarTelefono("Hola, necesito presupuesto para arreglar una perdida");
  assert.equal(r, null);
});

test("con varios números, prefiere el que tiene más dígitos (más específico)", () => {
  const r = detectarTelefono("Somos 2 personas en casa, mi telefono es 011 4567-8901");
  assert.equal(r?.telefono, "01145678901");
});

test("no explota con texto vacío", () => {
  assert.equal(detectarTelefono(""), null);
});
