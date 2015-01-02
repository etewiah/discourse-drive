module Drive
require 'current_user'

  class DiscetteController < ApplicationController
    # if I inherit from my own App controller as below, I lose the useful helpers from discourse (such as current_user) in templates
    # Drive::ApplicationController
    include CurrentUser
    # before_action :get_section_from_subdomain
    # before_filter :preload_drive_data

    # below check seems to redirect to main domain if user not authenticated
    # before_action :ensure_logged_in, only: [:claim_section]

    # end point for routes that are only implemented client side
    # hardly gets hit though...
    # TODO - render useful serverside content for search engine etc..
    def landing
      # binding.pryß

      store_preloaded("siteSettings", SiteSetting.client_settings_json)

      render layout: "drive"
      # subdomain = request.subdomain
      # render json: { status: 'ok', subdomain: subdomain}
      # head 200, content_type: "text/html", layout: "drive"
    end


    def preload_drive_data
      store_preloaded("site", Site.json_for(guardian))
      store_preloaded("siteSettings", SiteSetting.client_settings_json)
      store_preloaded("customHTML", custom_html_json)
      store_preloaded("banner", banner_json)
    end



    def store_preloaded(key, json)
      @preloaded ||= {}
      # I dislike that there is a gsub as opposed to a gsub!
      #  but we can not be mucking with user input, I wonder if there is a way
      #  to inject this safty deeper in the library or even in AM serializer
      @preloaded[key] = json.gsub("</", "<\\/")
    end

  end
end
