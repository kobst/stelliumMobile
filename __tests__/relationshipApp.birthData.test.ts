import {
  getEpochSeconds,
  isValidDate,
  isValidTime,
  parseNumberInput,
} from '../RelationshipApp/src/utils/birthData';

describe('relationship app birth data helpers', () => {
  test('validates ISO-like dates with real calendar values', () => {
    expect(isValidDate('2024-02-29')).toBe(true);
    expect(isValidDate('2023-02-29')).toBe(false);
    expect(isValidDate('2024-2-29')).toBe(false);
    expect(isValidDate('not-a-date')).toBe(false);
  });

  test('validates 24 hour time strings', () => {
    expect(isValidTime('00:00')).toBe(true);
    expect(isValidTime('23:59')).toBe(true);
    expect(isValidTime('24:00')).toBe(false);
    expect(isValidTime('9:30')).toBe(false);
  });

  test('parses number input and rejects blanks', () => {
    expect(parseNumberInput('40.7128')).toBe(40.7128);
    expect(parseNumberInput('-74')).toBe(-74);
    expect(parseNumberInput('')).toBeNull();
    expect(parseNumberInput('   ')).toBeNull();
    expect(parseNumberInput('abc')).toBeNull();
  });

  test('derives epoch seconds in UTC instead of device local time', () => {
    expect(getEpochSeconds('1970-01-01', '00:00')).toBe(0);
    expect(getEpochSeconds('1970-01-01', '12:34')).toBe(45240);
    expect(getEpochSeconds('2024-02-29', '06:45')).toBe(
      Math.floor(Date.UTC(2024, 1, 29, 6, 45, 0) / 1000)
    );
  });
});
