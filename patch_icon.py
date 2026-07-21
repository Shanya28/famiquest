# -*- coding: utf-8 -*-
"""
FamiQuest - Installe l'icone de l'application (a lancer depuis ~/Downloads/famiquest)
  python3 patch_icon.py
Prerequis : avoir place icon.png ET adaptive-icon.png dans le dossier assets/
Reexecutable sans danger.
"""
import os, sys, json

if not os.path.exists('app.json'):
    sys.exit("ERREUR : lancez ce script depuis ~/Downloads/famiquest")

# 1) Verifier la presence des images
missing = [f for f in ['assets/icon.png', 'assets/adaptive-icon.png'] if not os.path.exists(f)]
if missing:
    sys.exit("ERREUR : image(s) manquante(s) : " + ", ".join(missing) +
             "\n-> Placez icon.png et adaptive-icon.png dans le dossier assets/ puis relancez.")

# 2) Modifier app.json
c = json.load(open('app.json'))
e = c['expo']
e['icon'] = './assets/icon.png'

splash = e.get('splash', {})
splash['image'] = './assets/icon.png'
splash.setdefault('resizeMode', 'contain')
splash.setdefault('backgroundColor', '#6C5CE7')
e['splash'] = splash

android = e.get('android', {})
android['adaptiveIcon'] = {
    'foregroundImage': './assets/adaptive-icon.png',
    'backgroundColor': '#6C5CE7'
}
e['android'] = android

json.dump(c, open('app.json', 'w'), indent=2, ensure_ascii=False)
print("OK : icone declaree dans app.json")
print("   - icon        :", e['icon'])
print("   - splash.image:", e['splash']['image'])
print("   - adaptiveIcon:", e['android']['adaptiveIcon']['foregroundImage'])
print("=== TERMINE ===")
