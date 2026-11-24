const dialog = document.querySelector("#details-dialog");
const dialogTitle = dialog.querySelector("#details-title");
const dialogBody = dialog.querySelector(".details-body");

document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-open]");
  if (!trigger || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }

  const template = document.getElementById(`detail-${trigger.dataset.open}`);
  if (!template || typeof dialog.showModal !== "function") {
    return;
  }

  event.preventDefault();
  dialogTitle.textContent = translate(template.dataset.title);
  dialogBody.replaceChildren(template.content.cloneNode(true));
  if (trigger.dataset.open === "intro") {
    const paragraph = dialogBody.querySelector(language === "en" ? "p:not([lang])" : `p[lang="${language}"]`);
    dialogBody.replaceChildren(paragraph);
  }
  renderLanguage(dialogBody);
  dialog.showModal();
  dialogBody.scrollTop = 0;
});

dialog.addEventListener("close", () => {
  if (!dialog.open) {
    dialogBody.replaceChildren();
  }
});

if (!("closedBy" in HTMLDialogElement.prototype)) {
  const outside = (event) => {
    const rect = dialog.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right
      || event.clientY < rect.top || event.clientY > rect.bottom;
  };

  let pressedOutside = false;
  dialog.addEventListener("pointerdown", (event) => {
    pressedOutside = outside(event);
  });
  dialog.addEventListener("pointerup", (event) => {
    if (pressedOutside && outside(event)) {
      dialog.close();
    }
    pressedOutside = false;
  });
}

const picker = document.querySelector(".language-picker");
const languageTrigger = picker.querySelector("summary");
const languageButtons = document.querySelectorAll(".site-header [data-language]");
const languages = Array.from(languageButtons, button => button.dataset.language);
const storageKey = "cis-site-language";
let language = "en";
try {
  const saved = localStorage.getItem(storageKey);
  if (languages.includes(saved)) language = saved;
} catch {
  // Language switching also works when storage is disabled.
}

function translate(value) {
  if (language === "en") return value;
  const original = value.trim();
  const entry = window.schoolTranslations[original.replace(/\s+/g, " ")];
  return entry ? value.replace(original, () => entry[language === "th" ? 1 : 0]) : value;
}

// Keep the source strings so repeated switches always start from the original.
function collectStrings(root) {
  const entries = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.textContent.trim() || node.parentElement.closest("script, style, .school-name, .language-trigger, [data-language]")) continue;
    entries.push({ node, source: node.textContent });
  }
  for (const node of root.querySelectorAll("[aria-label], [alt], [placeholder], [title], meta[name='description']")) {
    for (const attr of ["aria-label", "alt", "placeholder", "title", "content"]) {
      const source = node.getAttribute(attr);
      if (source) entries.push({ node, attr, source });
    }
  }
  return entries;
}

function applyStrings(entries) {
  for (const { node, attr, source } of entries) {
    const value = translate(source);
    if (attr) node.setAttribute(attr, value);
    else node.textContent = value;
  }
}

function renderLanguage(root) {
  applyStrings(collectStrings(root));
  if (language === "zh-Hans") {
    for (const heading of root.querySelectorAll("[data-zh-heading]")) heading.textContent = heading.dataset.zhHeading;
  }
  for (const element of root.querySelectorAll("[lang]")) {
    if (language === "en" && element.dataset.english) element.textContent = element.dataset.english;
    element.lang = language;
  }
}

const pageStrings = collectStrings(document.documentElement);
function updatePage() {
  document.documentElement.lang = language;
  applyStrings(pageStrings);
  for (const button of languageButtons) {
    const selected = button.dataset.language === language;
    button.setAttribute("aria-pressed", String(selected));
    if (selected) {
      languageTrigger.querySelector("img").src = button.querySelector("img").src;
      languageTrigger.querySelector("span").textContent = button.textContent.trim();
    }
  }
  for (const panel of document.querySelectorAll("[data-benefit-language]")) {
    panel.hidden = panel.dataset.benefitLanguage !== language;
  }
}

for (const button of languageButtons) {
  button.addEventListener("click", () => {
    language = button.dataset.language;
    updatePage();
    picker.open = false;
    languageTrigger.focus();
    try { localStorage.setItem(storageKey, language); } catch { /* Temporary selection. */ }
  });
}
updatePage();

document.addEventListener("pointerdown", event => {
  if (!picker.contains(event.target)) picker.open = false;
});
picker.addEventListener("focusout", event => {
  if (event.relatedTarget && !picker.contains(event.relatedTarget)) picker.open = false;
});
picker.addEventListener("keydown", event => {
  if (event.key === "Escape" && picker.open) {
    event.preventDefault();
    picker.open = false;
    languageTrigger.focus();
  }
});
