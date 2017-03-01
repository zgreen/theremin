import Elm from './Main.elm'

export default function () {
  const app = Elm.Main.embed(document.getElementById('elm-root'))
  console.log(app.ports)
}
