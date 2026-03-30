from __future__ import annotations

import re
from datetime import datetime
from pathlib import Path

from fpdf import FPDF

ROOT = Path(__file__).resolve().parents[1]
INPUT_MD = ROOT / "HACKATHON_JUDGE_QUESTIONS.md"
OUTPUT_PDF = ROOT / "HACKATHON_JUDGE_QUESTIONS.pdf"


def ascii_safe(text: str) -> str:
    """Remove characters not supported by core PDF fonts."""
    # Keep printable ASCII and common whitespace.
    return "".join(ch for ch in text if ch == "\n" or ch == "\t" or 32 <= ord(ch) <= 126)


class QAPdf(FPDF):
    def header(self) -> None:
        if self.page_no() == 1:
            return
        self.set_font("Helvetica", "", 9)
        self.set_text_color(90, 90, 90)
        self.cell(0, 8, "Money Mule Detection Engine - Hackathon Judge Q&A", align="R")
        self.ln(2)

    def footer(self) -> None:
        self.set_y(-12)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(90, 90, 90)
        self.cell(0, 8, f"Page {self.page_no()}", align="C")


def add_cover_page(pdf: QAPdf) -> None:
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)

    pdf.set_font("Helvetica", "B", 22)
    pdf.set_text_color(20, 20, 20)
    pdf.ln(50)
    pdf.multi_cell(0, 12, "Comprehensive Hackathon Judge Questions", align="C")

    pdf.set_font("Helvetica", "", 15)
    pdf.ln(4)
    pdf.multi_cell(0, 9, "Money Mule Detection Engine", align="C")

    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(90, 90, 90)
    pdf.ln(10)
    pdf.multi_cell(0, 7, f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", align="C")

    pdf.set_text_color(20, 20, 20)
    pdf.set_font("Helvetica", "", 11)
    pdf.ln(20)
    pdf.multi_cell(
        0,
        7,
        "This PDF contains structured question-and-answer preparation material "
        "for hackathon judging, organized by technical, product, business, and "
        "operations categories.",
        align="C",
    )


def render_markdown(pdf: QAPdf, content: str) -> None:
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)

    question_pattern = re.compile(r"^(\d+)\.\s+\*\*(.+?)\*\*\s*$")

    for raw_line in content.splitlines():
        line = ascii_safe(raw_line.strip())
        if not line:
            pdf.ln(2)
            continue

        if line.startswith("### "):
            pdf.set_font("Helvetica", "B", 13)
            pdf.set_text_color(20, 45, 100)
            pdf.multi_cell(0, 8, line[4:])
            pdf.set_text_color(20, 20, 20)
            pdf.ln(1)
            continue

        if line.startswith("## "):
            pdf.set_font("Helvetica", "B", 15)
            pdf.set_text_color(10, 30, 85)
            pdf.ln(1)
            pdf.multi_cell(0, 9, line[3:])
            pdf.set_text_color(20, 20, 20)
            pdf.ln(1)
            continue

        if line.startswith("# "):
            pdf.set_font("Helvetica", "B", 17)
            pdf.set_text_color(10, 30, 85)
            pdf.multi_cell(0, 10, line[2:])
            pdf.set_text_color(20, 20, 20)
            pdf.ln(1)
            continue

        if line.startswith("---"):
            y = pdf.get_y()
            pdf.set_draw_color(180, 180, 180)
            pdf.line(12, y + 2, 198, y + 2)
            pdf.ln(5)
            continue

        m = question_pattern.match(line)
        if m:
            num, question = m.groups()
            pdf.set_font("Helvetica", "B", 11)
            pdf.set_text_color(25, 25, 25)
            pdf.multi_cell(0, 7, f"Q{num}. {question}")
            pdf.ln(0.5)
            continue

        if line.startswith("> **Answer**:"):
            answer = line.replace("> **Answer**:", "", 1).strip()
            pdf.set_font("Helvetica", "B", 10)
            pdf.set_text_color(0, 90, 40)
            pdf.multi_cell(0, 6, f"Answer: {answer}")
            pdf.set_text_color(35, 35, 35)
            pdf.ln(1)
            continue

        if line.startswith("- "):
            bullet_text = line[2:].strip()
            pdf.set_font("Helvetica", "", 10)
            pdf.set_text_color(35, 35, 35)
            pdf.cell(5, 6, chr(149))
            pdf.multi_cell(0, 6, bullet_text)
            continue

        # Fallback paragraph rendering.
        pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(35, 35, 35)
        pdf.multi_cell(0, 6, line)


def main() -> None:
    if not INPUT_MD.exists():
        raise FileNotFoundError(f"Missing input file: {INPUT_MD}")

    content = INPUT_MD.read_text(encoding="utf-8", errors="replace")

    pdf = QAPdf(format="A4")
    pdf.set_margins(12, 12, 12)
    pdf.set_title("Hackathon Judge Questions and Answers")
    pdf.set_author("Money Mule Detection Engine Team")

    add_cover_page(pdf)
    render_markdown(pdf, content)

    pdf.output(str(OUTPUT_PDF))
    print(f"Created: {OUTPUT_PDF}")


if __name__ == "__main__":
    main()
