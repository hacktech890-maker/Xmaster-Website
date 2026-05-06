import sys
import os
import pyperclip

def get_lang(path):
    ext = os.path.splitext(path)[1]
    return {
        ".jsx": "jsx", ".tsx": "tsx", ".js": "javascript",
        ".ts": "typescript", ".py": "python", ".css": "css",
        ".html": "html", ".json": "json", ".md": "markdown",
        ".env": "bash", ".sh": "bash", ".txt": "text"
    }.get(ext, "")

def format_file(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            code = f.read()
        lang = get_lang(path)
        return f"File: {path}\n\n```{lang}\n{code}\n```"
    except FileNotFoundError:
        return f"[ERROR: File not found — {path}]"
    except Exception as e:
        return f"[ERROR reading {path}: {e}]"

def main():
    # --- Mode 1: Pass file paths as arguments ---
    # python copy_files.py src/App.jsx src/index.js
    if len(sys.argv) > 1:
        paths = sys.argv[1:]

    # --- Mode 2: Read from files.txt in project root ---
    # One file path per line in files.txt
    elif os.path.exists("files.txt"):
        with open("files.txt") as f:
            paths = [l.strip() for l in f if l.strip()]
    else:
        print("Usage: python copy_files.py file1 file2 ...")
        print("   OR: create files.txt with one path per line")
        sys.exit(1)

    # --- One-shot mode: copy ALL files at once ---
    if "--all" in paths:
        paths.remove("--all")
        combined = "\n\n---\n\n".join(format_file(p) for p in paths)
        pyperclip.copy(combined)
        print(f"✓ All {len(paths)} files copied to clipboard!")
        return

    # --- Step mode: press Enter to copy next file ---
    for i, path in enumerate(paths):
        content = format_file(path)
        pyperclip.copy(content)
        print(f"\n[{i+1}/{len(paths)}] Copied to clipboard: {path}")
        print("  → Paste into AI, then press Enter for next file...")
        if i < len(paths) - 1:
            input()
    print("\n✓ All files done!")

if __name__ == "__main__":
    main()