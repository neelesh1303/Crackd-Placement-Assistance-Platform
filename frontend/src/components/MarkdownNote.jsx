// Renders the assistant's Markdown answer (headings, bullet/numbered lists, **bold**, *italic*, `code`)
// as notebook-styled React elements. Builds elements directly — no raw HTML is injected.

const INLINE = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*\s][^*]*\*|_[^_\s][^_]*_)/g;

function renderInline(text, keyPrefix) {
  return text.split(INLINE).filter(Boolean).map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"))) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={key} className="md-code">{part.slice(1, -1)}</code>;
    }
    if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) {
      return <em key={key} className="serif text-[1.1em]">{part.slice(1, -1)}</em>;
    }
    // drop any stray, unpaired markers
    return part.replace(/\*\*|__/g, "");
  });
}

// Turn the raw text into blocks: headings, paragraphs and lists (with nesting levels).
function parse(text) {
  const blocks = [];
  let para = [];
  let list = null;

  const flushPara = () => {
    if (para.length) blocks.push({ type: "p", text: para.join(" ") });
    para = [];
  };
  const flushList = () => {
    if (list) blocks.push(list);
    list = null;
  };

  text.replace(/\r\n/g, "\n").split("\n").forEach((raw) => {
    const line = raw.replace(/\t/g, "    ");
    if (!line.trim()) {
      flushPara();
      flushList();
      return;
    }

    const heading = line.match(/^\s*#{1,6}\s+(.*)$/);
    if (heading) {
      flushPara();
      flushList();
      blocks.push({ type: "h", text: heading[1].replace(/#+\s*$/, "") });
      return;
    }

    const bullet = line.match(/^(\s*)[*\-+•]\s+(.*)$/);
    const numbered = line.match(/^(\s*)(\d+)[.)]\s+(.*)$/);
    if (bullet || numbered) {
      flushPara();
      const indent = (bullet || numbered)[1].length;
      const item = {
        level: Math.min(Math.floor(indent / 2), 3),
        marker: numbered ? `${numbered[2]}.` : null,
        text: bullet ? bullet[2] : numbered[3],
      };
      if (!list) list = { type: "list", items: [] };
      list.items.push(item);
      return;
    }

    // a continuation line under a list item gets appended to it
    if (list && /^\s+/.test(line)) {
      list.items[list.items.length - 1].text += ` ${line.trim()}`;
      return;
    }

    flushList();
    para.push(line.trim());
  });

  flushPara();
  flushList();
  return blocks;
}

function MarkdownNote({ text }) {
  const blocks = parse(text || "");

  return (
    <div className="md">
      {blocks.map((block, i) => {
        if (block.type === "h") {
          return (
            <h3 key={i} className="md-h">
              <span className="hl">{renderInline(block.text, `h${i}`)}</span>
            </h3>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={i} className="md-list">
              {block.items.map((item, j) => (
                <li key={j} className="md-li" style={{ "--lvl": item.level }}>
                  <span className="md-marker" aria-hidden="true">
                    {item.marker || (item.level === 0 ? "—" : "·")}
                  </span>
                  <span>{renderInline(item.text, `l${i}-${j}`)}</span>
                </li>
              ))}
            </ul>
          );
        }
        return <p key={i} className="md-p">{renderInline(block.text, `p${i}`)}</p>;
      })}
    </div>
  );
}

export default MarkdownNote;
