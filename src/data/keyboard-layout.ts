export type KeyDef = [label: string, code: string, width?: number];

const IS_MAC = typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform);

export const LAYOUT: KeyDef[][] = [
  [
    ["`", "Backquote"], ["1", "Digit1"], ["2", "Digit2"], ["3", "Digit3"],
    ["4", "Digit4"], ["5", "Digit5"], ["6", "Digit6"], ["7", "Digit7"],
    ["8", "Digit8"], ["9", "Digit9"], ["0", "Digit0"], ["-", "Minus"],
    ["=", "Equal"], ["delete", "Backspace", 2],
  ],
  [
    ["tab", "Tab", 1.5], ["Q", "KeyQ"], ["W", "KeyW"], ["E", "KeyE"],
    ["R", "KeyR"], ["T", "KeyT"], ["Y", "KeyY"], ["U", "KeyU"], ["I", "KeyI"],
    ["O", "KeyO"], ["P", "KeyP"], ["[", "BracketLeft"], ["]", "BracketRight"],
    ["\\", "Backslash", 1.5],
  ],
  [
    ["caps", "CapsLock", 1.75], ["A", "KeyA"], ["S", "KeyS"], ["D", "KeyD"],
    ["F", "KeyF"], ["G", "KeyG"], ["H", "KeyH"], ["J", "KeyJ"], ["K", "KeyK"],
    ["L", "KeyL"], [";", "Semicolon"], ["'", "Quote"], ["return", "Enter", 2.25],
  ],
  [
    ["shift", "ShiftLeft", 2.25], ["Z", "KeyZ"], ["X", "KeyX"], ["C", "KeyC"],
    ["V", "KeyV"], ["B", "KeyB"], ["N", "KeyN"], ["M", "KeyM"], [",", "Comma"],
    [".", "Period"], ["/", "Slash"], ["shift", "ShiftRight", 2.75],
  ],
  IS_MAC
    ? [
        ["fn", "Fn", 1.25], ["⌃", "ControlLeft", 1.25], ["⌥", "AltLeft", 1.25],
        ["⌘", "MetaLeft", 1.25], ["", "Space", 6.25], ["⌘", "MetaRight", 1.25],
        ["⌥", "AltRight", 1.25],
      ]
    : [
        ["ctrl", "ControlLeft", 1.25], ["win", "MetaLeft", 1.25], ["alt", "AltLeft", 1.25],
        ["", "Space", 6.25], ["alt", "AltRight", 1.25], ["win", "MetaRight", 1.25],
        ["menu", "ContextMenu", 1.25], ["ctrl", "ControlRight", 1.25],
      ],
];
