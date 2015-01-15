Drive::Engine.routes.draw do
  root to: 'section#landing'

  get "/" => "section#landing"
  get "/d" => "section#landing"
  get "/d/*path" => "section#landing"
  get "/home" => "section#landing"
  get "/home/*path" => "section#landing"

# below route is target for 'hidden-login-form'
  post "/drive/section/login" => "section#enter"
  get "/drive/section/topics" => "section#topics"

  get "/drive/section/about" => "section#about"

  # TODO - use above instead of below from client side:
  # get "/" => "discette#landing"
  # get "/d" => "discette#landing"
  # get "/d/*path" => "discette#landing"
  # get "/home" => "discette#landing"
  # get "/home/*path" => "discette#landing"

  post "/discette_login" => "discette#enter"
  get "/discette_topics" => "discette#discette_topics"

  get "/discette/topics" => "discette#discette_topics"
  get "/discette/about" => "discette#discette_about"

  get "/drive/discettes" => "discette#all"
  get "/drive/sections" => "section#all"
  # get "*path" => "discette#landing"
end
