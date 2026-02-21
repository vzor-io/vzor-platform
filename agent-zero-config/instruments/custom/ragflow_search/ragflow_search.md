# Problem
Search the VZOR project knowledge base (RAGFlow) to find relevant information from regulatory documents, building codes (СП, СНиП, ГОСТ), design guides, and project documentation.

# Solution
Run the RAGFlow search script:

```bash
# Search across ALL 10 knowledge bases
/opt/venv/bin/python3 /a0/usr/instruments/custom/ragflow_search/ragflow_search.py search "your search query"

# Search in a specific knowledge base by code
/opt/venv/bin/python3 /a0/usr/instruments/custom/ragflow_search/ragflow_search.py search "your query" --kb "ЭС"

# List all knowledge bases
/opt/venv/bin/python3 /a0/usr/instruments/custom/ragflow_search/ragflow_search.py list

# Show details of a knowledge base
/opt/venv/bin/python3 /a0/usr/instruments/custom/ragflow_search/ragflow_search.py info --kb "ПБ"
```

## Knowledge base codes (use with --kb):
| Code | Topic | Chunks |
|------|-------|--------|
| ЭС | Электроснабжение (ПУЭ, СП 256) | 833 |
| ВК | Водоснабжение и канализация | 403 |
| ОВиК | Отопление, вентиляция, кондиционирование | 473 |
| ПБ | Пожарная безопасность (эвакуация, АПС) | 363 |
| ГС | Газоснабжение | 222 |
| АР | Архитектурные решения | 119 |
| ОДИ | Доступность для МГН | 25 |
| СС | Сети связи | 149 |
| ТУ | Технические условия и регламенты | 213 |
| Общее | Проектное дело | 92 |

## When to use this tool:
- Questions about building codes and regulations (нормативы, СП, ГОСТ, СНиП)
- Electrical requirements (электроснабжение, ПУЭ, нагрузки)
- Fire safety (пожарная безопасность, эвакуация, АПС, СОУЭ)
- HVAC (отопление, вентиляция, кондиционирование)
- Water supply and drainage (водоснабжение, канализация)
- Gas supply (газоснабжение)
- Accessibility (МГН, доступность, пандусы)
- Architectural requirements (архитектура, инсоляция)
- Communications (связь, телефония, интернет)
- Technical regulations (техусловия, госэкспертиза)
