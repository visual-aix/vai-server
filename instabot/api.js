import axios from "axios";

const INSTAPI_PATH = "http://localhost:8001";

var sessionid = "";
const INSTAPI = {
  setSession: (sid) => (sessionid = sid),
  login: (username, password) =>
    axios
      .post(
        INSTAPI_PATH + "/auth/login",
        new URLSearchParams({ username, password })
      )
      .then(({ data }) => data),
  getUser: (username) =>
    axios
      .post(
        INSTAPI_PATH + "/user/info_by_username",
        new URLSearchParams({ sessionid, username })
      )
      .then(
        ({
          data: {
            pk,
            username,
            full_name,
            biography,
            category_name,
            follower_count,
            following_count,
            is_private,
          },
        }) => ({
          pk,
          username,
          full_name,
          biography,
          category_name,
          follower_count,
          following_count,
          is_private,
        })
      ),
  getFollowers: (user_id, use_cache = true) =>
    axios
      .post(
        INSTAPI_PATH + "/user/followers",
        new URLSearchParams({ sessionid, user_id, use_cache })
      )
      .then(({ data }) => data),
  getFollowing: (user_id, use_cache = true) =>
    axios
      .post(
        INSTAPI_PATH + "/user/following",
        new URLSearchParams({ sessionid, user_id, use_cache })
      )
      .then(({ data }) => data),
  unfollow: (user_id) =>
    axios
      .post(
        INSTAPI_PATH + "/user/unfollow",
        new URLSearchParams({ sessionid, user_id })
      )
      .then(({ data }) => data),
  getSuggestions: (user_id) =>
    axios
      .post(
        INSTAPI_PATH + "/user/suggestions",
        new URLSearchParams({ sessionid, user_id })
      )
      .then(({ data }) => data),
  getUserMedia: (user_id, count = 15) =>
    axios
      .post(
        INSTAPI_PATH + "/media/user_medias",
        new URLSearchParams({ sessionid, user_id, amount: count })
      )
      .then(({ data }) => data),
  likeMedia: (media_id) =>
    axios
      .post(
        INSTAPI_PATH + "/media/like",
        new URLSearchParams({ sessionid, media_id })
      )
      .then(({ data }) => data),
  commentMedia: (media_id, message) =>
    axios
      .post(
        INSTAPI_PATH + "/media/comment",
        new URLSearchParams({ sessionid, media_id, message })
      )
      .then(({ data }) => data),
  followUser: (user_id) =>
    axios
      .post(
        INSTAPI_PATH + "/user/follow",
        new URLSearchParams({ sessionid, user_id })
      )
      .then(({ data }) => data),
};

export default INSTAPI;
