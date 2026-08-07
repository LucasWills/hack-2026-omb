import time
import board
import digitalio
import audiomixer
import synthio
import ulab.numpy as np
import audiobusio

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


audio = audiobusio.I2SOut(bit_clock=board.GP20, word_select=board.GP21, data=board.GP22)

# I2S audio on PropMaker Feather RP20

std_env = synthio.Envelope(
                                attack_time=0.1,
                                sustain_level=0.7,
                                release_time=0.2
)

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



mixer = audiomixer.Mixer(channel_count=1, sample_rate=22050, buffer_size=2048)
#synth = synthio.Synthesizer(channel_count=1, sample_rate=22050, envelope=std_env, waveform=saw_wave)

# 0: sawtooth, 1: square, 2: sine, 3: triangle
synths = [synthio.Synthesizer(channel_count=1, sample_rate=22050, envelope=std_env, waveform=saw_wave),
          synthio.Synthesizer(channel_count=1, sample_rate=22050, envelope=std_env),
          synthio.Synthesizer(channel_count=1, sample_rate=22050, envelope=std_env, waveform=sine_wave),
          synthio.Synthesizer(channel_count=1, sample_rate=22050, envelope=std_env, waveform=tri_wave)]

lfo_tremolo = synthio.LFO(rate=9, scale=-0.05, offset=0.4)

audio.play(mixer)
mixer.voice[0].play(synths[0])
mixer.voice[0].level = 0.8



def play_loop():
    # 0: sawtooth, 1: square, 2: sine, 3: triangle
    active_synth = 0
    
    
    
    while True:
        keys = read_keys()
        for key in keys:
            if (keys[key] == True) and (old_keys[key] == False):  # key pressed
                synths[0].press((key))  # midi note 65 = F4
            elif (keys[key] == False) and (old_keys[key] == True):  # key released
                synths[0].release((key))  # release the note we pressed
        old_keys.update(keys)
        time.sleep(0.01)

play_loop()



synths[0].press((60))  # midi note 65 = F4
time.sleep(1.0)
synths[0].release((60))  # release the note we pressed
time.sleep(0.5)
synths[0].press((60))  # midi note 65 = F4
time.sleep(1.0)
synths[0].release((60))  # release the note we pressed
time.sleep(0.5)
mixer.voice[0].level = (mixer.voice[0].level - 0.1) % 0.4  # reduce volume each pass