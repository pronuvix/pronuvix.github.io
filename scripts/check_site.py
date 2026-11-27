import pathlib
from html.parser import HTMLParser
from urllib.parse import urlsplit
root = pathlib.Path(__file__).resolve().parents[1]
errors = []
class Page(HTMLParser):
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        for key in ("href", "src"):
            value = attrs.get(key, "")
            if not value or value.startswith(("#", "data:", "mailto:", "tel:")):
                continue
            url = urlsplit(value)
            if url.scheme or url.netloc:
                continue
            target = root / url.path.lstrip("/") if url.path.startswith("/") else self.path.parent / url.path
            if target.is_dir():
                target /= "index.html"
            if not target.is_file():
                errors.append(f"{self.path.relative_to(root)}: missing {value}")
for path in root.rglob("*.html"):
    parser = Page()
    parser.path = path
    parser.feed(path.read_text(encoding="utf-8"))
if errors:
    raise SystemExit("\n".join(errors))
print("Local HTML links and assets verified.")
