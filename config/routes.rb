Drive::Engine.routes.draw do
  # root to: 'section#landing'

# should I have a current section controller?

  get "/" => "section#landing"
  get "/d" => "section#landing"
  get "/d/*path" => "section#landing"
  get "/home" => "section#landing"
  get "/home/*path" => "section#landing"
  get "/directory" => "section#landing"
  get "/drive-admin" => "section#landing"
  get "/drive-admin/*path" => "section#landing"
  get "/start" => "section#landing"

  get "/micro-forums" => "static#micro_forums"

# below route is target for 'hidden-login-form'
  post "/drive/section/login" => "section#enter"
  get "/drive/section/topics" => "section#topics"

  get "/drive/section/about" => "section#about"
  get "/drive/section/current" => "section#current"
  delete "/drive/section/current" => "section#delete_current"

  # get "/drive/discettes" => "discette#all"
  get "/drive/section/directory" => "section#directory"

  post "/drive/section/create" => "section#create"
# above only creates for the current section and user which can be passed in below:
  post "/drive/admin/section/create" => "admin#create_section"
  post "/drive/admin/discette/create" => "admin#create_discette"
  delete "/drive/admin/discette/:id" => "admin#destroy_discette"
  delete "/drive/admin/section/:id" => "admin#destroy_section"
  get "/drive/admin/sections" => "admin#all_sections" #currently includes discettes
  get "/drive/admin/section/:id" => "admin#show_section"
  get "/drive/admin/discette/:id" => "admin#show_discette"

  # TODO - use above instead of below from client side:

  # post "/discette_login" => "discette#enter"
  # get "/discette_topics" => "discette#discette_topics"

  # get "/discette/topics" => "discette#discette_topics"
  # get "/discette/about" => "discette#discette_about"

  # get "*path" => "discette#landing"
end
