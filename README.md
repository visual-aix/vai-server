This will serve local files & folders specified by `serve` parameter on `port`.

```
node index --serve D:\Design\ig\challenges\ --port 8088
```

---

To configure instagram automation store this json in `data/credentials.json`

```
{
  "username": "insta-login",
  "password": "your-password"
}
```

Run `GET /instabot/login` to start your instagram session.

Run `GET /instabot/clean` to unfollow people that do not follow back.

Run `GET /instabot/engage` to start engaging with similar content.

---

To develop with node monitor

```
nodemon
```
