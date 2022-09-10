import { randomBetween } from "../instabot/utils.js";

//https://instagram-fonts.top/special-characters-emojis.php
const EMOJIS = [
  "🧡",
  "💚",
  "😍",
  "❤️",
  "❤️",
  "❤️",
  "❤",
  "💪",
  "👍",
  "👏",
  "🙌",
  "🙌",
  "🔥",
  "🔥",
  "🚀",
  "✨",
  "⭐",
  "💫",
];
const MESSAGES = [
  "",
  "+1000 brownie points for this",
  "Amazing artwork",
  "Amazing",
  "Astounding",
  "Awesome",
  "Cool",
  "Damn",
  "Delightfull",
  "Dope",
  "Good art",
  "Good going",
  "Good job! Very nice",
  "Good one",
  "Good work",
  "Gorgeous",
  "Great job",
  "Great work",
  "Great! Always had a sweet tooth for this stuff",
  "Hats of to you",
  "I like your style",
  "I love your style",
  "Impressive art",
  "Impressive artwork",
  "Impressive generation",
  "Impressive",
  "Incredible",
  "Inspiring",
  "Love it",
  "Love the content you generate",
  "Love this AI",
  "Love your work",
  "Marvelous",
  "Nice going",
  "Nice one",
  "Nice render",
  "Nice",
  "Now that's the way to do AI art",
  "Now this is what I call art",
  "Omg, how did u do this?",
  "Omg, i'd hang this on my wall",
  "Perfection",
  "Respects",
  "So beautiful",
  "Stunning art",
  "Stunning artwork",
  "Stunning",
  "This comes right up my alley",
  "This is just breathtaking",
  "This would look so good in my livingroom",
  "U've got it",
  "Well done",
  "Whoa",
  "Wonderful",
  "Wow. Amazing AI",
  "Wow. Just beautiful",
  "Wow. this AI amazes me",
  "WOW",
];
export const getRandomComment = (caption) => {
  var emojis = "";
  var emax = randomBetween(0, 3);
  while (emax--) {
    emojis += EMOJIS[randomBetween(0, EMOJIS.length - 1)];
  }

  var msg = MESSAGES[randomBetween(0, MESSAGES.length - 1)];

  if (msg && msg.indexOf("?") === -1 && msg.indexOf("!") === -1) {
    if (Math.random() < 0.3) msg += "!";
  }

  if (Math.random() < 0.3) msg = msg.toLowerCase();

  msg = msg.trim();

  var full_msg = msg;
  if (Math.random() > 0.75) {
    full_msg = msg + " " + emojis;
  } else {
    full_msg = emojis + " " + msg;
  }
  full_msg = full_msg.trim();
  if (!full_msg) return "Awesome work";

  return full_msg.trim();
};
