-- Fix Category Mappings
-- This migration corrects auto-generated mapping errors where similar-sounding
-- words were incorrectly matched (e.g., frozen fish -> ice cream, ginger ale -> gin)
-- Run this AFTER the initial mapping migrations (003, 004, 005)

-- ============================================================================
-- AUCHAN FIXES (origin_id: 2)
-- ============================================================================

-- CRITICAL: Frozen fish was mapped to Ice Cream (Gelados)
-- 'Peixe e Mariscos Congelados' should be 69 (Peixe Congelado), not 72 (Gelados)
UPDATE category_mappings
SET canonical_category_id = 69, updated_at = NOW()
WHERE origin_id = 2 
  AND store_category = 'Produtos Frescos' 
  AND store_category_2 = 'Peixaria' 
  AND store_category_3 = 'Peixe e Mariscos Congelados';

-- Frozen organic products mapped to Ice Cream instead of Congelados
UPDATE category_mappings
SET canonical_category_id = 8, updated_at = NOW()
WHERE origin_id = 2 
  AND store_category = 'Biológicos e Alternativas' 
  AND store_category_2 = 'Biológicos' 
  AND store_category_3 = 'Biológicos Congelados';

-- Generic 'Alimentação' mapped to Baby Food - should be Mercearia
UPDATE category_mappings
SET canonical_category_id = 7, updated_at = NOW()
WHERE origin_id = 2 
  AND store_category = 'Alimentação' 
  AND store_category_2 IS NULL 
  AND store_category_3 IS NULL;

-- Adult milk 'Leites' mapped to Infant Milk - should be regular Leite (31)
UPDATE category_mappings
SET canonical_category_id = 31, updated_at = NOW()
WHERE origin_id = 2 
  AND store_category = 'Alimentação' 
  AND store_category_2 = 'Produtos Lácteos' 
  AND store_category_3 = 'Leites';

-- Creams (Natas, Béchamel) mapped to Baby Food - should be Natas e Chantilly (35)
UPDATE category_mappings
SET canonical_category_id = 35, updated_at = NOW()
WHERE origin_id = 2 
  AND store_category = 'Alimentação' 
  AND store_category_2 = 'Produtos Lácteos' 
  AND store_category_3 = 'Natas, Béchamel e Chantilly';

-- Cheese 'Queijaria' mapped to Baby Food - should be Queijos (33)
UPDATE category_mappings
SET canonical_category_id = 33, updated_at = NOW()
WHERE origin_id = 2 
  AND store_category = 'Alimentação' 
  AND store_category_2 = 'Produtos Lácteos' 
  AND store_category_3 = 'Queijaria';

-- Halal food mapped to Baby Food - should be Mercearia (7)
UPDATE category_mappings
SET canonical_category_id = 7, updated_at = NOW()
WHERE origin_id = 2 
  AND store_category = 'Alimentação' 
  AND store_category_2 = 'Sabores do Mundo' 
  AND store_category_3 = 'Halal';

-- World cuisines mapped to Kitchen (Casa > Cozinha) instead of food
-- Fix all 'Sabores do Mundo' cuisine mappings to Mercearia (7)
UPDATE category_mappings
SET canonical_category_id = 7, updated_at = NOW()
WHERE origin_id = 2 
  AND store_category = 'Alimentação' 
  AND store_category_2 = 'Sabores do Mundo'
  AND canonical_category_id = 127;

-- Hair conditioners mapped to Laundry Softeners - should be Cabelo (87)
UPDATE category_mappings
SET canonical_category_id = 87, updated_at = NOW()
WHERE origin_id = 2 
  AND store_category = 'Amaciadores e Máscaras de Cabelo';

UPDATE category_mappings
SET canonical_category_id = 311, updated_at = NOW()
WHERE origin_id = 2 
  AND store_category = 'Beleza e Higiene' 
  AND store_category_2 = 'Amaciadores e Máscaras de Cabelo' 
  AND store_category_3 = 'Máscaras';

-- Pet birds mapped to Poultry meat - should be Outros Animais (116)
UPDATE category_mappings
SET canonical_category_id = 116, updated_at = NOW()
WHERE origin_id = 2 
  AND store_category = 'Animais' 
  AND store_category_2 = 'Aves';

-- Storage/Ladders 'Arrumação e Escadotes' mapped to Rum - should be Arrumação (130)
UPDATE category_mappings
SET canonical_category_id = 130, updated_at = NOW()
WHERE origin_id = 2 
  AND store_category = 'Automóvel e Bricolage' 
  AND store_category_2 = 'Ferramentas e Bricolage' 
  AND store_category_3 = 'Arrumação e Escadotes';

-- Ginger Ale soft drink mapped to Gin - should be Água Tónica (162)
UPDATE category_mappings
SET canonical_category_id = 162, updated_at = NOW()
WHERE origin_id = 2 
  AND store_category = 'Bebidas e Garrafeira' 
  AND store_category_2 = 'Águas Tónicas e Ginger Ale' 
  AND store_category_3 = 'Ginger Ale';

-- Body lotions 'Leites e Loções' mapped to dairy Milk - should be Corpo (89)
UPDATE category_mappings
SET canonical_category_id = 89, updated_at = NOW()
WHERE origin_id = 2 
  AND store_category = 'Beleza e Higiene' 
  AND store_category_2 = 'Cremes de Corpo e Rosto' 
  AND store_category_3 = 'Leites e Loções';

-- Toy musical instruments mapped to Rum - should be Brinquedos e Jogos (19)
UPDATE category_mappings
SET canonical_category_id = 19, updated_at = NOW()
WHERE origin_id = 2 
  AND store_category = 'Brinquedos e Videojogos' 
  AND store_category_2 = 'Educativos e Criativos' 
  AND store_category_3 = 'Instrumentos Musicais de brincar';

-- Keychains 'Porta-chaves' mapped to Poultry - should be Brinquedos e Jogos (19)
UPDATE category_mappings
SET canonical_category_id = 19, updated_at = NOW()
WHERE origin_id = 2 
  AND store_category = 'Brinquedos e Videojogos' 
  AND store_category_2 = 'Kidults' 
  AND store_category_3 = 'Porta-chaves';

-- Breast pumps 'Bombas de Tirar Leite' mapped to dairy Milk - should be Maternidade (113)
UPDATE category_mappings
SET canonical_category_id = 113, updated_at = NOW()
WHERE origin_id = 2 
  AND store_category = 'O Mundo do Bebé' 
  AND store_category_2 = 'Maternidade e Amamentação' 
  AND store_category_3 = 'Bombas de Tirar Leite';

-- Umbrellas 'Guarda chuvas' mapped to Grapes - should be Casa e Jardim (17)
UPDATE category_mappings
SET canonical_category_id = 17, updated_at = NOW()
WHERE origin_id = 2 
  AND store_category = 'Roupa, Calçado e Acessórios' 
  AND store_category_2 = 'Guarda chuvas';

-- Medical 'Tratamento Ginecológico e Urinário' mapped to Gin - should be Saúde e Parafarmácia (16)
UPDATE category_mappings
SET canonical_category_id = 16, updated_at = NOW()
WHERE origin_id = 2 
  AND store_category = 'Saúde e Bem Estar' 
  AND store_category_2 = 'Medicamentos Não Sujeitos Receita Médica' 
  AND store_category_3 = 'Tratamento Ginecológico e Urinário';

-- Sports balls 'Bolas' mapped to Onions - should be Desporto (151)
UPDATE category_mappings
SET canonical_category_id = 151, updated_at = NOW()
WHERE origin_id = 2 
  AND store_category = 'Viagem, Desporto e Outdoor' 
  AND store_category_2 = 'Artigos de Desporto' 
  AND store_category_3 = 'Bolas';

-- Baby shampoo mapped to Children's clothing - should be Higiene Bebé (108)
UPDATE category_mappings
SET canonical_category_id = 108, updated_at = NOW()
WHERE origin_id = 2 
  AND store_category = 'Beleza e Higiene' 
  AND store_category_2 = 'Champô e Coloração' 
  AND store_category_3 = 'Bebé e Criança';

-- Children's gel bath mapped to Children's clothing - should be Gel de Banho (307)
UPDATE category_mappings
SET canonical_category_id = 307, updated_at = NOW()
WHERE origin_id = 2 
  AND store_category = 'Beleza e Higiene' 
  AND store_category_2 = 'Gel de Banho e Sabonete' 
  AND store_category_3 = 'Gel Banho Criança';

-- Children's perfume mapped to Children's clothing - should be Higiene e Beleza (11)
UPDATE category_mappings
SET canonical_category_id = 11, updated_at = NOW()
WHERE origin_id = 2 
  AND store_category = 'Beleza e Higiene' 
  AND store_category_2 = 'Maquilhagem e Perfumes' 
  AND store_category_3 = 'Perfumes Criança';

-- Children's sunscreen mapped to Children's clothing - should be Proteção Solar (94)
UPDATE category_mappings
SET canonical_category_id = 94, updated_at = NOW()
WHERE origin_id = 2 
  AND store_category = 'Beleza e Higiene' 
  AND store_category_2 = 'Cuidados Solares' 
  AND store_category_3 = 'Protetor Solar de Criança';

UPDATE category_mappings
SET canonical_category_id = 94, updated_at = NOW()
WHERE origin_id = 2 
  AND store_category = 'Saúde e Bem Estar' 
  AND store_category_2 = 'Produtos Solares' 
  AND store_category_3 = 'Protetores Bebé e Criança';

-- Congelados > Peixe should be Peixe Congelado (69), not generic Congelados
UPDATE category_mappings
SET canonical_category_id = 69, updated_at = NOW()
WHERE origin_id = 2 
  AND store_category = 'Alimentação' 
  AND store_category_2 = 'Congelados' 
  AND store_category_3 = 'Peixe';

-- Congelados > Carne should be Carne Congelada (70)
UPDATE category_mappings
SET canonical_category_id = 70, updated_at = NOW()
WHERE origin_id = 2 
  AND store_category = 'Alimentação' 
  AND store_category_2 = 'Congelados' 
  AND store_category_3 = 'Carne';

-- Congelados > Legumes e Frutas should be Legumes Congelados (71)
UPDATE category_mappings
SET canonical_category_id = 71, updated_at = NOW()
WHERE origin_id = 2 
  AND store_category = 'Alimentação' 
  AND store_category_2 = 'Congelados' 
  AND store_category_3 = 'Legumes e Frutas';

-- Congelados > Batatas (frozen) should be Legumes Congelados (71)
UPDATE category_mappings
SET canonical_category_id = 71, updated_at = NOW()
WHERE origin_id = 2 
  AND store_category = 'Alimentação' 
  AND store_category_2 = 'Congelados' 
  AND store_category_3 = 'Batatas';

-- ============================================================================
-- PINGO DOCE FIXES (origin_id: 3)
-- ============================================================================

-- CRITICAL: Chocolates mapped to Choco (cuttlefish) - should be Chocolates e Doces (65)
UPDATE category_mappings
SET canonical_category_id = 65, updated_at = NOW()
WHERE origin_id = 3 
  AND store_category = 'Alternativas Alimentares' 
  AND store_category_2 = 'Chocolates Bolachas E Snacks';

-- Sports nutrition snacks mapped to Dog Snacks - should be Nutrição Desportiva (121)
UPDATE category_mappings
SET canonical_category_id = 121, updated_at = NOW()
WHERE origin_id = 3 
  AND store_category = 'Alternativas Alimentares' 
  AND store_category_2 = 'Nutricao Desportiva' 
  AND store_category_3 = 'Snacks';

-- National cheese mapped to National Beer - should be Queijos (33)
UPDATE category_mappings
SET canonical_category_id = 33, updated_at = NOW()
WHERE origin_id = 3 
  AND store_category = 'Frigorifico' 
  AND store_category_2 = 'Queijo' 
  AND store_category_3 = 'Nacional';

-- Vegetables mapped to Vegetable Spreads (margarine) - should be Legumes (49)
UPDATE category_mappings
SET canonical_category_id = 49, updated_at = NOW()
WHERE origin_id = 3 
  AND store_category = 'Frutas E Vegetais' 
  AND store_category_2 = 'Vegetais';

-- Ervas Aromáticas Frescas mapped to Frutas - should be Ervas Aromáticas (51)
UPDATE category_mappings
SET canonical_category_id = 51, updated_at = NOW()
WHERE origin_id = 3 
  AND store_category = 'Frutas E Vegetais' 
  AND store_category_2 = 'Ervas Aromaticas Frescas';

-- Congelados > Peixe should use specific frozen fish categories
UPDATE category_mappings
SET canonical_category_id = 69, updated_at = NOW()
WHERE origin_id = 3 
  AND store_category = 'Congelados' 
  AND store_category_2 = 'Peixe' 
  AND store_category_3 = 'Peixe';

UPDATE category_mappings
SET canonical_category_id = 69, updated_at = NOW()
WHERE origin_id = 3 
  AND store_category = 'Congelados' 
  AND store_category_2 = 'Peixe' 
  AND store_category_3 = 'Bacalhau';

UPDATE category_mappings
SET canonical_category_id = 69, updated_at = NOW()
WHERE origin_id = 3 
  AND store_category = 'Congelados' 
  AND store_category_2 = 'Peixe' 
  AND store_category_3 = 'Polvo Lulas E Chocos';

UPDATE category_mappings
SET canonical_category_id = 69, updated_at = NOW()
WHERE origin_id = 3 
  AND store_category = 'Congelados' 
  AND store_category_2 = 'Peixe' 
  AND store_category_3 = 'Postas Filetes E Medalhoes';

-- Congelados > Carne should be Carne Congelada (70)
UPDATE category_mappings
SET canonical_category_id = 70, updated_at = NOW()
WHERE origin_id = 3 
  AND store_category = 'Congelados' 
  AND store_category_2 = 'Carne';

-- Congelados > Frutas E Vegetais should use appropriate frozen categories
UPDATE category_mappings
SET canonical_category_id = 71, updated_at = NOW()
WHERE origin_id = 3 
  AND store_category = 'Congelados' 
  AND store_category_2 = 'Frutas E Vegetais' 
  AND store_category_3 = 'Vegetais';

UPDATE category_mappings
SET canonical_category_id = 71, updated_at = NOW()
WHERE origin_id = 3 
  AND store_category = 'Congelados' 
  AND store_category_2 = 'Frutas E Vegetais' 
  AND store_category_3 = 'Frutas E Polpas';

-- Congelados > Refeicoes should use Refeições Congeladas (73)
UPDATE category_mappings
SET canonical_category_id = 73, updated_at = NOW()
WHERE origin_id = 3 
  AND store_category = 'Congelados' 
  AND store_category_2 = 'Refeicoes';

UPDATE category_mappings
SET canonical_category_id = 73, updated_at = NOW()
WHERE origin_id = 3 
  AND store_category = 'Congelados' 
  AND store_category_2 = 'Refeicoes' 
  AND store_category_3 IS NOT NULL;

-- Higiene intima gel mapped to baby wipes - should be Higiene Íntima (92)
UPDATE category_mappings
SET canonical_category_id = 92, updated_at = NOW()
WHERE origin_id = 3 
  AND store_category = 'Higiene Pessoal E Beleza' 
  AND store_category_2 = 'Higiene Intima' 
  AND store_category_3 = 'Gel Intimo E Toalhitas';

-- Papel Higienico mapped to baby wipes - should be Papel Higiénico e Lenços (95)
UPDATE category_mappings
SET canonical_category_id = 95, updated_at = NOW()
WHERE origin_id = 3 
  AND store_category = 'Higiene Pessoal E Beleza' 
  AND store_category_2 = 'Papel Higienico E Toalhitas';

-- ============================================================================
-- CONTINENTE FIXES (origin_id: 1)
-- ============================================================================

-- Men's hygiene products mapped to Roupa e Acessórios > Homem (clothing) - should be Barbear (91)
UPDATE category_mappings
SET canonical_category_id = 91, updated_at = NOW()
WHERE origin_id = 1 
  AND store_category = 'Beleza e Higiene' 
  AND store_category_2 = 'Homem' 
  AND store_category_3 = 'Barba';

UPDATE category_mappings
SET canonical_category_id = 87, updated_at = NOW()
WHERE origin_id = 1 
  AND store_category = 'Beleza e Higiene' 
  AND store_category_2 = 'Homem' 
  AND store_category_3 = 'Cabelo';

UPDATE category_mappings
SET canonical_category_id = 89, updated_at = NOW()
WHERE origin_id = 1 
  AND store_category = 'Beleza e Higiene' 
  AND store_category_2 = 'Homem' 
  AND store_category_3 = 'Depilatórios';

UPDATE category_mappings
SET canonical_category_id = 90, updated_at = NOW()
WHERE origin_id = 1 
  AND store_category = 'Beleza e Higiene' 
  AND store_category_2 = 'Homem' 
  AND store_category_3 = 'Desodorizantes';

UPDATE category_mappings
SET canonical_category_id = 88, updated_at = NOW()
WHERE origin_id = 1 
  AND store_category = 'Beleza e Higiene' 
  AND store_category_2 = 'Homem' 
  AND store_category_3 = 'Rosto';

UPDATE category_mappings
SET canonical_category_id = 124, updated_at = NOW()
WHERE origin_id = 1 
  AND store_category = 'Beleza e Higiene' 
  AND store_category_2 = 'Homem' 
  AND store_category_3 = 'Incontinência';

-- Children's favorite products mapped to clothing - should be Higiene e Beleza (11)
UPDATE category_mappings
SET canonical_category_id = 11, updated_at = NOW()
WHERE origin_id = 1 
  AND store_category = 'Beleza e Higiene' 
  AND store_category_2 = 'Coffrets e Presentes em Beleza' 
  AND store_category_3 = 'Os Favoritos de Criança';

UPDATE category_mappings
SET canonical_category_id = 11, updated_at = NOW()
WHERE origin_id = 1 
  AND store_category = 'Beleza e Higiene' 
  AND store_category_2 = 'Presentes em Beleza' 
  AND store_category_3 = 'Os Favoritos de Criança';

-- Children's sunscreen mapped to clothing - should be Proteção Solar (94)
UPDATE category_mappings
SET canonical_category_id = 94, updated_at = NOW()
WHERE origin_id = 1 
  AND store_category = 'Beleza e Higiene' 
  AND store_category_2 = 'Solares e Bronzeadores' 
  AND store_category_3 = 'Protetores Solares Crianças';

-- ============================================================================
-- Summary
-- ============================================================================
-- This migration fixes approximately 50+ incorrect category mappings that were
-- auto-generated based on word similarity rather than semantic meaning.
-- 
-- Key fixes:
-- - Frozen fish/seafood now correctly maps to "Peixe Congelado" (69) not "Gelados" (72)
-- - Chocolates/snacks no longer map to "Choco" (cuttlefish)
-- - National cheese no longer maps to "Cerveja Nacional"
-- - Hair conditioners no longer map to laundry softeners
-- - World cuisines map to food categories, not kitchen items
-- - Medical products no longer map to alcoholic beverages
-- - Children's hygiene products no longer map to clothing categories
