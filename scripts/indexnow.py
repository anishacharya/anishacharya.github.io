#!/usr/bin/env python3
"""Tell Bing (and every other IndexNow engine) that the site changed.

Run after a push has finished deploying:
    python3 scripts/indexnow.py

Reads the live sitemap and submits every URL in it. IndexNow proves ownership
with a key file served at the site root (<key>.txt in the repo root); the key
is public by design and is not a secret. Google does not use IndexNow; for
Google, resubmit the sitemap in Search Console instead.
"""
import json
import pathlib
import re
import urllib.request

SITE = "https://anishacharya.github.io"
ROOT = pathlib.Path(__file__).resolve().parent.parent


def main():
    keys = [p.stem for p in ROOT.glob("*.txt") if re.fullmatch(r"[0-9a-f]{32}", p.stem)]
    if len(keys) != 1:
        raise SystemExit(f"expected one IndexNow key file in {ROOT}, found {keys}")
    key = keys[0]

    with urllib.request.urlopen(f"{SITE}/sitemap.xml") as r:
        urls = re.findall(r"<loc>([^<]+)</loc>", r.read().decode())

    body = json.dumps({
        "host": SITE.split("://", 1)[1],
        "key": key,
        "keyLocation": f"{SITE}/{key}.txt",
        "urlList": urls,
    }).encode()
    req = urllib.request.Request(
        "https://api.indexnow.org/indexnow",
        data=body,
        headers={"Content-Type": "application/json; charset=utf-8"},
    )
    with urllib.request.urlopen(req) as r:
        print(f"IndexNow: {r.status} for {len(urls)} URLs")


if __name__ == "__main__":
    main()
