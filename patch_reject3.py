# -*- coding: utf-8 -*-
"""
FamiQuest - Rend le message de refus propre et bien integre dans la carte
  python3 patch_reject3.py   (depuis ~/Downloads/famiquest)
Reexecutable sans danger.
"""
import os, sys
if not os.path.exists('src/screens/child/MissionsScreen.js'):
    sys.exit("ERREUR : lancez depuis ~/Downloads/famiquest")

p = 'src/screens/child/MissionsScreen.js'
s = open(p).read()

if 'flexDirection: \'column\'' in s and 'rejectBox' in s:
    print("SKIP (deja applique)"); sys.exit(0)

# 1) Retirer l'ancien bandeau flottant s'il est present
old_banner = """      {task.status === 'rejected' && (
        <View style={styles.rejectBanner}>
          <Text style={styles.rejectText}>
            {'\\u274C'} Ta preuve n'a pas été validée. {task.rejectReason ? '\\u00AB ' + task.rejectReason + ' \\u00BB. ' : ''}Refais ta mission !
          </Text>
        </View>
      )}
"""
if old_banner in s:
    s = s.replace(old_banner, "")

# 2) Restructurer le return de TaskRow : contenu en ligne + bandeau en dessous
old_return = """  return (
    <Card style={[
      styles.taskRow,
      task.status === 'done' && { opacity: 0.6 },
      task.status === 'late' && { borderWidth: 2, borderColor: C.coralSoft },
    ]}>
      <View style={[styles.taskIcon, task.status === 'done' && { backgroundColor: C.mint }]}>
        {task.status === 'done'
          ? <Text style={{ fontSize: 22, color: '#fff', fontWeight: '900' }}>{'\\u2713'}</Text>
          : <Text style={{ fontSize: 24 }}>{task.icon}</Text>}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.taskTitle, task.status === 'done' && { textDecorationLine: 'line-through' }]}>
          {task.title}
        </Text>
        <View style={styles.pillRow}>
          <Pill bg={task.status === 'late' ? C.coralSoft : C.bg} color={task.status === 'late' ? C.coralText : C.inkSoft}>
            🕐 {task.time}
          </Pill>
          <Pill bg={C.violetSoft} color={C.violetDark}>+{task.xp} XP</Pill>
          <Pill bg={C.sunSoft} color={C.sunText}>🎮 +{task.screenMin}m</Pill>
        </View>
      </View>
      {busy ? (
        <ActivityIndicator color={C.violet} />
      ) : actionable ? (
        <TouchableOpacity style={styles.doneBtn} onPress={() => onComplete(task)}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>
            {task.proofRequired ? '📸 Fait !' : 'Fait !'}
          </Text>
        </TouchableOpacity>
      ) : (
        <Pill bg={cfg.bg} color={cfg.color}>{cfg.label}</Pill>
      )}
    </Card>
  );"""

new_return = """  return (
    <Card style={[
      { flexDirection: 'column', gap: 0 },
      task.status === 'done' && { opacity: 0.6 },
      task.status === 'rejected' && { borderWidth: 2, borderColor: C.coral },
      task.status === 'late' && { borderWidth: 2, borderColor: C.coralSoft },
    ]}>
      <View style={styles.taskMain}>
        <View style={[styles.taskIcon, task.status === 'done' && { backgroundColor: C.mint }]}>
          {task.status === 'done'
            ? <Text style={{ fontSize: 22, color: '#fff', fontWeight: '900' }}>{'\\u2713'}</Text>
            : <Text style={{ fontSize: 24 }}>{task.icon}</Text>}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.taskTitle, task.status === 'done' && { textDecorationLine: 'line-through' }]}>
            {task.title}
          </Text>
          <View style={styles.pillRow}>
            <Pill bg={task.status === 'late' ? C.coralSoft : C.bg} color={task.status === 'late' ? C.coralText : C.inkSoft}>
              🕐 {task.time}
            </Pill>
            <Pill bg={C.violetSoft} color={C.violetDark}>+{task.xp} XP</Pill>
            <Pill bg={C.sunSoft} color={C.sunText}>🎮 +{task.screenMin}m</Pill>
          </View>
        </View>
        {busy ? (
          <ActivityIndicator color={C.violet} />
        ) : actionable ? (
          <TouchableOpacity style={styles.doneBtn} onPress={() => onComplete(task)}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>
              {task.proofRequired ? '📸 Fait !' : 'Fait !'}
            </Text>
          </TouchableOpacity>
        ) : (
          <Pill bg={cfg.bg} color={cfg.color}>{cfg.label}</Pill>
        )}
      </View>

      {task.status === 'rejected' && (
        <View style={styles.rejectBox}>
          <Text style={styles.rejectText}>
            {'\\u274C'} Ta preuve n'a pas été validée{task.rejectReason ? ' : ' + task.rejectReason : ''}. Refais ta mission !
          </Text>
        </View>
      )}
    </Card>
  );"""

if old_return not in s:
    sys.exit("INTROUVABLE : structure TaskRow -> git checkout -- %s puis reappliquez patch_reject.py + patch_reject2.py, puis celui-ci" % p)
s = s.replace(old_return, new_return)

# 3) Styles : ajouter taskMain et rejectBox, retirer les anciens rejectBanner/rejectText s'ils existent
# Retirer ancien style rejectBanner + rejectText
import re
s = re.sub(r"\n  rejectBanner: \{[^}]*\},", "", s)
s = re.sub(r"\n  rejectText: \{[^}]*\},", "", s)

# Ajouter les nouveaux styles apres doneBtn
anchor = "  doneBtn: { backgroundColor: C.mint, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 },"
addition = anchor + """
  taskMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rejectBox: { backgroundColor: C.coralSoft, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, marginTop: 10 },
  rejectText: { color: C.coralText, fontSize: 12, fontWeight: '700', lineHeight: 17 },"""
if anchor not in s:
    sys.exit("INTROUVABLE : ancre doneBtn")
s = s.replace(anchor, addition)

open(p, 'w').write(s)
print("OK : message de refus proprement integre dans la carte")
print("=== TERMINE ===")
