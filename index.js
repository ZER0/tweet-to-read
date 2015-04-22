const { Cu } = require("chrome");
const { ReadingList } = Cu.import("resource:///modules/readinglist/ReadingList.jsm", {});
const { Task } = Cu.import("resource://gre/modules/Task.jsm", {});

const { data: { load } } = require("sdk/self");
const { PageMod } = require("sdk/page-mod");

PageMod({
  include: "*.twitter.com",
  attachTo: ["top", "existing"],
  contentScriptWhen: "start",
  contentScriptFile: ["./observable.js", "./overlay.js", "./add-button.js"],
  contentStyleFile: "./style.css",
  contentScriptOptions: { overlay: load("./overlay.html") },
  onAttach: Task.async(function *(worker) {

    let listener = {
      onItemAdded: ({url}) => worker.port.emit("added", url),
      onItemDeleted: ({url}) => worker.port.emit("deleted", url)
    };

    ReadingList.addListener(listener);

    worker.on("detach", () => ReadingList.removeListener(listener));

    let urls = (yield ReadingList.iterator().items()).map(({url}) => url);

    worker.port.on("add-to-reading-list", Task.async(function *(item) {
      let hasItem = yield ReadingList.hasItemForURL(item.url);

      if (!hasItem)
        ReadingList.addItem(item);
    }));

    worker.port.on("delete-from-reading-list", Task.async(function *(url) {
      let item = yield ReadingList.itemForURL(url);

      if (item) {
        yield ReadingList.deleteItem(item);
      }
    }));

    worker.port.emit("init", urls);
  })
});