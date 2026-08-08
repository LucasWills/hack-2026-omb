import time
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
import tracks
from adafruit_display_text.bitmap_label import Label
from terminalio import FONT



# create matrix keypad
cols = [digitalio.DigitalInOut(x) for x in (board.GP26, board.GP27, board.GP15)]
rows = [digitalio.DigitalInOut(x) for x in (board.GP16, board.GP17, board.GP18, board.GP19)]
matr_keys = ((1, 2, 3),
        (4, 5, 6),
        (7, 8, 9),
        ('*', 0, '#'))
        

keypad = adafruit_matrixkeypad.Matrix_Keypad(rows, cols, matr_keys)

# while True:
#     keys = keypad.pressed_keys
#     if keys:
#         print("Pressed: ", keys)
#     time.sleep(0.1)


# matrix buttons
btn_synth0 = 1
btn_synth1 = 2
btn_synth2 = 3

btn_volUp = 7
btn_volDown = '*'

btn_octUp = 9
btn_octDown = '#'




# create I2C connection to oled

displayio.release_displays()

main_group = displayio.Group()

i2c = busio.I2C(scl=board.GP1, sda=board.GP0)

display_bus = i2cdisplaybus.I2CDisplayBus(i2c, device_address = 0x3C)

display = adafruit_displayio_ssd1306.SSD1306(display_bus, width=128, height=64)

# Create a Label to show the readings. If you have a very small
# display you may need to change to scale=1.
display_output_label = Label(FONT, text="", scale=1)

# create labels to display at locations
disp_synth_label = Label(FONT, text="", scale=1)
disp_synth_label.anchor_point = (0, 0)
disp_synth_label.anchored_position = (4, 0)

disp_track_label = Label(FONT, text="", scale=1)
disp_track_label.anchor_point = (0, 0)
disp_track_label.anchored_position = (4, 10)

disp_volume_label = Label(FONT, text="", scale=1)
disp_volume_label.anchor_point = (0, 0)
disp_volume_label.anchored_position = (4, 20)

disp_octave_label = Label(FONT, text="", scale=1)
disp_octave_label.anchor_point = (0, 0)
disp_octave_label.anchored_position = (4, 30)

disp_mod_label = Label(FONT, text="", scale=1)
disp_mod_label.anchor_point = (0, 0)
disp_mod_label.anchored_position = (4, 40)


# add the labels to the main_group
main_group.append(disp_synth_label)
main_group.append(disp_track_label)
main_group.append(disp_volume_label)
main_group.append(disp_octave_label)
main_group.append(disp_mod_label)

# set the main_group as the root_group of the built-in DISPLAY
display.root_group = main_group

# Update the label.text property to change the text on the display
#display_output_label.text = f"Range: {1}mm"


# create switches
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

# create analog in for slider

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


audio = audiobusio.I2SOut(bit_clock=board.GP20, word_select=board.GP21, data=board.GP22)

std_env = synthio.Envelope(
                            attack_time=0.1,
                            sustain_level=0.7,
                            release_time=0.2
)
# number pf playable synths
num_synths = 3
num_backsynths = 2

length = 512
# Generate raw floating-point sine values
raw_sine = np.sin(np.linspace(0, 2 * np.pi, length, endpoint=False))

# Scale and convert directly to a signed 16-bit integer array via dtype
sine_wave = np.array(raw_sine * 32767, dtype=np.int16)



# 2. Sawtooth Wave (Ramps linearly from -32767 to 32767)
saw_wave = np.array(np.linspace(-32767, 32767, length, endpoint=False), dtype=np.int16)

# 3. Triangle Wave (Ramps up to 32767, then down to -32767)
raw_tri = np.zeros(length)
half_len = length // 2
raw_tri[:half_len] = np.linspace(-32767, 32767, half_len, endpoint=False)
raw_tri[half_len:] = np.linspace(32767, -32767, half_len, endpoint=False)
tri_wave = np.array(raw_tri, dtype=np.int16)



mixer = audiomixer.Mixer(voice_count=num_synths+num_backsynths, channel_count=1, sample_rate=22050, buffer_size=2048)
#synth = synthio.Synthesizer(channel_count=1, sample_rate=22050, envelope=std_env, waveform=saw_wave)

# 0: sawtooth, 1: square, 2: triangle
synths = [synthio.Synthesizer(channel_count=1, sample_rate=22050, envelope=std_env, waveform=saw_wave),
          synthio.Synthesizer(channel_count=1, sample_rate=22050, envelope=std_env),
          synthio.Synthesizer(channel_count=1, sample_rate=22050, envelope=std_env, waveform=tri_wave)]

backSynths = [synthio.Synthesizer(channel_count=1, sample_rate=22050, envelope=std_env, waveform=tri_wave),
              synthio.Synthesizer(channel_count=1, sample_rate=22050, envelope=std_env, waveform=saw_wave)]


lfo_tremolo = synthio.LFO(rate=2, scale=0.1, offset=0.9)

audio.play(mixer)
for i in range(num_synths):
    mixer.voice[i].play(synths[i])
    mixer.voice[i].level = 0.8

for i in range(num_backsynths):
    mixer.voice[i + num_synths].play(backSynths[i])
    mixer.voice[i + num_synths].level = 0.6


### TODO IMPLIMENT PLAYBACK OF TRACKS USING BACKSYNTHS

def play_loop():
    # 0: sawtooth, 1: square, 2: triangle
    clock = 0
    active_synth = 0
    synth_names = ["Sawtooth", "Square", "Triangle"]
    active_synth_name = synth_names[active_synth]
    volume = 0.8
    octave = 0
    
    vol_up_pressed = 0
    vol_down_pressed = 0
    
    oct_up_pressed = 0
    oct_down_pressed = 0
    
    lfo_tremolo.offset = volume
    for i in range(num_synths):
        mixer.voice[i].level = lfo_tremolo
    
    # play loop!
    while True:
        # run every 10 ticks
        if (clock % 10 == 0):
            
            print(get_modulation())
            
            active_synth_name = synth_names[active_synth]
            
            disp_synth_label.text = f"Active Sound: {active_synth_name}"
            disp_track_label.text = f"Track: {0}%"
            disp_volume_label.text = f"Volume: {round(volume * 100) + 10}%"
            disp_octave_label.text = f"Octave: +{octave}" if (octave > 0) else f"Octave: {octave}"
            disp_mod_label.text = f"Modulation: {round((get_modulation() / modulator_multiplier) * 100)}%"
        
        

        
        lfo_tremolo.scale = -get_modulation()
        
        
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
                
            
            if matrix_input[0] == btn_synth0:
                synths[active_synth].release_all()
                active_synth = 0
            elif matrix_input[0] == btn_synth1:
                synths[active_synth].release_all()
                active_synth = 1
            elif matrix_input[0] == btn_synth2:
                synths[active_synth].release_all()
                active_synth = 2

        else:
            vol_up_pressed = 0
            vol_down_pressed = 0
            oct_up_pressed = 0
            oct_down_pressed = 0
            
        
        if vol_up_pressed == 1:
            print("volume up")
            volume += 0.1
            if volume > 0.9:
                volume = 0.9
            lfo_tremolo.offset = volume
        elif vol_down_pressed == 1:
            print("volume down")
            volume -= 0.1
            if volume < 0.1:
                volume = 0.1
            lfo_tremolo.offset = volume

        if oct_up_pressed == 1:
            print("octave up")
            synths[active_synth].release_all()
            octave += 1
            if octave > 2:
                octave = 2
        if oct_down_pressed == 1:
            print("octave down")
            synths[active_synth].release_all()
            octave -= 1
            if octave < -2:
                octave = -2
        
        keys = read_keys()
        for key in keys:
            if (keys[key] == True) and (old_keys[key] == False): # key pressed
                synths[active_synth].press((key+(octave*12)))
            elif (keys[key] == False) and (old_keys[key] == True): # key released
                synths[active_synth].release((key+(octave*12)))
        old_keys.update(keys)
        clock += 1
        time.sleep(0.01)

play_loop()