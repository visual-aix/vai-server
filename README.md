This will serve local files & folders specified by `serve` parameter on `port`.

```
node index --serve D:\Design\ig\challenges\ --port 8088
```

To use `instabot` feature you need to launch [instagrapi-rest](https://github.com/visual-aix/instagrapi-rest).

```
cd D:\Design\ig\instagrapi-rest\instagrapi-rest
python3 -m uvicorn main:app --host 0.0.0.0 --port 8001

REST InstagrAPI Docs http://localhost:8001/docs#/
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
