# Durak Online — Документация проекта

## 1. Назначение проекта

`Durak Online` — веб-платформа для онлайн-игры в настольные игры в реальном времени между живыми пользователями. Первая игра в системе — классический `Дурак` на 2 игроков. Проект заложен как расширяемая платформа: новые игры добавляются через новый игровой движок, без изменений транспортного слоя.

## 2. Текущий технологический стек

- Frontend: `Angular` (Nx app `frontend`)
- Backend: `NestJS` (Nx app `backend`)
- Monorepo: `Nx` (integrated workspace)
- Shared contracts: библиотека `shared` (`@board-games/shared`)
- Дополнительно по архитектуре (по ТЗ): `PostgreSQL`, `Redis`, `Kafka`, `Nginx`, `Docker Compose`

## 3. Структура репозитория

Корень монорепозитория:

- `frontend` — клиентское Angular-приложение
- `backend` — серверное NestJS-приложение
- `backend-e2e` — e2e-тесты для backend
- `shared` — общие типы/контракты для frontend и backend
- `docs` — проектная документация
- `nx.json`, `package.json`, `tsconfig.base.json` — конфигурация Nx/TypeScript/workspace

## 4. Созданные проекты (инициализация выполнена)

Инициализированы:

1. Nx workspace `board-games`
2. Angular app `frontend`
3. NestJS app `backend`
4. JS/TS library `shared` с import path `@board-games/shared`

Генерация сделана только через CLI-команды, без ручного создания проектных файлов.

## 5. Архитектурная модель (целевая)

### 5.1 Высокоуровневая схема

- Браузер (Angular SPA) общается с backend:
  - по HTTP (REST)
  - по WebSocket (Socket.io)
- NestJS обрабатывает:
  - авторизацию
  - создание сессий
  - игровой gateway
  - игровые движки через `Registry + Strategy`
- Хранилища:
  - `PostgreSQL` для пользователей/сессий/логов
  - `Redis` для активного состояния игры и кэша
- Kafka:
  - публикация игровых событий (`game-events`)
  - последующая асинхронная обработка и аналитика

### 5.2 Принцип расширения новыми играми

Транспортный слой (`GameGateway`) не содержит правил конкретной игры. Правила инкапсулируются в конкретном движке (`DurakEngine`, будущий `BattleshipEngine` и т.д.), который реализует общий интерфейс `GameEngine`. Gateway получает нужный движок по `gameType` через `GameRegistry`.

## 6. Модули, которые планируются в backend

- `AuthModule`: register/login/refresh/logout/me
- `UsersModule`: пользовательский профиль и поиск
- `SessionsModule`: создание/получение игровых сессий
- `GameModule`:
  - gateway
  - registry
  - engines
- `KafkaModule`: producer + consumer
- `PrismaModule`: работа с PostgreSQL

## 7. Функциональные требования (MVP)

- Регистрация/вход по логину и паролю
- Вход гостем по имени
- Создание сессии с share-ссылкой
- Подключение второго игрока по ссылке
- Полный игровой цикл дурака в real-time:
  - attack
  - defend
  - take
  - pass
- Персонализированная выдача состояния игрока (`myHand` только для владельца)

## 8. API и события (контрактно)

### REST

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/sessions`
- `GET /api/sessions/:id`

### Socket.io

Клиент -> сервер:

- `join_session`
- `attack`
- `defend`
- `take_cards`
- `pass`

Сервер -> клиент:

- `session_joined`
- `player_joined`
- `game_started`
- `state_updated`
- `game_over`
- `error`
- `player_left`

## 9. Безопасность (целевая спецификация)

- Пароли: `bcrypt` hash
- JWT: access + refresh
- Logout: blacklist токенов в Redis
- WS auth: проверка токена в handshake
- Скрытие приватных данных соперника (только `cardCount`, не список карт)
- Rate limit на auth endpoint-ах

## 10. Среда и инфраструктура

Планируется два основных compose-контура:

- `docker-compose.dev.yml` для локальной разработки
- `docker-compose.yml` для production-профиля

Сервисы инфраструктуры:

- `postgres`
- `redis`
- `zookeeper`
- `kafka`
- `kafdrop`
- `nginx`

## 11. Ближайшие шаги разработки

1. Создать типы в `shared`:
   - `Card`, `Suit`, `Rank`
   - `GameType`, `GameAction`, `GameEngine`
   - WS event contracts
2. Подключить Prisma в backend и описать схему БД
3. Реализовать `AuthModule` и `SessionsModule`
4. Реализовать `DurakEngine` и `GameRegistry`
5. Подключить `Socket.io` gateway и Redis state storage
6. Включить Kafka producer/consumer для event log
7. Добавить UI-экраны auth/lobby/game на frontend

Подробный пошаговый план с фазами, критериями готовности и рисками вынесен в отдельный файл:

- `docs/IMPLEMENTATION_ROADMAP.md`

## 12. Команды, использованные для инициализации

```bash
npx create-nx-workspace@latest board-games --preset=apps --workspaceType=integrated --packageManager=npm --nxCloud=skip --interactive=false --skipGit
npx nx add @nx/angular --interactive=false
npx nx add @nx/nest --interactive=false
npx nx g @nx/angular:app frontend --routing --style=scss --standalone --e2eTestRunner=none --unitTestRunner=jest
npx nx g @nx/nest:app backend --unitTestRunner=jest
npx nx g @nx/js:lib shared --importPath=@board-games/shared --unitTestRunner=jest
```

## 13. Итог состояния

На текущем шаге создан фундамент монорепозитория и необходимые проектные заготовки. Бизнес-логика игры, инфраструктурные файлы (`docker-compose`, `prisma`, `kafka setup`) и прикладные модули реализуются на следующих фазах.

## 14. Стандарт Angular: обязательный Signal API

Для всего Angular-приложения принят обязательный стандарт: использовать только Signal API для локального состояния и вычисляемых значений.

Обязательные правила:

- Локальное состояние компонента хранить через `signal(...)`.
- Производные значения описывать через `computed(...)`.
- Побочные эффекты оформлять через `effect(...)` (когда это действительно нужно).
- В шаблонах читать сигналы только через вызов: `mySignal()`.
- Не использовать mutable-поля компонента как источник UI-состояния.
- Не использовать `BehaviorSubject`/`Subject` для локального состояния компонента, если это можно выразить через signals.

Рекомендации по интеграции с HTTP:

- Результат HTTP-запросов записывать в сигналы (`stateSignal.set(...)`).
- Ошибки и загрузку также хранить в сигналах (`isLoading`, `errorMessage`).
- Для сложного состояния использовать композицию `signal + computed`.

## 15. Стандарт CSS/SCSS: обязательный БЭМ

Для всех стилей во frontend использовать методологию БЭМ (Block, Element, Modifier).

Обязательные правила:

- Имена классов писать в формате БЭМ: `block`, `block__element`, `block--modifier`.
- Не использовать вложенные селекторы, нарушающие БЭМ-структуру.
- Один компонент = один основной блок (например, `lobby-card`, `game-table`, `auth-form`).
- Модификаторы состояния оформлять только через `--`: `button--primary`, `card--selected`.
- Не использовать id-селекторы для стилизации компонентов.

Пример:

```html
<section class="auth-form auth-form--loading">
  <h1 class="auth-form__title">Sign In</h1>
  <button class="auth-form__submit auth-form__submit--disabled">Submit</button>
</section>
```
