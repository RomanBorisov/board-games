# 🃏 Durak Online — Платформа настольных игр онлайн

> **Документ для передачи агентам.** Содержит описание задачи, архитектуру, стек технологий и пошаговый план разработки.

---

## 1. Суть задачи

Разработать веб-приложение для игры в настольные игры онлайн между живыми игроками в реальном времени. Первая и основная игра — **«Дурак»** (классический вариант, карточная игра).

### Ключевые требования

- **Игра в реальном времени** между двумя игроками через браузер
- **Авторизация**: регистрация/вход по логину и паролю; незарегистрированные игроки могут играть как гости (ввести имя)
- **Сессии**: игрок создаёт игру, получает ссылку и делится ею; второй игрок переходит по ссылке и они начинают играть
- **Современный UI** с красивыми анимациями карт
- **Масштабируемая архитектура**: приложение — учебный проект, но функционально полноценный продукт
- Frontend обязательно на **Angular**

---

## 2. Стек технологий

### Frontend
| Технология | Версия | Зачем |
|---|---|---|
| **Angular** | 21+ | Обязательное требование; standalone components, signals |
| **Angular Material** | 21+ | UI-компоненты, темизация |
| **GSAP** | 3.x | Анимации карт (перемещение, переворот, раздача) |
| **Socket.io-client** | 4.x | WebSocket-соединение с сервером |
| **NgRx** | 21+ | State management (состояние игры, пользователь) |
| **TailwindCSS** | 4.x | Утилитарные стили поверх Material |

### Backend
| Технология | Версия | Зачем |
|---|---|---|
| **NestJS** | 11+ | TypeScript-фреймворк; идеально сочетается с Angular-экосистемой |
| **Socket.io** (server) | 4.x | WebSocket-сервер для игровых событий в реальном времени |
| **Passport.js + JWT** | — | Аутентификация; access + refresh токены |
| **Prisma ORM** | 5.x | Типобезопасная работа с БД; автомиграции |
| **class-validator** | — | Валидация входящих данных |

### Хранение данных
| Технология | Зачем |
|---|---|
| **PostgreSQL** | Основная БД: пользователи, история игр, сессии |
| **Redis** | Активное состояние игры в памяти; кэш сессий; blacklist JWT-токенов |

### Брокер сообщений
| Технология | Зачем |
|---|---|
| **Apache Kafka** | Event sourcing игровых событий (каждый ход → Kafka topic); фундамент для будущей аналитики, replay-режима, истории партий. Kafka нужна: игровые события — это именно поток событий, а не RPC-вызовы |

### Инфраструктура
| Технология | Зачем |
|---|---|
| **Docker + Docker Compose** | Единое окружение для всех сервисов |
| **Nginx** | Reverse proxy; раздача Angular-статики; SSL termination |
| **Kafdrop** | UI для мониторинга Kafka-топиков (dev-инструмент) |

---

## 3. Архитектура системы

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│  Angular App (SPA)                                          │
│  ├── HTTP REST  ──────────────────────────────────────────► │
│  └── WebSocket (Socket.io) ──────────────────────────────►  │
└──────────────────────┬──────────────────────┬───────────────┘
                       │ HTTP                 │ WS
                  ┌────▼──────────────────────▼────┐
                  │           NGINX                 │
                  │   (reverse proxy / static)      │
                  └────┬──────────────────────┬─────┘
                       │ /api/*               │ /socket.io
                  ┌────▼──────────────────────▼─────┐
                  │         NestJS App               │
                  │  ┌──────────────────────────┐    │
                  │  │   REST API Controllers   │    │
                  │  │   /auth, /users,         │    │
                  │  │   /sessions, /game       │    │
                  │  └──────────────────────────┘    │
                  │  ┌──────────────────────────┐    │
                  │  │  WebSocket Gateway        │    │
                  │  │  (Socket.io rooms)        │    │
                  │  └──────────────────────────┘    │
                  │  ┌──────────────────────────┐    │
                  │  │     Game Engine           │    │
                  │  │  (Durak game logic)       │    │
                  │  └──────────────────────────┘    │
                  │  ┌──────────────────────────┐    │
                  │  │   Kafka Producer          │    │
                  │  │  (publish game events)    │    │
                  │  └──────────────────────────┘    │
                  └────┬──────────────┬──────────────┘
                       │              │
              ┌────────▼────┐  ┌──────▼──────┐
              │ PostgreSQL  │  │   Redis      │
              │  users      │  │  game state  │
              │  sessions   │  │  jwt cache   │
              │  game_logs  │  │              │
              └─────────────┘  └──────────────┘
                                      │
                  ┌───────────────────▼────────────────┐
                  │           Apache Kafka              │
                  │  topics:                            │
                  │  game-events  (ходы, атаки и тп)   │
                  │  session-events (создание, конец)   │
                  └────────────────────────────────────┘
```

### Как используется Kafka

Каждое игровое событие (атака, отбивание, взятие карт, конец хода, конец игры) публикуется в топик `game-events`. NestJS сам же потребляет эти события через Kafka Consumer для:
- **Сохранения истории партии в PostgreSQL** (асинхронно, не блокирует игру)
- **Аналитики**: сколько ходов, кто проиграл, время партии
- **Будущий replay-режим**: воспроизведение партии по событиям

Это классический паттерн **Event Sourcing** — состояние можно восстановить из цепочки событий.

---

## 4. Структура проекта (монорепо)

### Почему монорепо

Ключевая причина — **общие типы** (`shared/`). Типы WebSocket-событий, карт, состояния игры и контракт `GameEngine` описываются один раз и используются и в Angular, и в NestJS без дублирования. Когда появится морской бой, добавится только новый тип в `GameType` — и фронт, и бэк сразу об этом знают.

Монорепо управляется через **Nx** — он умеет строить только изменившиеся части, запускать тесты по затронутым модулям и чётко разделяет зависимости между `apps/` и `libs/`.

```
board-games/                        # Nx монорепо
├── nx.json
├── package.json                    # единый node_modules
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
│
├── libs/
│   └── shared/                     # ← КЛЮЧЕВАЯ ЧАСТЬ
│       ├── src/
│       │   ├── types/
│       │   │   ├── card.types.ts       # Card, Suit, Rank
│       │   │   ├── game.types.ts       # GameState, GameAction, GameType
│       │   │   ├── session.types.ts    # SessionStatus, Player
│       │   │   └── events.types.ts     # WS-события: клиент ↔ сервер
│       │   └── index.ts
│       └── tsconfig.json
│
├── apps/
│   ├── frontend/                   # Angular приложение
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── core/               # Guards, interceptors, services
│   │   │   │   ├── features/
│   │   │   │   │   ├── auth/           # Страницы login/register
│   │   │   │   │   ├── lobby/          # Главная: выбор игры, создание сессии
│   │   │   │   │   ├── game-durak/     # Игровое поле дурака
│   │   │   │   │   └── game-*/        # Будущие игры
│   │   │   │   ├── shared/             # UI-компоненты (карты, аватары, кнопки)
│   │   │   │   └── store/              # NgRx: auth, session, game
│   │   │   └── environments/
│   │   ├── Dockerfile
│   │   └── nginx.conf
│   │
│   └── backend/                    # NestJS приложение
│       ├── src/
│       │   ├── auth/                   # Модуль авторизации
│       │   ├── users/                  # Модуль пользователей
│       │   ├── sessions/               # Создание и управление сессиями
│       │   ├── game/
│       │   │   ├── gateway/            # Socket.io gateway (не знает правил игр)
│       │   │   ├── registry/           # GameRegistry: реестр движков
│       │   │   └── engines/            # Конкретные движки
│       │   │       ├── engine.interface.ts   # GameEngine контракт
│       │   │       ├── durak.engine.ts       # Логика дурака
│       │   │       └── battleship.engine.ts  # (будущий морской бой)
│       │   ├── kafka/                  # Producer/Consumer модуль
│       │   └── prisma/                 # Prisma service
│       ├── prisma/
│       │   └── schema.prisma
│       └── Dockerfile
│
└── infrastructure/
    ├── nginx/
    │   └── nginx.conf
    └── kafka/
        └── kafka-setup.sh              # Создание топиков
```

---

## 5. База данных (PostgreSQL)

### Схема Prisma

```prisma
model User {
  id           String        @id @default(uuid())
  username     String        @unique
  passwordHash String
  createdAt    DateTime      @default(now())
  sessions     GameSession[] @relation("CreatorSessions")
  gameLogs     GameLog[]
}

model GameSession {
  id          String      @id @default(uuid())
  createdBy   User?       @relation("CreatorSessions", fields: [createdById], references: [id])
  createdById String?
  guestName   String?     // если создатель — гость
  status      SessionStatus @default(WAITING)
  createdAt   DateTime    @default(now())
  startedAt   DateTime?
  endedAt     DateTime?
  gameLogs    GameLog[]
}

model GameLog {
  id        String      @id @default(uuid())
  session   GameSession @relation(fields: [sessionId], references: [id])
  sessionId String
  user      User?       @relation(fields: [userId], references: [id])
  userId    String?
  playerName String     // для гостей
  eventType  String     // ATTACK, DEFEND, TAKE, PASS, WIN, LOSE
  payload    Json       // данные хода (карты)
  createdAt  DateTime   @default(now())
}

enum SessionStatus {
  WAITING    // ждём второго игрока
  IN_PROGRESS
  FINISHED
  ABANDONED
}
```

### Redis ключи

```
session:{sessionId}:state     → JSON: полное состояние игры (колода, руки, стол)
session:{sessionId}:players   → JSON: [{playerId, name, isGuest}]
jwt:blacklist:{jti}           → ex TTL: заблокированные токены при logout
```

---

## 6. REST API

### Auth
```
POST /api/auth/register      { username, password } → { accessToken, refreshToken, user }
POST /api/auth/login         { username, password } → { accessToken, refreshToken, user }
POST /api/auth/refresh       { refreshToken }       → { accessToken }
POST /api/auth/logout        [auth]                 → 200 OK
GET  /api/auth/me            [auth]                 → { user }
```

### Sessions
```
POST /api/sessions           [auth/guest] { guestName? } → { sessionId, joinUrl }
GET  /api/sessions/:id       → { session info, status }
```

---

## 7. WebSocket-события (Socket.io)

### Клиент → Сервер
```
join_session     { sessionId, token?, guestName? }
                 → игрок входит в комнату

attack           { sessionId, cards: Card[] }
                 → атакующий кидает карты на стол

defend           { sessionId, tableIndex: number, card: Card }
                 → защищающийся отбивает конкретную карту

take_cards       { sessionId }
                 → защищающийся берёт все карты со стола

pass             { sessionId }
                 → атакующий пасует (завершает ход)
```

### Сервер → Клиент
```
session_joined   { sessionId, players, status }
player_joined    { player }     → когда пришёл второй игрок
game_started     { gameState }  → полное начальное состояние

state_updated    { gameState }  → после каждого хода
                 gameState: {
                   deck:       { remaining: number }
                   trump:      Card
                   table:      { attack: Card, defense?: Card }[]
                   players: [
                     { id, name, cardCount, isAttacker, isDefender }
                   ]
                   myHand:     Card[]   // только для текущего игрока!
                 }

game_over        { winner: { id, name }, loser: { id, name } }
error            { code, message }
player_left      { player }
```

---

## 8. Архитектура игровых движков — Strategy + Registry

### Проблема, которую решает паттерн

Если заложить логику дурака напрямую в `GameGateway`, то при добавлении морского боя придётся городить `if (gameType === 'battleship')` внутри одного gateway или создавать второй — оба варианта плохо масштабируются. Вместо этого Gateway не знает правил ни одной игры — он только маршрутизирует события.

### Контракт GameEngine (libs/shared)

```typescript
// libs/shared/src/types/game.types.ts

export type GameType = 'durak' | 'battleship' // расширяется при добавлении игр

export interface GameAction {
  type: string       // 'attack' | 'defend' | 'fire' | и т.д.
  payload: unknown
}

export interface GameEngine<TState = unknown> {
  readonly gameType: GameType

  // Создать начальное состояние игры
  initGame(players: Player[]): TState

  // Применить действие игрока → новое состояние (чистая функция, без side effects)
  processAction(state: TState, playerId: string, action: GameAction): TState

  // Вернуть состояние так, чтобы скрыть данные других игроков (чужие карты)
  getStateForPlayer(state: TState, playerId: string): unknown

  // Проверить: игра завершена?
  isGameOver(state: TState): boolean

  // Вернуть победителя (если игра завершена)
  getWinner(state: TState): string | null
}
```

### GameRegistry

```typescript
// apps/backend/src/game/registry/game.registry.ts

@Injectable()
export class GameRegistry {
  private engines = new Map<GameType, GameEngine>()

  register(engine: GameEngine): void {
    this.engines.set(engine.gameType, engine)
  }

  get(gameType: GameType): GameEngine {
    const engine = this.engines.get(gameType)
    if (!engine) throw new Error(`No engine registered for: ${gameType}`)
    return engine
  }
}
```

### GameGateway — не знает правил

```typescript
// apps/backend/src/game/gateway/game.gateway.ts

@WebSocketGateway()
export class GameGateway {
  constructor(
    private registry: GameRegistry,
    private sessionsService: SessionsService,
    private redisService: RedisService,
    private kafkaProducer: KafkaProducer,
  ) {}

  @SubscribeMessage('action')
  async handleAction(client: Socket, dto: GameActionDto) {
    const session = await this.sessionsService.get(dto.sessionId)
    const engine = this.registry.get(session.gameType)  // ← достаём нужный движок

    const currentState = await this.redisService.getState(dto.sessionId)
    const newState = engine.processAction(currentState, client.data.playerId, dto.action)

    await this.redisService.setState(dto.sessionId, newState)
    await this.kafkaProducer.publish('game-events', { sessionId: dto.sessionId, action: dto.action })

    // Каждому игроку отправляем только его версию состояния
    const players = await this.redisService.getPlayers(dto.sessionId)
    for (const player of players) {
      const playerState = engine.getStateForPlayer(newState, player.id)
      this.server.to(player.socketId).emit('state_updated', playerState)
    }

    if (engine.isGameOver(newState)) {
      this.server.to(dto.sessionId).emit('game_over', { winner: engine.getWinner(newState) })
    }
  }
}
```

### Добавление новой игры = только новый файл

```typescript
// apps/backend/src/game/engines/battleship.engine.ts

@Injectable()
export class BattleshipEngine implements GameEngine<BattleshipState> {
  readonly gameType: GameType = 'battleship'

  initGame(players: Player[]): BattleshipState { /* ... */ }
  processAction(state, playerId, action): BattleshipState { /* ... */ }
  getStateForPlayer(state, playerId): unknown { /* ... */ }
  isGameOver(state): boolean { /* ... */ }
  getWinner(state): string | null { /* ... */ }
}

// И зарегистрировать в модуле:
// registry.register(battleshipEngine)
```

`GameGateway` трогать не нужно — он уже умеет работать с любым движком.

---

### Правила дурака (классический, 2 игрока)

1. **Колода**: 36 карт (6–Туз), козырная масть определяется последней картой
2. **Раздача**: по 6 карт каждому; атакующий — у кого наименьший козырь
3. **Атака**: атакующий кладёт карты одного номинала (не более карт в руке защищающегося)
4. **Подбрасывание**: можно добавлять карты тех номиналов, что уже есть на столе
5. **Защита**: карта отбивается старшей картой той же масти или любым козырем
6. **Взятие**: не смог/не хочешь отбиться — берёшь все карты со стола
7. **Добор**: после хода оба добирают до 6 карт (сначала атакующий)
8. **Конец хода**: успешно отбитые карты идут в отбой (из игры навсегда)
9. **Победа**: кто первым избавился от всех карт при пустой колоде — победил

### DurakEngine

```typescript
// apps/backend/src/game/engines/durak.engine.ts

@Injectable()
export class DurakEngine implements GameEngine<DurakState> {
  readonly gameType: GameType = 'durak'

  initGame(players: Player[]): DurakState { /* перемешать колоду, раздать по 6 */ }

  processAction(state: DurakState, playerId: string, action: GameAction): DurakState {
    switch (action.type) {
      case 'attack':   return this.attack(state, playerId, action.payload)
      case 'defend':   return this.defend(state, playerId, action.payload)
      case 'take':     return this.takeCards(state, playerId)
      case 'pass':     return this.pass(state, playerId)
      default: throw new InvalidActionException(action.type)
    }
  }

  getStateForPlayer(state: DurakState, playerId: string): DurakClientState {
    return {
      trump:      state.trump,
      deckSize:   state.deck.length,
      table:      state.table,
      myHand:     state.hands.get(playerId),          // свои карты полностью
      opponents:  this.getOpponents(state, playerId), // только { name, cardCount }
      phase:      state.phase,
      attackerId: state.attackerId,
    }
  }

  // Приватные методы: attack, defend, takeCards, pass,
  // canDefend, refillHands, checkWinCondition
}
```

---

## 9. Docker Compose

```yaml
# docker-compose.yml
version: '3.9'
services:

  frontend:
    build: ./apps/frontend
    ports:
      - "80:80"

  backend:
    build: ./apps/backend
    environment:
      DATABASE_URL: postgres://...
      REDIS_URL: redis://redis:6379
      KAFKA_BROKERS: kafka:9092
      JWT_SECRET: ${JWT_SECRET}
    depends_on: [postgres, redis, kafka]

  postgres:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: durak_online
      POSTGRES_USER: durak
      POSTGRES_PASSWORD: ${DB_PASSWORD}

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data

  zookeeper:
    image: confluentinc/cp-zookeeper:7.6.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181

  kafka:
    image: confluentinc/cp-kafka:7.6.0
    depends_on: [zookeeper]
    environment:
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "false"

  kafdrop:                          # UI для Kafka (только dev)
    image: obsidiandynamics/kafdrop
    ports:
      - "9000:9000"
    environment:
      KAFKA_BROKERCONNECT: kafka:9092

volumes:
  pgdata:
  redisdata:
```

---

## 10. UI и анимации

### Дизайн игрового стола

```
┌─────────────────────────────────────────────────┐
│  [Противник]  🃏×6    ♠️ (козырь)   [Колода: 24] │
│                                                  │
│           ┌───────────────────────┐              │
│           │     СТОЛ ИГРЫ         │              │
│           │  [Атака] [Защита]    │              │
│           │  [Атака] [Защита]    │              │
│           └───────────────────────┘              │
│                                                  │
│     [Взять карты]        [Пас / Готово]          │
│                                                  │
│  ╔══════════════════════════════════════════╗    │
│  ║          МОИ КАРТЫ                       ║    │
│  ║  🃏  🃏  🃏  🃏  🃏  🃏                     ║    │
│  ╚══════════════════════════════════════════╝    │
└─────────────────────────────────────────────────┘
```

### GSAP-анимации

| Событие | Анимация |
|---|---|
| Раздача карт | Карты «летят» из колоды к игрокам одна за одной |
| Атака | Карта выскальзывает из руки и плавно кладётся на стол |
| Защита | Карта защиты падает поверх атакующей с небольшим вращением |
| Взятие карт | Карты со стола «летят» в руку защищающегося |
| Отбой | Карты стягиваются в стопку отбоя |
| Добор | Карты вылетают из колоды в руку |
| Победа | Конфетти + анимированный баннер |
| Ховер на карте | Карта приподнимается, легкая тень |

---

## 11. Экраны приложения

```
/                     → Landing page (создать игру / войти в игру)
/auth/login           → Страница входа
/auth/register        → Страница регистрации
/lobby                → Главная для авторизованного пользователя
/game/:sessionId      → Игровое поле
/game/:sessionId/join → Страница подтверждения входа в сессию (для гостей — запрос имени)
```

### Lobby-экран (главная)

- Кнопка «Создать игру» → POST /api/sessions → показать ссылку с кнопкой «Скопировать»
- Отображение ссылки: `https://domain.com/game/{uuid}/join`
- Опционально в будущем: список открытых сессий

### Экран входа в сессию (`/game/:sessionId/join`)

```
if (авторизован)  → показать имя из профиля, кнопка "Войти в игру"
if (гость)        → показать поле "Введите ваше имя", кнопка "Войти"
```

---

## 12. Безопасность

- Пароли хранятся как **bcrypt**-хэши (cost factor 12)
- JWT: **access token** 15 минут + **refresh token** 7 дней
- При logout: jti access-токена попадает в Redis blacklist до истечения TTL
- WebSocket: при подключении токен передаётся в `auth` handshake и верифицируется
- Гостевой игрок получает временный `guestToken` (UUID) для идентификации в рамках сессии
- Состояние чужой руки **никогда не передаётся** клиенту — только `cardCount`
- Rate limiting на эндпоинтах авторизации (nestjs-throttler)

---

## 13. Kafka: топики и события

### Топик `game-events`

```json
{
  "eventId": "uuid",
  "sessionId": "uuid",
  "playerId": "uuid | guest_name",
  "eventType": "GAME_STARTED | ATTACK | DEFEND | TAKE | PASS | GAME_OVER",
  "payload": { /* зависит от типа */ },
  "timestamp": "ISO8601"
}
```

### Топик `session-events`

```json
{
  "eventId": "uuid",
  "sessionId": "uuid",
  "eventType": "SESSION_CREATED | PLAYER_JOINED | SESSION_ABANDONED",
  "payload": { /* ... */ },
  "timestamp": "ISO8601"
}
```

### Kafka Consumer (NestJS)

- Слушает `game-events`, батчами записывает в `GameLog` в PostgreSQL
- Слушает `session-events`, обновляет статус `GameSession`
- Это позволяет: игра не ждёт записи в БД → меньше задержки

---

## 14. Поэтапный план разработки

### Фаза 1: Инфраструктура и фундамент (≈1 неделя)

- [ ] Создать Nx монорепо (`npx create-nx-workspace board-games`)
- [ ] Инициализировать Angular-приложение в `apps/frontend` через Nx Angular plugin
- [ ] Инициализировать NestJS-приложение в `apps/backend` через Nx NestJS plugin
- [ ] Создать `libs/shared` с типами: `Card`, `GameType`, `GameEngine`, `GameAction`, WS-события
- [ ] Настроить TypeScript path aliases: `@board-games/shared` → `libs/shared/src`
- [ ] `docker-compose.dev.yml` с PostgreSQL, Redis, Kafka, Kafdrop
- [ ] Настроить Prisma: schema + первая миграция
- [ ] Настроить Kafka-модуль в NestJS (KafkaJS)
- [ ] Базовый Nginx-конфиг для проксирования
- [ ] ESLint + Prettier единая конфигурация на уровне монорепо

### Фаза 2: Аутентификация (≈3–4 дня)

**Backend:**
- [ ] `UsersModule`: создание, поиск по username
- [ ] `AuthModule`: register, login, refresh, logout, me
- [ ] JWT strategy + Guards (JwtAuthGuard, WsJwtGuard)
- [ ] Интеграция bcrypt, Redis blacklist

**Frontend:**
- [ ] Angular страницы `/auth/login` и `/auth/register`
- [ ] NgRx slice: `AuthState` (user, tokens)
- [ ] HTTP interceptor: добавление Authorization header
- [ ] Auth guard для защищённых роутов
- [ ] Persistent auth: хранение токенов в localStorage, refresh при старте

### Фаза 3: Сессии и лобби (≈2–3 дня)

**Backend:**
- [ ] `SessionsModule`: создание сессии, получение по id
- [ ] Генерация UUID как sessionId
- [ ] Запись в PostgreSQL + публикация в `session-events` Kafka

**Frontend:**
- [ ] Страница лобби: кнопка создать игру → показать ссылку
- [ ] Страница `/game/:sessionId/join`: определить авторизован ли пользователь, запросить имя у гостя
- [ ] Копирование ссылки в буфер

### Фаза 4: Game Engine (≈3–4 дня)

- [ ] Описать интерфейс `GameEngine<TState>` в `libs/shared`
- [ ] Реализовать `GameRegistry` сервис
- [ ] Реализовать `DurakEngine implements GameEngine<DurakState>`
- [ ] Полная реализация правил: инициализация, атака, защита, взятие, пас, добор, отбой
- [ ] Метод `getStateForPlayer`: скрывает карты чужой руки, показывает только `cardCount`
- [ ] Определение победителя через `isGameOver` / `getWinner`
- [ ] 100% unit-тесты (Jest) для всех методов движка
- [ ] Особые случаи: козырная атака, конец колоды, нет ходов

### Фаза 5: WebSocket и игровой процесс (≈4–5 дней)

**Backend:**
- [ ] `GameGateway` (Socket.io): подключение, комнаты по sessionId
- [ ] WS-авторизация через JWT handshake (гость — по guestToken)
- [ ] Gateway использует `GameRegistry` для получения нужного движка по `session.gameType`
- [ ] Хранение GameState в Redis (`session:{id}:state`)
- [ ] После каждого хода: рассылка `getStateForPlayer` каждому игроку персонально
- [ ] Публикация каждого хода в Kafka `game-events`
- [ ] Kafka Consumer → асинхронная запись в `GameLog`

**Frontend:**
- [ ] SocketService: connect, disconnect, emit, on
- [ ] NgRx slice: `GameState`
- [ ] Игровой экран: отображение стола, колоды, козыря
- [ ] Отображение своих карт с возможностью выбора
- [ ] Обработка всех событий от сервера
- [ ] Игровая логика на клиенте (только отображение, не валидация)

### Фаза 6: UI, анимации, полировка (≈5–7 дней)

- [ ] Дизайн карт (SVG или CSS-карты с мастями и номиналами)
- [ ] GSAP: анимация раздачи, ходов, взятия, отбоя
- [ ] Адаптивная вёрстка (планшет + десктоп)
- [ ] Toast-уведомления: чья очередь, ошибки, победитель
- [ ] Экран победы/поражения с анимацией
- [ ] Индикатор соединения (reconnect при обрыве WS)
- [ ] Оптимизация: скелетоны, loading states

### Фаза 7: Production-сборка (≈2 дня)

- [ ] `docker-compose.yml` для production (multi-stage builds)
- [ ] Nginx: gzip, caching headers, SSL-ready конфиг
- [ ] Переменные окружения: `.env.example` с документацией
- [ ] Health check эндпоинты (`/api/health`)
- [ ] README с инструкцией по запуску

---

## 15. Переменные окружения (.env.example)

```env
# Database
DATABASE_URL=postgresql://durak:password@postgres:5432/durak_online

# Redis
REDIS_URL=redis://redis:6379

# Kafka
KAFKA_BROKERS=kafka:9092
KAFKA_GROUP_ID=durak-backend

# JWT
JWT_SECRET=your-super-secret-key-here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# App
PORT=3000
CLIENT_URL=http://localhost:4200
NODE_ENV=development
```

---

## 16. Порядок запуска для разработки

```bash
# 1. Запустить инфраструктуру
docker compose -f docker-compose.dev.yml up -d

# 2. Установить зависимости (единый node_modules в монорепо)
npm install

# 3. Применить миграции БД
npx nx run backend:prisma-migrate

# 4. Запустить backend и frontend параллельно
npx nx run-many --target=serve --projects=backend,frontend

# Или по отдельности:
npx nx serve backend      # http://localhost:3000
npx nx serve frontend     # http://localhost:4200

# Kafdrop (мониторинг Kafka): http://localhost:9000

# Запустить тесты только затронутых проектов (Nx умеет это):
npx nx affected --target=test
```

---

## 17. Что намеренно не включено (и почему)

| Не включено | Почему |
|---|---|
| Микросервисная архитектура | Излишняя сложность; NestJS-монолит с Registry паттерном расширяем без разбивки на сервисы |
| GraphQL | WebSocket+REST достаточно; GQL избыточен для этого домена |
| Kubernetes | Излишне на старте; Docker Compose покрывает все нужды |
| CI/CD pipelines | Можно добавить на Фазе 7; Nx умеет запускать только затронутые тесты |
| Observability (Prometheus/Grafana) | Kafdrop покрывает мониторинг Kafka; можно добавить позже |

---

## 18. Как добавлять новые игры

Архитектура спроектирована так, что добавление новой игры не требует изменений в Gateway, Redis-логике, Kafka или инфраструктуре. Только новый код, никаких правок старого.

### Чеклист для новой игры (например, Морской бой)

**Backend:**
- [ ] Добавить `'battleship'` в `GameType` (в `libs/shared`)
- [ ] Создать `BattleshipEngine implements GameEngine` в `apps/backend/src/game/engines/`
- [ ] Зарегистрировать движок в NestJS-модуле: `registry.register(battleshipEngine)`
- [ ] Добавить новый `GameType` в Prisma enum + миграция

**Frontend:**
- [ ] Создать `apps/frontend/src/app/features/game-battleship/` модуль
- [ ] Реализовать компонент игрового поля (специфичный для морского боя)
- [ ] Добавить маршрут в роутер
- [ ] На странице лобби добавить кнопку «Морской бой»

**Что не нужно трогать:**
- `GameGateway` — уже умеет работать с любым движком
- Redis-логика хранения состояния
- Kafka-топики и Consumer
- Auth, Sessions, Users модули
- Docker Compose и инфраструктура

---

*Документ составлен для передачи агентам-разработчикам. Каждый агент должен работать в рамках своей Фазы, не нарушая интерфейсы соседних модулей.*
