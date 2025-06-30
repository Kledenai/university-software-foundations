function openModal() {
  document.getElementById("myModal").classList.add("show");
}

function closeModal() {
  document.getElementById("myModal").classList.remove("show");
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function escapeHTML(str) {
  return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
}

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("terminal-input");
  const output = document.getElementById("terminal-output");
  const suggestionBox = document.getElementById("suggestion");

  const history = [];
  let historyIndex = -1;

    output.innerHTML += `<pre>
    ____                            ____             __         
   / __ )_______  ______  ____     / __ \\____  _____/ /_  ____ _
  / __  / ___/ / / / __ \\/ __ \\   / /_/ / __ \\/ ___/ __ \\/ __ \`/
 / /_/ / /  / /_/ / / / / /_/ /  / _, _/ /_/ / /__/ / / / /_/ / 
/_____/_/   \\__,_/_/ /_/\\____/  /_/ |_|\\____/\\___/_/ /_/\\__,_/  
</pre><br/>Saiba mais sobre mim de uma forma diferente. Digite o comando <strong>help</strong> para ver as opções.`;

  const formatters = {
    text: (data) =>
      data.map((d) => {
        if (typeof d === "object" && d.title) {
          return `• ${d.title}`;
        } else if (typeof d === "object") {
          return Object.entries(d)
            .map(([key, value]) => {
              const label = `<strong>${capitalize(key)}:</strong>`;
              if (key === "description") {
                const formatted = String(value).replace(/\. /g, '.<br/>');
                return `${label} ${formatted}`;
              }
              return `${label} ${value}`;
            })
            .join("<br/>");
        }
        return `• ${d}`;
      }).join("<br/>"),

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
        } else if (item.nome) {
          result += `${indent(1)}<pessoa>\n`;
          result += `${indent(2)}<nome>${item.nome}</nome>\n`;
          result += `${indent(2)}<apelido>${item.apelido}</apelido>\n`;
          result += `${indent(2)}<profissao>${item.profissão}</profissao>\n`;
          result += `${indent(2)}<descricao>${item.descrição}</descricao>\n`;
          result += `${indent(2)}<github>${item.github}</github>\n`;
          result += `${indent(2)}<linkedin>${item.linkedin}</linkedin>\n`;
          result += `${indent(2)}<instagram>${item.instagram}</instagram>\n`;
          result += `${indent(2)}<x>${item.x}</x>\n`;
          result += `${indent(1)}</pessoa>\n`;
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
      const data = [{
        nome: "Bruno Rocha",
        apelido: "Kledenai",
        profissão: "Engenheiro de Software",
        descrição: "Especialista em desenvolvimento backend e automações complexas. Atua com Node.js, TypeScript, Terraform, Kubernetes, AWS e Azure. Desenvolve soluções autorais unindo lógica, arte e filosofia.",
        github: "https://github.com/Kledenai",
        linkedin: "https://www.linkedin.com/in/bruno-rocha/",
        instagram: "https://www.instagram.com/kledenai/",
        x: "https://x.com/Kledenai"
      }];
      return formatters[format] ? formatters[format](data, "about") : formatters.text(data);
    },

    hobbies: (format) => {
      const list = [
        "Jogar golfe",
        "Projetar e programar sistemas",
        "Explorar ideias filosóficas e existenciais",
        "Estudar matemática, lógica e linguagem",
        "Escrever sobre tecnologia e pensamento crítico",
      ];
      const defaultText = `O que costumo explorar fora do trabalho:<br/><br/>${list.map(item => `• ${item}`).join("<br/>")}`;
      if (format !== "text" && formatters[format]) return formatters[format](list, "hobbies");
      return defaultText;
    },

    countries: (format) => {
      const countries = [
        { country: "Estados Unidos", emoji: "🇺🇸" },
        { country: "Canadá", emoji: "🇨🇦" },
        { country: "Argentina", emoji: "🇦🇷" },
      ];
      if (format !== "text" && formatters[format]) return formatters[format](countries, "countries");
      return `Países que gostaria de visitar:<br/><br/>${countries.map(c => `• ${c.country} ${c.emoji}`).join("<br/>")}`;
    },

    ping: () => "Pong!",

    clear: () => {
      output.innerHTML = "";
      return "";
    },
  };

  input.addEventListener("keydown", function (e) {
    const raw = input.value.trim();

    if (e.key === "Enter") {
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
      return;
    }

    if (e.key === "ArrowUp") {
      if (historyIndex > 0) {
        historyIndex--;
        input.value = history[historyIndex];
      }
      e.preventDefault();
    }

    if (e.key === "ArrowDown") {
      if (historyIndex < history.length - 1) {
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

    if (e.ctrlKey && e.key.toLowerCase() === "c") {
      output.innerHTML += `<div><span class="prompt">$</span> ${raw}<span style="color:#888;"> ^C</span></div>`;
      input.value = "";
      suggestionBox.textContent = "";
      scrollToBottom();
      e.preventDefault();
      return;
    }

    setTimeout(() => {
      const current = input.value.trim();
      if (!current) {
        suggestionBox.textContent = "";
        return;
      }

      const match = Object.keys(commands).find((c) => c.startsWith(current));
      if (match && match !== current) {
        suggestionBox.innerHTML = `<span style="visibility:hidden">${current}</span><span>${match.slice(current.length)}</span>`;
      } else {
        suggestionBox.textContent = "";
      }
    }, 0);
  });

  function scrollToBottom() {
    const terminal = document.querySelector(".terminal");
    terminal.scrollTop = terminal.scrollHeight;
  }

  function focusInput() {
    input.focus();
  }

  window.focusInput = focusInput;
  focusInput();
});


