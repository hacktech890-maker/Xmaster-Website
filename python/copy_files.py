import sys
import os
import pyperclip

# ─── Always resolve paths relative to THIS script's location ───────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

def get_lang(path):
    ext = os.path.splitext(path)[1].lower()
    return {
        ".jsx": "jsx", ".tsx": "tsx", ".js": "javascript",
        ".ts": "typescript", ".py": "python", ".css": "css",
        ".html": "html", ".json": "json", ".md": "markdown",
        ".env": "bash", ".sh": "bash", ".txt": "text"
    }.get(ext, "")

def resolve_path(path):
    """
    Resolve a path that may be:
    - absolute            →  use as-is
    - relative like ../   →  resolve from SCRIPT_DIR
    - plain src/foo.jsx   →  resolve from SCRIPT_DIR
    """
    if os.path.isabs(path):
        return path
    return os.path.normpath(os.path.join(SCRIPT_DIR, path))

def format_file(raw_path):
    path = resolve_path(raw_path)
    try:
        with open(path, "r", encoding="utf-8") as f:
            code = f.read()
        lang = get_lang(path)
        return f"File: {raw_path}\n\n```{lang}\n{code}\n```", True
    except FileNotFoundError:
        return f"[ERROR: File not found — {path}]", False
    except Exception as e:
        return f"[ERROR reading {path}: {e}]", False

def find_files_txt():
    """
    Look for files.txt in multiple likely locations so the script
    works no matter where you run it from.
    """
    candidates = [
        os.path.join(SCRIPT_DIR, "files.txt"),          # next to script  ← most likely
        os.path.join(os.getcwd(), "files.txt"),          # current dir
        os.path.join(SCRIPT_DIR, "files.txt.txt"),       # Windows hidden-ext trap
        os.path.join(os.getcwd(), "files.txt.txt"),
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    return None

def load_paths_from_file(fpath):
    with open(fpath, "r", encoding="utf-8") as f:
        return [l.strip() for l in f if l.strip() and not l.startswith("#")]

def main():
    args = sys.argv[1:]

    # ── extract flags ──────────────────────────────────────────────────────
    save_mode    = "--save"    in args
    combine_mode = "--combine" in args
    all_mode     = "--all"     in args
    debug_mode   = "--debug"   in args
    paths_from_args = [a for a in args if not a.startswith("--")]

    # ── resolve where paths come from ─────────────────────────────────────
    if paths_from_args:
        paths = paths_from_args
        source = "command-line arguments"
    else:
        ftxt = find_files_txt()
        if ftxt:
            paths = load_paths_from_file(ftxt)
            source = ftxt
        else:
            print("❌  Could not find files.txt anywhere near the script.")
            print(f"    Script lives in: {SCRIPT_DIR}")
            print("    Create files.txt there with one path per line.")
            sys.exit(1)

    if debug_mode or len(paths) == 0:
        print(f"\n── DEBUG ────────────────────────────────────────")
        print(f"Script dir  : {SCRIPT_DIR}")
        print(f"Working dir : {os.getcwd()}")
        print(f"Path source : {source}")
        print(f"Paths found : {len(paths)}")
        for p in paths[:5]:
            resolved = resolve_path(p)
            exists   = "✅" if os.path.exists(resolved) else "❌"
            print(f"  {exists}  {p}  →  {resolved}")
        if len(paths) > 5:
            print(f"  ... and {len(paths)-5} more")
        print(f"────────────────────────────────────────────────\n")
        if len(paths) == 0:
            sys.exit(1)

    # ── save each file as its own .md ──────────────────────────────────────
    if save_mode:
        out_dir = os.path.join(SCRIPT_DIR, "output_files")
        os.makedirs(out_dir, exist_ok=True)
        ok = 0
        for p in paths:
            content, success = format_file(p)
            safe = p.replace("/", "_").replace("\\", "_") + ".md"
            with open(os.path.join(out_dir, safe), "w", encoding="utf-8") as f:
                f.write(content)
            print(f"  {'✓' if success else '✗'}  {p}")
            if success: ok += 1
        print(f"\n✓ {ok}/{len(paths)} files saved to '{out_dir}/'")
        return

    # ── combine all into one file ──────────────────────────────────────────
    if combine_mode:
        out_dir = os.path.join(SCRIPT_DIR, "output_files")
        os.makedirs(out_dir, exist_ok=True)
        parts = []
        ok = 0
        for p in paths:
            content, success = format_file(p)
            parts.append(content)
            print(f"  {'✓' if success else '✗'}  {p}")
            if success: ok += 1
        out_path = os.path.join(out_dir, "all_files.md")
        with open(out_path, "w", encoding="utf-8") as f:
            f.write("\n\n---\n\n".join(parts))
        print(f"\n✓ {ok}/{len(paths)} combined into '{out_path}'")
        return

    # ── copy ALL to clipboard at once ─────────────────────────────────────
    if all_mode:
        parts = []
        ok = 0
        for p in paths:
            content, success = format_file(p)
            parts.append(content)
            print(f"  {'✓' if success else '✗'}  {p}")
            if success: ok += 1
        pyperclip.copy("\n\n---\n\n".join(parts))
        print(f"\n✓ {ok}/{len(paths)} files copied to clipboard!")
        return

    # ── default: step-through mode ────────────────────────────────────────
    for i, p in enumerate(paths):
        content, success = format_file(p)
        if success:
            pyperclip.copy(content)
        print(f"\n[{i+1}/{len(paths)}] {'Copied' if success else 'FAILED'}: {p}")
        if not success:
            print(f"  {content}")
        if i < len(paths) - 1:
            print("  → Paste into AI, then press Enter for next file...")
            input()
    print("\n✓ Done!")

if __name__ == "__main__":
    main()
