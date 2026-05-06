from __future__ import annotations

import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "PROJECT_DOCUMENTATION.md"
TARGET = ROOT / "PROJECT_DOCUMENTATION.pdf"

PAGE_WIDTH = 595
PAGE_HEIGHT = 842
LEFT_MARGIN = 48
RIGHT_MARGIN = 48
TOP_MARGIN = 52
BOTTOM_MARGIN = 52
LINE_GAP = 5
MAX_WIDTH = PAGE_WIDTH - LEFT_MARGIN - RIGHT_MARGIN


def escape_pdf_text(text: str) -> str:
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def estimate_text_width(text: str, font_size: int) -> float:
    return len(text) * font_size * 0.52


def wrap_text(text: str, font_size: int) -> list[str]:
    stripped = text.rstrip()
    if not stripped:
      return [""]

    words = stripped.split()
    lines: list[str] = []
    current = words[0]

    for word in words[1:]:
        trial = f"{current} {word}"
        if estimate_text_width(trial, font_size) <= MAX_WIDTH:
            current = trial
        else:
            lines.append(current)
            current = word

    lines.append(current)
    return lines


def tokenize_markdown(text: str) -> list[tuple[str, str]]:
    tokens: list[tuple[str, str]] = []
    in_code = False

    for raw_line in text.splitlines():
        line = raw_line.rstrip("\n")

        if line.startswith("```"):
            in_code = not in_code
            continue

        if in_code:
            tokens.append(("code", line))
            continue

        if not line.strip():
            tokens.append(("blank", ""))
            continue

        if line.startswith("### "):
            tokens.append(("h3", line[4:].strip()))
            continue

        if line.startswith("## "):
            tokens.append(("h2", line[3:].strip()))
            continue

        if line.startswith("# "):
            tokens.append(("h1", line[2:].strip()))
            continue

        if re.match(r"^\d+\.\s+", line):
            tokens.append(("list", line.strip()))
            continue

        if line.startswith("- "):
            tokens.append(("list", f"• {line[2:].strip()}"))
            continue

        tokens.append(("p", line))

    return tokens


def render_lines(tokens: list[tuple[str, str]]) -> list[tuple[str, int, str, int]]:
    rendered: list[tuple[str, int, str, int]] = []

    styles = {
        "h1": ("F2", 20, 18),
        "h2": ("F2", 14, 14),
        "h3": ("F2", 12, 12),
        "p": ("F1", 10, 9),
        "list": ("F1", 10, 9),
        "code": ("F3", 9, 9),
    }

    for kind, value in tokens:
        if kind == "blank":
            rendered.append(("blank", 0, "", 8))
            continue

        font_name, font_size, spacing = styles[kind]
        wrapped = wrap_text(value, font_size)
        for line in wrapped:
            rendered.append((font_name, font_size, line, spacing))

        if kind in {"h1", "h2", "h3"}:
            rendered.append(("blank", 0, "", 4))

    return rendered


def paginate(rendered_lines: list[tuple[str, int, str, int]]) -> list[list[tuple[str, int, str, int]]]:
    pages: list[list[tuple[str, int, str, int]]] = []
    current_page: list[tuple[str, int, str, int]] = []
    y = PAGE_HEIGHT - TOP_MARGIN

    for entry in rendered_lines:
        font_name, font_size, text, spacing = entry
        needed = spacing if font_name == "blank" else font_size + spacing
        if y - needed < BOTTOM_MARGIN:
            pages.append(current_page)
            current_page = []
            y = PAGE_HEIGHT - TOP_MARGIN

        current_page.append(entry)
        y -= needed

    if current_page:
        pages.append(current_page)

    return pages


def build_stream(page_lines: list[tuple[str, int, str, int]]) -> bytes:
    y = PAGE_HEIGHT - TOP_MARGIN
    chunks: list[str] = []

    for font_name, font_size, text, spacing in page_lines:
        if font_name == "blank":
            y -= spacing
            continue

        y -= font_size
        escaped = escape_pdf_text(text)
        chunks.append(f"BT /{font_name} {font_size} Tf 1 0 0 1 {LEFT_MARGIN} {y} Tm ({escaped}) Tj ET")
        y -= spacing

    return "\n".join(chunks).encode("latin-1", errors="replace")


def build_pdf(page_streams: list[bytes]) -> bytes:
    objects: list[bytes] = []

    def add_object(data: bytes) -> int:
        objects.append(data)
        return len(objects)

    font_regular = add_object(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    font_bold = add_object(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")
    font_code = add_object(b"<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>")

    page_entries: list[tuple[int, int]] = []
    pages_placeholder = add_object(b"<<>>")

    for stream in page_streams:
        stream_obj = add_object(
            f"<< /Length {len(stream)} >>\nstream\n".encode("latin-1") + stream + b"\nendstream"
        )
        page_obj = add_object(
            (
                f"<< /Type /Page /Parent {pages_placeholder} 0 R "
                f"/MediaBox [0 0 {PAGE_WIDTH} {PAGE_HEIGHT}] "
                f"/Resources << /Font << /F1 {font_regular} 0 R /F2 {font_bold} 0 R /F3 {font_code} 0 R >> >> "
                f"/Contents {stream_obj} 0 R >>"
            ).encode("latin-1")
        )
        page_entries.append((stream_obj, page_obj))

    kids = " ".join(f"{page_obj} 0 R" for _, page_obj in page_entries)
    objects[pages_placeholder - 1] = (
        f"<< /Type /Pages /Count {len(page_entries)} /Kids [{kids}] >>".encode("latin-1")
    )

    catalog = add_object(f"<< /Type /Catalog /Pages {pages_placeholder} 0 R >>".encode("latin-1"))

    pdf = bytearray()
    pdf.extend(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = [0]

    for index, obj in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf.extend(f"{index} 0 obj\n".encode("latin-1"))
        pdf.extend(obj)
        pdf.extend(b"\nendobj\n")

    xref_position = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n".encode("latin-1"))
    pdf.extend(b"0000000000 65535 f \n")

    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode("latin-1"))

    pdf.extend(
        (
            f"trailer\n<< /Size {len(objects) + 1} /Root {catalog} 0 R >>\n"
            f"startxref\n{xref_position}\n%%EOF"
        ).encode("latin-1")
    )
    return bytes(pdf)


def main() -> None:
    markdown = SOURCE.read_text(encoding="utf-8")
    tokens = tokenize_markdown(markdown)
    rendered_lines = render_lines(tokens)
    pages = paginate(rendered_lines)
    streams = [build_stream(page) for page in pages]
    TARGET.write_bytes(build_pdf(streams))
    print(f"Created {TARGET}")


if __name__ == "__main__":
    main()
