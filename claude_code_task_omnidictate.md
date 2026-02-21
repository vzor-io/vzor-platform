# Задание для Claude Code: Установка OmniDictate

## Цель
Установи OmniDictate — бесплатное open-source приложение для голосовой диктовки на Windows. Работает локально через AI-модель Whisper, без облака.

## Шаги

### 1. Проверь систему
- Убедись что ОС — Windows 10/11 64-bit
- Проверь наличие NVIDIA GPU командой: `nvidia-smi`
- Проверь наличие CUDA: `nvcc --version`
- Проверь установлен ли Visual C++ Redistributable

### 2. Установи зависимости (если отсутствуют)

**Visual C++ Redistributable (обязательно):**
- Скачай с https://aka.ms/vs/17/release/vc_redist.x64.exe
- Установи тихо: `vc_redist.x64.exe /install /quiet /norestart`

**Если есть NVIDIA GPU но нет CUDA 12.6:**
- Скачай CUDA Toolkit 12.6 с https://developer.nvidia.com/cuda-12-6-0-download-archive
- Установи
- Проверь: `nvcc --version` должен показать 12.6

**Обнови драйвер NVIDIA до последней версии если он устаревший.**

### 3. Скачай OmniDictate
- Перейди на https://github.com/gurjar1/OmniDictate/releases/tag/v2.0.1
- Скачай файл `OmniDictate_Setup_v2.0.1.exe` (установщик)
- ИЛИ скачай `OmniDictate_Portable_v2.0.1.7z` (портативная версия без установки)

### 4. Установи
**Вариант A — Установщик:**
```
OmniDictate_Setup_v2.0.1.exe /SILENT
```

**Вариант B — Портативная версия:**
- Распакуй .7z архив в `C:\Tools\OmniDictate\` (или другую удобную папку)
- Создай ярлык на рабочем столе для `OmniDictate.exe`

### 5. Первоначальная настройка
После первого запуска OmniDictate автоматически скачает модель Whisper. Рекомендуемые настройки:

- **Model:** `large-v3-turbo` (лучшая точность с хорошей скоростью)
- **Language:** `Auto Detection` (автоматически определит русский/английский)
- **VAD:** включён (автоматическое определение речи)
- **PTT Hotkey:** Right Shift (по умолчанию, можно изменить)

### 6. Проверь работу
- Открой Блокнот (notepad.exe)
- Запусти OmniDictate
- Нажми Start Dictation
- Скажи что-нибудь на русском — текст должен появиться в Блокноте

### 7. Если что-то не работает
- `CUDA is not available` → проверь драйвер NVIDIA, CUDA Toolkit, переменные PATH
- `Failed to load Python DLL` → установи Visual C++ Redistributable
- Нет звука / VAD не работает → проверь микрофон в настройках Windows (16000 Hz, не эксклюзивный режим)
- Медленная работа без GPU → это нормально, CPU-режим значительно медленнее. Рассмотри модель `base` или `small` вместо `large-v3-turbo`

## Важно
- Приложение не подписано — Windows SmartScreen может заблокировать. Это нормально для open-source.
- Размер модели large-v3-turbo — около 3 ГБ, скачивание займёт время.
- Всё работает локально — голос не отправляется в облако.
