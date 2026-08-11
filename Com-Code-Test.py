import time
import array
import board
import busio
import displayio
import i2cdisplaybus
import digitalio
import audiomixer
import synthio
import ulab.numpy as np
import audiobusio
import analogio
import adafruit_matrixkeypad
import adafruit_displayio_ssd1306
from tracks import track_1_chords, track_1_bass, track_1_name, track_1_tempo
from tracks import track_2_chords, track_2_bass, track_2_name, track_2_tempo
from adafruit_display_text.bitmap_label import Label
from terminalio import FONT


# === Website communication (ADDED — see "ADDED CIRCUITPYTHON CODE" list) ===
import json

_NOTE_NAMES = ("C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B")

def _midi_to_name(midi_note):
    return f"{_NOTE_NAMES[midi_note % 12]}{(midi_note // 12) - 1}"

def _midi_to_freq(midi_note):
    return round(440.0 * (2 ** ((midi_note - 69) / 12)), 2)

# Two separate sets so clearing one source (e.g. switching backing tracks)
# never wipes out notes that are actually being held on the physical keys.
live_notes_web = set()
track_notes_web = set()
_last_web_send = 0.0
_web_send_interval = 0.05  # ~20Hz over serial, plenty for the visualizer

def _send_web_state():
    global _last_web_send
    now = time.monotonic()
    if now - _last_web_send < _web_send_interval:
        return
    _last_web_send = now
    all_notes = sorted(live_notes_web | track_notes_web)
    note_names = [_midi_to_name(n) for n in all_notes]
    freq = _midi_to_freq(all_notes[-1]) if all_notes else 0
    vel = 100 if all_notes else 0
    try:
        print(json.dumps({"notes": note_names, "frequency": freq, "velocity": vel}))
    except Exception:
        pass
# === End website communication setup ===


# create inputs for matrix keypad
cols = [digitalio.DigitalInOut(x) for x in (board.GP26, board.GP27, board.GP15)]
rows = [digitalio.DigitalInOut(x) for x in (board.GP16, board.GP17, board.GP18, board.GP19)]
matr_keys = ((1, 2, 3),
        (4, 5, 6),
        (7, 8, 9),
        ('*', 0, '#'))

keypad = adafruit_matrixkeypad.Matrix_Keypad(rows, cols, matr_keys)

# mapping matrix buttons to their functions
btn_synth0 = 1
btn_synth1 = 2
btn_synth2 = 3
btn_track1 = 4
btn_track2 = 5
btn_track3 = 6
btn_volUp = 7
btn_volDown = '*'
btn_octUp = 9
btn_octDown = '#'
btn_pause = 0
btn_stop = 8



# create i2c connection to oled display
displayio.release_displays()
main_group = displayio.Group()
i2c = busio.I2C(scl=board.GP1, sda=board.GP0)
display_bus = i2cdisplaybus.I2CDisplayBus(i2c, device_address = 0x3C)
display = adafruit_displayio_ssd1306.SSD1306(display_bus, width=128, height=64)

# synth
disp_synth_label = Label(FONT, text="", scale=1)
disp_synth_label.anchor_point = (0, 0)
disp_synth_label.anchored_position = (4, 0)

# track
disp_track_label = Label(FONT, text="", scale=1)
disp_track_label.anchor_point = (0, 0)
disp_track_label.anchored_position = (4, 10)

# volume
disp_volume_label = Label(FONT, text="", scale=1)
disp_volume_label.anchor_point = (0, 0)
disp_volume_label.anchored_position = (4, 20)

# octave
disp_octave_label = Label(FONT, text="", scale=1)
disp_octave_label.anchor_point = (0, 0)
disp_octave_label.anchored_position = (4, 30)

# modulation
disp_mod_label = Label(FONT, text="", scale=1)
disp_mod_label.anchor_point = (0, 0)
disp_mod_label.anchored_position = (4, 40)

# metronome
disp_metr_label = Label(FONT, text="", scale=1)
disp_metr_label.anchor_point = (0, 0)
disp_metr_label.anchored_position = (4, 50)

# adding all our lines to main group
main_group.append(disp_synth_label)
main_group.append(disp_track_label)
main_group.append(disp_volume_label)
main_group.append(disp_octave_label)
main_group.append(disp_mod_label)
main_group.append(disp_metr_label)

# main group gets pushed to the display
display.root_group = main_group



# create digital inputs for switches
key_C4 = digitalio.DigitalInOut(board.GP2)
key_Db4 = digitalio.DigitalInOut(board.GP3)
key_D4 = digitalio.DigitalInOut(board.GP4)
key_Eb4 = digitalio.DigitalInOut(board.GP5)
key_E4 = digitalio.DigitalInOut(board.GP6)
key_F4 = digitalio.DigitalInOut(board.GP7)
key_Gb4 = digitalio.DigitalInOut(board.GP8)
key_G4 = digitalio.DigitalInOut(board.GP9)
key_Ab4 = digitalio.DigitalInOut(board.GP10)
key_A4 = digitalio.DigitalInOut(board.GP11)
key_Bb4 = digitalio.DigitalInOut(board.GP12)
key_B4 = digitalio.DigitalInOut(board.GP13)
key_C5 = digitalio.DigitalInOut(board.GP14)

# map buttons to midi notes
def read_keys():
    keys = {
        60: key_C4.value,
        61: key_Db4.value,
        62: key_D4.value,
        63: key_Eb4.value,
        64: key_E4.value,
        65: key_F4.value,
        66: key_Gb4.value,
        67: key_G4.value,
        68: key_Ab4.value,
        69: key_A4.value,
        70: key_Bb4.value,
        71: key_B4.value,
        72: key_C5.value
    }
    return keys

# previous values for buttons, used to let us capture only the rising edge
old_keys = {
        60: False,
        61: False,
        62: False,
        63: False,
        64: False,
        65: False,
        66: False,
        67: False,
        68: False,
        69: False,
        70: False,
        71: False,
        72: False
}

# create analog input for slider
slider = analogio.AnalogIn(board.A2)
modulator_multiplier = 0.2

def get_modulation():
    # value from 0 to 3.3
    normalized_val = (slider.value * 3.3) / 65535

    # zero to one with lower end cut off
    out_val = (normalized_val - 0.7) / (3.3 - 0.7)
    # make it smaller
    out_val *= modulator_multiplier
    if out_val < 0.0:
        out_val = 0.0

    return out_val

# set up audio through i2s
audio = audiobusio.I2SOut(bit_clock=board.GP20, word_select=board.GP21, data=board.GP22)

# standard envelope for the synths
std_env = synthio.Envelope(
                            attack_time=0.1,
                            sustain_level=0.7,
                            release_time=0.2
)

std_env_short = synthio.Envelope(
                            attack_time=0.1,
                            decay_time=0.3,
                            sustain_level=0.4,
                            release_time=0.2
)

std_env_quick = synthio.Envelope(
                            attack_time=0.05,
                            decay_time=0.1,
                            sustain_level=0.7,
                            release_time=0.1
)
# number of playable synths and backing synths
num_synths = 3
num_backsynths = 2

length = 512
# generate array with sine values
raw_sine = np.sin(np.linspace(0, 2 * np.pi, length, endpoint=False))

# scale to fill a 16 bit integer
sine_wave = np.array(raw_sine * 32767, dtype=np.int16)

# pulse wave. adjustable duty cycle square wave for buzzy sound
pulse_duty = 0.1
pulse_wave = array.array('h')
for i in range(length):
  if i < (length * pulse_duty):
    pulse_wave.append(32767)
  else:
    pulse_wave.append(-32768)

# 2. sawtooth Wave. ramps linearly from -32767 to 32767
saw_wave = np.array(np.linspace(-32767, 32767, length, endpoint=False), dtype=np.int16)

# triangle Wave. ramps up to 32767, then down to -32767
raw_tri = np.zeros(length)
half_len = length // 2
raw_tri[:half_len] = np.linspace(-32767, 32767, half_len, endpoint=False)
raw_tri[half_len:] = np.linspace(32767, -32767, half_len, endpoint=False)
tri_wave = np.array(raw_tri, dtype=np.int16)

# sample rate for all synths
global_sample_rate = 16000

mixer = audiomixer.Mixer(voice_count=num_synths+num_backsynths, channel_count=1, sample_rate=global_sample_rate, buffer_size=2048)

# 0: sawtooth, 1: square, 2: triangle
synths = [synthio.Synthesizer(channel_count=1, sample_rate=global_sample_rate, envelope=std_env, waveform=saw_wave),
          synthio.Synthesizer(channel_count=1, sample_rate=global_sample_rate, envelope=std_env_quick, waveform=pulse_wave),
          synthio.Synthesizer(channel_count=1, sample_rate=global_sample_rate, envelope=std_env, waveform=tri_wave)]


backSynths = [
# bass
                synthio.Synthesizer(channel_count=1, sample_rate=global_sample_rate, envelope=std_env_quick, waveform=pulse_wave),
# chords
                synthio.Synthesizer(channel_count=1, sample_rate=global_sample_rate, envelope=std_env_short, waveform=tri_wave)]


# modulate the synth volume with our lfo
lfo_tremolo = synthio.LFO(rate=4, scale=0.1, offset=0.9)

# volume at startup
initial_volume = 0.6
# volume of background track relative to the lead
back_volume_mult = 0.8

audio.play(mixer)
for i in range(num_synths):
    mixer.voice[i].play(synths[i])
    mixer.voice[i].level = initial_volume

for i in range(num_backsynths):
    mixer.voice[i + num_synths].play(backSynths[i])
    mixer.voice[i + num_synths].level = back_volume_mult * initial_volume





# make everything happen!
def play_loop():

    clock = 0
    active_synth = 0
    # 0: sawtooth, 1: square, 2: triangle
    synth_names = ["Saw", "Pulse", "Tri"]
    active_synth_name = synth_names[active_synth]
    volume = initial_volume
    octave = 0
    # BPM / 60 = BPS
    # 1 / BPS = seconds per beat
    BPS = 120 / 60
    sec_per_eighth = 1.0 / (BPS * 2)
    current_eighth = -1
    current_bar = 0

    last_eighth_time = -1000000.0

    vol_up_pressed = 0
    vol_down_pressed = 0

    oct_up_pressed = 0
    oct_down_pressed = 0

    pause_pressed = 0

    paused = True
    disp_metr_label.text = f"PLAYBACK STOPPED"


    selected_chords = track_1_chords()
    selected_bass = track_1_bass()
    selected_track = track_1_name()

    BPS = track_1_tempo() / 60
    sec_per_eighth = 1.0 / (BPS * 2)

    # apply modulation
    lfo_tremolo.offset = volume
    for i in range(num_synths):
        mixer.voice[i].level = lfo_tremolo

    # loop runs at 100Hz and handles everything interactive
    while True:

        # run every 10 ticks
        if (clock % 10 == 0):

            # manage display
            active_synth_name = synth_names[active_synth]

            disp_synth_label.text = f"Active Sound: {active_synth_name}"
            disp_track_label.text = f"Track: {selected_track}"
            disp_volume_label.text = f"Volume: {round(volume * 100) + 10}%"
            disp_octave_label.text = f"Octave: +{octave}" if (octave > 0) else f"Octave: {octave}"
            disp_mod_label.text = f"Modulation: {round((get_modulation() / modulator_multiplier) * 100)}%"


        # manage backing track playback
        if (time.monotonic() >= last_eighth_time + sec_per_eighth):
            if not paused:
                # update the time in the track
                last_eighth_time = time.monotonic()
                current_eighth += 1

                if current_eighth > 7:
                    current_eighth = 0
                    current_bar += 1
                if current_bar * 8 >= len(selected_bass):
                    current_bar = 0
                    current_eighth = 0

                # bass
                #print((8 * current_bar) + current_eighth)
                for note in range(len(selected_bass[(8 * current_bar) + current_eighth])):

                    if selected_bass[(8 * current_bar) + current_eighth][note] == 0:
                        if (8 * current_bar) + current_eighth == 0:
                            backSynths[0].release(note + 36)
                            track_notes_web.discard(note + 36)  # ADDED
                            #print(f"off      {current_bar}    {current_eighth}   {note}")
                        elif selected_bass[((8 * current_bar) + current_eighth) - 1][note] == 1:
                            backSynths[0].release(note + 36)
                            track_notes_web.discard(note + 36)  # ADDED
                            #print(f"off      {current_bar}    {current_eighth}   {note}")

                    if selected_bass[(8 * current_bar) + current_eighth][note] == 1:
                        if (8 * current_bar) + current_eighth == 0:
                            backSynths[0].press(note + 36)
                            track_notes_web.add(note + 36)  # ADDED
                            #print(f"on      {current_bar}    {current_eighth}   {note}")
                        elif selected_bass[((8 * current_bar) + current_eighth) - 1][note] == 0:
                            backSynths[0].press(note + 36)
                            track_notes_web.add(note + 36)  # ADDED
                            #print(f"on      {current_bar}    {current_eighth}   {note}")
                
                # chords
                for note in range(len(selected_chords[(8 * current_bar) + current_eighth])):

                    if selected_chords[(8 * current_bar) + current_eighth][note] == 0:
                        if (8 * current_bar) + current_eighth == 0:
                            backSynths[1].release(note + 60)
                            track_notes_web.discard(note + 60)  # ADDED
                            #print(f"off      {current_bar}    {current_eighth}   {note}")
                        elif selected_chords[((8 * current_bar) + current_eighth) - 1][note] == 1:
                            backSynths[1].release(note + 60)
                            track_notes_web.discard(note + 60)  # ADDED
                            #print(f"off      {current_bar}    {current_eighth}   {note}")

                    if selected_chords[(8 * current_bar) + current_eighth][note] == 1:
                        if (8 * current_bar) + current_eighth == 0:
                            backSynths[1].press(note + 60)
                            track_notes_web.add(note + 60)  # ADDED
                            #print(f"on      {current_bar}    {current_eighth}   {note}")
                        elif selected_chords[((8 * current_bar) + current_eighth) - 1][note] == 0:
                            backSynths[1].press(note + 60)
                            track_notes_web.add(note + 60)  # ADDED
                            #print(f"on      {current_bar}    {current_eighth}   {note}")


                # chords





                if (current_eighth == 0 or current_eighth == 1):
                    disp_metr_label.text = f"bar {current_bar} 1"
                elif (current_eighth == 2 or current_eighth == 3):
                    disp_metr_label.text = f"bar {current_bar}  2"
                elif (current_eighth == 4 or current_eighth == 5):
                    disp_metr_label.text = f"bar {current_bar}   3"
                elif (current_eighth == 6 or current_eighth == 7):
                    disp_metr_label.text = f"bar {current_bar}    4"


        # apply modulation again
        lfo_tremolo.scale = -get_modulation()


        # handle matrix keypad
        matrix_input = keypad.pressed_keys
        if matrix_input:

            if matrix_input[0] == btn_volUp:
                vol_up_pressed += 1
            else:
                vol_up_pressed = 0
            if matrix_input[0] == btn_volDown:
                vol_down_pressed += 1
            else:
                vol_down_pressed = 0
            if matrix_input[0] == btn_octUp:
                oct_up_pressed += 1
            else:
                oct_up_pressed = 0
            if matrix_input[0] == btn_octDown:
                oct_down_pressed += 1
            else:
                oct_down_pressed = 0
            if matrix_input[0] == btn_pause:
                pause_pressed += 1
            else:
                pause_pressed = 0


            if matrix_input[0] == btn_synth0:
                synths[active_synth].release_all()
                live_notes_web.clear()  # ADDED
                active_synth = 0
            elif matrix_input[0] == btn_synth1:
                synths[active_synth].release_all()
                live_notes_web.clear()  # ADDED
                active_synth = 1
            elif matrix_input[0] == btn_synth2:
                synths[active_synth].release_all()
                live_notes_web.clear()  # ADDED
                active_synth = 2

            elif matrix_input[0] == btn_track1:
                paused = False
                current_eighth = -1
                current_bar = 0
                last_eighth_time = -1000000.0
                for synth in backSynths:
                    synth.release_all()
                track_notes_web.clear()  # ADDED
                selected_chords = track_1_chords()
                selected_bass = track_1_bass()
                selected_track = track_1_name()
                BPS = track_1_tempo() / 60
                sec_per_eighth = 1.0 / (BPS * 2)
                
            elif matrix_input[0] == btn_track2:
                paused = False
                current_eighth = -1
                current_bar = 0
                last_eighth_time = -1000000.0
                for synth in backSynths:
                    synth.release_all()
                track_notes_web.clear()  # ADDED
                selected_chords = track_2_chords()
                selected_bass = track_2_bass()
                selected_track = track_2_name()
                BPS = track_2_tempo() / 60
                sec_per_eighth = 1.0 / (BPS * 2)
                
            elif matrix_input[0] == btn_track3:
                paused = False
            elif matrix_input[0] == btn_stop:
                # pause and reset everything
                paused = True
                current_eighth = -1
                current_bar = 0
                last_eighth_time = -1000000.0
                for synth in backSynths:
                    synth.release_all()
                track_notes_web.clear()  # ADDED
                disp_metr_label.text = f"PLAYBACK STOPPED"


        else:
            vol_up_pressed = 0
            vol_down_pressed = 0
            oct_up_pressed = 0
            oct_down_pressed = 0
            pause_pressed = 0


        if vol_up_pressed == 1:
            volume += 0.1
            if volume > 0.9:
                volume = 0.9
            lfo_tremolo.offset = volume
            for i in range(num_backsynths):
                mixer.voice[i + num_synths].level = back_volume_mult * volume
        elif vol_down_pressed == 1:
            volume -= 0.1
            if volume < 0.1:
                volume = 0.1
            lfo_tremolo.offset = volume
            for i in range(num_backsynths):
                mixer.voice[i + num_synths].level = back_volume_mult * volume

        if oct_up_pressed == 1:
            synths[active_synth].release_all()
            live_notes_web.clear()  # ADDED
            octave += 1
            if octave > 2:
                octave = 2
        if oct_down_pressed == 1:
            synths[active_synth].release_all()
            live_notes_web.clear()  # ADDED
            octave -= 1
            if octave < -2:
                octave = -2

        if pause_pressed == 1:
            if paused == False:
                paused = True
                for synth in backSynths:
                    synth.release_all()
                track_notes_web.clear()  # ADDED
            else:
                paused = False
                
                
                
        # handle live key playing
        keys = read_keys()
        for key in keys:
            if (keys[key] == True) and (old_keys[key] == False): # key pressed
                synths[active_synth].press((key+(octave*12)))
                live_notes_web.add(key+(octave*12))  # ADDED
                if not active_synth == 1:
                    synths[active_synth].press((key+(octave*12)-12))
                    live_notes_web.add(key+(octave*12)-12)  # ADDED
            elif (keys[key] == False) and (old_keys[key] == True): # key released
                synths[active_synth].release((key+(octave*12)))
                live_notes_web.discard(key+(octave*12))  # ADDED
                if not active_synth == 1:
                    synths[active_synth].release((key+(octave*12)-12))
                    live_notes_web.discard(key+(octave*12)-12)  # ADDED
        old_keys.update(keys)
        _send_web_state()  # ADDED
        clock += 1
        time.sleep(0.01)

play_loop()