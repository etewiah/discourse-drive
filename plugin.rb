# name: Drive
# about: Klavado's Drive plugin for Discourse 
# version: 0.1
# authors: Ed Tewiah

# load the engine
load File.expand_path('../lib/drive/engine.rb', __FILE__)



# And mount the engine
# Discourse::Application.routes.append do
Discourse::Application.routes.prepend do
  mount Drive::Engine, at: '/'
end



after_initialize do
  ApplicationController.class_eval do
    def set_layout
      # binding.pry
      use_crawler_layout? ? 'crawler' : 'drive'
    end
  end
end
