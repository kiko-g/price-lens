-- Seed Data: Canonical Categories for Portuguese Supermarkets
-- Run this AFTER 001_canonical_categories.sql
-- Designed based on actual store categories from Continente, Auchan, Pingo Doce

-- ============================================================================
-- Level 1: Root Categories (22 total)
-- ============================================================================
INSERT INTO canonical_categories (name, parent_id, level) VALUES
-- Food & Beverages (10)
('Bebidas', NULL, 1),
('Laticínios e Ovos', NULL, 1),
('Carnes e Talho', NULL, 1),
('Peixaria e Marisco', NULL, 1),
('Frutas e Legumes', NULL, 1),
('Padaria e Pastelaria', NULL, 1),
('Mercearia', NULL, 1),
('Congelados', NULL, 1),
('Charcutaria', NULL, 1),
('Refeições Prontas', NULL, 1),
-- Household Essentials (4)
('Higiene e Beleza', NULL, 1),
('Limpeza do Lar', NULL, 1),
('Bebé', NULL, 1),
('Animais', NULL, 1),
-- Health & Wellness (2)
('Bio, Eco e Saudável', NULL, 1),
('Saúde e Parafarmácia', NULL, 1),
-- Non-Food (6)
('Casa e Jardim', NULL, 1),
('Tecnologia e Eletrodomésticos', NULL, 1),
('Brinquedos e Jogos', NULL, 1),
('Papelaria e Livraria', NULL, 1),
('Desporto e Viagem', NULL, 1),
('Roupa e Acessórios', NULL, 1);

-- ============================================================================
-- Level 2: Subcategories
-- ============================================================================

-- 1. Bebidas
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 2 FROM (
  SELECT 'Águas' as name, id FROM canonical_categories WHERE name = 'Bebidas' AND level = 1
  UNION ALL SELECT 'Refrigerantes', id FROM canonical_categories WHERE name = 'Bebidas' AND level = 1
  UNION ALL SELECT 'Sumos e Néctares', id FROM canonical_categories WHERE name = 'Bebidas' AND level = 1
  UNION ALL SELECT 'Cervejas e Sidras', id FROM canonical_categories WHERE name = 'Bebidas' AND level = 1
  UNION ALL SELECT 'Vinhos', id FROM canonical_categories WHERE name = 'Bebidas' AND level = 1
  UNION ALL SELECT 'Bebidas Espirituosas', id FROM canonical_categories WHERE name = 'Bebidas' AND level = 1
  UNION ALL SELECT 'Café e Chá', id FROM canonical_categories WHERE name = 'Bebidas' AND level = 1
  UNION ALL SELECT 'Bebidas Vegetais', id FROM canonical_categories WHERE name = 'Bebidas' AND level = 1
) sub;

-- 2. Laticínios e Ovos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 2 FROM (
  SELECT 'Leite' as name, id FROM canonical_categories WHERE name = 'Laticínios e Ovos' AND level = 1
  UNION ALL SELECT 'Iogurtes', id FROM canonical_categories WHERE name = 'Laticínios e Ovos' AND level = 1
  UNION ALL SELECT 'Queijos', id FROM canonical_categories WHERE name = 'Laticínios e Ovos' AND level = 1
  UNION ALL SELECT 'Manteigas e Cremes', id FROM canonical_categories WHERE name = 'Laticínios e Ovos' AND level = 1
  UNION ALL SELECT 'Natas e Chantilly', id FROM canonical_categories WHERE name = 'Laticínios e Ovos' AND level = 1
  UNION ALL SELECT 'Ovos', id FROM canonical_categories WHERE name = 'Laticínios e Ovos' AND level = 1
  UNION ALL SELECT 'Sobremesas Lácteas', id FROM canonical_categories WHERE name = 'Laticínios e Ovos' AND level = 1
) sub;

-- 3. Carnes e Talho
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 2 FROM (
  SELECT 'Bovino' as name, id FROM canonical_categories WHERE name = 'Carnes e Talho' AND level = 1
  UNION ALL SELECT 'Suíno', id FROM canonical_categories WHERE name = 'Carnes e Talho' AND level = 1
  UNION ALL SELECT 'Aves', id FROM canonical_categories WHERE name = 'Carnes e Talho' AND level = 1
  UNION ALL SELECT 'Borrego e Cabrito', id FROM canonical_categories WHERE name = 'Carnes e Talho' AND level = 1
  UNION ALL SELECT 'Preparados de Carne', id FROM canonical_categories WHERE name = 'Carnes e Talho' AND level = 1
) sub;

-- 4. Peixaria e Marisco
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 2 FROM (
  SELECT 'Peixe Fresco' as name, id FROM canonical_categories WHERE name = 'Peixaria e Marisco' AND level = 1
  UNION ALL SELECT 'Marisco', id FROM canonical_categories WHERE name = 'Peixaria e Marisco' AND level = 1
  UNION ALL SELECT 'Bacalhau', id FROM canonical_categories WHERE name = 'Peixaria e Marisco' AND level = 1
  UNION ALL SELECT 'Peixe Fumado', id FROM canonical_categories WHERE name = 'Peixaria e Marisco' AND level = 1
  UNION ALL SELECT 'Conservas de Peixe', id FROM canonical_categories WHERE name = 'Peixaria e Marisco' AND level = 1
) sub;

-- 5. Frutas e Legumes
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 2 FROM (
  SELECT 'Frutas' as name, id FROM canonical_categories WHERE name = 'Frutas e Legumes' AND level = 1
  UNION ALL SELECT 'Legumes', id FROM canonical_categories WHERE name = 'Frutas e Legumes' AND level = 1
  UNION ALL SELECT 'Saladas e Preparados', id FROM canonical_categories WHERE name = 'Frutas e Legumes' AND level = 1
  UNION ALL SELECT 'Ervas Aromáticas', id FROM canonical_categories WHERE name = 'Frutas e Legumes' AND level = 1
  UNION ALL SELECT 'Frutos Secos e Sementes', id FROM canonical_categories WHERE name = 'Frutas e Legumes' AND level = 1
) sub;

-- 6. Padaria e Pastelaria
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 2 FROM (
  SELECT 'Pão' as name, id FROM canonical_categories WHERE name = 'Padaria e Pastelaria' AND level = 1
  UNION ALL SELECT 'Pastelaria', id FROM canonical_categories WHERE name = 'Padaria e Pastelaria' AND level = 1
  UNION ALL SELECT 'Bolachas e Biscoitos', id FROM canonical_categories WHERE name = 'Padaria e Pastelaria' AND level = 1
  UNION ALL SELECT 'Tostas e Torradas', id FROM canonical_categories WHERE name = 'Padaria e Pastelaria' AND level = 1
) sub;

-- 7. Mercearia
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 2 FROM (
  SELECT 'Arroz e Massa' as name, id FROM canonical_categories WHERE name = 'Mercearia' AND level = 1
  UNION ALL SELECT 'Azeite e Óleos', id FROM canonical_categories WHERE name = 'Mercearia' AND level = 1
  UNION ALL SELECT 'Conservas', id FROM canonical_categories WHERE name = 'Mercearia' AND level = 1
  UNION ALL SELECT 'Molhos e Condimentos', id FROM canonical_categories WHERE name = 'Mercearia' AND level = 1
  UNION ALL SELECT 'Açúcar e Adoçantes', id FROM canonical_categories WHERE name = 'Mercearia' AND level = 1
  UNION ALL SELECT 'Farinhas e Fermentos', id FROM canonical_categories WHERE name = 'Mercearia' AND level = 1
  UNION ALL SELECT 'Cereais e Barras', id FROM canonical_categories WHERE name = 'Mercearia' AND level = 1
  UNION ALL SELECT 'Snacks e Aperitivos', id FROM canonical_categories WHERE name = 'Mercearia' AND level = 1
  UNION ALL SELECT 'Chocolates e Doces', id FROM canonical_categories WHERE name = 'Mercearia' AND level = 1
  UNION ALL SELECT 'Compotas e Mel', id FROM canonical_categories WHERE name = 'Mercearia' AND level = 1
  UNION ALL SELECT 'Temperos e Especiarias', id FROM canonical_categories WHERE name = 'Mercearia' AND level = 1
  UNION ALL SELECT 'Leguminosas Secas', id FROM canonical_categories WHERE name = 'Mercearia' AND level = 1
) sub;

-- 8. Congelados
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 2 FROM (
  SELECT 'Peixe Congelado' as name, id FROM canonical_categories WHERE name = 'Congelados' AND level = 1
  UNION ALL SELECT 'Carne Congelada', id FROM canonical_categories WHERE name = 'Congelados' AND level = 1
  UNION ALL SELECT 'Legumes Congelados', id FROM canonical_categories WHERE name = 'Congelados' AND level = 1
  UNION ALL SELECT 'Gelados', id FROM canonical_categories WHERE name = 'Congelados' AND level = 1
  UNION ALL SELECT 'Refeições Congeladas', id FROM canonical_categories WHERE name = 'Congelados' AND level = 1
  UNION ALL SELECT 'Salgados e Pastelaria Congelada', id FROM canonical_categories WHERE name = 'Congelados' AND level = 1
) sub;

-- 9. Charcutaria
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 2 FROM (
  SELECT 'Fiambre e Mortadela' as name, id FROM canonical_categories WHERE name = 'Charcutaria' AND level = 1
  UNION ALL SELECT 'Presunto e Paleta', id FROM canonical_categories WHERE name = 'Charcutaria' AND level = 1
  UNION ALL SELECT 'Bacon e Fumados', id FROM canonical_categories WHERE name = 'Charcutaria' AND level = 1
  UNION ALL SELECT 'Salpicão e Paio', id FROM canonical_categories WHERE name = 'Charcutaria' AND level = 1
  UNION ALL SELECT 'Chouriços e Alheiras', id FROM canonical_categories WHERE name = 'Charcutaria' AND level = 1
) sub;

-- 10. Refeições Prontas
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 2 FROM (
  SELECT 'Take Away' as name, id FROM canonical_categories WHERE name = 'Refeições Prontas' AND level = 1
  UNION ALL SELECT 'Sandes e Wraps', id FROM canonical_categories WHERE name = 'Refeições Prontas' AND level = 1
  UNION ALL SELECT 'Sopas Prontas', id FROM canonical_categories WHERE name = 'Refeições Prontas' AND level = 1
  UNION ALL SELECT 'Saladas Prontas', id FROM canonical_categories WHERE name = 'Refeições Prontas' AND level = 1
  UNION ALL SELECT 'Pizzas Refrigeradas', id FROM canonical_categories WHERE name = 'Refeições Prontas' AND level = 1
) sub;

-- 11. Higiene e Beleza
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 2 FROM (
  SELECT 'Higiene Oral' as name, id FROM canonical_categories WHERE name = 'Higiene e Beleza' AND level = 1
  UNION ALL SELECT 'Higiene Corporal', id FROM canonical_categories WHERE name = 'Higiene e Beleza' AND level = 1
  UNION ALL SELECT 'Cabelo', id FROM canonical_categories WHERE name = 'Higiene e Beleza' AND level = 1
  UNION ALL SELECT 'Rosto', id FROM canonical_categories WHERE name = 'Higiene e Beleza' AND level = 1
  UNION ALL SELECT 'Corpo', id FROM canonical_categories WHERE name = 'Higiene e Beleza' AND level = 1
  UNION ALL SELECT 'Desodorizantes', id FROM canonical_categories WHERE name = 'Higiene e Beleza' AND level = 1
  UNION ALL SELECT 'Barbear', id FROM canonical_categories WHERE name = 'Higiene e Beleza' AND level = 1
  UNION ALL SELECT 'Higiene Íntima', id FROM canonical_categories WHERE name = 'Higiene e Beleza' AND level = 1
  UNION ALL SELECT 'Maquilhagem', id FROM canonical_categories WHERE name = 'Higiene e Beleza' AND level = 1
  UNION ALL SELECT 'Proteção Solar', id FROM canonical_categories WHERE name = 'Higiene e Beleza' AND level = 1
  UNION ALL SELECT 'Papel Higiénico e Lenços', id FROM canonical_categories WHERE name = 'Higiene e Beleza' AND level = 1
) sub;

-- 12. Limpeza do Lar
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 2 FROM (
  SELECT 'Detergentes Roupa' as name, id FROM canonical_categories WHERE name = 'Limpeza do Lar' AND level = 1
  UNION ALL SELECT 'Detergentes Loiça', id FROM canonical_categories WHERE name = 'Limpeza do Lar' AND level = 1
  UNION ALL SELECT 'Limpeza Multiusos', id FROM canonical_categories WHERE name = 'Limpeza do Lar' AND level = 1
  UNION ALL SELECT 'Limpeza WC', id FROM canonical_categories WHERE name = 'Limpeza do Lar' AND level = 1
  UNION ALL SELECT 'Limpeza Cozinha', id FROM canonical_categories WHERE name = 'Limpeza do Lar' AND level = 1
  UNION ALL SELECT 'Papel de Cozinha', id FROM canonical_categories WHERE name = 'Limpeza do Lar' AND level = 1
  UNION ALL SELECT 'Sacos do Lixo', id FROM canonical_categories WHERE name = 'Limpeza do Lar' AND level = 1
  UNION ALL SELECT 'Ambientadores', id FROM canonical_categories WHERE name = 'Limpeza do Lar' AND level = 1
  UNION ALL SELECT 'Inseticidas e Desumidificadores', id FROM canonical_categories WHERE name = 'Limpeza do Lar' AND level = 1
  UNION ALL SELECT 'Utensílios de Limpeza', id FROM canonical_categories WHERE name = 'Limpeza do Lar' AND level = 1
) sub;

-- 13. Bebé
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 2 FROM (
  SELECT 'Fraldas e Toalhitas' as name, id FROM canonical_categories WHERE name = 'Bebé' AND level = 1
  UNION ALL SELECT 'Alimentação Bebé', id FROM canonical_categories WHERE name = 'Bebé' AND level = 1
  UNION ALL SELECT 'Higiene Bebé', id FROM canonical_categories WHERE name = 'Bebé' AND level = 1
  UNION ALL SELECT 'Leites Infantis', id FROM canonical_categories WHERE name = 'Bebé' AND level = 1
  UNION ALL SELECT 'Acessórios Bebé', id FROM canonical_categories WHERE name = 'Bebé' AND level = 1
  UNION ALL SELECT 'Passeio e Viagem', id FROM canonical_categories WHERE name = 'Bebé' AND level = 1
  UNION ALL SELECT 'Quarto do Bebé', id FROM canonical_categories WHERE name = 'Bebé' AND level = 1
  UNION ALL SELECT 'Maternidade', id FROM canonical_categories WHERE name = 'Bebé' AND level = 1
) sub;

-- 14. Animais
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 2 FROM (
  SELECT 'Cão' as name, id FROM canonical_categories WHERE name = 'Animais' AND level = 1
  UNION ALL SELECT 'Gato', id FROM canonical_categories WHERE name = 'Animais' AND level = 1
  UNION ALL SELECT 'Outros Animais', id FROM canonical_categories WHERE name = 'Animais' AND level = 1
) sub;

-- 15. Bio, Eco e Saudável
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 2 FROM (
  SELECT 'Produtos Biológicos' as name, id FROM canonical_categories WHERE name = 'Bio, Eco e Saudável' AND level = 1
  UNION ALL SELECT 'Sem Glúten', id FROM canonical_categories WHERE name = 'Bio, Eco e Saudável' AND level = 1
  UNION ALL SELECT 'Sem Lactose', id FROM canonical_categories WHERE name = 'Bio, Eco e Saudável' AND level = 1
  UNION ALL SELECT 'Vegan e Vegetariano', id FROM canonical_categories WHERE name = 'Bio, Eco e Saudável' AND level = 1
  UNION ALL SELECT 'Nutrição Desportiva', id FROM canonical_categories WHERE name = 'Bio, Eco e Saudável' AND level = 1
) sub;

-- 16. Saúde e Parafarmácia
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 2 FROM (
  SELECT 'Suplementos e Vitaminas' as name, id FROM canonical_categories WHERE name = 'Saúde e Parafarmácia' AND level = 1
  UNION ALL SELECT 'Primeiros Socorros', id FROM canonical_categories WHERE name = 'Saúde e Parafarmácia' AND level = 1
  UNION ALL SELECT 'Incontinência', id FROM canonical_categories WHERE name = 'Saúde e Parafarmácia' AND level = 1
  UNION ALL SELECT 'Dermocosmética', id FROM canonical_categories WHERE name = 'Saúde e Parafarmácia' AND level = 1
  UNION ALL SELECT 'Medicamentos OTC', id FROM canonical_categories WHERE name = 'Saúde e Parafarmácia' AND level = 1
) sub;

-- 17. Casa e Jardim
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 2 FROM (
  SELECT 'Cozinha' as name, id FROM canonical_categories WHERE name = 'Casa e Jardim' AND level = 1
  UNION ALL SELECT 'Decoração', id FROM canonical_categories WHERE name = 'Casa e Jardim' AND level = 1
  UNION ALL SELECT 'Jardim', id FROM canonical_categories WHERE name = 'Casa e Jardim' AND level = 1
  UNION ALL SELECT 'Arrumação', id FROM canonical_categories WHERE name = 'Casa e Jardim' AND level = 1
  UNION ALL SELECT 'Têxtil Lar', id FROM canonical_categories WHERE name = 'Casa e Jardim' AND level = 1
  UNION ALL SELECT 'Bricolage', id FROM canonical_categories WHERE name = 'Casa e Jardim' AND level = 1
  UNION ALL SELECT 'Automóvel', id FROM canonical_categories WHERE name = 'Casa e Jardim' AND level = 1
) sub;

-- 18. Tecnologia e Eletrodomésticos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 2 FROM (
  SELECT 'Pequenos Eletrodomésticos' as name, id FROM canonical_categories WHERE name = 'Tecnologia e Eletrodomésticos' AND level = 1
  UNION ALL SELECT 'Grandes Eletrodomésticos', id FROM canonical_categories WHERE name = 'Tecnologia e Eletrodomésticos' AND level = 1
  UNION ALL SELECT 'Informática', id FROM canonical_categories WHERE name = 'Tecnologia e Eletrodomésticos' AND level = 1
  UNION ALL SELECT 'Telemóveis', id FROM canonical_categories WHERE name = 'Tecnologia e Eletrodomésticos' AND level = 1
  UNION ALL SELECT 'TV e Som', id FROM canonical_categories WHERE name = 'Tecnologia e Eletrodomésticos' AND level = 1
) sub;

-- 19. Brinquedos e Jogos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 2 FROM (
  SELECT 'Brinquedos Bebé' as name, id FROM canonical_categories WHERE name = 'Brinquedos e Jogos' AND level = 1
  UNION ALL SELECT 'Construções', id FROM canonical_categories WHERE name = 'Brinquedos e Jogos' AND level = 1
  UNION ALL SELECT 'Jogos de Tabuleiro', id FROM canonical_categories WHERE name = 'Brinquedos e Jogos' AND level = 1
  UNION ALL SELECT 'Puzzles', id FROM canonical_categories WHERE name = 'Brinquedos e Jogos' AND level = 1
  UNION ALL SELECT 'Bonecas e Peluches', id FROM canonical_categories WHERE name = 'Brinquedos e Jogos' AND level = 1
  UNION ALL SELECT 'Veículos e Pistas', id FROM canonical_categories WHERE name = 'Brinquedos e Jogos' AND level = 1
  UNION ALL SELECT 'Exterior e Ar Livre', id FROM canonical_categories WHERE name = 'Brinquedos e Jogos' AND level = 1
  UNION ALL SELECT 'Videojogos', id FROM canonical_categories WHERE name = 'Brinquedos e Jogos' AND level = 1
) sub;

-- 20. Papelaria e Livraria
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 2 FROM (
  SELECT 'Livros' as name, id FROM canonical_categories WHERE name = 'Papelaria e Livraria' AND level = 1
  UNION ALL SELECT 'Papelaria', id FROM canonical_categories WHERE name = 'Papelaria e Livraria' AND level = 1
  UNION ALL SELECT 'Escrita e Material Escolar', id FROM canonical_categories WHERE name = 'Papelaria e Livraria' AND level = 1
  UNION ALL SELECT 'Embrulhos e Presentes', id FROM canonical_categories WHERE name = 'Papelaria e Livraria' AND level = 1
) sub;

-- 21. Desporto e Viagem
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 2 FROM (
  SELECT 'Desporto' as name, id FROM canonical_categories WHERE name = 'Desporto e Viagem' AND level = 1
  UNION ALL SELECT 'Campismo', id FROM canonical_categories WHERE name = 'Desporto e Viagem' AND level = 1
  UNION ALL SELECT 'Malas e Trolleys', id FROM canonical_categories WHERE name = 'Desporto e Viagem' AND level = 1
  UNION ALL SELECT 'Bicicletas e Trotinetes', id FROM canonical_categories WHERE name = 'Desporto e Viagem' AND level = 1
) sub;

-- 22. Roupa e Acessórios
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 2 FROM (
  SELECT 'Homem' as name, id FROM canonical_categories WHERE name = 'Roupa e Acessórios' AND level = 1
  UNION ALL SELECT 'Mulher', id FROM canonical_categories WHERE name = 'Roupa e Acessórios' AND level = 1
  UNION ALL SELECT 'Criança', id FROM canonical_categories WHERE name = 'Roupa e Acessórios' AND level = 1
  UNION ALL SELECT 'Calçado', id FROM canonical_categories WHERE name = 'Roupa e Acessórios' AND level = 1
) sub;

-- ============================================================================
-- Level 3: Sub-subcategories (Focus on Food, Beverages, Household)
-- ============================================================================

-- Águas > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Água com Gás' as name, id FROM canonical_categories WHERE name = 'Águas' AND level = 2
  UNION ALL SELECT 'Água sem Gás', id FROM canonical_categories WHERE name = 'Águas' AND level = 2
  UNION ALL SELECT 'Água com Sabor', id FROM canonical_categories WHERE name = 'Águas' AND level = 2
  UNION ALL SELECT 'Água Tónica', id FROM canonical_categories WHERE name = 'Águas' AND level = 2
) sub;

-- Refrigerantes > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Com Gás' as name, id FROM canonical_categories WHERE name = 'Refrigerantes' AND level = 2
  UNION ALL SELECT 'Sem Gás', id FROM canonical_categories WHERE name = 'Refrigerantes' AND level = 2
  UNION ALL SELECT 'Energéticas', id FROM canonical_categories WHERE name = 'Refrigerantes' AND level = 2
  UNION ALL SELECT 'Isotónicas', id FROM canonical_categories WHERE name = 'Refrigerantes' AND level = 2
  UNION ALL SELECT 'Ice Tea', id FROM canonical_categories WHERE name = 'Refrigerantes' AND level = 2
) sub;

-- Sumos e Néctares > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Sumos de Fruta' as name, id FROM canonical_categories WHERE name = 'Sumos e Néctares' AND level = 2
  UNION ALL SELECT 'Concentrados', id FROM canonical_categories WHERE name = 'Sumos e Néctares' AND level = 2
  UNION ALL SELECT 'Refrigerados', id FROM canonical_categories WHERE name = 'Sumos e Néctares' AND level = 2
) sub;

-- Cervejas e Sidras > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Cerveja Nacional' as name, id FROM canonical_categories WHERE name = 'Cervejas e Sidras' AND level = 2
  UNION ALL SELECT 'Cerveja Estrangeira', id FROM canonical_categories WHERE name = 'Cervejas e Sidras' AND level = 2
  UNION ALL SELECT 'Cerveja sem Álcool', id FROM canonical_categories WHERE name = 'Cervejas e Sidras' AND level = 2
  UNION ALL SELECT 'Sidras', id FROM canonical_categories WHERE name = 'Cervejas e Sidras' AND level = 2
) sub;

-- Vinhos > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Vinho Tinto' as name, id FROM canonical_categories WHERE name = 'Vinhos' AND level = 2
  UNION ALL SELECT 'Vinho Branco', id FROM canonical_categories WHERE name = 'Vinhos' AND level = 2
  UNION ALL SELECT 'Vinho Rosé', id FROM canonical_categories WHERE name = 'Vinhos' AND level = 2
  UNION ALL SELECT 'Vinho Verde', id FROM canonical_categories WHERE name = 'Vinhos' AND level = 2
  UNION ALL SELECT 'Espumante e Champanhe', id FROM canonical_categories WHERE name = 'Vinhos' AND level = 2
  UNION ALL SELECT 'Porto e Moscatel', id FROM canonical_categories WHERE name = 'Vinhos' AND level = 2
  UNION ALL SELECT 'Sangria e Aromatizados', id FROM canonical_categories WHERE name = 'Vinhos' AND level = 2
) sub;

-- Bebidas Espirituosas > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Whisky' as name, id FROM canonical_categories WHERE name = 'Bebidas Espirituosas' AND level = 2
  UNION ALL SELECT 'Gin', id FROM canonical_categories WHERE name = 'Bebidas Espirituosas' AND level = 2
  UNION ALL SELECT 'Vodka', id FROM canonical_categories WHERE name = 'Bebidas Espirituosas' AND level = 2
  UNION ALL SELECT 'Rum', id FROM canonical_categories WHERE name = 'Bebidas Espirituosas' AND level = 2
  UNION ALL SELECT 'Licores', id FROM canonical_categories WHERE name = 'Bebidas Espirituosas' AND level = 2
  UNION ALL SELECT 'Aguardente', id FROM canonical_categories WHERE name = 'Bebidas Espirituosas' AND level = 2
  UNION ALL SELECT 'Tequila', id FROM canonical_categories WHERE name = 'Bebidas Espirituosas' AND level = 2
) sub;

-- Café e Chá > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Café Torrado' as name, id FROM canonical_categories WHERE name = 'Café e Chá' AND level = 2
  UNION ALL SELECT 'Café em Cápsulas', id FROM canonical_categories WHERE name = 'Café e Chá' AND level = 2
  UNION ALL SELECT 'Café Solúvel', id FROM canonical_categories WHERE name = 'Café e Chá' AND level = 2
  UNION ALL SELECT 'Chás e Infusões', id FROM canonical_categories WHERE name = 'Café e Chá' AND level = 2
  UNION ALL SELECT 'Bebidas de Cereais', id FROM canonical_categories WHERE name = 'Café e Chá' AND level = 2
) sub;

-- Bebidas Vegetais > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Bebida de Amêndoa' as name, id FROM canonical_categories WHERE name = 'Bebidas Vegetais' AND level = 2
  UNION ALL SELECT 'Bebida de Aveia', id FROM canonical_categories WHERE name = 'Bebidas Vegetais' AND level = 2
  UNION ALL SELECT 'Bebida de Arroz', id FROM canonical_categories WHERE name = 'Bebidas Vegetais' AND level = 2
  UNION ALL SELECT 'Bebida de Soja', id FROM canonical_categories WHERE name = 'Bebidas Vegetais' AND level = 2
  UNION ALL SELECT 'Bebida de Coco', id FROM canonical_categories WHERE name = 'Bebidas Vegetais' AND level = 2
) sub;

-- Leite > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Leite Gordo' as name, id FROM canonical_categories WHERE name = 'Leite' AND level = 2
  UNION ALL SELECT 'Leite Meio-Gordo', id FROM canonical_categories WHERE name = 'Leite' AND level = 2
  UNION ALL SELECT 'Leite Magro', id FROM canonical_categories WHERE name = 'Leite' AND level = 2
  UNION ALL SELECT 'Leite sem Lactose', id FROM canonical_categories WHERE name = 'Leite' AND level = 2
  UNION ALL SELECT 'Leite com Sabor', id FROM canonical_categories WHERE name = 'Leite' AND level = 2
) sub;

-- Iogurtes > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Iogurtes Naturais' as name, id FROM canonical_categories WHERE name = 'Iogurtes' AND level = 2
  UNION ALL SELECT 'Iogurtes com Aromas', id FROM canonical_categories WHERE name = 'Iogurtes' AND level = 2
  UNION ALL SELECT 'Iogurtes Gregos', id FROM canonical_categories WHERE name = 'Iogurtes' AND level = 2
  UNION ALL SELECT 'Iogurtes Líquidos', id FROM canonical_categories WHERE name = 'Iogurtes' AND level = 2
  UNION ALL SELECT 'Iogurtes Magros', id FROM canonical_categories WHERE name = 'Iogurtes' AND level = 2
  UNION ALL SELECT 'Iogurtes Proteína', id FROM canonical_categories WHERE name = 'Iogurtes' AND level = 2
  UNION ALL SELECT 'Iogurtes Infantis', id FROM canonical_categories WHERE name = 'Iogurtes' AND level = 2
  UNION ALL SELECT 'Iogurtes sem Lactose', id FROM canonical_categories WHERE name = 'Iogurtes' AND level = 2
) sub;

-- Queijos > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Queijo Fresco' as name, id FROM canonical_categories WHERE name = 'Queijos' AND level = 2
  UNION ALL SELECT 'Queijo Curado', id FROM canonical_categories WHERE name = 'Queijos' AND level = 2
  UNION ALL SELECT 'Queijo Fatiado', id FROM canonical_categories WHERE name = 'Queijos' AND level = 2
  UNION ALL SELECT 'Queijo Ralado', id FROM canonical_categories WHERE name = 'Queijos' AND level = 2
  UNION ALL SELECT 'Queijo para Barrar', id FROM canonical_categories WHERE name = 'Queijos' AND level = 2
  UNION ALL SELECT 'Queijos Estrangeiros', id FROM canonical_categories WHERE name = 'Queijos' AND level = 2
  UNION ALL SELECT 'Queijo sem Lactose', id FROM canonical_categories WHERE name = 'Queijos' AND level = 2
) sub;

-- Manteigas e Cremes > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Manteiga' as name, id FROM canonical_categories WHERE name = 'Manteigas e Cremes' AND level = 2
  UNION ALL SELECT 'Margarina', id FROM canonical_categories WHERE name = 'Manteigas e Cremes' AND level = 2
  UNION ALL SELECT 'Cremes Vegetais', id FROM canonical_categories WHERE name = 'Manteigas e Cremes' AND level = 2
) sub;

-- Sobremesas Lácteas > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Pudins' as name, id FROM canonical_categories WHERE name = 'Sobremesas Lácteas' AND level = 2
  UNION ALL SELECT 'Mousses', id FROM canonical_categories WHERE name = 'Sobremesas Lácteas' AND level = 2
  UNION ALL SELECT 'Gelatinas', id FROM canonical_categories WHERE name = 'Sobremesas Lácteas' AND level = 2
) sub;

-- Bovino > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Novilho' as name, id FROM canonical_categories WHERE name = 'Bovino' AND level = 2
  UNION ALL SELECT 'Vitela', id FROM canonical_categories WHERE name = 'Bovino' AND level = 2
  UNION ALL SELECT 'Vitelão', id FROM canonical_categories WHERE name = 'Bovino' AND level = 2
) sub;

-- Aves > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Frango' as name, id FROM canonical_categories WHERE name = 'Aves' AND level = 2
  UNION ALL SELECT 'Peru', id FROM canonical_categories WHERE name = 'Aves' AND level = 2
  UNION ALL SELECT 'Pato', id FROM canonical_categories WHERE name = 'Aves' AND level = 2
) sub;

-- Preparados de Carne > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Hambúrgueres' as name, id FROM canonical_categories WHERE name = 'Preparados de Carne' AND level = 2
  UNION ALL SELECT 'Almôndegas', id FROM canonical_categories WHERE name = 'Preparados de Carne' AND level = 2
  UNION ALL SELECT 'Salsichas Frescas', id FROM canonical_categories WHERE name = 'Preparados de Carne' AND level = 2
) sub;

-- Peixe Fresco > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Filetes e Lombos' as name, id FROM canonical_categories WHERE name = 'Peixe Fresco' AND level = 2
  UNION ALL SELECT 'Postas', id FROM canonical_categories WHERE name = 'Peixe Fresco' AND level = 2
  UNION ALL SELECT 'Peixe Inteiro', id FROM canonical_categories WHERE name = 'Peixe Fresco' AND level = 2
) sub;

-- Marisco > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Camarão' as name, id FROM canonical_categories WHERE name = 'Marisco' AND level = 2
  UNION ALL SELECT 'Amêijoas e Mexilhão', id FROM canonical_categories WHERE name = 'Marisco' AND level = 2
  UNION ALL SELECT 'Polvo e Lulas', id FROM canonical_categories WHERE name = 'Marisco' AND level = 2
  UNION ALL SELECT 'Choco', id FROM canonical_categories WHERE name = 'Marisco' AND level = 2
) sub;

-- Frutas > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Maçãs e Peras' as name, id FROM canonical_categories WHERE name = 'Frutas' AND level = 2
  UNION ALL SELECT 'Citrinos', id FROM canonical_categories WHERE name = 'Frutas' AND level = 2
  UNION ALL SELECT 'Tropicais', id FROM canonical_categories WHERE name = 'Frutas' AND level = 2
  UNION ALL SELECT 'Frutos Vermelhos', id FROM canonical_categories WHERE name = 'Frutas' AND level = 2
  UNION ALL SELECT 'Melão e Melancia', id FROM canonical_categories WHERE name = 'Frutas' AND level = 2
  UNION ALL SELECT 'Uvas', id FROM canonical_categories WHERE name = 'Frutas' AND level = 2
) sub;

-- Legumes > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Batatas' as name, id FROM canonical_categories WHERE name = 'Legumes' AND level = 2
  UNION ALL SELECT 'Cenouras e Abóbora', id FROM canonical_categories WHERE name = 'Legumes' AND level = 2
  UNION ALL SELECT 'Cebolas e Alho', id FROM canonical_categories WHERE name = 'Legumes' AND level = 2
  UNION ALL SELECT 'Tomates', id FROM canonical_categories WHERE name = 'Legumes' AND level = 2
  UNION ALL SELECT 'Couves e Brócolos', id FROM canonical_categories WHERE name = 'Legumes' AND level = 2
  UNION ALL SELECT 'Cogumelos', id FROM canonical_categories WHERE name = 'Legumes' AND level = 2
  UNION ALL SELECT 'Alface e Folhas', id FROM canonical_categories WHERE name = 'Legumes' AND level = 2
) sub;

-- Pão > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Pão do Dia' as name, id FROM canonical_categories WHERE name = 'Pão' AND level = 2
  UNION ALL SELECT 'Pão de Forma', id FROM canonical_categories WHERE name = 'Pão' AND level = 2
  UNION ALL SELECT 'Broa', id FROM canonical_categories WHERE name = 'Pão' AND level = 2
  UNION ALL SELECT 'Pão Embalado', id FROM canonical_categories WHERE name = 'Pão' AND level = 2
) sub;

-- Pastelaria > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Bolos' as name, id FROM canonical_categories WHERE name = 'Pastelaria' AND level = 2
  UNION ALL SELECT 'Pastelaria Tradicional', id FROM canonical_categories WHERE name = 'Pastelaria' AND level = 2
  UNION ALL SELECT 'Sobremesas', id FROM canonical_categories WHERE name = 'Pastelaria' AND level = 2
  UNION ALL SELECT 'Bolos de Aniversário', id FROM canonical_categories WHERE name = 'Pastelaria' AND level = 2
) sub;

-- Bolachas e Biscoitos > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Bolachas Maria e Torrada' as name, id FROM canonical_categories WHERE name = 'Bolachas e Biscoitos' AND level = 2
  UNION ALL SELECT 'Bolachas Recheadas', id FROM canonical_categories WHERE name = 'Bolachas e Biscoitos' AND level = 2
  UNION ALL SELECT 'Bolachas Integrais', id FROM canonical_categories WHERE name = 'Bolachas e Biscoitos' AND level = 2
  UNION ALL SELECT 'Bolachas Infantis', id FROM canonical_categories WHERE name = 'Bolachas e Biscoitos' AND level = 2
  UNION ALL SELECT 'Biscoitos', id FROM canonical_categories WHERE name = 'Bolachas e Biscoitos' AND level = 2
) sub;

-- Arroz e Massa > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Arroz' as name, id FROM canonical_categories WHERE name = 'Arroz e Massa' AND level = 2
  UNION ALL SELECT 'Massa', id FROM canonical_categories WHERE name = 'Arroz e Massa' AND level = 2
  UNION ALL SELECT 'Noodles', id FROM canonical_categories WHERE name = 'Arroz e Massa' AND level = 2
  UNION ALL SELECT 'Couscous', id FROM canonical_categories WHERE name = 'Arroz e Massa' AND level = 2
) sub;

-- Azeite e Óleos > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Azeite' as name, id FROM canonical_categories WHERE name = 'Azeite e Óleos' AND level = 2
  UNION ALL SELECT 'Óleo Alimentar', id FROM canonical_categories WHERE name = 'Azeite e Óleos' AND level = 2
  UNION ALL SELECT 'Vinagre', id FROM canonical_categories WHERE name = 'Azeite e Óleos' AND level = 2
) sub;

-- Conservas > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Conservas de Legumes' as name, id FROM canonical_categories WHERE name = 'Conservas' AND level = 2
  UNION ALL SELECT 'Feijão e Grão', id FROM canonical_categories WHERE name = 'Conservas' AND level = 2
  UNION ALL SELECT 'Fruta em Calda', id FROM canonical_categories WHERE name = 'Conservas' AND level = 2
  UNION ALL SELECT 'Patés e Pastas', id FROM canonical_categories WHERE name = 'Conservas' AND level = 2
  UNION ALL SELECT 'Azeitonas e Pickles', id FROM canonical_categories WHERE name = 'Conservas' AND level = 2
) sub;

-- Molhos e Condimentos > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Ketchup e Mostarda' as name, id FROM canonical_categories WHERE name = 'Molhos e Condimentos' AND level = 2
  UNION ALL SELECT 'Maionese', id FROM canonical_categories WHERE name = 'Molhos e Condimentos' AND level = 2
  UNION ALL SELECT 'Molhos de Culinária', id FROM canonical_categories WHERE name = 'Molhos e Condimentos' AND level = 2
  UNION ALL SELECT 'Caldos e Temperos', id FROM canonical_categories WHERE name = 'Molhos e Condimentos' AND level = 2
) sub;

-- Cereais e Barras > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Cereais Pequeno-Almoço' as name, id FROM canonical_categories WHERE name = 'Cereais e Barras' AND level = 2
  UNION ALL SELECT 'Granola e Muesli', id FROM canonical_categories WHERE name = 'Cereais e Barras' AND level = 2
  UNION ALL SELECT 'Barras de Cereais', id FROM canonical_categories WHERE name = 'Cereais e Barras' AND level = 2
  UNION ALL SELECT 'Aveia e Flocos', id FROM canonical_categories WHERE name = 'Cereais e Barras' AND level = 2
) sub;

-- Snacks e Aperitivos > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Batatas Fritas' as name, id FROM canonical_categories WHERE name = 'Snacks e Aperitivos' AND level = 2
  UNION ALL SELECT 'Pipocas', id FROM canonical_categories WHERE name = 'Snacks e Aperitivos' AND level = 2
  UNION ALL SELECT 'Frutos Secos Snack', id FROM canonical_categories WHERE name = 'Snacks e Aperitivos' AND level = 2
  UNION ALL SELECT 'Tostas e Crackers', id FROM canonical_categories WHERE name = 'Snacks e Aperitivos' AND level = 2
) sub;

-- Chocolates e Doces > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Chocolates' as name, id FROM canonical_categories WHERE name = 'Chocolates e Doces' AND level = 2
  UNION ALL SELECT 'Gomas' , id FROM canonical_categories WHERE name = 'Chocolates e Doces' AND level = 2
  UNION ALL SELECT 'Rebuçados', id FROM canonical_categories WHERE name = 'Chocolates e Doces' AND level = 2
  UNION ALL SELECT 'Bombons', id FROM canonical_categories WHERE name = 'Chocolates e Doces' AND level = 2
) sub;

-- Gelados > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Cones e Paus' as name, id FROM canonical_categories WHERE name = 'Gelados' AND level = 2
  UNION ALL SELECT 'Potes e Taças', id FROM canonical_categories WHERE name = 'Gelados' AND level = 2
  UNION ALL SELECT 'Gelados de Água', id FROM canonical_categories WHERE name = 'Gelados' AND level = 2
  UNION ALL SELECT 'Tartes Geladas', id FROM canonical_categories WHERE name = 'Gelados' AND level = 2
) sub;

-- Refeições Congeladas > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Pizzas' as name, id FROM canonical_categories WHERE name = 'Refeições Congeladas' AND level = 2
  UNION ALL SELECT 'Lasanhas', id FROM canonical_categories WHERE name = 'Refeições Congeladas' AND level = 2
  UNION ALL SELECT 'Pratos Prontos', id FROM canonical_categories WHERE name = 'Refeições Congeladas' AND level = 2
  UNION ALL SELECT 'Nuggets e Panados', id FROM canonical_categories WHERE name = 'Refeições Congeladas' AND level = 2
) sub;

-- Higiene Oral > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Pastas de Dentes' as name, id FROM canonical_categories WHERE name = 'Higiene Oral' AND level = 2
  UNION ALL SELECT 'Escovas de Dentes', id FROM canonical_categories WHERE name = 'Higiene Oral' AND level = 2
  UNION ALL SELECT 'Elixir Bucal', id FROM canonical_categories WHERE name = 'Higiene Oral' AND level = 2
  UNION ALL SELECT 'Fio Dentário', id FROM canonical_categories WHERE name = 'Higiene Oral' AND level = 2
) sub;

-- Higiene Corporal > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Gel de Banho' as name, id FROM canonical_categories WHERE name = 'Higiene Corporal' AND level = 2
  UNION ALL SELECT 'Sabonetes', id FROM canonical_categories WHERE name = 'Higiene Corporal' AND level = 2
  UNION ALL SELECT 'Esponjas e Acessórios', id FROM canonical_categories WHERE name = 'Higiene Corporal' AND level = 2
) sub;

-- Cabelo > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Champô' as name, id FROM canonical_categories WHERE name = 'Cabelo' AND level = 2
  UNION ALL SELECT 'Condicionador', id FROM canonical_categories WHERE name = 'Cabelo' AND level = 2
  UNION ALL SELECT 'Coloração', id FROM canonical_categories WHERE name = 'Cabelo' AND level = 2
  UNION ALL SELECT 'Styling', id FROM canonical_categories WHERE name = 'Cabelo' AND level = 2
  UNION ALL SELECT 'Tratamentos', id FROM canonical_categories WHERE name = 'Cabelo' AND level = 2
) sub;

-- Higiene Íntima > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Pensos Higiénicos' as name, id FROM canonical_categories WHERE name = 'Higiene Íntima' AND level = 2
  UNION ALL SELECT 'Tampões', id FROM canonical_categories WHERE name = 'Higiene Íntima' AND level = 2
  UNION ALL SELECT 'Pensos Diários', id FROM canonical_categories WHERE name = 'Higiene Íntima' AND level = 2
  UNION ALL SELECT 'Gel Íntimo', id FROM canonical_categories WHERE name = 'Higiene Íntima' AND level = 2
) sub;

-- Detergentes Roupa > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Detergente Máquina' as name, id FROM canonical_categories WHERE name = 'Detergentes Roupa' AND level = 2
  UNION ALL SELECT 'Detergente Manual', id FROM canonical_categories WHERE name = 'Detergentes Roupa' AND level = 2
  UNION ALL SELECT 'Amaciadores', id FROM canonical_categories WHERE name = 'Detergentes Roupa' AND level = 2
  UNION ALL SELECT 'Tira-Nódoas', id FROM canonical_categories WHERE name = 'Detergentes Roupa' AND level = 2
) sub;

-- Detergentes Loiça > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Detergente Máquina Loiça' as name, id FROM canonical_categories WHERE name = 'Detergentes Loiça' AND level = 2
  UNION ALL SELECT 'Detergente Manual Loiça', id FROM canonical_categories WHERE name = 'Detergentes Loiça' AND level = 2
  UNION ALL SELECT 'Aditivos Máquina', id FROM canonical_categories WHERE name = 'Detergentes Loiça' AND level = 2
) sub;

-- Ambientadores > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Ambientadores Spray' as name, id FROM canonical_categories WHERE name = 'Ambientadores' AND level = 2
  UNION ALL SELECT 'Ambientadores Elétricos', id FROM canonical_categories WHERE name = 'Ambientadores' AND level = 2
  UNION ALL SELECT 'Velas Perfumadas', id FROM canonical_categories WHERE name = 'Ambientadores' AND level = 2
  UNION ALL SELECT 'Absorve Odores', id FROM canonical_categories WHERE name = 'Ambientadores' AND level = 2
) sub;

-- Fraldas e Toalhitas > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Fraldas T1 e T2' as name, id FROM canonical_categories WHERE name = 'Fraldas e Toalhitas' AND level = 2
  UNION ALL SELECT 'Fraldas T3 e T4', id FROM canonical_categories WHERE name = 'Fraldas e Toalhitas' AND level = 2
  UNION ALL SELECT 'Fraldas T5 e T6', id FROM canonical_categories WHERE name = 'Fraldas e Toalhitas' AND level = 2
  UNION ALL SELECT 'Toalhitas', id FROM canonical_categories WHERE name = 'Fraldas e Toalhitas' AND level = 2
  UNION ALL SELECT 'Fraldas de Banho', id FROM canonical_categories WHERE name = 'Fraldas e Toalhitas' AND level = 2
) sub;

-- Alimentação Bebé > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Papas' as name, id FROM canonical_categories WHERE name = 'Alimentação Bebé' AND level = 2
  UNION ALL SELECT 'Boiões', id FROM canonical_categories WHERE name = 'Alimentação Bebé' AND level = 2
  UNION ALL SELECT 'Saquetas de Fruta', id FROM canonical_categories WHERE name = 'Alimentação Bebé' AND level = 2
  UNION ALL SELECT 'Bolachinhas Bebé', id FROM canonical_categories WHERE name = 'Alimentação Bebé' AND level = 2
) sub;

-- Cão > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Ração Seca Cão' as name, id FROM canonical_categories WHERE name = 'Cão' AND level = 2
  UNION ALL SELECT 'Ração Húmida Cão', id FROM canonical_categories WHERE name = 'Cão' AND level = 2
  UNION ALL SELECT 'Snacks Cão', id FROM canonical_categories WHERE name = 'Cão' AND level = 2
  UNION ALL SELECT 'Higiene Cão', id FROM canonical_categories WHERE name = 'Cão' AND level = 2
) sub;

-- Gato > Tipos
INSERT INTO canonical_categories (name, parent_id, level)
SELECT name, id, 3 FROM (
  SELECT 'Ração Seca Gato' as name, id FROM canonical_categories WHERE name = 'Gato' AND level = 2
  UNION ALL SELECT 'Ração Húmida Gato', id FROM canonical_categories WHERE name = 'Gato' AND level = 2
  UNION ALL SELECT 'Snacks Gato', id FROM canonical_categories WHERE name = 'Gato' AND level = 2
  UNION ALL SELECT 'Areias Gato', id FROM canonical_categories WHERE name = 'Gato' AND level = 2
) sub;

-- ============================================================================
-- Summary
-- ============================================================================
-- This seed creates:
-- - 22 Level 1 (root) categories
-- - ~100 Level 2 (subcategories) 
-- - ~150 Level 3 (sub-subcategories) focused on food, beverages, household
--
-- Non-food categories (Casa, Tecnologia, Brinquedos, Papelaria, Desporto, Roupa)
-- have Level 2 only - can be expanded with Level 3 later as needed.
--
-- Designed based on actual store categories from:
-- - Continente, Auchan, Pingo Doce
