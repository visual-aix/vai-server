const ai_keywords = [
  "MidJourney",
  "Mid Journey",
  "StableDiffusion",
  "Stable Diffusion",
  "Dalle",
  "Dall-e",
  "Digital Art",
  "digital.art",
  "daydream",
];
export const isAiArtUser = (user) => {
  if (user.full_name.indexOf("AI") > -1) return true;
  if (user.username.toLowerCase().indexOf("ai") > -1) return true;

  var name = user.full_name.toLowerCase();
  var uname = user.username.toLowerCase();
  for (let kw of ai_keywords) {
    if (name.indexOf(kw.toLowerCase()) > -1) return true;
    if (uname.indexOf(kw.toLowerCase()) > -1) return true;
  }

  if (user.biography) {
    if (user.biography.indexOf("AI") > -1) return true;

    var bio = user.biography.toLowerCase();
    for (let kw of ai_keywords) {
      if (bio.indexOf(kw.toLowerCase()) > -1) return true;
    }
  }

  return false;
};
