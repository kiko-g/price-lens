#!/usr/bin/env python3
"""
Generate category mappings from store category tuples to canonical categories.
This script analyzes store categories and creates SQL INSERT statements.
"""

import json
import re
from pathlib import Path
from typing import Optional

# Categories to skip (promotional, navigational, empty)
SKIP_PATTERNS = [
    r'^$',  # Empty
    r'^promoções?$',
    r'^novidades?$',
    r'^destaques?$',
    r'^mais vendidos$',
    r'^campanhas?$',
    r'^ofertas?$',
    r'^especiais?$',
    r'^exclusivos?$',
    r'^online$',
]

def normalize(s: str) -> str:
    """Normalize string for comparison."""
    if not s:
        return ""
    # Lowercase, remove extra spaces
    s = s.lower().strip()
    # Remove common suffixes/prefixes that vary between stores
    s = re.sub(r'\s+e\s+', ' ', s)  # "X e Y" -> "X Y"
    s = re.sub(r'\s+', ' ', s)  # Multiple spaces
    return s

def should_skip(cat1: str, cat2: Optional[str], cat3: Optional[str]) -> bool:
    """Check if this tuple should be skipped."""
    for pattern in SKIP_PATTERNS:
        if re.match(pattern, normalize(cat1), re.IGNORECASE):
            return True
    return False

def build_canonical_lookup(categories: list) -> dict:
    """Build lookup structures for canonical categories."""
    by_id = {c['id']: c for c in categories}
    by_name = {}  # name -> list of categories with that name
    by_name_level = {}  # (name, level) -> category
    
    for c in categories:
        name_norm = normalize(c['name'])
        if name_norm not in by_name:
            by_name[name_norm] = []
        by_name[name_norm].append(c)
        by_name_level[(name_norm, c['level'])] = c
    
    # Build full path for each category
    for c in categories:
        path = [c['name']]
        parent_id = c.get('parent_id')
        while parent_id:
            parent = by_id.get(parent_id)
            if parent:
                path.insert(0, parent['name'])
                parent_id = parent.get('parent_id')
            else:
                break
        c['full_path'] = ' > '.join(path)
        c['path_parts'] = path
    
    return {
        'by_id': by_id,
        'by_name': by_name,
        'by_name_level': by_name_level,
        'all': categories,
    }

def find_best_match(cat1: str, cat2: Optional[str], cat3: Optional[str], lookup: dict) -> Optional[dict]:
    """Find the best canonical category match for a store tuple."""
    
    # Normalize inputs
    c1 = normalize(cat1) if cat1 else ""
    c2 = normalize(cat2) if cat2 else ""
    c3 = normalize(cat3) if cat3 else ""
    
    if not c1:
        return None
    
    # Strategy 1: Direct name match at deepest level
    # Try cat3 first, then cat2, then cat1
    for level, name in [(3, c3), (2, c2), (1, c1)]:
        if not name:
            continue
        key = (name, level)
        if key in lookup['by_name_level']:
            return lookup['by_name_level'][key]
    
    # Strategy 2: Fuzzy name match
    best_match = None
    best_score = 0
    
    for cat in lookup['all']:
        cat_norm = normalize(cat['name'])
        score = 0
        
        # Check various matches
        if c3 and cat_norm == c3:
            score = 100
        elif c2 and cat_norm == c2:
            score = 90
        elif c1 and cat_norm == c1:
            score = 80
        elif c3 and c3 in cat_norm:
            score = 60
        elif c3 and cat_norm in c3:
            score = 55
        elif c2 and c2 in cat_norm:
            score = 50
        elif c2 and cat_norm in c2:
            score = 45
        elif c1 and c1 in cat_norm:
            score = 40
        elif c1 and cat_norm in c1:
            score = 35
        
        # Prefer deeper levels when scores are equal
        if score > 0:
            score += cat['level'] * 0.1
        
        if score > best_score:
            best_score = score
            best_match = cat
    
    if best_score >= 35:
        return best_match
    
    # Strategy 3: Semantic mappings (hardcoded common translations)
    semantic_map = {
        # Bebidas
        'bebidas e garrafeira': 'Bebidas',
        'bebidas garrafeira': 'Bebidas',
        'águas': 'Águas',
        'água': 'Águas',
        'refrigerantes': 'Refrigerantes',
        'sumos e néctares': 'Sumos e Néctares',
        'sumos néctares': 'Sumos e Néctares',
        'cervejas': 'Cervejas e Sidras',
        'cerveja': 'Cervejas e Sidras',
        'sidras': 'Cervejas e Sidras',
        'vinhos': 'Vinhos',
        'vinho': 'Vinhos',
        'espirituosas': 'Bebidas Espirituosas',
        'café': 'Café e Chá',
        'chá': 'Café e Chá',
        'café e chá': 'Café e Chá',
        
        # Laticínios
        'lacticínios': 'Laticínios e Ovos',
        'laticínios': 'Laticínios e Ovos',
        'leite': 'Leite',
        'iogurtes': 'Iogurtes',
        'queijos': 'Queijos',
        'queijo': 'Queijos',
        'manteiga': 'Manteigas e Cremes',
        'manteigas': 'Manteigas e Cremes',
        'ovos': 'Ovos',
        
        # Carnes
        'talho': 'Carnes e Talho',
        'carnes': 'Carnes e Talho',
        'carne': 'Carnes e Talho',
        'bovino': 'Bovino',
        'vaca': 'Bovino',
        'vitela': 'Vitela',
        'suíno': 'Suíno',
        'porco': 'Suíno',
        'aves': 'Aves',
        'frango': 'Frango',
        'peru': 'Peru',
        
        # Peixaria
        'peixaria': 'Peixaria e Marisco',
        'peixe': 'Peixe Fresco',
        'marisco': 'Marisco',
        'bacalhau': 'Bacalhau',
        
        # Frutas e Legumes
        'frutas legumes': 'Frutas e Legumes',
        'frutas e legumes': 'Frutas e Legumes',
        'frutas': 'Frutas',
        'fruta': 'Frutas',
        'legumes': 'Legumes',
        'vegetais': 'Legumes',
        'saladas': 'Saladas e Preparados',
        
        # Padaria
        'padaria': 'Padaria e Pastelaria',
        'pastelaria': 'Pastelaria',
        'pão': 'Pão',
        'bolos': 'Pastelaria',
        'bolachas': 'Bolachas e Biscoitos',
        'biscoitos': 'Bolachas e Biscoitos',
        
        # Mercearia
        'mercearia': 'Mercearia',
        'arroz': 'Arroz',
        'massa': 'Massa',
        'massas': 'Massa',
        'azeite': 'Azeite',
        'óleos': 'Azeite e Óleos',
        'conservas': 'Conservas',
        'molhos': 'Molhos e Condimentos',
        'temperos': 'Temperos e Especiarias',
        'especiarias': 'Temperos e Especiarias',
        'cereais': 'Cereais e Barras',
        'snacks': 'Snacks e Aperitivos',
        'aperitivos': 'Snacks e Aperitivos',
        'chocolates': 'Chocolates e Doces',
        'doces': 'Chocolates e Doces',
        
        # Congelados
        'congelados': 'Congelados',
        'gelados': 'Gelados',
        
        # Charcutaria
        'charcutaria': 'Charcutaria',
        'fiambre': 'Fiambre e Mortadela',
        'presunto': 'Presunto e Paleta',
        
        # Refeições Prontas
        'refeições prontas': 'Refeições Prontas',
        'take away': 'Take Away',
        'pizzas': 'Pizzas Refrigeradas',
        
        # Higiene
        'higiene beleza': 'Higiene e Beleza',
        'higiene e beleza': 'Higiene e Beleza',
        'higiene pessoal': 'Higiene e Beleza',
        'cabelo': 'Cabelo',
        'champô': 'Champô',
        'corpo': 'Corpo',
        'rosto': 'Rosto',
        'maquilhagem': 'Maquilhagem',
        
        # Limpeza
        'limpeza': 'Limpeza do Lar',
        'limpeza do lar': 'Limpeza do Lar',
        'detergentes': 'Limpeza do Lar',
        
        # Bebé
        'bebé': 'Bebé',
        'bébé': 'Bebé',
        'fraldas': 'Fraldas e Toalhitas',
        
        # Animais
        'animais': 'Animais',
        'pet': 'Animais',
        'cão': 'Cão',
        'gato': 'Gato',
        
        # Outros
        'bio': 'Bio, Eco e Saudável',
        'biológico': 'Produtos Biológicos',
        'sem glúten': 'Sem Glúten',
        'vegan': 'Vegan e Vegetariano',
        'vegetariano': 'Vegan e Vegetariano',
        'saúde': 'Saúde e Parafarmácia',
        'parafarmácia': 'Saúde e Parafarmácia',
        
        # Casa
        'casa': 'Casa e Jardim',
        'jardim': 'Jardim',
        'decoração': 'Decoração',
        'cozinha': 'Cozinha',
        
        # Outros não-alimentar
        'brinquedos': 'Brinquedos e Jogos',
        'jogos': 'Jogos de Tabuleiro',
        'papelaria': 'Papelaria e Livraria',
        'livros': 'Livros',
        'desporto': 'Desporto',
        'roupa': 'Roupa e Acessórios',
        'tecnologia': 'Tecnologia e Eletrodomésticos',
        'eletrodomésticos': 'Tecnologia e Eletrodomésticos',
    }
    
    # Try to find semantic match
    for search_term in [c3, c2, c1]:
        if not search_term:
            continue
        if search_term in semantic_map:
            target_name = semantic_map[search_term]
            for cat in lookup['all']:
                if normalize(cat['name']) == normalize(target_name):
                    return cat
    
    # Strategy 4: Try L1 category match (broadest)
    l1_mappings = {
        'bebidas': 'Bebidas',
        'lacticínios': 'Laticínios e Ovos',
        'laticínios': 'Laticínios e Ovos',
        'talho': 'Carnes e Talho',
        'carnes': 'Carnes e Talho',
        'peixaria': 'Peixaria e Marisco',
        'frutas': 'Frutas e Legumes',
        'legumes': 'Frutas e Legumes',
        'padaria': 'Padaria e Pastelaria',
        'mercearia': 'Mercearia',
        'congelados': 'Congelados',
        'charcutaria': 'Charcutaria',
        'higiene': 'Higiene e Beleza',
        'limpeza': 'Limpeza do Lar',
        'bebé': 'Bebé',
        'animais': 'Animais',
        'bio': 'Bio, Eco e Saudável',
        'casa': 'Casa e Jardim',
        'brinquedos': 'Brinquedos e Jogos',
        'papelaria': 'Papelaria e Livraria',
        'desporto': 'Desporto e Viagem',
        'roupa': 'Roupa e Acessórios',
        'tecnologia': 'Tecnologia e Eletrodomésticos',
    }
    
    for search_key, target_name in l1_mappings.items():
        if search_key in c1:
            for cat in lookup['all']:
                if cat['level'] == 1 and normalize(cat['name']) == normalize(target_name):
                    return cat
    
    return None

def escape_sql_string(s: str) -> str:
    """Escape single quotes for SQL."""
    if s is None:
        return "NULL"
    return "'" + s.replace("'", "''") + "'"

def generate_sql(tuples: list, lookup: dict, origin_id: int, origin_name: str) -> str:
    """Generate SQL INSERT statements for mappings."""
    
    lines = [
        f"-- Category mappings for {origin_name} (origin_id: {origin_id})",
        f"-- Generated automatically - review before importing",
        f"-- Total tuples: {len(tuples)}",
        "",
        "INSERT INTO category_mappings (origin_id, store_category, store_category_2, store_category_3, canonical_category_id)",
        "VALUES"
    ]
    
    values = []
    skipped = []
    unmapped = []
    
    for t in tuples:
        cat1 = t.get('store_category', '')
        cat2 = t.get('store_category_2')
        cat3 = t.get('store_category_3')
        
        # Skip empty or promotional categories
        if should_skip(cat1, cat2, cat3):
            skipped.append(t)
            continue
        
        # Find best match
        match = find_best_match(cat1, cat2, cat3, lookup)
        
        if match:
            cat2_sql = escape_sql_string(cat2) if cat2 else "NULL"
            cat3_sql = escape_sql_string(cat3) if cat3 else "NULL"
            comment = f"-- {match['full_path']}"
            # Store value and comment separately
            values.append({
                'sql': f"  ({origin_id}, {escape_sql_string(cat1)}, {cat2_sql}, {cat3_sql}, {match['id']})",
                'comment': comment
            })
        else:
            unmapped.append(t)
    
    if values:
        # Build VALUES with commas BEFORE comments (not after)
        for i, v in enumerate(values):
            if i < len(values) - 1:
                lines.append(f"{v['sql']},  {v['comment']}")
            else:
                lines.append(f"{v['sql']}  {v['comment']}")
        lines.append("ON CONFLICT DO NOTHING;")
    else:
        lines.append("-- No mappings generated")
    
    # Add summary
    lines.extend([
        "",
        f"-- Summary:",
        f"-- Mapped: {len(values)}",
        f"-- Skipped (empty/promo): {len(skipped)}",
        f"-- Unmapped: {len(unmapped)}",
    ])
    
    if unmapped:
        lines.append("")
        lines.append("-- Unmapped tuples (review manually):")
        for t in unmapped[:50]:  # Show first 50
            cat1 = t.get('store_category', '')
            cat2 = t.get('store_category_2', '')
            cat3 = t.get('store_category_3', '')
            lines.append(f"-- {cat1} > {cat2 or '-'} > {cat3 or '-'}")
        if len(unmapped) > 50:
            lines.append(f"-- ... and {len(unmapped) - 50} more")
    
    return "\n".join(lines)

def generate_store_mappings(store_config: dict, lookup: dict, base_path: Path):
    """Generate mappings for a single store."""
    tuples_files = store_config['files']
    origin_id = store_config['origin_id']
    origin_name = store_config['name']
    output_file = store_config['output']
    
    # Load tuples from all files
    all_tuples = []
    for f in tuples_files:
        data = json.loads(Path(f).read_text())
        all_tuples.extend(data.get('data', []))
    
    print(f"\n{origin_name}: {len(all_tuples)} tuples")
    
    # Generate SQL
    sql = generate_sql(all_tuples, lookup, origin_id=origin_id, origin_name=origin_name)
    
    # Write to file
    output_path = base_path / output_file
    output_path.write_text(sql)
    print(f"  Generated: {output_path}")
    
    # Count mapped
    mapped = sql.count(f"  ({origin_id},")
    print(f"  Mapped: {mapped}")
    
    return mapped

def main():
    base_path = Path('/Users/kikogoncalves/Development/price-lens/scripts/migrations')
    
    # Load canonical categories
    canonical = json.loads(Path('/tmp/canonical_flat.json').read_text())
    categories = canonical.get('data', [])
    print(f"Loaded {len(categories)} canonical categories")
    
    # Build lookup
    lookup = build_canonical_lookup(categories)
    
    # Store configurations
    stores = [
        {
            'name': 'Continente',
            'origin_id': 1,
            'files': ['/tmp/continente_tuples_1.json', '/tmp/continente_tuples_2.json'],
            'output': '003_map_continente_categories.sql',
        },
        {
            'name': 'Auchan',
            'origin_id': 2,
            'files': ['/tmp/auchan_tuples_1.json'],
            'output': '004_map_auchan_categories.sql',
        },
        {
            'name': 'Pingo Doce',
            'origin_id': 3,
            'files': ['/tmp/pingodoce_tuples_1.json'],
            'output': '005_map_pingodoce_categories.sql',
        },
    ]
    
    # Generate for each store
    total_mapped = 0
    for store in stores:
        try:
            mapped = generate_store_mappings(store, lookup, base_path)
            total_mapped += mapped
        except FileNotFoundError as e:
            print(f"  Skipped {store['name']}: {e}")
    
    print(f"\n=== Total mapped: {total_mapped} ===")

if __name__ == "__main__":
    main()
