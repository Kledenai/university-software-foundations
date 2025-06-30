function openModal() {
  document.getElementById("myModal").style.display = "block";
}

function closeModal() {
  document.getElementById("myModal").style.display = "none";
}

const input = document.getElementById("terminal-input");
const output = document.getElementById("terminal-output");
const suggestionBox = document.getElementById("suggestion");

function escapeHTML(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const formatters = {
  text: (data) =>
    data.map((d) => (typeof d === "object" ? Object.values(d).join(" ") : d)).join("\n"),

  json: (data) => JSON.stringify(data, null, 2),

  csv: (data) => {
    if (typeof data[0] === "object") {
      const keys = Object.keys(data[0]);
      const header = `"${keys.join('","')}"`;
      const rows = data.map((d) =>
        `"${keys.map((key) => String(d[key] || "").replace(/"/g, '""')).join('","')}"`
      );
      return [header, ...rows].join("\n");
    }
    return data.map((d, i) => `"${i + 1}","${d}"`).join("\n");
  },

  xml: (data, root = "data") => {
    const indent = (level) => "  ".repeat(level);
    let result = `<?xml version="1.0" encoding="UTF-8"?>\n<${root}>\n`;

    data.forEach((item, i) => {
      if (item.title) {
        result += `${indent(1)}<item id="${i + 1}" emoji="${item.emoji}">${item.title}</item>\n`;
      } else if (item.name) {
        result += `${indent(1)}<person>\n`;
        result += `${indent(2)}<name>${item.name}</name>\n`;
        result += `${indent(2)}<alias>${item.alias}</alias>\n`;
        result += `${indent(2)}<profession>${item.profession}</profession>\n`;
        result += `${indent(2)}<description>${item.description}</description>\n`;
        result += `${indent(2)}<github>${item.github}</github>\n`;
        result += `${indent(2)}<linkedin>${item.linkedin}</linkedin>\n`;
        result += `${indent(1)}</person>\n`;
      } else if (item.country) {
        result += `${indent(1)}<country emoji="${item.emoji}">${item.country}</country>\n`;
      } else {
        result += `${indent(1)}<item id="${i + 1}">${item}</item>\n`;
      }
    });

    result += `</${root}>`;
    return result;
  },
};

function parseCommand(inputText) {
  const [cmd, ...flags] = inputText.split(/\s+/);
  const formatFlag = flags.find((f) => f.startsWith("--output="));
  const format = formatFlag ? formatFlag.split("=")[1].toLowerCase() : "text";
  return { cmd, format };
}

const commands = {
  help: () => `
    <strong>Comandos disponíveis:</strong>

    - <strong>help</strong>
      Exibe esta lista de comandos com explicações detalhadas.

    - <strong>about [--output=json|xml|csv|text]</strong>
      Mostra informações pessoais sobre o autor.

    - <strong>hobbies [--output=json|xml|csv|text]</strong>
      Lista os hobbies favoritos.

    - <strong>countries [--output=json|xml|csv|text]</strong>
      Mostra países que gostaria de visitar.

    - <strong>clear</strong>
      Limpa completamente o terminal (histórico da sessão).
  `,

  about: (format) => {
    const data = [
      {
        name: "Bruno Rocha",
        alias: "Kledenai",
        profession: "Engenheiro de Software",
        description:
          "Especialista em desenvolvimento backend e automações complexas. Atua com Node.js, TypeScript, Terraform, Kubernetes, AWS e Azure. Desenvolve soluções autorais unindo lógica, arte e filosofia.",
        github: "https://github.com/Kledenai",
        linkedin: "https://www.linkedin.com/in/bruno-rocha/",
      },
    ];
    return formatters[format] ? formatters[format](data, "about") : formatters.text(data);
  },

  hobbies: (format) => {
    const data = [
      { title: "Desenvolvimento criativo", emoji: "🧠" },
      { title: "Escrita filosófica", emoji: "📚" },
      { title: "Design e experiências visuais", emoji: "🎨" },
    ];
    return formatters[format] ? formatters[format](data, "hobbies") : formatters.text(data);
  },

  countries: (format) => {
    const data = [
      { country: "Estados Unidos", emoji: "🇺🇸" },
      { country: "Canadá", emoji: "🇨🇦" },
      { country: "Argentina", emoji: "🇦🇷" },
    ];
    return formatters[format] ? formatters[format](data, "countries") : formatters.text(data);
  },

  clear: () => {
    output.innerHTML = "";
    return "";
  },
};

const history = [];
let historyIndex = -1;

input.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    const raw = input.value.trim();
    if (raw) {
      history.push(raw);
      historyIndex = history.length;
    }

    const { cmd, format } = parseCommand(raw);
    output.innerHTML += `<div><span class="prompt">$</span> ${raw}</div>`;

    if (commands[cmd]) {
      const result = commands[cmd](format);
      if (result) {
        const isXML = format === "xml";
        output.innerHTML += `<div><pre>${isXML ? escapeHTML(result) : result}</pre></div>`;
      }
    } else {
      output.innerHTML += `<div>Comando não reconhecido. Digite <strong>help</strong>.</div>`;
    }

    input.value = "";
    suggestionBox.textContent = "";
    scrollToBottom();
  }

  if (e.key === "ArrowUp") {
    if (history.length > 0 && historyIndex > 0) {
      historyIndex--;
      input.value = history[historyIndex];
    }
    e.preventDefault();
  }

  if (e.key === "ArrowDown") {
    if (history.length > 0 && historyIndex < history.length - 1) {
      historyIndex++;
      input.value = history[historyIndex];
    } else {
      input.value = "";
      historyIndex = history.length;
    }
    e.preventDefault();
  }

  if (e.key === "Tab") {
    const current = input.value.trim();
    const match = Object.keys(commands).find((c) => c.startsWith(current));
    if (match) {
      input.value = match;
      suggestionBox.textContent = "";
    }
    e.preventDefault();
  }

  setTimeout(() => {
    const current = input.value.trim();
    if (!current) {
      suggestionBox.textContent = "";
      return;
    }

    const match = Object.keys(commands).find((c) => c.startsWith(current));
    if (match && match !== current) {
      suggestionBox.innerHTML =
        `<span style="visibility:hidden">${current}</span><span>${match.slice(current.length)}</span>`;
    } else {
      suggestionBox.textContent = "";
    }
  }, 0);
});

function focusInput() {
  input.focus();
}

function scrollToBottom() {
  const terminal = document.querySelector(".terminal");
  terminal.scrollTop = terminal.scrollHeight;
}
