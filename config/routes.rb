Drive::Engine.routes.draw do
  root to: 'discette#landing'
  get "/" => "discette#landing"
  get "/d" => "discette#landing"
  get "/d/*path" => "discette#landing"
  get "/home" => "discette#landing"

  post "/discette_login" => "discette#enter"
  get "/discette_topics" => "discette#discette_topics"

  # get "*path" => "discette#landing"
end
