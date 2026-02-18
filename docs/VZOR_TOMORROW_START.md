# VZOR — Быстрый старт на 2026-02-19

## Что передать агенту (Claude Code) в начале сессии:

Прочитай файл контекста и продолжи работу:
- C:\Users\vzor\Desktop\vzor-ai.com\VZOR_TOMORROW_START.md — этот файл (задачи + контекст)
- C:\Users\vzor\Desktop\vzor-ai.com\SESSION_NOTES.md — полный лог сессий (если нужны детали)

## Текущее состояние:
- Сервер: 95.174.95.209, 32 GB RAM, все контейнеры работают
- RAGFlow: 13 баз знаний, 10 старых (2892 чанка) + 3 новых ПИК (парсятся)
- Agent Zero: http://95.174.95.209:50080
- GitHub: ветка `feature/fractal-splash`, последний коммит на сервере
- Инструмент ragflow_search: уже создан и работает

---

## ЗАДАЧИ НА 19.02.2026

### Задача 1 (КРИТИЧНО): Починить парсинг Экономики
- 79 документов застряли в статусе CANCEL, API не даёт перезапустить
- **Решение:** подключиться к MySQL в Docker и сбросить статус:
  ```bash
  docker exec docker-mysql-1 mysql -u root -pVzorMySQL_2026! rag_flow \
    -e "UPDATE document SET run=0, progress=0, progress_msg='' WHERE kb_id='6e79a93a0cbf11f1a7b1d293515dc461' AND run=2"
  ```
- Затем перезапустить парсинг через API:
  ```bash
  POST /api/v1/datasets/6e79a93a0cbf11f1a7b1d293515dc461/chunks
  Body: {"document_ids": [...all doc IDs...]}
  ```

### Задача 2: Проверить результаты парсинга
- Поставщики (5 docs) и Технология (28 docs) были в статусе RUNNING
- Проверить: `bash /tmp/ragflow_check.sh` на сервере
- Если 0 чанков — перезапустить аналогично задаче 1

### Задача 3: Обновить ragflow_search с новыми базами ПИК
- Файл: `/home/vzor/agent-zero-data/instruments/custom/ragflow_search/ragflow_search.py`
- Добавить в KB_MAP:
  ```python
  "Поставщики": "8b0ee65e0cbf11f18e08d293515dc461",
  "Технология": "8b0554570cbf11f184c9d293515dc461",
  "Экономика": "6e79a93a0cbf11f1a7b1d293515dc461",
  ```
- Обновить `ragflow_search.md` — добавить описание новых баз

### Задача 4: Обновить системную роль Agent Zero
- Файл: `/home/vzor/agent-zero-data/agents/agent0/prompts/agent.system.main.role.md`
- Добавить информацию о 3 новых базах ПИК (Поставщики, Технология, Экономика)
- Добавить маппинг тем: бюджеты/расценки → Экономика, техзакы/регламенты → Технология, поставщики/цены → Поставщики

### Задача 5: Загрузить нормативный справочник в Agent Zero
- Скопировать `NORMATIVE_REFERENCE.md` в `/home/vzor/agent-zero-data/knowledge/custom/main/`
- Agent Zero автоматически проиндексирует через FAISS

### Задача 6: Тестирование поиска
- Проверить что Agent Zero корректно ищет по всем 13 базам
- Тесты:
  1. "Какие требования к электроснабжению жилого дома?" → ЭС
  2. "Нормы пожарной безопасности для эвакуационных путей" → ПБ
  3. "Целевые бюджеты СКБ" → Экономика (новая ПИК)
  4. "Регламент строительного контроля" → Технология (новая ПИК)

---

## СПРАВКА

### Доступы
- SSH: `ssh -i "C:\Users\vzor\Desktop\.ssh\id_ed25519" vzor@95.174.95.209`
- RAGFlow API: `http://localhost:9380/api/v1` (с сервера), токен: `ragflow-c36bd6a4202fcfefaed61f8e9df5456e`
- Agent Zero: `http://95.174.95.209:50080`
- Agent Zero данные: `/home/vzor/agent-zero-data/`

### ID баз знаний RAGFlow (все 13)
```
Старые (10, с чанками):
  ЭС:  8a26d27c0c1011f1a70a7ecd752f3782  (833 чанков)
  ВК:  8a3e6e640c1011f1920e7ecd752f3782  (403)
  ОВиК: 8a52fa860c1011f1989c7ecd752f3782  (473)
  ПБ:  8a673f060c1011f186b67ecd752f3782  (363)
  ГС:  8a7b00340c1011f195977ecd752f3782  (222)
  АР:  8a8ee0550c1011f1964e7ecd752f3782  (119)
  ОДИ: 8aa2b06e0c1011f1ae857ecd752f3782  (25)
  СС:  8ab6419a0c1011f1b2c57ecd752f3782  (149)
  ТУ:  8ac948f20c1011f197657ecd752f3782  (213)
  Общее: 8adda8a20c1011f1ab1e7ecd752f3782  (92)

Новые ПИК (3, парсинг в процессе):
  Поставщики: 8b0ee65e0cbf11f18e08d293515dc461
  Технология: 8b0554570cbf11f184c9d293515dc461
  Экономика: 6e79a93a0cbf11f1a7b1d293515dc461
```

### Docker RAGFlow
```bash
cd /home/vzor/ragflow/docker
docker compose restart ragflow-cpu    # Перезапуск
docker compose ps                     # Статус
docker exec docker-mysql-1 mysql -u root -pVzorMySQL_2026! rag_flow  # MySQL
```
