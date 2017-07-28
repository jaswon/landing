(function() {
  var terminal = document.querySelector("#terminal")
  var lines = document.querySelector('#lines')
  var curLine = document.querySelector("#input")

  var terminalOpen = false;

  function print(content) {
    var line = document.createElement("li")
    line.innerHTML = "- "+content
    lines.appendChild(line)
    lines.scrollTop = lines.scrollHeight
  }

  function onTermKey (e) {
    if (e.keyCode == 13) { // enter
      print(curLine.innerHTML);
      curLine.innerHTML = "";
    } else if (e.keyCode == 8) { // backspace
      if (e.ctrlKey) {
        curLine.innerHTML = curLine.innerHTML
          .trim()
          .split(" ")
          .slice(0,-1)
          .join(" ")
      } else {
        curLine.innerHTML = curLine.innerHTML.slice(0,-1)
      }
    } else if (e.key.length == 1) {
      curLine.innerHTML += e.key
    }
    e.preventDefault()
  }

  document.querySelector("html").onkeydown = function(e) {
    if (e.key == "`" && e.altKey) {
      terminalOpen = !terminalOpen
      terminal.className = ""
      terminal.className = terminalOpen?"show":"hide"
      if (terminalOpen) {
        terminal.focus()
        terminal.addEventListener("keydown",onTermKey)
      } else {
        terminal.removeEventListener("keydown",onTermKey)
      }
    }
  }
})()
