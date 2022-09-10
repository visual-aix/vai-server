import sleep from "sleep-promise";

export const randomBetween = (min, max) => {
  return Math.floor(min + Math.random() * (max - min + 1));
};

export const smartsleep = (fromInSeconds, toInSeconds) =>
  sleep(1000 * randomBetween(fromInSeconds, toInSeconds));
