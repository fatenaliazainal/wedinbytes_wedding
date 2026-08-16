(function () {
  // Disable context menu (right-click) on the whole page
  function onContextMenu(e) {
    e.preventDefault();
  }

  // Block common DevTools / view-source keyboard shortcuts
  function onKeyDown(e) {
    var key = e.key;
    var code = e.code;
    var ctrl = e.ctrlKey || e.metaKey; // Ctrl on Windows/Linux, Cmd on Mac
    var shift = e.shiftKey;
    var alt = e.altKey;

    // F12
    if (code === "F12") { e.preventDefault(); return; }

    // Ctrl/Cmd + Shift + I  (Inspector)
    // Ctrl/Cmd + Shift + J  (Console)
    // Ctrl/Cmd + Shift + C  (Element picker)
    if (ctrl && shift && ["i", "I", "j", "J", "c", "C"].indexOf(key) !== -1) {
      e.preventDefault(); return;
    }

    // Ctrl/Cmd + U  (View source)
    if (ctrl && !shift && (key === "u" || key === "U")) {
      e.preventDefault(); return;
    }

    // Cmd + Option + I / J / C (Mac DevTools variants)
    if (ctrl && alt && ["i", "I", "j", "J", "c", "C"].indexOf(key) !== -1) {
      e.preventDefault(); return;
    }
  }

  // Prevent dragging images
  function onDragStart(e) {
    if (e.target && e.target.tagName === "IMG") {
      e.preventDefault();
    }
  }

  document.addEventListener("contextmenu", onContextMenu);
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("dragstart", onDragStart);

  // Clean up on page unload to avoid memory leaks
  window.addEventListener("unload", function () {
    document.removeEventListener("contextmenu", onContextMenu);
    document.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("dragstart", onDragStart);
  }, { once: true });
})();
