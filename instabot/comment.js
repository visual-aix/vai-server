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
  "Hats off to you",
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
  "Omg, how did you do this?",
  "Perfection",
  "Respects",
  "So beautiful",
  "Stunning art",
  "Stunning artwork",
  "Stunning",
  "This comes right up my alley",
  "This is just breathtaking",
  "This would look awesome in my livingroom",
  "U've got it",
  "Well done",
  "Whoa",
  "Wonderful",
  "Wow. Amazing AI",
  "Wow. Just beautiful",
  "Wow. this AI amazes me",
  "WOW",
];

const getRandomComment = (to_user, caption) => {
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
  if (Math.random() < 0.75) {
    full_msg = msg + " " + emojis;
  } else {
    full_msg = emojis + " " + msg;
  }
  full_msg = full_msg.trim();
  if (!full_msg) return "Awesome work";

  return full_msg.trim();
};

var users = {};
export const getComment = (to_user, caption) => {
  users[to_user] = users[to_user] || [];
  var user_comments = users[to_user];

  var comment = getRandomComment(to_user, caption);
  var text = removeEmoji(comment).trim();
  while (user_comments.indexOf(text) > -1) {
    comment = getRandomComment(to_user, caption);
    text = removeEmoji(comment).split("!").join(" ").trim().toLowerCase();
  }

  user_comments.push(text);
  return comment;
};

function removeEmoji(str) {
  let strCopy = str;
  const emojiKeycapRegex = /[\u0023-\u0039]\ufe0f?\u20e3/g;
  const emojiRegex = /\p{Extended_Pictographic}/gu;
  const emojiComponentRegex = /\p{Emoji_Component}/gu;
  if (emojiKeycapRegex.test(strCopy)) {
    strCopy = strCopy.replace(emojiKeycapRegex, "");
  }
  if (emojiRegex.test(strCopy)) {
    strCopy = strCopy.replace(emojiRegex, "");
  }
  if (emojiComponentRegex.test(strCopy)) {
    // eslint-disable-next-line no-restricted-syntax
    for (const emoji of strCopy.match(emojiComponentRegex) || []) {
      if (/[\d|*|#]/.test(emoji)) {
        continue;
      }
      strCopy = strCopy.replace(emoji, "");
    }
  }

  return strCopy;
}
