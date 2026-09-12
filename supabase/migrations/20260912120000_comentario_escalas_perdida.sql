-- El comentario de profiles.tipo_perdida_cabello decía "entradas |
-- coronilla | difusa | combinada" (una lista provisional). Se sustituye
-- por los valores reales de las escalas Norwood-Hamilton (hombre) y
-- Ludwig (mujer) que usa ahora el formulario. Es solo documentación:
-- no hay CHECK constraint, así que no hace falta migrar datos.

comment on column public.profiles.tipo_perdida_cabello is 'Hombre (Norwood-Hamilton): norwood_2 | norwood_3 | norwood_3v | norwood_4 | norwood_5 | norwood_6 | norwood_7 | no_seguro. Mujer (Ludwig): ludwig_1 | ludwig_2 | ludwig_3 | no_segura';
