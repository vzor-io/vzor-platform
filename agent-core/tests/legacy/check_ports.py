"""
Быстрая проверка доступных портов VPN
"""
import socket

ports_to_check = [12334, 8964, 16450, 16756, 1080, 10808, 10809, 7890, 7891]

print("Проверка открытых портов на localhost:\n")

for port in ports_to_check:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(1)
    result = sock.connect_ex(('127.0.0.1', port))
    sock.close()
    
    if result == 0:
        print(f"✅ Порт {port} ОТКРЫТ")
    else:
        print(f"❌ Порт {port} закрыт")
