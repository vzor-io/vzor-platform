# THE.Hosting — регистрация VPS
**Обновлено:** 2026-02-13

---

## Статус: ожидание (phone verification заблокирована)

Агент OpenClaw зарегистрировал аккаунт, но слишком много раз пытался пройти верификацию телефона — хостинг заблокировал: "Phone verification unavailable. Try again later or write to the support"

---

## Аккаунт

| Параметр | Значение |
|----------|----------|
| Сайт | https://client.the.hosting |
| Email | pis.vzor@gmail.com |
| Пароль | Pis.V.Agv |
| Email подтверждён | Да (13.02.2026) |
| Phone verification | Заблокирована (слишком много попыток) |
| Баланс | 0.00 € |
| User ID | 1012679 |

## Телефон для верификации

| Параметр | Значение |
|----------|----------|
| Номер | +447367211583 (UK) |
| Источник | Виртуальный номер |

## Заказ

- **Тариф:** Aluminium [UK] — VPS/VDS
- **Статус:** Payment pending (ожидает оплаты, но сначала нужна верификация)

---

## План действий (14.02)

### 1. Попробовать верификацию заново
- Зайти: https://client.the.hosting → pis.vzor@gmail.com / Pis.V.Agv
- Меню → Phone verification → ввести +447367211583 → Get verification code
- Если SMS придёт — ввести код → завершить верификацию → оплатить VPS

### 2. Если всё ещё заблокировано
- Написать в support THE.Hosting: "Phone verification is unavailable, please unblock"
- Или: зарегистрировать новый аккаунт на другую почту (agvzor@gmail.com)

### 3. После верификации
- Оплатить VPS Aluminium [UK]
- Получить IP нового сервера
- Настроить VLESS + Caddy (миграция с ServerSpace)

---

## Техническая справка

### Как работать через браузер агента (CDP)
Браузер агента уже залогинен на client.the.hosting. Табы открыты:
- Tab `6F8F12DDBC9F7C0852129E5244435F2F` — User settings / Phone verification
- Tab `EE04CA4EB2E29328193D264B62694A97` — Dashboard

### API billmgr (из контейнера OpenClaw)
```bash
# Сессия (может истечь, тогда перелогиниться через браузер)
billmgrses5=3f528ab48066f89e1130053a

# Проверить статус верификации
docker exec openclaw-openclaw-gateway-1 node -e "
const W=require('/app/node_modules/.pnpm/ws@8.19.0/node_modules/ws');
const ws=new W('ws://127.0.0.1:18800/devtools/page/6F8F12DDBC9F7C0852129E5244435F2F');
ws.on('open',()=>{ws.send(JSON.stringify({id:1,method:'Runtime.evaluate',
  params:{awaitPromise:true,expression:\"fetch('/billmgr',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'phone=%2B447367211583&type=1&func=validatephone.start&sok=ok&clicked_button=next&out=json'}).then(r=>r.text())\"}}))});
ws.on('message',d=>{const m=JSON.parse(d);if(m.id===1){console.log(m.result.result.value);process.exit(0)}});
setTimeout(()=>process.exit(0),15000);
"
```

### Ошибка при блокировке
```json
{
  "doc": {
    "error": {
      "msg": "Phone verification unavailable. Try again later or write to the support"
    }
  }
}
```
