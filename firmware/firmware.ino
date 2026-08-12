// ATmega32U4 (Micro, Leonardo, Pro Micro)
#if defined(__AVR_ATmega32U4__)
  const int DIGITAL_START = 2;
  const int DIGITAL_END = 16;  // More digital pins available
  const int ANALOG_START = A0;
  const int ANALOG_END = A5;
  const int ANALOG_OFFSET = 18; // Offset for unique ID generation

// ATmega328P (Uno, Nano, Mini Pro)
#else
  const int DIGITAL_START = 2;
  const int DIGITAL_END = 13;
  const int ANALOG_START = A0;
  const int ANALOG_END = A5;
  const int ANALOG_OFFSET = 14; 
#endif

int lastPinState[24]; // Increased size to support Micro/Leonardo (approx 20 pins max used)

int analogToDigital(int analogPin) {
  return analogPin - A0 + ANALOG_OFFSET;
}

void setup() {
  Serial.begin(9600);
  
  for (int i = DIGITAL_START; i <= DIGITAL_END; i++) {
    pinMode(i, INPUT_PULLUP);
    lastPinState[i - DIGITAL_START] = HIGH;
  }
  
  for (int i = ANALOG_START; i <= ANALOG_END; i++) {
    pinMode(i, INPUT_PULLUP);
    int index = (DIGITAL_END - DIGITAL_START + 1) + (i - ANALOG_START);
    lastPinState[index] = HIGH;
  }
  
  Serial.println("DeckThing Firmware Ready");
}

void loop() {
  for (int i = DIGITAL_START; i <= DIGITAL_END; i++) {
    int index = i - DIGITAL_START;
    int currentState = digitalRead(i);
    
    if (currentState == LOW && lastPinState[index] == HIGH) {
      Serial.print("BTN_");
      Serial.println(i);
      lastPinState[index] = LOW;
    }
    else if (currentState == HIGH && lastPinState[index] == LOW) {
      lastPinState[index] = HIGH;
    }
  }
  
  for (int i = ANALOG_START; i <= ANALOG_END; i++) {
    int index = (DIGITAL_END - DIGITAL_START + 1) + (i - ANALOG_START);
    int currentState = digitalRead(i);
    
    if (currentState == LOW && lastPinState[index] == HIGH) {
      int pinNumber = analogToDigital(i);
      Serial.print("BTN_");
      Serial.println(pinNumber);
      lastPinState[index] = LOW;
    }
    else if (currentState == HIGH && lastPinState[index] == LOW) {
      lastPinState[index] = HIGH;
    }
  }
  
  delay(10);
}

