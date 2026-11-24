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
  dialogTitle.textContent = template.dataset.title;
  dialogBody.replaceChildren(template.content.cloneNode(true));
  const language = trigger.dataset.introLang;
  if (language) {
    const heading = dialogBody.querySelector(`h2[lang="${language}"]`);
    const paragraph = dialogBody.querySelector(language === "en" ? "p:not([lang])" : `p[lang="${language}"]`);
    dialogTitle.textContent = heading?.textContent ?? template.dataset.title;
    dialogTitle.lang = language;
    dialogBody.replaceChildren(paragraph);
  } else {
    dialogTitle.removeAttribute("lang");
  }
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

const tablist = document.querySelector(".language-tabs");
const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));

function selectLanguage(selected) {
  for (const tab of tabs) {
    const active = tab === selected;
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
    document.getElementById(tab.getAttribute("aria-controls")).hidden = !active;
  }
}

tablist.addEventListener("click", (event) => {
  const selected = event.target.closest('[role="tab"]');
  if (selected) {
    selectLanguage(selected);
  }
});

tablist.addEventListener("keydown", (event) => {
  const current = tabs.indexOf(event.target);
  if (current === -1) {
    return;
  }

  const next = {
    ArrowLeft: (current - 1 + tabs.length) % tabs.length,
    ArrowRight: (current + 1) % tabs.length,
    Home: 0,
    End: tabs.length - 1,
  }[event.key];

  if (next !== undefined) {
    event.preventDefault();
    selectLanguage(tabs[next]);
    tabs[next].focus();
  }
});

