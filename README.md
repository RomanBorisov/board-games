# Board Games Monorepo

Монорепозиторий для платформы онлайн-настольных игр (MVP: игра "Дурак").

## Что уже создано

- `frontend` - Angular приложение
- `backend` - NestJS приложение
- `shared` - общая библиотека типов/контрактов
- `backend-e2e` - e2e тесты backend

Дополнительная документация по архитектуре и плану: `docs/README.md`.

Важно: во всем Angular-коде обязателен Signal API (`signal`, `computed`, `effect`), а стили должны следовать БЭМ. Подробные правила описаны в `docs/README.md`.

## Пошаговый запуск (локальная разработка)

### 1) Требования к окружению

Проверь, что установлено:

- `Node.js` 22+ (рекомендуется актуальная LTS)
- `npm` 10+
- `Docker` и `Docker Compose` (для PostgreSQL/Redis/Kafka на следующих этапах)

Проверка:

```bash
node -v
npm -v
docker -v
docker compose version
```

### 2) Перейти в корень проекта

```bash
cd /Users/romanborisov/Documents/projects/personal/tabgam/board-games
```

### 3) Установить зависимости

```bash
npm install
```

### 4) Проверить список Nx-проектов

```bash
npx nx show projects
```

Ожидаемо увидишь:

- `frontend`
- `backend`
- `shared`
- `backend-e2e`

### 5) Запустить backend

Отдельный терминал:

```bash
npx nx serve backend
```

Backend поднимается на `http://localhost:8600`.

Проверка:

```bash
curl http://localhost:8600/api
```

### 6) Запустить frontend

Второй терминал:

```bash
npx nx serve frontend
```

Frontend доступен на `http://localhost:8700`.

### 7) Запуск frontend + backend одной командой

Если хочешь запускать оба сервиса сразу:

```bash
npx nx run-many --target=serve --projects=backend,frontend
```

### 8) Запуск тестов

Все тесты:

```bash
npx nx run-many --target=test --projects=frontend,backend,shared
```

E2E backend:

```bash
npx nx e2e backend-e2e
```

### 9) Сборка проектов

```bash
npx nx build frontend
npx nx build backend
```

Артефакты сборки появятся в `dist/`.

### 10) Проверка линтинга

```bash
npx nx run-many --target=lint --projects=frontend,backend,shared
```

## Полезные команды Nx

- Показать граф зависимостей: `npx nx graph`
- Посмотреть информацию о проекте: `npx nx show project frontend`
- Сгенерировать новый модуль/библиотеку: `npx nx g ...`

## Типовые проблемы и решения

### Ошибка версии Node

Если `npx`/`node` не запускаются или версия не подходит - переключи версию Node (например, через `nvm`/`asdf`) и заново выполни `npm install`.

### Заняты порты

По умолчанию в этом репозитории заданы нестандартные порты, чтобы не конфликтовать с другими проектами:

- backend: `8600`
- frontend: `8700`

### После обновления зависимостей "странные" ошибки

Очисти `node_modules` и lock-файл, затем установи заново:

```bash
rm -rf node_modules package-lock.json
npm install
```
