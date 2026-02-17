# Problem
Search the VZOR project knowledge base (RAGFlow) to find relevant information from uploaded documents: designs, supplier quotes, cost estimates, building codes, regulations, financial models, and other project documentation.

# Solution
Run the RAGFlow search script:

```bash
# Search across ALL knowledge bases
python3 /a0/usr/instruments/custom/ragflow_search/ragflow_search.py search "your search query"

# Search in a specific knowledge base
python3 /a0/usr/instruments/custom/ragflow_search/ragflow_search.py search "your query" --kb "Поставщики"

# List all knowledge bases
python3 /a0/usr/instruments/custom/ragflow_search/ragflow_search.py list

# Show details of a knowledge base
python3 /a0/usr/instruments/custom/ragflow_search/ragflow_search.py info --kb "Проектирование"
```

Use this tool whenever the user asks about:
- Supplier prices, quotes, or comparisons
- Design specifications or requirements
- Cost estimates or budgets
- Building codes, regulations, or standards (СНиП, ГОСТ)
- Any project documentation that was previously uploaded
