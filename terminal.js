const h2c = String.fromCodePoint; // unicode hex -> character

function balloon (text) { // https://github.com/piuccio/cowsay
  if ("" == text) text = "moo"
  let lines = (function ( str, width ) { // https://j11y.io/snippets/wordwrap-for-javascript/
    if (!str) return str;
    var regex = String.raw`.{1,${width}}(\s|$)|.{${width}}|.+$`;
    return str.match( RegExp(regex, 'g') );
  })(text, 40).map(s => s.trim())
  let maxLength = lines.reduce((prev, cur) => (prev>cur.length)?prev:cur.length,0)
  let delims = {
    f: ["/","\\"],
    m: ["|","|"],
    l: ["\\","/"]
  }
  if (lines.length == 1) {
    return [
      " " + "_".repeat(maxLength + 2),
      "< " + lines[0] + " >",
      " " + "-".repeat(maxLength + 2)
    ].join("\n")
  } else {
    let balloon = [" " + "_".repeat(maxLength + 2)]
    for (var i = 0 ; i < lines.length ; ++i) {
      let delim = delims[i==0?"f":(i==lines.length-1?"l":"m")]
      balloon.push(delim[0]+" "+lines[i].padEnd(maxLength)+" "+delim[1])
    }
    return balloon.concat(" " + "-".repeat(maxLength + 2)).join("\n")
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
  icons: [ '👊','🖐','✌️' ],
  faces: [ '😭','😐','😀' ]
}

function playRPS (pmove) {
  var cmove = Math.floor(Math.random()*3)
  var rules = rps.rules[cmove]
  var result = rules[rps.moves[pmove]]
  if (pmove in rps.moves)
    return `🤖${rps.icons[cmove]}${result>-1?"<":""}-${result<1?">":""}${rps.icons[rps.moves[pmove]]}${rps.faces[result+1]}`
  return "you have to play either r(ock), p(aper), or s(cissor)"
}

const getLocation = () => new Promise((res,rej) => {
  navigator.geolocation.getCurrentPosition(
    pos => res([pos.coords.latitude, pos.coords.longitude]),
    rej,
    { timeout: 3000, maximumAge: 1000*60*10 }
  )
});

const srv = 'https://srv.jaswon.tech';

(function() {
  const terminal = document.querySelector("#terminal")
  const lines = document.querySelector('#lines')
  const curLine = document.querySelector("#input")
  const caret = document.querySelector("#caret")

  const history = []
  var historyPos = 0

  const aliases = (function(rev) {
    let ret = {}
    for (var key in rev)
      rev[key].forEach(function(v) {
        ret[v] = key
      })
    return ret
  })({
    'random': ['rand'],
    'hello': ['hi','hey','hi!','hoi!','hoi','howdy','hallo','hihi','hihi!','hii','hiii','helloo','hellooo'],
    'cowsay': ['moo'],
    'define': ['def']
  })

  const convertAlias = command => (command in aliases)?aliases[command]:command

  const commands = {
    'random': max => max?`${h2c(0x1F3B2)} ${Math.floor(Math.random()*max)}`:'gimme a numbah',
    'hello': () => `hi!${h2c(0x1F44B)}`,
    'echo': (...args) => args.join(" "),
    'cowsay': (...args) => cowsay(args.join(" ")),
    'cls': () => {
      curLine.innerHTML = ""
      while (lines.lastChild) lines.removeChild(lines.lastChild);
      return ""
    },
    'rps': playRPS,
    'help': () => (function(arr,perLine) { // grid formatted
      print("are you lost? 🤔","-")
      const maxLen = arr.reduce((p,c)=>p>c.length?p:c.length,0)
      return arr.reduce((a,x,i,s)=>(i%perLine)?a:a.concat([s.slice(i,i+perLine)]),[])
        .map(l=>l.reduce((a,x,i,s)=>a+x.padEnd(maxLen+5),""))
        .join("\n")
    })(Object.keys(commands),4),
    'weather': arg => getLocation()
      .catch(err => {
        return fetch(`${srv}/location`)
          .then(res => res.json())
          .then(res => [res.lat, res.lon])
      })
      .then(([lat,long]) => {
      return fetch(`${srv}/weather?lat=${lat}&lon=${long}`)
        .then(r => r.json())
        .then(r => {
          switch (arg) {
            case 'day': return r.day
            case 'week': return r.week
            default: return `<div class="weather ${r.cur.icon}"></div> ${r.cur.temp}˚C ${r.cur.summary.toLowerCase()}`
          }
        })
    }),
    'define': word => fetch(`${srv}/dict?q=${word}`)
      .then(r => r.json())
      .then(r => r.map(v => `(${v.type}) ${v.defenition}`).join("\n")),
    'quote': () => fetch(`${srv}/quote`)
      .then(r => r.json())
      .then(r => `"${r.quote}"\n\t\t- ${r.author || "Anonymous"}`),
    'math': (...args) => fetch(`${srv}/math?q=${args.join(" ")}`)
      .then(r => r.text())
  }

  function display(content, p, before) {
    content != "" && content.split('\n').forEach(function(l) {
      var line = document.createElement("li")
      line.innerHTML = p+" "+l
      if (before) lines.insertBefore(line,before)
      else lines.appendChild(line)
      terminal.scrollTop = terminal.scrollHeight
    })
  }

  function print(content, p) {
    if (!p) return display(content, ">")
    var tmp = document.createElement("li")
    tmp.innerHTML = '- <img class="svg-icon" src="loading.svg" />'
    lines.appendChild(tmp)
    terminal.scrollTop = terminal.scrollHeight
    Promise.resolve(content).then(v => {
      display(v, p, tmp)
      tmp.remove()
    })
  }

  function evaluate(tokens) {
    return commands[tokens[0]].apply(null, tokens.slice(1))
  }

  function onTermKey (e) {
    if (e.keyCode == 38) { // up arrow
      if (historyPos >= history.length-1) curLine.innerHTML = history.length?history[history.length-1]:""
      else curLine.innerHTML = history[historyPos++]
    } else if (e.keyCode == 40) { // down arrow
      curLine.innerHTML = historyPos?history[--historyPos]:""
    } else if (e.keyCode == 13) { // enter
      historyPos = 0
      let command = curLine.innerHTML.trim()
      if ("" == command) return print(" ")
      history.unshift(command)
      let tokens = command.split(" ")
      tokens[0] = convertAlias(tokens[0])
      print(curLine.innerHTML);
      if (tokens[0] in commands) print(evaluate(tokens), '-')
      curLine.innerHTML = "";
      terminal.scrollTop = terminal.scrollHeight
    } else if (e.keyCode == 8) { // backspace
      if (e.ctrlKey || e.altKey) {
        curLine.innerText = curLine.innerText
          .trim()
          .split(" ")
          .slice(0,-1)
          .join(" ")
      } else {
        curLine.innerText = curLine.innerText.slice(0,-1)
      }
    } else if (e.key.length == 1 && !(e.metaKey || e.ctrlKey)) {
      curLine.innerHTML += e.key
    }
    if ((e.metaKey || e.ctrlKey) && ["r","l","R"].indexOf(e.key) < 0) e.preventDefault();
  }

  terminal.focus()
  terminal.addEventListener("keydown",onTermKey)
  terminal.addEventListener("focusin", function() { caret.className = "blink" })
  terminal.addEventListener("focusout", function() { terminal.focus() })

  // motd
  print(commands['quote'](), " ")
})()
