const h2c = String.fromCodePoint; // unicode hex -> character

function balloon (text) { // https://github.com/piuccio/cowsay
  let lines = (function ( str, width ) { // https://j11y.io/snippets/wordwrap-for-javascript/
    if (!str) return str;
    var regex = String.raw`.{1,${width}}(\s|$)|.{${width}}|.+$`;
    return str.match( RegExp(regex, 'g') );
  })(text, 40).map(s => s.trim())
  let maxLength = lines.reduce((prev, cur) => {
    return (prev>cur.length)?prev:cur.length
  },0)
  let delims = {
    f: ["/","\\"],
    m: ["|","|"],
    l: ["\\","/"]
  }
  if (lines.length == 1) {
    return [
      " " + new Array(maxLength+3).join("_"),
      "< " + lines[0] + " >",
      " " + new Array(maxLength+3).join("-")
    ].join("\n")
  } else {
    let balloon = [" " + new Array(maxLength+3).join("_")]
    for (var i = 0 ; i < lines.length ; ++i) {
      let delim = delims[i==0?"f":(i==lines.length-1?"l":"m")]
      balloon.push(delim[0]+" "+lines[i]+(new Array(maxLength - lines[i].length + 1)).join(" ")+" "+delim[1])
    }
    return balloon.concat(" " + new Array(maxLength+3).join("-")).join("\n")
  }
}

function cowsay (text) {
  return String.raw`${balloon(text)}
    \   ^__^
     \  (oo)\_______
        (__)\       )\/\
            ||----w |
            ||     ||
  `
}

const rps = {
  rules: [
    [0,1,-1],
    [-1,0,1],
    [1,-1,0]
  ],
  moves: {
    'rock':0,
    'r':0,
    'paper':1,
    'p':1,
    'scissor':2,
    's':2
  },
  icons: [ '👊','🖐','✌️' ]
}

function playRPS (choice) {
  var move = Math.floor(Math.random()*3)
  var rules = rps.rules[move]
  if (choice in rps.moves) {
    var result = ""
    switch (rules[rps.moves[choice]]) {
      case -1: result = "you lose!"; break;
      case  0: result = "tie..."; break;
      case  1: result = "you win!"; break;
    }
    return `${result} 🤖${rps.icons[move]} -> ${rps.icons[rps.moves[choice]]}😀`
  }
  return "you have to play either r(ock), p(aper), or s(cissor)"
}

(function() {
  const trigger = "'"

  const terminal = document.querySelector("#terminal")
  const lines = document.querySelector('#lines')
  const curLine = document.querySelector("#input")

  var terminalOpen = false;

  const aliases = (function(rev) {
    let ret = {}
    for (var key in rev)
      rev[key].forEach(function(v) {
        ret[v] = key
      })
    return ret
  })({
    'random': ['rand'],
    'hello': ['hi','hey'],
    'cowsay': ['moo']
  })

  const convertAlias = command => (command in aliases)?aliases[command]:command

  const commands = {
    'random': max => max?`${h2c(0x1F3B2)} ${Math.floor(Math.random()*max)}`:'gimme a numbah',
    'hello': () => `hi!${h2c(0x1F44B)}`,
    'echo': (...args) => args.join(" "),
    'cowsay': (...args) => cowsay(args.join(" ")),
    'cls': () => {
      while (lines.lastChild) lines.removeChild(lines.lastChild);
      return ""
    },
    'sudo': () => '<video src="veryimportant.webm" height="200" autoplay></video>',
    'rps': choice => playRPS(choice)
  }

  function print(content, res) {
    if (content != "")
      content.split('\n').forEach(function(l) {
        var line = document.createElement("li")
        line.innerHTML = (res?"- ":"> ")+l
        lines.appendChild(line)
        terminal.scrollTop = terminal.scrollHeight
      })
  }

  function evaluate(tokens) {
    return commands[tokens[0]].apply(null, tokens.slice(1))
  }

  function onTermKey (e) {
    if (e.keyCode == 13) { // enter
      let tokens = curLine.innerHTML.trim().split(" ")
      tokens[0] = convertAlias(tokens[0])
      print(curLine.innerHTML);
      if (tokens[0] in commands) {
        print(evaluate(tokens), true)
      } else {
        print(`${tokens[0]}: Need to be root (sudo)`,true)
      }
      curLine.innerHTML = "";
      terminal.scrollTop = terminal.scrollHeight
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
      if (!(e.key == trigger && (e.ctrlKey || e.metaKey) )) curLine.innerHTML += e.key
    }
    e.preventDefault()
  }

  document.querySelector("html").onkeydown = function(e) {
    if (e.key == trigger && (e.ctrlKey || e.metaKey) ) {
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
