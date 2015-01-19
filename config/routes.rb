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
  get "/drive/section/current" => "section#current"

  get "/drive/discettes" => "discette#all"
  get "/drive/sections" => "section#all"

  post "/drive/discette/create" => "discette#create"
  post "/drive/section/create" => "section#create"
  delete "/drive/discette/:id" => "discette#destroy"
  delete "/drive/section/:id" => "section#destroy"

  # TODO - use above instead of below from client side:

  # post "/discette_login" => "discette#enter"
  # get "/discette_topics" => "discette#discette_topics"

  # get "/discette/topics" => "discette#discette_topics"
  # get "/discette/about" => "discette#discette_about"

  # get "*path" => "discette#landing"
end
