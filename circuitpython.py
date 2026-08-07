import time
import board
import digitalio
import audiomixer
import synthio
import ulab.numpy as np
import audiobusio

# create switches
key_C4 = digitalio.DigitalInOut(board.GP2)



audio = audiobusio.I2SOut(bit_clock=board.GP20, word_select=board.GP21, data=board.GP22)

# I2S audio on PropMaker Feather RP20

std_env = synthio.Envelope(
                                attack_time=0.0,
                                sustain_level=0.5,
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
synth = synthio.Synthesizer(channel_count=1, sample_rate=22050, envelope=std_env, waveform=saw_wave)

audio.play(mixer)
mixer.voice[0].play(synth)
mixer.voice[0].level = 0.4


synth.press((60))  # midi note 65 = F4
time.sleep(1.0)
synth.release((60))  # release the note we pressed
time.sleep(0.5)
synth.press((60))  # midi note 65 = F4
time.sleep(1.0)
synth.release((60))  # release the note we pressed
time.sleep(0.5)
mixer.voice[0].level = (mixer.voice[0].level - 0.1) % 0.4  # reduce volume each pass