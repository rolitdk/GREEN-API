# GREEN-API — чат MAX

Тестовое веб-приложение: UI чата в духе [web.max.ru](https://web.max.ru/) на HTTP API [GREEN-API](https://green-api.com/) для мессенджера MAX. Можно войти по инстансу, создать чат по номеру телефона, отправить текст через `SendMessage` и получить ответ через long-polling `ReceiveNotification`.

## Стек

- React 19
- TypeScript
- Vite 8
- Vitest + Testing Library

Без Redux, axios, UI-китов и роутера: состояние в React Context, запросы через `fetch`.

## Что нужно заранее

- Node.js 20+
- Аккаунт в [console.green-api.com](https://console.green-api.com)
- Инстанс **MAX** (не WhatsApp)
- Авторизация инстанса по QR в приложении MAX

У инстанса должен быть пустой `webhookUrl` и включённые входящие уведомления. При логине приложение само вызывает `SetSettings` с `webhookUrl: ""` и `incomingWebhook: "yes"`, чтобы HTTP API receiving работал даже если в кабинете был задан webhook.

## Где взять учётные данные

В кабинете GREEN-API, в карточке инстанса:

| Поле | Описание |
| --- | --- |
| `idInstance` | Идентификатор инстанса |
| `apiTokenInstance` | Токен API инстанса |
| `apiUrl` | Необязательно. URL кластера из кабинета, если он отличается от `https://api.green-api.com` |

## Инструкция по запуску

Скопируйте `.env.example` в `.env` и заполните `VITE_ID_INSTANCE` и `VITE_API_TOKEN_INSTANCE` (при необходимости — `VITE_API_URL`). Форма входа подставит эти значения. Файл `.env` в git не попадает.

Переменные с префиксом `VITE_` попадают в клиентский бандл, поэтому это удобно только для локальной разработки, а не для публикации секретов.

```bash
cp .env.example .env
npm install
npm run dev
```

Откройте [http://localhost:5173](http://localhost:5173).

Dev-сервер проксирует `/green-api` на API GREEN-API (обход CORS в браузере).

| Команда | Описание |
| --- | --- |
| `npm install` | установка зависимостей |
| `npm run dev` | локальный dev-сервер (Vite) |
| `npm run build` | production-сборка (`tsc -b` + Vite) |
| `npm run preview` | просмотр production-сборки |
| `npm run test` | unit- и component-тесты (Vitest, один прогон) |
| `npm run lint` | проверка кода (oxlint) |
| `npm run typecheck` | проверка типов TypeScript |

## Сценарий проверки

1. Введите `idInstance` и `apiTokenInstance` (или заполните `.env`) и войдите.
2. В сайдбаре укажите номер получателя (РФ или РБ) и создайте чат.
3. Отправьте текстовое сообщение.
4. Ответьте из приложения MAX.
5. Ответ должен появиться в том же чате.

## Что сделано

- **Вход по инстансу.** Форма `idInstance` / `apiTokenInstance` / опциональный `apiUrl`. При логине вызывается `SetSettings`, чтобы отключить webhook и включить входящие уведомления. Учётные данные сохраняются в `sessionStorage` на время вкладки.
- **Создание чата по телефону.** Нормализация номеров РФ (`7…`, в том числе `8…` и 10 цифр) и РБ (`375…`). Проверка аккаунта через `CheckAccount`; чат создаётся только если номер есть в MAX.
- **Отправка текста.** `SendMessage`; исходящее сообщение сразу появляется в ленте.
- **Приём входящих.** Long-polling `ReceiveNotification` + `DeleteNotification`. Текстовые `incomingMessageReceived` попадают в существующий чат или создают новый. Повтор одного `idMessage` не дублируется.
- **Клиент GREEN-API.** Обёртка над `fetch`: кластерный хост из `idInstance`, в dev — прокси `/green-api`, ошибки HTTP как `GreenApiError`.
- **UI.** Экран логина, список чатов, лента сообщений, поле ввода. Состояние приложения в React Context, без стороннего store.

## Тесты

Тесты запускаются командой `npm run test` (Vitest в режиме `run`, окружение jsdom).

| Файл | Что проверяет |
| --- | --- |
| `src/utils/phone.test.ts` | Нормализация и формат номеров РФ/РБ, отказ пустого и чужого кода страны |
| `src/utils/credentials.test.ts` | Сборка credentials (trim, `apiUrl` без слэша) и чтение `VITE_*` из env |
| `src/api/greenApi.test.ts` | Выбор хоста API, `sendMessage`, пустой `receiveNotification`, `checkAccount` при `status: false` и не-JSON |
| `src/chats.test.ts` | Разбор входящего текстового webhook, игнор не-текста, защита от дублей, создание чата из `CheckAccount` и тексты ошибок |
| `src/context/AppContext.test.tsx` | Сценарий: логин → создание чата → отправка → входящее → выход (API замокан) |
| `src/components/components.test.tsx` | UI: пустая лента и пузыри, логин (trim и ошибка 401), форма нового чата, отправка сообщения |

Интеграции с живым GREEN-API в тестах нет: `fetch` и контекст мокаются. Ручная проверка — по сценарию выше.

## Ограничения

- Только текстовые сообщения (медиа, цитаты, группы, статусы доставки не поддерживаются).
- История чатов хранится только в памяти: перезагрузка страницы её очищает. Учётные данные сохраняются в `sessionStorage`.
- Номера: Россия (`7…`) и Беларусь (`375…`).
