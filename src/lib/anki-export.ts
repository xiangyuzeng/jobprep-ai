// Anki-compatible TSV export generator
// Generates tab-separated values that users can import into Anki

interface BoardForExport {
  company_name: string;
  round_type: string;
  modules: Array<{
    title: string;
    cards: Array<{ num: number; q: string; a: string; qtype: string }>;
  }>;
}

export function generateAnkiExport(board: BoardForExport): string {
  const lines: string[] = [];

  // Anki import configuration headers
  lines.push("#separator:tab");
  lines.push("#html:true");
  lines.push("#tags column:3");

  for (const mod of board.modules) {
    for (const card of mod.cards) {
      if (!card.a) continue; // Skip cards without answers

      const front = escapeHtml(card.q);
      const back = formatAnswerAsHtml(card.a);
      const tags = [
        board.company_name.replace(/\s/g, ""),
        board.round_type,
        mod.title.replace(/[^a-zA-Z0-9]/g, ""),
        card.qtype,
      ].join(" ");

      lines.push(`${front}\t${back}\t${tags}`);
    }
  }

  return lines.join("\n");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\t/g, " ");
}

function formatAnswerAsHtml(answer: string): string {
  return answer
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n\n/g, "<br><br>")
    .replace(/\n/g, "<br>")
    .replace(/\t/g, " ");
}
