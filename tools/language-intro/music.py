"""Original instrumental score for the 30-second Language Page introduction."""
import numpy as np
import wave
SR=44100
DURATION=30
rng=np.random.default_rng(77)
track=np.zeros((DURATION*SR,2),dtype=np.float64)
def add(at, samples, pan=0):
    start=int(at*SR); end=min(len(track),start+len(samples)); n=end-start
    if n>0:
        track[start:end,0]+=samples[:n]*(1-pan)*.5
        track[start:end,1]+=samples[:n]*(1+pan)*.5
def tone(freq,dur,volume,kind='bell'):
    t=np.arange(int(dur*SR))/SR
    env=np.exp(-t*(3 if kind=='bell' else 1.4))*np.minimum(1,t*80)
    if kind=='bell': x=np.sin(2*np.pi*freq*t)+.32*np.sin(2*np.pi*freq*2.01*t)+.12*np.sin(2*np.pi*freq*3*t)
    else: x=np.sin(2*np.pi*freq*t)+.18*np.sin(2*np.pi*freq*2*t)
    return x*env*volume
def kick():
    t=np.arange(int(.28*SR))/SR
    return .36*np.sin(2*np.pi*(48*t+65*(1-np.exp(-t*25))/25))*np.exp(-t*18)
def hat():
    t=np.arange(int(.055*SR))/SR
    return rng.normal(0,1,len(t))*np.exp(-t*95)*.045
# 120 bpm. Five-second scenes are exactly ten beats; accents align with each new scene.
chords=[(261.63,329.63,392),(220,261.63,329.63),(174.61,220,261.63),(196,246.94,293.66),(261.63,329.63,392),(174.61,220,261.63)]
for beat in range(60):
    at=beat*.5; chord=chords[min(5,beat//10)]
    add(at,kick())
    add(at+.25,hat(),.45 if beat%2 else -.45)
    add(at,tone(chord[beat%3]*2,.45,.10),(-.45,0,.45)[beat%3])
    if beat%2==0: add(at,tone(chord[0]/2,.9,.13,'bass'))
    if beat%10==0:
        for j,hz in enumerate(chord): add(at+j*.055,tone(hz,1.8,.12),(-.5,0,.5)[j])
# Finish cleanly with a warm resolving chord.
for j,hz in enumerate((261.63,329.63,392,523.25)): add(28+j*.08,tone(hz,2,.11),(-.5,-.2,.2,.5)[j])
fade=np.minimum(1,np.arange(len(track))/(SR*.25))*np.minimum(1,(len(track)-np.arange(len(track)))/(SR*.65))
track*=fade[:,None]
track=np.tanh(track*1.3)*.7
pcm=(track*32767).astype('<i2')
with wave.open('/tmp/language-intro-music.wav','wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
