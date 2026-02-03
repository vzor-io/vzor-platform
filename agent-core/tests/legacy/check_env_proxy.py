import os

print("=== ALL PROXY-RELATED ENVIRONMENT VARIABLES ===")
for key, value in os.environ.items():
    if 'proxy' in key.lower():
        print(f"{key} = {value}")
print("=" * 50)
