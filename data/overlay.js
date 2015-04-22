// Using a block to avoid scope pollution
{
  const _nodes = Symbol("overlay/nodes");
  const _queries = Symbol("overlay/queries");
  const _cache = Symbol("overlay/cache");

  const queryFrom = (node) => node.dataset.insertBefore ||
                              node.dataset.insertAfter ||
                              node.dataset.insertAtBeginning ||
                              node.dataset.insertAtEnd;

  const insertBefore = (node, ref) =>
    ref.parentNode.insertBefore(node, ref);

  const insertAfter = (node, ref) =>
    ref.parentNode.insertBefore(node, ref.nextSibling);

  const insertAtBeginning = (node, ref) =>
    ref.insertBefore(node, ref.firstChild);

  const insertAtEnd = (node, ref) => ref.appendChild(node);

  const insertionMethodFor = (node) =>
    node.dataset.insertBefore
      ? insertBefore
      : node.dataset.insertAfter
      ? insertAfter
      : node.dataset.insertAtBeginning
      ? insertAtBeginning
      : node.dataset.insertAtEnd
      ? insertAtEnd
      : null;

  // declaring function is an auto "export" to the outer scope
  function Overlay(html) {
    let fragment = document.createRange().createContextualFragment(html);
    let nodes = this[_nodes] = fragment.children;
    this[_queries] = [];
    this[_cache] = new Set();

    for (let node of nodes) {
      let query = queryFrom(node);

      if (query)
       this[_queries].push(query);
    }
  }

  Overlay.prototype = {
    get selectors() {
      return this[_queries].join()
    },

    decorate(target) {
      if (!target.matches(this.selectors)) {
        if (!(target = target.querySelector(this.selectors)))
          return;
      }

      for (let node of this[_nodes]) {
        let query = queryFrom(node);

        if (target.matches(query)) {
          let cloned = node.cloneNode(true);
          insertionMethodFor(node)(cloned, target);
          this[_cache].add(cloned);
        }
      }
    },

    dispose() {
      for (let node of this[_cache]) {
        node.remove();
      }
    }
  }
}
