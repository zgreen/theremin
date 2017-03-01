port module Main exposing (..)

import Html exposing (..)
import List exposing (..)

-- MODEL
type alias Model =
  { waves: List String
  }
model : { waves : List String }
model =
  { waves = ["sine", "square", "sawtooth", "triangle"]
  }

-- UPDATE
port sendState : Model -> Cmd msg

-- VIEW
waveSelect : String -> Html msg
waveSelect wave =
  option [] [ text wave ]
-- main : Html msg
main : Html msg
main =
  select [] (List.map waveSelect model.waves)

  -- h1 [] [ text "hi there" ]
