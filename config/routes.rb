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

  get "/reader" => "section#landing"
  get "/reader/*path" => "section#landing"
  get "/reader-admin" => "section#landing"
  get "/reader-admin/*path" => "section#landing"


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
  post "/drive/admin/section" => "admin#create_section"
  delete "/drive/admin/section/:id" => "admin#destroy_section"
  get "/drive/admin/sections" => "admin#all_sections" #currently includes discettes
  get "/drive/admin/section/:id" => "admin#show_section"
  put "/drive/admin/section/:id" => "admin#update_section"

  post "/drive/admin/discette" => "admin#create_discette"
  delete "/drive/admin/discette/:id" => "admin#destroy_discette"
  get "/drive/admin/discette/:id" => "admin#show_discette"
  put "/drive/admin/discette/:id" => "admin#update_discette"

  get "/drive/admin/sites" => "discourse_sites_admin#all" 
  # post "/drive/admin/site" => "discourse_sites_admin#create_site"
  # delete "/drive/admin/site/:id" => "discourse_sites_admin#destroy_site"
  get "/drive/admin/site/:id" => "discourse_sites_admin#show"
  put "/drive/admin/site/:id" => "discourse_sites_admin#update"



  post "discourse_sites/create" => "discourse_sites#create"
  # get "discourse_sites/create" => "discourse_sites#create"


  get "/discourse_sites/get_or_add_site" => "discourse_sites#get_or_add_site"
  get "/discourse_sites/get_sites" => "discourse_sites#get_sites"
  # get "/discourse_sites/passthrough" => "discourse_sites#passthrough"
  get "/discourse_sites/:slug/latest" => "discourse_sites#latest"
  get "/discourse_sites/:slug/about" => "discourse_sites#about"
  get "/discourse_sites/:slug/categories" => "discourse_sites#categories"
  get "/discourse_sites/:slug/topic_details" => "discourse_sites#topic_details"
end
