Drive::Engine.routes.draw do
  root to: 'discette#landing'
  get "/" => "discette#landing"
  get "/d" => "discette#landing"
  get "/d/*path" => "discette#landing"
  get "/home" => "discette#landing"
  get "/home/*path" => "discette#landing"

  post "/discette_login" => "discette#enter"
  get "/discette_topics" => "discette#discette_topics"

  get "/discette/topics" => "discette#discette_topics"
  get "/discette/about" => "discette#discette_about"

  get "/drive/sections" => "section#all"
  # get "*path" => "discette#landing"
end
