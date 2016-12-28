module Main exposing (..)
import Html exposing (..)
import Html.Events exposing (onClick)
import Debug exposing (..)

main =
  Html.beginnerProgram { model = model, view = view, update = update }
-- MODEL
-- type alias Effect = { enabled : Bool, rate: Int, amplitude: Int }
-- type alias Effects = { tremolo : Effect, vibrato : Effect }
-- type alias Model = {
--   effects : Effects,
--   test : Int
-- }
type alias Model = Int

model : Model
-- model =
--   { effects =
--     { tremolo = { enabled = False, rate = 10, amplitude = 10 }
--     , vibrato = { enabled = False, rate = 10, amplitude = 10 }
--     },
--     test = 10000000
--   }
model = 0

-- UPDATE
-- type Msg = Reset
type Msg = Increment | Decrement

update : Msg -> Model -> Model
-- update msg model =
--   case msg of
--     Reset ->
--       { model | test = model.test + 1 }
update msg model =
  case msg of
    Increment ->
      model + 1

    Decrement ->
      model - 1

-- VIEW
-- main : Html.Html a
-- view model =
--   ...
view model =
  div []
   [ button [ onClick Increment ] [ text "click" ]
   , h1 [] [ (text (toString model)) ]
   ]
