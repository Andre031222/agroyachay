INSERT INTO products (sku, name, category, unit, price_pen, supplier) VALUES
    ('fert-urea', 'Urea 46 % N', 'fertilizer', 'saco 50 kg', 145.00, 'Agroservicios del Altiplano, Juliaca'),
    ('fert-dap', 'Fosfato diamónico 18-46-0', 'fertilizer', 'saco 50 kg', 175.00, 'Agroservicios del Altiplano, Juliaca'),
    ('fert-kcl', 'Cloruro de potasio 60 % K2O', 'fertilizer', 'saco 50 kg', 140.00, 'Agroservicios del Altiplano, Juliaca'),
    ('fert-an', 'Nitrato de amonio 33,5 % N', 'fertilizer', 'saco 50 kg', 120.00, 'Distribuidora Agrícola Sur, Arequipa'),
    ('fert-guano', 'Guano de las islas 10-10-2', 'fertilizer', 'saco 50 kg', 65.00, 'Agro Rural (MIDAGRI)'),
    ('amend-lime', 'Cal agrícola (carbonato de calcio)', 'amendment', 'saco 50 kg', 25.00, 'Distribuidora Agrícola Sur, Arequipa'),
    ('seed-potato', 'Semilla de papa certificada (Canchán, Yungay)', 'seed', 'kg', 2.80, 'Asociación de Semilleristas de Puno'),
    ('seed-quinoa', 'Semilla de quinua certificada (Salcedo INIA)', 'seed', 'kg', 18.00, 'INIA, Estación Experimental Illpa'),
    ('seed-maize', 'Semilla de maíz amiláceo (Blanco Urubamba)', 'seed', 'kg', 12.00, 'Semillas Andinas, Cusco'),
    ('seed-faba', 'Semilla de haba (Verde Cusqueña)', 'seed', 'kg', 8.00, 'Semillas Andinas, Cusco'),
    ('seed-oca', 'Semilla de oca seleccionada', 'seed', 'kg', 3.00, 'Asociación de Semilleristas de Puno'),
    ('seed-canihua', 'Semilla de cañihua (Cupi)', 'seed', 'kg', 20.00, 'INIA, Estación Experimental Illpa'),
    ('seed-barley', 'Semilla de cebada (UNA 80)', 'seed', 'kg', 4.00, 'Asociación de Semilleristas de Puno'),
    ('seed-wheat', 'Semilla de trigo (Andino)', 'seed', 'kg', 4.50, 'Asociación de Semilleristas de Puno'),
    ('chem-mancozeb', 'Mancozeb 80 % WP (fungicida de contacto)', 'agrochemical', 'kg', 38.00, 'Agroservicios del Altiplano, Juliaca'),
    ('chem-cymoxanil-mancozeb', 'Cimoxanil 8 % + Mancozeb 64 % WP', 'agrochemical', 'kg', 55.00, 'Agroservicios del Altiplano, Juliaca'),
    ('chem-metalaxyl-mancozeb', 'Metalaxil 8 % + Mancozeb 64 % WP', 'agrochemical', 'kg', 70.00, 'Distribuidora Agrícola Sur, Arequipa'),
    ('chem-chlorothalonil', 'Clorotalonil 720 g/L SC', 'agrochemical', 'L', 60.00, 'Distribuidora Agrícola Sur, Arequipa'),
    ('chem-cypermethrin', 'Cipermetrina 25 % EC (insecticida)', 'agrochemical', 'L', 45.00, 'Agroservicios del Altiplano, Juliaca'),
    ('chem-lambda-cyhalothrin', 'Lambda-cihalotrina 5 % EC (insecticida)', 'agrochemical', 'L', 70.00, 'Distribuidora Agrícola Sur, Arequipa'),
    ('chem-bt', 'Bacillus thuringiensis var. kurstaki WP (bioinsecticida)', 'agrochemical', 'kg', 80.00, 'Bioagro Andino, Cusco'),
    ('equip-sprayer', 'Mochila pulverizadora manual 20 L', 'equipment', 'unidad', 180.00, 'Ferretería Agrícola Puno'),
    ('equip-yellow-traps', 'Trampas amarillas pegajosas (paquete de 10)', 'equipment', 'paquete', 35.00, 'Bioagro Andino, Cusco'),
    ('equip-drip-tape', 'Cinta de riego por goteo 16 mm (rollo 1000 m)', 'equipment', 'rollo', 320.00, 'Ferretería Agrícola Puno'),
    ('equip-sensor-node', 'Nodo sensor AgroYachay (ESP32 + DHT11 + FC-28)', 'equipment', 'unidad', 95.00, 'Ensamblaje local');

INSERT INTO settings (key, value) VALUES
    ('announcement', 'null'::jsonb),
    ('registration_open', 'true'::jsonb),
    ('default_region', '{"name": "Puno, Perú", "latitude": -15.84, "longitude": -70.02}'::jsonb),
    ('labour_day_pen', '50'::jsonb)
ON CONFLICT (key) DO NOTHING;
