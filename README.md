# IndexedDB Training App (RU)

Трекер тренировок без бэкенда: хранит данные локально в IndexedDB, показывает сводку за сегодня и список по предыдущим дням.

## Запуск

```bash
npm i
npm run dev
```

Открой `http://localhost:5173`.

## Где лежат данные

- В браузере, в базе **IndexedDB** (`training-db`, хранилище `sets`).
- Очистка локальных данных/кеша в браузере удалит записи.

## Структура записи

```ts
type SetRow = {
  id: string;
  date: string; // YYYY-MM-DD (локальная дата)
  type: string; // 'pushup' | 'pullup' | 'squat' | 'abs'
  count: number;
};
```
