const clear = (value) => value
  .replace(/((https?:\/\/)|(pic\.twitter\.com))\S+(\s|$)/g, "")
  .trim();

const text = (node) => {
  let nodeText = node.querySelector(".js-tweet-text");

  return nodeText && nodeText.textContent;
};

const link = (node) => {
  let nodeLink = node.querySelector(".twitter-timeline-link");

  return nodeLink && nodeLink.dataset.expandedUrl;
};

const image = (node) => {
  let nodeImage = node.querySelector("a.is-preview img") ||
                  node.querySelector("img.avatar");

  return nodeImage &&  nodeImage.src;
}

const content = (node) => node.closest(".content");

const isDocumentDisposed = () => {
  // the "detach" event could be emitted when the host document it's disposed
  // already
  try {
    document.title;
  } catch (e) {
    return true;
  }

  return false;
};

function onClick(event) {
  const { target } = event;

  if (target.dataset.modal !== "ProfileTweet-reading")
    return;

  const node = content(target);

  if (target.classList.contains("is-in-list")) {
    self.port.emit("delete-from-reading-list", link(node));
  } else {
    const content = clear(text(node));

    self.port.emit("add-to-reading-list", {
      url: link(node),
      title: content,
      excerpt: content,
      preview: image(node)
    });
  }

  event.preventDefault();
  event.stopPropagation();
};

document.addEventListener("click", onClick, true);

function setButtonsActive(value, url) {
  const links = document.querySelectorAll(`.twitter-timeline-link[data-expanded-url='${url}']`);

  Array.forEach(links, (node) => {
    const nodeButton = content(node)
                        .querySelector("button[data-modal=ProfileTweet-reading]");

    if (nodeButton) {
      nodeButton.classList[value ? "add" : "remove"]("is-in-list");
    }
  });
}

const setButtonsOn = setButtonsActive.bind(null, true);
const setButtonsOff = setButtonsActive.bind(null, false);

self.port.on("added", setButtonsOn);
self.port.on("deleted", setButtonsOff);

self.port.on("detach", () => {
  if (isDocumentDisposed) return;

  document.removeEventListener("click", onClick, true);

  observer.dispose();
  overlay.dispose();
});

const hasExpandedUrl = (node) =>
              !!node.querySelector(".twitter-timeline-link[data-expanded-url]");

const observer = observe(document);
const overlay = new Overlay(self.options.overlay);

self.port.on("init", (urls) => {
  const listUrls = new Set(urls);

  const decorate = (node) => {
    overlay.decorate(node);

    let url = link(node)

    if (listUrls.has(url)) {
      setButtonsOn(url);
    }
  }

  observer
    .matches(".js-stream-item")
    .filter(hasExpandedUrl)
    .forEach(decorate);
});