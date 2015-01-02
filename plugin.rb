# name: Drive
# about: Klavado's Drive plugin for Discourse
# version: 0.1
# authors: Ed Tewiah

# load the engine
load File.expand_path('../lib/drive/engine.rb', __FILE__)

class DrivesConstraint
  def matches?(request)
    # request.host == BLOG_HOST
    return true
  end
end

# And mount the engine
Discourse::Application.routes.append do
  # Discourse::Application.routes.prepend do
  mount Drive::Engine, at: '/', constraints: DrivesConstraint.new
end



after_initialize do
  # ApplicationController.class_eval do
  #   def set_layout
  #     use_crawler_layout? ? 'crawler' : 'drive'
  #   end
  # end


  module ApplicationControllerExtender
    def self.included(klass)
      klass.send(:before_filter, :redirect_discette)
      # klass.append_before_filter :redirect_discette
    end

    private

    def redirect_discette
      # The idea here is to check if we have a request to a registered discette subdomain
      # which would otherwise get handled by the main discourse app
      # binding.pry 

      return if ( (request.format && request.format.json?) || params[:controller] == 'discette')
      subdomain = request.subdomain
      binding.pry
      # if params[:controller] != 'discette'
        if is_discette_subdomain subdomain
          redirect_to "/home"
        end
        # unless subdomain.empty?
      # end
    end

    def is_discette_subdomain subdomain
      # TODO - check discette list
      if subdomain.empty?
        return false
      else
        return true
      end
    end
  end
  ApplicationController.send(:include, ApplicationControllerExtender)


end
