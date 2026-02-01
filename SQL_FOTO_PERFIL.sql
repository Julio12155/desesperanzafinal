-- Script SQL para agregar soporte de foto de perfil
-- Ejecutar si la tabla usuarios no tiene el campo avatar

-- Verificar si el campo existe (MySQL/MariaDB)
-- Si la siguiente consulta no retorna nada, necesitas agregar el campo

ALTER TABLE usuarios ADD COLUMN avatar VARCHAR(255) NULL AFTER email;

-- Alternativa si avatar ya existe pero es de otro tipo:
-- ALTER TABLE usuarios MODIFY COLUMN avatar VARCHAR(255) NULL;

-- Verificar que se agregó correctamente:
-- DESC usuarios;
-- O en algunos motores:
-- SHOW COLUMNS FROM usuarios;
