#!/usr/bin/env python3
"""
upload-media.py: put click-to-play videos on media.evancuttic.com (Cloudflare R2).

Click-to-play videos (trailers, spots) are not deployed with the site. They live
in the R2 bucket "evancuttic-media", at the same path they have under images/:

    images/portfolio/x/y.mp4  ->  https://media.evancuttic.com/portfolio/x/y.mp4

js/main.js (galleries) and projects/av-motion.html already point there, and
static <video src> tags use the full https://media.evancuttic.com/... address.
Self-playing loops (*.loop.mp4 and data-autoplay videos) stay in the site.

Usage, from the site folder:
    python3 scripts/upload-media.py images/portfolio/art-direction/av-motion/netflix/11-New-Trailer.mp4 [more files...]

Then list the file in .gitignore (section "Served from media.evancuttic.com")
so it isn't deployed, and run "Update Images.command" if it belongs to a gallery.

Needs: pip3 install boto3
Credentials: read from the macOS Keychain (account "evancuttic-media"; services
r2-access-key-id, r2-secret-access-key, r2-endpoint). Never put them in a file.
"""
import os, subprocess, sys, urllib.parse, urllib.request

try:
    import boto3
    from boto3.s3.transfer import TransferConfig
except ImportError:
    sys.exit("boto3 is missing. Run: pip3 install boto3")

BUCKET = "evancuttic-media"
PUBLIC = "https://media.evancuttic.com"


def keychain(name):
    return subprocess.run(
        ["security", "find-generic-password", "-a", BUCKET, "-s", name, "-w"],
        capture_output=True, text=True, check=True).stdout.strip()


def main(paths):
    if not paths:
        sys.exit(__doc__)
    client = boto3.client(
        "s3", endpoint_url=keychain("r2-endpoint").rstrip("/"),
        aws_access_key_id=keychain("r2-access-key-id"),
        aws_secret_access_key=keychain("r2-secret-access-key"), region_name="auto")
    cfg = TransferConfig(multipart_threshold=16 << 20, multipart_chunksize=16 << 20)
    for path in paths:
        path = os.path.normpath(path)
        if not path.startswith("images" + os.sep):
            sys.exit(f"{path}: give the path from the site folder, starting with images/")
        key = path[len("images/"):].replace(os.sep, "/")
        client.upload_file(path, BUCKET, key, Config=cfg, ExtraArgs={
            "ContentType": "video/mp4",
            "CacheControl": "public, max-age=86400, stale-while-revalidate=604800"})
        url = PUBLIC + "/" + urllib.parse.quote(key)
        head = urllib.request.urlopen(urllib.request.Request(url, method="HEAD"))
        same = int(head.headers["Content-Length"]) == os.path.getsize(path)
        print(("OK   " if same else "SIZE MISMATCH  ") + url)


if __name__ == "__main__":
    main(sys.argv[1:])
