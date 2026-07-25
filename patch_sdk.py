# -*- coding: utf-8 -*-
"""
FamiQuest - Cible une version Android recente (compatibilite Samsung / Android 16)
  python3 patch_sdk.py   (depuis ~/Downloads/famiquest)
Ajoute le plugin expo-build-properties qui fixe compileSdk/targetSdk = 35.
Reexecutable sans danger.
"""
import os, sys, json
if not os.path.exists('app.json'):
    sys.exit("ERREUR : lancez depuis ~/Downloads/famiquest")

c = json.load(open('app.json'))
e = c['expo']
plugins = e.get('plugins', [])

# Verifier si build-properties est deja present
already = any(
    (isinstance(p, str) and p == 'expo-build-properties') or
    (isinstance(p, list) and len(p) > 0 and p[0] == 'expo-build-properties')
    for p in plugins
)
if already:
    print("SKIP : expo-build-properties deja configure")
    sys.exit(0)

plugins.append([
    "expo-build-properties",
    {
        "android": {
            "compileSdkVersion": 35,
            "targetSdkVersion": 35,
            "buildToolsVersion": "35.0.0"
        }
    }
])
e['plugins'] = plugins
json.dump(c, open('app.json', 'w'), indent=2, ensure_ascii=False)
print("OK : app.json cible desormais Android 35 (compatible Samsung/Android 16)")
print("=== TERMINE ===")
