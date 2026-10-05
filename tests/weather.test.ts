import test from "node:test";
import assert from "node:assert/strict";
import { normalizeForecast, weatherCondition } from "../src/lib/weather";
test("weather groups Utah days, converts temperatures and preserves missing values", () => {
  const raw = {
    properties: {
      generatedAt: "2026-10-04T12:00:00-06:00",
      periods: [
        {
          startTime: "2026-10-04T12:00:00-06:00",
          isDaytime: true,
          temperature: 20,
          temperatureUnit: "C",
          shortForecast: "Sunny",
          windSpeed: "5 to 10 mph",
          probabilityOfPrecipitation: { value: null },
        },
        {
          startTime: "2026-10-04T18:00:00-06:00",
          isDaytime: false,
          temperature: 30,
          temperatureUnit: "F",
          shortForecast: "Chance Rain And Snow",
          windSpeed: "12 mph",
          probabilityOfPrecipitation: { value: 60 },
        },
      ],
    },
  };
  const result = normalizeForecast(raw, new Date("2026-10-05T01:00:00Z"));
  assert.equal(result.days.length, 7);
  assert.equal(result.days[0].date, "2026-10-04");
  assert.equal(result.days[0].high, 68);
  assert.equal(result.days[0].low, 30);
  assert.equal(result.days[0].chance, 60);
  assert.equal(result.days[0].wind, 12);
  assert.equal(result.days[0].kind, "snow");
  assert.equal(result.days[1].chance, null);
  assert.equal(result.days[1].high, null);
  assert.throws(() => normalizeForecast(raw, new Date("2026-11-01T12:00:00Z")));
  assert.throws(() => normalizeForecast({}));
  assert.equal(weatherCondition("Thunderstorms").kind, "storm");
  assert.equal(weatherCondition("Patchy Fog").kind, "fog");
});
