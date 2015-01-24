# name: Drive
# about: Klavado's Drive plugin for Discourse
# version: 0.1
# authors: Ed Tewiah

# load the engine
load File.expand_path('../lib/drive/engine.rb', __FILE__)


register_asset "javascripts/discourse/templates/micro-forums.js.handlebars"
register_asset "javascripts/discourse/extensions/signup_route.js"
register_asset "javascripts/discourse/extensions/login_route.js"
register_asset "javascripts/discourse/routes/micro-forums.js.es6"
register_asset "javascripts/discourse/drive_router.js"


# class DrivesConstraint
#   def matches?(request)
#     # request.host == BLOG_HOST
#     return true
#   end
# end

# And mount the engine
Discourse::Application.routes.append do
  # Discourse::Application.routes.prepend do
  mount Drive::Engine, at: '/'
  # , constraints: DrivesConstraint.new
end



after_initialize do
  require_dependency File.expand_path('../read_in_discettes.rb', __FILE__)
  # load File.expand_path("../app/jobs/map_topic/update_categories.rb", __FILE__)

  # ApplicationController.class_eval do
  #   def set_layout
  #     use_crawler_layout? ? 'crawler' : 'drive'
  #   end
  # end

  module TopicPatch
    extend ActiveSupport::Concern

    included do
      # when I tried with before_create, I got errors from posts_controller l88
      after_create :hide_discette_topics
      # has_ony :activity_stream_event
    end


    module InstanceMethods
      def hide_discette_topics
        if self.archetype == "discette"
          self.visible = false
          self.save
        end
      end
    end

    def self.included(receiver)
      receiver.send :include, InstanceMethods
    end

  end

  Topic.send(:include, TopicPatch)

  # based on this: http://stackoverflow.com/questions/10761059/re-open-an-activerecord-model-thats-provided-by-a-gem

  # module TopicExtender
  #   module InstanceMethods
  #     private
  #     def hide_discette_topics
  #       binding.pry
  #       if self.archetype == "discette"
  #         self.visible = false
  #       end
  #     end
  #   end

  #   def self.included(receiver)
  #     receiver.send :include, InstanceMethods
  #     receiver.class_eval do
  #       after_create :hide_discette_topics
  #     end
  #   end
  # end
  # Topic.send(:include, TopicExtender)

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

      if request.subdomain.blank?
        redirect_to "/micro-forums"
        return
      end

      # for json requests or if we're already in discette controller, exit
      # return if ( (request.format && request.format.json?) || params[:controller] == 'drive/discette')

      subdomain = request.subdomain
      if is_discette_subdomain subdomain
        redirect_to "/home"
      end
    end

    def is_discette_subdomain subdomain
      # section = Drive::Section.where(:subdomain_lower => subdomain).first

      # if (%w(oporto lisbon berlin madrid madrid2 example birmingham discette ed).include? subdomain.downcase)
      # if section
      # 
      unless (%w(madhacks lisa).include? subdomain.downcase)
        return true
      else
        return false
      end
    end
  end
  ApplicationController.send(:include, ApplicationControllerExtender)


end
