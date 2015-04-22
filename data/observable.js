// Using a block to avoid scope pollution; waiting for es6 module
{
  const _mutation = Symbol("observable/mutation");
  const _target = Symbol("observable/target");
  const _selectors = Symbol("observable/selectors")
  const _actions = Symbol("observable/actions");

  const Observable = function(target) {
    this[_target] = target;
    this[_actions] = [];
    this[_selectors] = [];
  };

  Observable.prototype = {
    filter(predicate) {
      this[_actions].push({
        action: predicate,
        type: "filter"
      });

      return this;
    },

    map(predicate) {
      this[_actions].push({
        action: predicate,
        type: "map"
      });

      return this;
    },

    matches(selectors) {
      this[_selectors].push(selectors);

      return this;
    },

    forEach(predicate) {
      let target = this[_target];
      let selectors = this[_selectors].join() || "*";

      let execute = (node) => {
        if (node.nodeType !== 1 || !node.matches(selectors))
          return;

        let value = node;

        for (let {action, type} of this[_actions]) {
          if (type === "filter" && !action(value))
            return;

          if (type === "map")
            value = action(value);
        }

        predicate(value);
      };

      this[_mutation] = new MutationObserver((mutations) => {
        mutations.forEach(({addedNodes}) => {
          Array.forEach(addedNodes, execute)
        });
      });

      this[_mutation].observe(target, { childList: true, subtree: true });

      let nodes = target.querySelectorAll(selectors);

      Array.forEach(nodes, execute);
    },

    dispose() {
      this[_mutation].disconnect();
    }
  };

  function observe(target) {
    return new Observable(target);
  }
}
