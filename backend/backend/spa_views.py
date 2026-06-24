import mimetypes
from pathlib import Path

from django.http import FileResponse, Http404
from django.conf import settings


def _strip_spa_prefix(path: str) -> str:
    """
    Vite builds with base /SEPiCP/ emit asset URLs under /SEPiCP/assets/... .
    Django's URL catch-all receives that as path 'SEPiCP/assets/...' — strip the app segment
    so files resolve under static/site/assets/...
    Uses FORCE_SCRIPT_NAME when set; otherwise strips a leading 'SEPiCP/' for local Waitress tests.
    """
    if not path:
        return path
    mount = (getattr(settings, "FORCE_SCRIPT_NAME", "") or "").strip("/")
    if mount:
        if path == mount or path == mount + "/":
            return ""
        if path.startswith(mount + "/"):
            return path[len(mount) + 1 :]
    # Local dev: Waitress on :8010 without IIS — .env may omit FORCE_SCRIPT_NAME
    if path == "SEPiCP" or path == "SEPiCP/":
        return ""
    if path.startswith("SEPiCP/"):
        return path[len("SEPiCP") + 1 :]
    return path


def spa_catch_all(request, path, document_root):
    """Serve Vite-built files from document_root; unknown paths return index.html for SPA routing."""
    root = Path(document_root).resolve()
    if not root.is_dir():
        raise Http404()
    if path:
        path = _strip_spa_prefix(path)

        candidate = (root / path).resolve()
        try:
            candidate.relative_to(root)
        except ValueError as exc:
            raise Http404() from exc
        if candidate.is_file():
            ctype, _ = mimetypes.guess_type(str(candidate))
            return FileResponse(candidate.open("rb"), content_type=ctype or "application/octet-stream")
    index = root / "index.html"
    if not index.is_file():
        raise Http404()
    return FileResponse(index.open("rb"), content_type="text/html")
