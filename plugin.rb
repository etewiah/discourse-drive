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
      # klass.send(:before_filter, :redirect_discette)
      klass.prepend_before_filter :redirect_discette
    end

    private

    def redirect_discette
      # The idea here is to check if we have a request to a registered discette subdomain
      # and ensure it does not get handled by the main discourse app

      # right now I only care about redirecting the root
      return if (request.path != "/")

      # for json requests or if we're already in discette controller, exit
      # return if ( (request.format && request.format.json?) || params[:controller] == 'drive/discette')

      subdomain = request.subdomain
      if is_discette_subdomain subdomain
        redirect_to "/home"
      end
    end

    def is_discette_subdomain subdomain
      # TODO - check discette list
      if (%w(oporto lisbon berlin madrid madrid2 example birmingham discette ed).include? subdomain.downcase)
        return true
      else
        return false
      end
    end
  end
  ApplicationController.send(:include, ApplicationControllerExtender)


end
