import math
from array import array
from machine import I2S, Pin
from utime import ticks_ms, ticks_diff, sleep_ms, sleep_us

# ADC 1
SCK_PIN = 20
WS_PIN = 21
SD_PIN = 22

# BUTTONS
BUTTON_PINS = [2, 3, 4, 5, 6, 7, 8]
BUTTON_PULL = Pin.PULL_DOWN

# AUDIO STUFF
SAMPLE_RATE = 22050
BUFFER_FRAMES = 256
MAX_AMPLITUDE = 0.5

# Frequencies for the notes
notes = [440.0, 554.37, 659.25, 783.99, 880.0, 987.77, 1046.5]


# Function to create the I2S connection
def create_i2s():
    return I2S(
        0,
        sck=Pin(SCK_PIN),
        ws=Pin(WS_PIN),
        sd=Pin(SD_PIN),
        mode=I2S.TX,
        bits=16,
        format=I2S.STEREO,
        rate=SAMPLE_RATE,
        ibuf=BUFFER_FRAMES * 4,
    )

# Function to create the button connections based on the button pin array
def create_buttons():
    return [Pin(pin, Pin.IN, pull=BUTTON_PULL) for pin in BUTTON_PINS]

# Function to read all the buttons
def read_buttons(buttons):
    pressed = []
    for index, button in enumerate(buttons):
        if button.value():
            pressed.append(index)
    return pressed

# Generate waveform based on the preset name
def voice_func(phase, presetName):
    if presetName == "sine":
        return math.sin(phase)
    elif presetName == "square":
        return 1.0 if phase < math.pi else -1.0
    elif presetName == "sawtooth":
        return (phase / math.pi) - 1.0
    elif presetName == "triangle":
        return 2.0 * abs((phase / math.pi) - 1.0) - 1.0
    else:
        return math.sin(phase)
    

# Voice class, representing a single audio voice sound
class Voice:
    def __init__(self, freq, ampl, presetName):
        self.freq = freq
        self.ampl = ampl
        self.presetName = presetName
        self.phase = 0.0
        self.phase_inc = 2.0 * math.pi * self.freq / SAMPLE_RATE

    def sample(self):
        value = voice_func(self.phase, self.presetName) * self.ampl
        self.phase += self.phase_inc
        if self.phase >= 2.0 * math.pi:
            self.phase -= 2.0 * math.pi
        return value

# Turn individual voices into an audio buffer we can send over I2S
def render_frame(voices):
    buffer = array('h', [0] * (BUFFER_FRAMES * 2)) 
    for frame in range(BUFFER_FRAMES):
        mix = 0.0
        for voice in voices:
            mix += voice.sample()
        sample = int(mix * MAX_AMPLITUDE * 32767)
        if sample > 32767:
            sample = 32767
        elif sample < -32768:
            sample = -32768
        buffer[frame * 2] = sample
        buffer[frame * 2 + 1] = sample
    return buffer


def main():
    i2s = create_i2s()
    buttons = create_buttons()
    voices = []

    try:
        while True:
            pressed = read_buttons(buttons)
            if pressed:
                voices = [Voice(notes[index], 0.3, "sine") for index in pressed]
                print(f"Pressed buttons: {pressed}, Voices: {[voice.freq for voice in voices]}")
            else:
                now = ticks_ms()


            buffer = render_frame(voices)
            i2s.write(buffer)
            print(ticks_ms())
            sleep_us(1000)
    finally:
        i2s.deinit()


main()