#define TRIG_PIN 9
#define ECHO_PIN 10

const int MAX_DISTANCE_CM = 400;
const int MIN_DISTANCE_CM = 2;

unsigned long duration;
float distanceCm;
int intensity;

void setup() {
  Serial.begin(9600);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  digitalWrite(TRIG_PIN, LOW);
  delay(500);

  Serial.println("======================================");
  Serial.println("  ULTRASONIC SENSOR MONITOR");
  Serial.println("======================================");
  Serial.println("Distance | Echo(us) | Intensity | Status");
  Serial.println("--------------------------------------");
}

void loop() {
  // Trigger ultrasonic pulse
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);

  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // Measure echo, timeout after 30 ms
  duration = pulseIn(ECHO_PIN, HIGH, 30000UL);

  if (duration == 0) {
    Serial.println("No echo   | ---      | ---       | Out of range");
  } else {
    // Convert echo time to distance in centimetres
    distanceCm = duration * 0.0343 / 2.0;

    Serial.print(distanceCm, 1);
    Serial.print(" cm     | ");

    Serial.print(duration);
    Serial.print("      | ");

    if (distanceCm >= MIN_DISTANCE_CM &&
        distanceCm <= MAX_DISTANCE_CM) {

      // Estimated proximity score, NOT actual echo strength
      intensity = map(
        constrain((int)distanceCm, MIN_DISTANCE_CM, MAX_DISTANCE_CM),
        MAX_DISTANCE_CM, MIN_DISTANCE_CM, 0, 100
      );

      Serial.print(intensity);
      Serial.print("%        | ");

      if (distanceCm < 10) {
        Serial.println("Very Close");
      } else if (distanceCm < 30) {
        Serial.println("Close");
      } else if (distanceCm < 100) {
        Serial.println("Medium");
      } else {
        Serial.println("Far");
      }
    } else {
      Serial.println("---       | Outside range");
    }
  }

  delay(250);
}