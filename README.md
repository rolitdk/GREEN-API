# GREEN-API — чат MAX

Тестовое веб-приложение: UI чата в духе [web.max.ru](https://web.max.ru/) на HTTP API [GREEN-API](https://green-api.com/) для мессенджера MAX. Можно войти по инстансу, создать чат по номеру телефона, отправить текст через `SendMessage` и получить ответ через long-polling `ReceiveNotification`.

## Стек

- React 19
- TypeScript
- Vite 8

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

## Локальный запуск

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
| `npm run dev` | dev-сервер |
| `npm run build` | production-сборка |
| `npm run preview` | просмотр сборки |
| `npm run lint` | проверка кода |
| `npm run typecheck` | проверка типов |
| `npm run test` | unit- и integration-тесты |

## Сценарий проверки

1. Введите `idInstance` и `apiTokenInstance` (или заполните `.env`) и войдите.
2. В сайдбаре укажите номер получателя (РФ или РБ) и создайте чат.
3. Отправьте текстовое сообщение.
4. Ответьте из приложения MAX.
5. Ответ должен появиться в том же чате.

## Ограничения

- Только текстовые сообщения (медиа, цитаты, группы, статусы доставки не поддерживаются).
- История чатов хранится только в памяти: перезагрузка страницы её очищает. Учётные данные сохраняются в `sessionStorage`.
- Номера: Россия (`7…`) и Беларусь (`375…`).
